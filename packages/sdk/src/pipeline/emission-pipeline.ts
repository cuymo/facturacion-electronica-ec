/**
 * Core emission pipeline.
 *
 * Orchestrates: validate -> sequence -> claveAcceso -> buildXml
 * -> validateXmlStructure -> sign -> send -> authorize
 *
 * Extracted and decoupled from EmiteYa document.datasource.impl.ts.
 * No database, no auth, no subscription logic.
 */

import {
  type DocumentType,
  type Emisor,
  type XmlBuildContext,
  type DocumentData,
  type Logger,
  type SriMensaje,
  FacturacionElectronicaECError,
  buildDocumentXml,
  generateClaveAcceso,
  generateCodigoNumerico,
  schemaRegistry,
  validateXmlAgainstXsd,
} from "@facturacion-ec/core";
import type { ISigner, SignOptions } from "@facturacion-ec/signer";
import type { ISriClient, SriRecepcionResult, SriAutorizacionResult } from "@facturacion-ec/sri-client";
import type { ISequenceProvider } from "../sequence/sequence-provider.js";
import type { EmissionResult, EmissionEstado } from "../emission-result.js";
import type { EmissionHooks } from "../hooks.js";

export interface PipelineParams {
  emisor: Emisor;
  documentType: DocumentType;
  data: DocumentData;
  p12: Buffer;
  p12Password: string;
  sequenceProvider: ISequenceProvider;
  signer: ISigner;
  sriClient: ISriClient;
  logger?: Logger;
  hooks?: EmissionHooks;
  validateXsd: boolean;
  authorizationDelayMs: number;
  maxError70Retries: number;
  maxSendRetries: number;
  sendRetryDelayMs: number;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callHook<T>(
  fn: ((arg: T) => void | Promise<void>) | undefined,
  arg: T,
  logger?: Logger
): Promise<void> {
  if (!fn) return;
  try {
    await fn(arg);
  } catch (e) {
    logger?.warn("[Pipeline] Hook error", {
      error: e instanceof Error ? e.message : String(e),
    });
  }
}

export async function runEmissionPipeline(
  params: PipelineParams
): Promise<EmissionResult> {
  const {
    emisor,
    documentType,
    data,
    signer,
    sriClient,
    sequenceProvider,
    logger,
    hooks,
    validateXsd,
    authorizationDelayMs,
    maxError70Retries,
    maxSendRetries,
    sendRetryDelayMs,
  } = params;

  const schema = schemaRegistry.get(documentType);
  const signOptions: SignOptions = { p12: params.p12, p12Password: params.p12Password };

  let secuencial = "";
  let claveAcceso = "";
  let xmlOriginal = "";
  let xmlFirmado = "";
  let estado: EmissionEstado = "FIRMADO";
  let numeroAutorizacion: string | null = null;
  let fechaAutorizacion: Date | null = null;
  let recepcionEstado: EmissionResult["recepcionEstado"] = null;
  let autorizacionEstado: EmissionResult["autorizacionEstado"] = null;
  let rawRecepcion: SriRecepcionResult | null = null;
  let rawAutorizacion: SriAutorizacionResult | null = null;
  let mensajes: SriMensaje[] = [];
  let attempts = 0;

  // Error 70 retry loop: each iteration gets a new secuencial + clave
  for (let error70Attempt = 0; error70Attempt <= maxError70Retries; error70Attempt++) {
    attempts = error70Attempt + 1;

    // 1. Get next sequence
    secuencial = await sequenceProvider.next(
      emisor.establecimiento,
      emisor.puntoEmision,
      documentType
    );

    // 2. Generate clave de acceso
    const codigoNumerico = generateCodigoNumerico();

    // Extract fechaEmision from data (all doc types have it, but field name varies)
    const fechaEmision = extractFechaEmision(documentType, data);

    claveAcceso = generateClaveAcceso({
      fechaEmision,
      tipoComprobante: schema.codDoc,
      ruc: emisor.ruc,
      ambiente: emisor.ambiente,
      establecimiento: emisor.establecimiento,
      puntoEmision: emisor.puntoEmision,
      secuencial,
      codigoNumerico,
      tipoEmision: "1",
    });

    // 3. Build XML
    const ctx: XmlBuildContext = {
      ambiente: emisor.ambiente,
      ruc: emisor.ruc,
      razonSocial: emisor.razonSocial,
      nombreComercial: emisor.nombreComercial ?? null,
      dirMatriz: emisor.dirMatriz,
      claveAcceso,
      codDoc: schema.codDoc,
      establecimiento: emisor.establecimiento,
      puntoEmision: emisor.puntoEmision,
      secuencial,
      direccionEstablecimiento: emisor.direccionEstablecimiento,
      contribuyenteEspecial: emisor.contribuyenteEspecial ?? null,
      obligadoContabilidad: emisor.obligadoContabilidad,
    };

    xmlOriginal = buildDocumentXml(documentType, ctx, data);
    await callHook(hooks?.onXmlBuilt, xmlOriginal, logger);

    logger?.info(`[Pipeline] XML generado para ${documentType}`, {
      claveAcceso,
      secuencial,
      attempt: attempts,
    });

    // 4. Validate XML structure (basic checks always run)
    validateXmlStructure(xmlOriginal, claveAcceso, schema.rootTag);

    // 4b. XSD validation (optional, requires xmllint-wasm)
    if (validateXsd) {
      const xsdResult = await validateXmlAgainstXsd(documentType, xmlOriginal);
      if (!xsdResult.valid) {
        throw FacturacionElectronicaECError.xmlStructure(
          `XSD validation failed for ${documentType}: ${xsdResult.errors.join("; ")}`
        );
      }
      logger?.info(`[Pipeline] XSD validation passed for ${documentType}`);
    }

    // 5. Sign XML
    try {
      xmlFirmado = await signer.sign(xmlOriginal, documentType, signOptions);
    } catch (error) {
      throw FacturacionElectronicaECError.signing(
        `Error al firmar XML: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      );
    }
    await callHook(hooks?.onXmlSigned, xmlFirmado, logger);

    // 6. Send to SRI (with communication retry)
    estado = "FIRMADO";
    rawRecepcion = null;
    rawAutorizacion = null;
    recepcionEstado = null;
    autorizacionEstado = null;
    mensajes = [];

    let recepcion: SriRecepcionResult | null = null;

    for (let sendAttempt = 0; sendAttempt <= maxSendRetries; sendAttempt++) {
      try {
        recepcion = await sriClient.enviarComprobante(xmlFirmado, emisor.ambiente);
        rawRecepcion = recepcion;
        recepcionEstado = recepcion.estado;
        await callHook(hooks?.onSriRecepcion, recepcion, logger);
        break;
      } catch (error) {
        if (sendAttempt < maxSendRetries) {
          logger?.warn("[Pipeline] Send retry", {
            attempt: sendAttempt + 1,
            error: error instanceof Error ? error.message : String(error),
          });
          await delay(sendRetryDelayMs);
          continue;
        }
        // Final attempt failed
        mensajes = [
          {
            identificador: "",
            mensaje: error instanceof Error ? error.message : "SRI communication failed",
            informacionAdicional: "",
            tipo: "ERROR",
          },
        ];
        return buildResult();
      }
    }

    if (!recepcion) {
      return buildResult();
    }

    logger?.info(`[Pipeline] SRI recepcion: ${recepcion.estado}`, {
      claveAcceso,
      attempt: attempts,
    });

    if (recepcion.estado === "RECIBIDA") {
      estado = "ENVIADO";

      // 7. Authorization polling
      await delay(authorizationDelayMs);

      try {
        const autorizacion = await sriClient.autorizarComprobante(
          claveAcceso,
          emisor.ambiente
        );
        rawAutorizacion = autorizacion;
        autorizacionEstado = autorizacion.estado;
        await callHook(hooks?.onSriAutorizacion, autorizacion, logger);

        if (autorizacion.estado === "AUTORIZADO") {
          estado = "AUTORIZADO";
          numeroAutorizacion = autorizacion.numeroAutorizacion;
          fechaAutorizacion = autorizacion.fechaAutorizacion
            ? new Date(autorizacion.fechaAutorizacion)
            : new Date();
          mensajes = autorizacion.mensajes;

          if (hooks?.onAuthorized && numeroAutorizacion) {
            try {
              await hooks.onAuthorized(claveAcceso, numeroAutorizacion);
            } catch (e) {
              logger?.warn("[Pipeline] onAuthorized hook error", {
                error: e instanceof Error ? e.message : String(e),
              });
            }
          }
        } else {
          estado = "RECHAZADO";
          mensajes = autorizacion.mensajes;
        }
      } catch (error) {
        // Authorization query failed, but document was received
        logger?.error("[Pipeline] Error consultando autorizacion", {
          claveAcceso,
          error: error instanceof Error ? error.message : String(error),
        });
        mensajes = [
          {
            identificador: "",
            mensaje: `Documento enviado pero error al consultar autorizacion: ${error instanceof Error ? error.message : String(error)}`,
            informacionAdicional: "",
            tipo: "WARNING",
          },
        ];
      }
      break; // Reception was successful, no Error 70 retry needed
    }

    // DEVUELTO
    estado = "DEVUELTO";
    mensajes = recepcion.mensajes;

    // Check for Error 70
    const hasError70 = recepcion.mensajes.some(
      (m) => String(m.identificador) === "70"
    );

    if (hasError70) {
      logger?.info("[Pipeline] Error 70 — consultando autorizacion de clave actual", {
        claveAcceso,
        attempt: attempts,
      });
      await delay(2000);

      try {
        const consulta = await sriClient.autorizarComprobante(
          claveAcceso,
          emisor.ambiente
        );
        rawAutorizacion = consulta;
        autorizacionEstado = consulta.estado;

        if (consulta.estado === "AUTORIZADO") {
          logger?.info("[Pipeline] Error 70 resuelto: AUTORIZADO", { claveAcceso });
          estado = "AUTORIZADO";
          numeroAutorizacion = consulta.numeroAutorizacion;
          fechaAutorizacion = consulta.fechaAutorizacion
            ? new Date(consulta.fechaAutorizacion)
            : new Date();
          mensajes = consulta.mensajes;
          break;
        }
      } catch (pollError) {
        logger?.warn("[Pipeline] Error consultando autorizacion tras Error 70", {
          claveAcceso,
          error: pollError instanceof Error ? pollError.message : String(pollError),
        });
      }

      // Not authorized -- retry with new sequence if attempts remain
      if (error70Attempt < maxError70Retries) {
        logger?.warn("[Pipeline] Error 70: reintentando con nuevo secuencial", {
          claveAcceso,
          attempt: attempts,
        });
        continue;
      }

      // All retries exhausted
      mensajes = [
        {
          identificador: "70",
          mensaje:
            "Documento en procesamiento o clave duplicada. Verifique el historial antes de reintentar.",
          informacionAdicional: "",
          tipo: "ERROR",
        },
      ];
    } else {
      // DEVUELTO but not Error 70 -- rollback sequence and stop
      if (sequenceProvider.rollback) {
        await sequenceProvider.rollback(
          emisor.establecimiento,
          emisor.puntoEmision,
          documentType
        );
        logger?.info("[Pipeline] Secuencial liberado por DEVUELTO", {
          claveAcceso,
          secuencial,
        });
      }
      break;
    }
  }

  return buildResult();

  function buildResult(): EmissionResult {
    return {
      estado,
      ambiente: emisor.ambiente,
      claveAcceso,
      secuencial,
      xmlOriginal,
      xmlFirmado,
      numeroAutorizacion,
      fechaAutorizacion,
      recepcionEstado,
      autorizacionEstado,
      rawRecepcion,
      rawAutorizacion,
      mensajes,
      attempts,
    };
  }
}

function extractFechaEmision(
  documentType: DocumentType,
  data: DocumentData
): string {
  // All document types have a date field, but guiaRemision uses fechaIniTransporte
  if (documentType === "GUIA_REMISION") {
    return (data as { fechaIniTransporte: string }).fechaIniTransporte;
  }
  return (data as { fechaEmision: string }).fechaEmision;
}

function validateXmlStructure(
  xml: string,
  claveAcceso: string,
  rootTag: string
): void {
  if (!xml.startsWith("<?xml")) {
    throw FacturacionElectronicaECError.xmlStructure("XML falta declaracion <?xml");
  }
  if (!xml.includes("<infoTributaria>")) {
    throw FacturacionElectronicaECError.xmlStructure("XML falta bloque <infoTributaria>");
  }
  if (!xml.includes(`<claveAcceso>${claveAcceso}</claveAcceso>`)) {
    throw FacturacionElectronicaECError.xmlStructure("XML falta <claveAcceso> correcta");
  }
  if (!xml.includes(`<${rootTag}`)) {
    throw FacturacionElectronicaECError.xmlStructure(
      `XML falta tag raiz <${rootTag}>`
    );
  }
}
