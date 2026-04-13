// ─── Main SDK class ───
export { FacturaYa } from "./facturaya.js";

// ─── Configuration ───
export type { FacturaYaConfig } from "./config.js";

// ─── Emission result ───
export type { EmissionResult, EmissionEstado } from "./emission-result.js";

// ─── Sequence provider ───
export type { ISequenceProvider } from "./sequence/sequence-provider.js";
export { UnsafeMemorySequenceProvider } from "./sequence/sequence-provider.js";

// ─── Hooks ───
export type { EmissionHooks } from "./hooks.js";

// ─── Core types (re-exported so consumers don't need a separate package) ───
export type {
  Emisor,
  DocumentType,
  Ambiente,
  AmbienteLabel,
  XmlBuildContext,
  TaxInfo,
  TotalTax,
  Payment,
  SimplePayment,
  TipoIdentificacion,
  ClaveAccesoParams,
  DocumentSchema,
  CatalogEntry,
  CatalogMeta,
  ValidationResult,
  ValidationError,
  FacturaYaErrorCode,
  SriMensaje,
  Logger,
  XsdValidationResult,
} from "@facturaya/core";

// ─── Core document data types ───
export type {
  FacturaData,
  FacturaDetail,
  LiquidacionCompraData,
  LiquidacionCompraDetail,
  NotaCreditoData,
  NotaCreditoDetail,
  NotaDebitoData,
  NotaDebitoMotivo,
  GuiaRemisionData,
  GuiaRemisionDestinatario,
  GuiaRemisionDetailItem,
  RetencionData,
  RetencionDocSustento,
  RetencionDocTax,
  RetencionRetencion,
  DocumentData,
} from "@facturaya/core";

// ─── Core functions ───
export {
  FacturaYaError,
  // Clave de acceso
  generateClaveAcceso,
  generateCodigoNumerico,
  computeModulo11,
  // XML builders
  buildFacturaXml,
  buildLiquidacionCompraXml,
  buildNotaCreditoXml,
  buildNotaDebitoXml,
  buildGuiaRemisionXml,
  buildComprobanteRetencionXml,
  buildDocumentXml,
  escapeXml,
  toFixed2,
  toFixed6,
  buildInfoTributariaXml,
  // Types & constants
  ambienteToLabel,
  labelToAmbiente,
  DOCUMENT_TYPE_COD_DOC,
  COD_DOC_TO_DOCUMENT_TYPE,
  getCodDoc,
  isValidDocumentType,
  // Schema registry
  SchemaRegistry,
  schemaRegistry,
  // Catalog registry
  CatalogRegistry,
  catalogRegistry,
  TIPOS_IDENTIFICACION,
  TIPOS_COMPROBANTE,
  FORMAS_PAGO,
  IMPUESTOS_IVA,
  RETENCION_IVA,
  CODIGOS_IMPUESTO,
  CODIGOS_SUSTENTO,
  // Validation
  ValidationContext,
  isValidRuc,
  isValidCedula,
  isValidFecha,
  isValidTipoIdentificacion,
  isValidNumDocumento,
  validateFactura,
  validateNotaCredito,
  validateNotaDebito,
  validateGuiaRemision,
  validateRetencion,
  validateLiquidacionCompra,
  // XSD Validation
  validateXmlAgainstXsd,
  getAvailableXsdTypes,
  registerXsdSearchPath,
} from "@facturaya/core";

// ─── Signer interface ───
export type { ISigner, SignOptions } from "@facturaya/signer";
export { EcSriSigner } from "@facturaya/signer";

// ─── SRI Client interface ───
export type { ISriClient, SriRecepcionResult, SriAutorizacionResult } from "@facturaya/sri-client";
export { SriClient, SRI_ENDPOINTS } from "@facturaya/sri-client";
export type { SriClientOptions, SriEndpoints } from "@facturaya/sri-client";
