/**
 * Concrete ISriClient implementation.
 *
 * Ported from EmiteYa src/config/sri.adapter.ts.
 * Changes from EmiteYa:
 * - Logger is injectable (no global singleton)
 * - Ambiente uses '1'/'2' codes (not 'PRUEBAS'/'PRODUCCION')
 * - No retry/polling logic -- that belongs in the SDK pipeline
 * - Uses standard fetch() (Node 18+)
 */

import type { Ambiente, Logger } from "@facturaya/core";
import { FacturaYaError } from "@facturaya/core";
import type { ISriClient } from "./sri-client.interface.js";
import type { SriRecepcionResult, SriAutorizacionResult } from "./types.js";
import { SRI_ENDPOINTS } from "./endpoints.js";
import { buildRecepcionEnvelope, buildAutorizacionEnvelope } from "./soap/builder.js";
import { sriParser, findNode, parseMensajes } from "./soap/parser.js";

export interface SriClientOptions {
  /** Optional logger. If not provided, no logging occurs. */
  logger?: Logger;

  /**
   * Custom fetch implementation. Defaults to globalThis.fetch.
   * Useful for testing or environments without native fetch.
   */
  fetch?: typeof globalThis.fetch;

  /** Request timeout in milliseconds. Default: 30000 (30s). */
  timeoutMs?: number;
}

export class SriClient implements ISriClient {
  private readonly logger: Logger | undefined;
  private readonly fetchFn: typeof globalThis.fetch;
  private readonly timeoutMs: number;

  constructor(options?: SriClientOptions) {
    this.logger = options?.logger;
    this.fetchFn = options?.fetch ?? globalThis.fetch.bind(globalThis);
    this.timeoutMs = options?.timeoutMs ?? 30_000;
  }

  async enviarComprobante(
    signedXml: string,
    ambiente: Ambiente
  ): Promise<SriRecepcionResult> {
    const endpoint = SRI_ENDPOINTS[ambiente].recepcion;

    this.logger?.info("[SRI] Enviando comprobante a recepcion", {
      ambiente,
      endpoint,
    });

    const xmlBase64 = Buffer.from(signedXml, "utf-8").toString("base64");
    const soapEnvelope = buildRecepcionEnvelope(xmlBase64);

    const response = await this.soapRequest(endpoint, soapEnvelope);
    const responseXml = await response.text();

    this.logger?.debug("[SRI] Recepcion respuesta cruda", { responseXml });

    const parsed = sriParser.parse(responseXml);
    const estado = String(findNode(parsed, "estado") ?? "DEVUELTA");
    const mensajesNode = findNode(parsed, "mensajes");

    const result: SriRecepcionResult = {
      estado: estado as SriRecepcionResult["estado"],
      mensajes: parseMensajes(mensajesNode),
    };

    this.logger?.info(`[SRI] Recepcion resultado: ${result.estado}`, {
      mensajes: result.mensajes,
    });

    return result;
  }

  async autorizarComprobante(
    claveAcceso: string,
    ambiente: Ambiente
  ): Promise<SriAutorizacionResult> {
    const endpoint = SRI_ENDPOINTS[ambiente].autorizacion;

    this.logger?.info("[SRI] Consultando autorizacion", {
      claveAcceso,
      ambiente,
      endpoint,
    });

    const soapEnvelope = buildAutorizacionEnvelope(claveAcceso);
    const response = await this.soapRequest(endpoint, soapEnvelope);
    const responseXml = await response.text();

    this.logger?.debug("[SRI] Autorizacion respuesta cruda", { responseXml });

    const parsed = sriParser.parse(responseXml);
    let autorizacion = findNode(parsed, "autorizacion") as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | undefined;

    // autorizaciones may contain an array; take the first entry
    if (Array.isArray(autorizacion)) autorizacion = autorizacion[0];

    if (!autorizacion) {
      this.logger?.warn("[SRI] Autorizacion sin bloque <autorizacion>", {
        claveAcceso,
        responseXml,
      });
      return {
        estado: "NO AUTORIZADO",
        numeroAutorizacion: null,
        fechaAutorizacion: null,
        mensajes: parseMensajes(findNode(parsed, "mensajes")),
      };
    }

    const estadoAuth = String(autorizacion.estado ?? "NO AUTORIZADO");

    const result: SriAutorizacionResult = {
      estado: estadoAuth as SriAutorizacionResult["estado"],
      numeroAutorizacion: autorizacion.numeroAutorizacion
        ? String(autorizacion.numeroAutorizacion)
        : null,
      fechaAutorizacion: autorizacion.fechaAutorizacion
        ? String(autorizacion.fechaAutorizacion)
        : null,
      mensajes: parseMensajes(autorizacion.mensajes),
    };

    this.logger?.info(`[SRI] Autorizacion resultado: ${result.estado}`, {
      claveAcceso,
      numeroAutorizacion: result.numeroAutorizacion,
      mensajes: result.mensajes,
    });

    return result;
  }

  private async soapRequest(
    endpoint: string,
    soapEnvelope: string
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchFn(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "",
        },
        body: soapEnvelope,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "(no body)");
        this.logger?.error("[SRI] HTTP error", {
          status: response.status,
          statusText: response.statusText,
          responseBody: errorBody,
          endpoint,
        });
        throw FacturaYaError.sriCommunication(
          `SRI endpoint returned HTTP ${response.status}: ${response.statusText}`
        );
      }

      return response;
    } catch (error) {
      if (error instanceof FacturaYaError) throw error;

      if (error instanceof DOMException && error.name === "AbortError") {
        throw FacturaYaError.sriCommunication(
          `SRI request timed out after ${this.timeoutMs}ms`
        );
      }

      throw FacturaYaError.sriCommunication(
        `SRI communication error: ${error instanceof Error ? error.message : String(error)}`,
        { cause: error instanceof Error ? error : undefined }
      );
    } finally {
      clearTimeout(timeout);
    }
  }
}
