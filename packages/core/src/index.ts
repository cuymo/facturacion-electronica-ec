// === Types ===
export type {
  Ambiente,
  AmbienteLabel,
  DocumentType,
  Emisor,
  XmlBuildContext,
  TaxInfo,
  TotalTax,
  Payment,
  SimplePayment,
  TipoIdentificacion,
} from "./types/index.js";

export {
  ambienteToLabel,
  labelToAmbiente,
  DOCUMENT_TYPE_COD_DOC,
  COD_DOC_TO_DOCUMENT_TYPE,
  getCodDoc,
  isValidDocumentType,
} from "./types/index.js";

// === Document Data Interfaces ===
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
} from "./documents/index.js";

// === XML Builders ===
export {
  escapeXml,
  toFixed2,
  toFixed6,
  buildInfoTributariaXml,
  buildFacturaXml,
  buildNotaCreditoXml,
  buildNotaDebitoXml,
  buildGuiaRemisionXml,
  buildComprobanteRetencionXml,
  buildLiquidacionCompraXml,
  buildDocumentXml,
} from "./xml/index.js";

// === Clave de Acceso ===
export type { ClaveAccesoParams } from "./clave-acceso/index.js";
export {
  generateClaveAcceso,
  generateCodigoNumerico,
  computeModulo11,
} from "./clave-acceso/index.js";

// === Schema Registry ===
export type { DocumentSchema } from "./schema-registry/index.js";
export { SchemaRegistry, schemaRegistry } from "./schema-registry/index.js";

// === Catalog Registry ===
export type { CatalogEntry, CatalogMeta } from "./catalogs/index.js";
export {
  CatalogRegistry,
  catalogRegistry,
  TIPOS_IDENTIFICACION,
  TIPOS_COMPROBANTE,
  FORMAS_PAGO,
  IMPUESTOS_IVA,
  RETENCION_IVA,
  CODIGOS_IMPUESTO,
  CODIGOS_SUSTENTO,
} from "./catalogs/index.js";

// === Validation ===
export type { ValidationResult, ValidationError } from "./validation/index.js";
export {
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
} from "./validation/index.js";

// === Errors ===
export type { FacturaYaErrorCode } from "./errors/index.js";
export { FacturaYaError } from "./errors/index.js";
export type { SriMensaje } from "./errors/index.js";

// === XSD Validation ===
export type { XsdValidationResult } from "./xsd-validation/index.js";
export {
  validateXmlAgainstXsd,
  getAvailableXsdTypes,
  registerXsdSearchPath,
} from "./xsd-validation/index.js";

// === Logger Interface ===
// Defined here in core so all packages can use it without circular deps.
export interface Logger {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  debug(message: string, meta?: Record<string, unknown>): void;
}
