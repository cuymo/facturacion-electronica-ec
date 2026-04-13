/**
 * FacturaYa SDK -- Main orchestrator class.
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
  FacturaYaError,
  buildDocumentXml,
  validateFactura,
  validateNotaCredito,
  validateNotaDebito,
  validateGuiaRemision,
  validateRetencion,
  validateLiquidacionCompra,
  catalogRegistry,
  schemaRegistry,
} from "@facturaya/core";
import type { ValidationResult } from "@facturaya/core";
import { EcSriSigner } from "@facturaya/signer";
import type { ISigner } from "@facturaya/signer";
import { SriClient } from "@facturaya/sri-client";
import type { ISriClient, SriRecepcionResult, SriAutorizacionResult } from "@facturaya/sri-client";

import type { FacturaYaConfig } from "./config.js";
import type { EmissionResult } from "./emission-result.js";
import { runEmissionPipeline } from "./pipeline/emission-pipeline.js";

export class FacturaYa {
  private readonly config: Required<
    Pick<
      FacturaYaConfig,
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
    FacturaYaConfig;

  private readonly signer: ISigner;
  private readonly sriClient: ISriClient;

  constructor(config: FacturaYaConfig) {
    if (!config.sequenceProvider) {
      throw FacturaYaError.configuration(
        "sequenceProvider es obligatorio. Use UnsafeMemorySequenceProvider solo para tests."
      );
    }

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
    this.assertValid(validateFactura(data));
    return this.emit("FACTURA", data);
  }

  async emitirLiquidacionCompra(
    data: LiquidacionCompraData
  ): Promise<EmissionResult> {
    this.assertValid(validateLiquidacionCompra(data));
    return this.emit("LIQUIDACION_COMPRA", data);
  }

  async emitirNotaCredito(data: NotaCreditoData): Promise<EmissionResult> {
    this.assertValid(validateNotaCredito(data));
    return this.emit("NOTA_CREDITO", data);
  }

  async emitirNotaDebito(data: NotaDebitoData): Promise<EmissionResult> {
    this.assertValid(validateNotaDebito(data));
    return this.emit("NOTA_DEBITO", data);
  }

  async emitirGuiaRemision(data: GuiaRemisionData): Promise<EmissionResult> {
    this.assertValid(validateGuiaRemision(data));
    return this.emit("GUIA_REMISION", data);
  }

  async emitirRetencion(data: RetencionData): Promise<EmissionResult> {
    this.assertValid(validateRetencion(data));
    return this.emit("COMPROBANTE_RETENCION", data);
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
  }

  /**
   * Sign an XML document.
   * Does not send or interact with SRI.
   */
  async signXml(xml: string, documentType: DocumentType): Promise<string> {
    return this.signer.sign(xml, documentType, {
      p12: this.config.p12,
      p12Password: this.config.p12Password,
    });
  }

  /**
   * Send a signed XML to SRI reception. Single attempt, no retry.
   */
  async sendToSri(signedXml: string): Promise<SriRecepcionResult> {
    return this.sriClient.enviarComprobante(
      signedXml,
      this.config.emisor.ambiente
    );
  }

  /**
   * Query SRI authorization by clave de acceso. Single call, no polling.
   */
  async checkAuthorization(
    claveAcceso: string
  ): Promise<SriAutorizacionResult> {
    return this.sriClient.autorizarComprobante(
      claveAcceso,
      this.config.emisor.ambiente
    );
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
    catalogRegistry.override(name, entries);
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

  private assertValid(result: ValidationResult): void {
    if (!result.valid) {
      const messages = result.errors
        .map((e) => `${e.field}: ${e.message}`)
        .join("; ");
      throw FacturaYaError.validation(messages);
    }
  }
}
