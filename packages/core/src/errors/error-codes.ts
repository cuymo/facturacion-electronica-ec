/**
 * Typed error codes for FacturacionElectronicaEC operations.
 *
 * Intentionally NOT HTTP status codes -- this is a library, not a web framework.
 * Consumers map these to their own error handling strategy.
 */
export type FacturacionElectronicaECErrorCode =
  | "VALIDATION"
  | "CLAVE_ACCESO"
  | "XML_BUILD"
  | "XML_STRUCTURE"
  | "SIGNING"
  | "SRI_RECEPTION"
  | "SRI_AUTHORIZATION"
  | "SRI_COMMUNICATION"
  | "SRI_ERROR_70"
  | "SEQUENCE"
  | "CONFIGURATION"
  | "CERTIFICATE";
