/**
 * FacturacionElectronicaEC SDK -- Main orchestrator class.
 *
 * Provides a high-level API for emitting SRI electronic documents
 * and low-level access to individual pipeline steps.
 */

import {
  type DocumentType,
  type DocumentData,
  type FacturaData,
  type LiquidacionCompraData,
  type NotaCreditoData,
  type NotaDebitoData,
  type GuiaRemisionData,
  type RetencionData,
  type XmlBuildContext,
  type CatalogEntry,
  FacturacionElectronicaECError,
  buildDocumentXml,
  validateFactura,
  validateNotaCredito,
  validateNotaDebito,
  validateGuiaRemision,
  validateRetencion,
  validateLiquidacionCompra,
  catalogRegistry,
  schemaRegistry,
} from "@facturacion-ec/core";
import type { ValidationResult } from "@facturacion-ec/core";
import { EcSriSigner } from "@facturacion-ec/signer";
import type { ISigner } from "@facturacion-ec/signer";
import { SriClient } from "@facturacion-ec/sri-client";
import type { ISriClient, SriRecepcionResult, SriAutorizacionResult } from "@facturacion-ec/sri-client";

import type { FacturacionElectronicaECConfig } from "./config.js";
import type { EmissionResult } from "./emission-result.js";
import { runEmissionPipeline } from "./pipeline/emission-pipeline.js";

type DocumentValidator<T extends DocumentData> = (data: T) => ValidationResult;
const ERROR_NOTIFIED = Symbol.for("facturacion-electronica-ec.errorNotified");

export class FacturacionElectronicaEC {
  private readonly config: Required<
    Pick<
      FacturacionElectronicaECConfig,
      | "emisor"
      | "p12"
      | "p12Password"
      | "sequenceProvider"
      | "authorizationDelayMs"
      | "maxError70Retries"
      | "maxSendRetries"
      | "sendRetryDelayMs"
    >
  > &
    FacturacionElectronicaECConfig;

  private readonly signer: ISigner;
  private readonly sriClient: ISriClient;

  constructor(config: FacturacionElectronicaECConfig) {
    if (!config || typeof config !== "object") {
      throw FacturacionElectronicaECError.configuration(
        "La configuracion es obligatoria."
      );
    }

    if (!config.emisor || typeof config.emisor !== "object") {
      throw FacturacionElectronicaECError.configuration(
        "emisor es obligatorio."
      );
    }

    if (!config.sequenceProvider) {
      throw FacturacionElectronicaECError.configuration(
        "sequenceProvider es obligatorio. Use UnsafeMemorySequenceProvider solo para tests."
      );
    }

    if (typeof config.sequenceProvider.next !== "function") {
      throw FacturacionElectronicaECError.configuration(
        "sequenceProvider.next debe ser una funcion."
      );
    }

    if (
      config.sequenceProvider.rollback !== undefined &&
      typeof config.sequenceProvider.rollback !== "function"
    ) {
      throw FacturacionElectronicaECError.configuration(
        "sequenceProvider.rollback debe ser una funcion si se define."
      );
    }

    if (config.signer && typeof config.signer.sign !== "function") {
      throw FacturacionElectronicaECError.configuration(
        "signer.sign debe ser una funcion."
      );
    }

    if (
      config.sriClient &&
      (typeof config.sriClient.enviarComprobante !== "function" ||
        typeof config.sriClient.autorizarComprobante !== "function")
    ) {
      throw FacturacionElectronicaECError.configuration(
        "sriClient debe implementar enviarComprobante y autorizarComprobante."
      );
    }

    this.assertNonNegativeInteger(
      "authorizationDelayMs",
      config.authorizationDelayMs
    );
    this.assertNonNegativeInteger("maxError70Retries", config.maxError70Retries);
    this.assertNonNegativeInteger("maxSendRetries", config.maxSendRetries);
    this.assertNonNegativeInteger("sendRetryDelayMs", config.sendRetryDelayMs);

    this.config = {
      ...config,
      authorizationDelayMs: config.authorizationDelayMs ?? 1500,
      maxError70Retries: config.maxError70Retries ?? 3,
      maxSendRetries: config.maxSendRetries ?? 2,
      sendRetryDelayMs: config.sendRetryDelayMs ?? 2000,
    };

    this.signer = config.signer ?? new EcSriSigner();
    this.sriClient =
      config.sriClient ?? new SriClient({ logger: config.logger });
  }

  // ==================== High-level emission methods ====================

  async emitirFactura(data: FacturaData): Promise<EmissionResult> {
    return this.emitValidated("FACTURA", data, validateFactura);
  }

  async emitirLiquidacionCompra(
    data: LiquidacionCompraData
  ): Promise<EmissionResult> {
    return this.emitValidated(
      "LIQUIDACION_COMPRA",
      data,
      validateLiquidacionCompra
    );
  }

  async emitirNotaCredito(data: NotaCreditoData): Promise<EmissionResult> {
    return this.emitValidated("NOTA_CREDITO", data, validateNotaCredito);
  }

  async emitirNotaDebito(data: NotaDebitoData): Promise<EmissionResult> {
    return this.emitValidated("NOTA_DEBITO", data, validateNotaDebito);
  }

  async emitirGuiaRemision(data: GuiaRemisionData): Promise<EmissionResult> {
    return this.emitValidated("GUIA_REMISION", data, validateGuiaRemision);
  }

  async emitirRetencion(data: RetencionData): Promise<EmissionResult> {
    return this.emitValidated("COMPROBANTE_RETENCION", data, validateRetencion);
  }

  // ==================== Low-level access ====================

  /**
   * Build an unsigned XML document.
   * Does not sign, send, or interact with SRI.
   */
  buildXml(
    documentType: DocumentType,
    data: DocumentData,
    options?: { secuencial?: string; claveAcceso?: string }
  ): string {
    try {
      this.assertDocumentData(data);

      const schema = schemaRegistry.get(documentType);
      const secuencial = options?.secuencial ?? "000000000";
      const claveAcceso = options?.claveAcceso ?? "0".repeat(49);

      const ctx: XmlBuildContext = {
        ambiente: this.config.emisor.ambiente,
        ruc: this.config.emisor.ruc,
        razonSocial: this.config.emisor.razonSocial,
        nombreComercial: this.config.emisor.nombreComercial ?? null,
        dirMatriz: this.config.emisor.dirMatriz,
        claveAcceso,
        codDoc: schema.codDoc,
        establecimiento: this.config.emisor.establecimiento,
        puntoEmision: this.config.emisor.puntoEmision,
        secuencial,
        direccionEstablecimiento:
          this.config.emisor.direccionEstablecimiento,
        contribuyenteEspecial:
          this.config.emisor.contribuyenteEspecial ?? null,
        obligadoContabilidad: this.config.emisor.obligadoContabilidad,
      };

      return buildDocumentXml(documentType, ctx, data);
    } catch (error) {
      throw this.handleSyncError(error, (e) =>
        FacturacionElectronicaECError.xmlBuild(
          `Error construyendo XML: ${this.errorMessage(e)}`,
          { cause: e instanceof Error ? e : undefined }
        )
      );
    }
  }

  /**
   * Sign an XML document.
   * Does not send or interact with SRI.
   */
  async signXml(xml: string, documentType: DocumentType): Promise<string> {
    try {
      return await this.signer.sign(xml, documentType, {
        p12: this.config.p12,
        p12Password: this.config.p12Password,
      });
    } catch (error) {
      throw await this.handleAsyncError(error, (e) =>
        FacturacionElectronicaECError.signing(
          `Error al firmar XML: ${this.errorMessage(e)}`,
          { cause: e instanceof Error ? e : undefined }
        )
      );
    }
  }

  /**
   * Send a signed XML to SRI reception. Single attempt, no retry.
   */
  async sendToSri(signedXml: string): Promise<SriRecepcionResult> {
    try {
      return await this.sriClient.enviarComprobante(
        signedXml,
        this.config.emisor.ambiente
      );
    } catch (error) {
      throw await this.handleAsyncError(error, (e) =>
        FacturacionElectronicaECError.sriCommunication(
          `Error enviando comprobante al SRI: ${this.errorMessage(e)}`,
          { cause: e instanceof Error ? e : undefined }
        )
      );
    }
  }

  /**
   * Query SRI authorization by clave de acceso. Single call, no polling.
   */
  async checkAuthorization(
    claveAcceso: string
  ): Promise<SriAutorizacionResult> {
    try {
      return await this.sriClient.autorizarComprobante(
        claveAcceso,
        this.config.emisor.ambiente
      );
    } catch (error) {
      throw await this.handleAsyncError(error, (e) =>
        FacturacionElectronicaECError.sriCommunication(
          `Error consultando autorizacion en SRI: ${this.errorMessage(e)}`,
          { cause: e instanceof Error ? e : undefined }
        )
      );
    }
  }

  // ==================== Catalog management ====================

  /**
   * Override entries in a catalog.
   * Useful when SRI changes tax rates.
   */
  overrideCatalog(
    name: string,
    entries: Record<string, CatalogEntry>
  ): void {
    try {
      catalogRegistry.override(name, entries);
    } catch (error) {
      throw this.handleSyncError(error, (e) =>
        FacturacionElectronicaECError.configuration(
          `Error actualizando catalogo "${name}": ${this.errorMessage(e)}`,
          { cause: e instanceof Error ? e : undefined }
        )
      );
    }
  }

  // ==================== Private ====================

  private async emit(
    documentType: DocumentType,
    data: DocumentData
  ): Promise<EmissionResult> {
    return runEmissionPipeline({
      emisor: this.config.emisor,
      documentType,
      data,
      p12: this.config.p12,
      p12Password: this.config.p12Password,
      sequenceProvider: this.config.sequenceProvider,
      signer: this.signer,
      sriClient: this.sriClient,
      logger: this.config.logger,
      hooks: this.config.hooks,
      validateXsd: this.config.validateXsd ?? false,
      authorizationDelayMs: this.config.authorizationDelayMs,
      maxError70Retries: this.config.maxError70Retries,
      maxSendRetries: this.config.maxSendRetries,
      sendRetryDelayMs: this.config.sendRetryDelayMs,
    });
  }

  private async emitValidated<T extends DocumentData>(
    documentType: DocumentType,
    data: T,
    validate: DocumentValidator<T>
  ): Promise<EmissionResult> {
    try {
      this.assertDocumentData(data);
      this.assertValid(validate(data));
    } catch (error) {
      throw await this.handleAsyncError(error, (e) =>
        FacturacionElectronicaECError.validation(
          `Datos invalidos para ${documentType}: ${this.errorMessage(e)}`,
          { cause: e instanceof Error ? e : undefined }
        )
      );
    }

    try {
      return await this.emit(documentType, data);
    } catch (error) {
      throw await this.handleAsyncError(error, (e) =>
        FacturacionElectronicaECError.xmlBuild(
          `Error emitiendo ${documentType}: ${this.errorMessage(e)}`,
          { cause: e instanceof Error ? e : undefined }
        )
      );
    }
  }

  private assertValid(result: ValidationResult): void {
    if (!result.valid) {
      const messages = result.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ");
      throw FacturacionElectronicaECError.validation(messages);
    }
  }

  private assertDocumentData(data: unknown): asserts data is DocumentData {
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      throw FacturacionElectronicaECError.validation(
        "Los datos del documento deben ser un objeto."
      );
    }
  }

  private assertNonNegativeInteger(field: string, value: unknown): void {
    if (value === undefined) return;
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 0
    ) {
      throw FacturacionElectronicaECError.configuration(
        `${field} debe ser un entero mayor o igual a 0.`
      );
    }
  }

  private handleSyncError(
    error: unknown,
    fallback: (error: unknown) => FacturacionElectronicaECError
  ): FacturacionElectronicaECError {
    const typed =
      error instanceof FacturacionElectronicaECError ? error : fallback(error);
    void this.notifyError(typed);
    return typed;
  }

  private async handleAsyncError(
    error: unknown,
    fallback: (error: unknown) => FacturacionElectronicaECError
  ): Promise<FacturacionElectronicaECError> {
    const typed =
      error instanceof FacturacionElectronicaECError ? error : fallback(error);
    await this.notifyError(typed);
    return typed;
  }

  private async notifyError(
    error: FacturacionElectronicaECError
  ): Promise<void> {
    const record = error as FacturacionElectronicaECError & {
      [ERROR_NOTIFIED]?: true;
    };
    if (record[ERROR_NOTIFIED]) return;
    Object.defineProperty(record, ERROR_NOTIFIED, {
      value: true,
      enumerable: false,
      configurable: true,
    });

    if (!this.config.hooks?.onError) return;
    try {
      await this.config.hooks.onError(error);
    } catch (hookError) {
      this.config.logger?.warn("[SDK] onError hook error", {
        error: this.errorMessage(hookError),
      });
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
