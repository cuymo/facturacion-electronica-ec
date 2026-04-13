/**
 * SRI document types with their official codDoc values.
 *
 * These codes are defined in the Ficha Tecnica SRI and are used
 * in the clave de acceso, XML infoTributaria, and WSDL operations.
 */
export type DocumentType =
  | "FACTURA"
  | "LIQUIDACION_COMPRA"
  | "NOTA_CREDITO"
  | "NOTA_DEBITO"
  | "GUIA_REMISION"
  | "COMPROBANTE_RETENCION";

/**
 * Maps a DocumentType to its SRI codDoc (2-digit string).
 */
export const DOCUMENT_TYPE_COD_DOC: Record<DocumentType, string> = {
  FACTURA: "01",
  LIQUIDACION_COMPRA: "03",
  NOTA_CREDITO: "04",
  NOTA_DEBITO: "05",
  GUIA_REMISION: "06",
  COMPROBANTE_RETENCION: "07",
};

/**
 * Reverse map: codDoc -> DocumentType.
 */
export const COD_DOC_TO_DOCUMENT_TYPE: Record<string, DocumentType> = {
  "01": "FACTURA",
  "03": "LIQUIDACION_COMPRA",
  "04": "NOTA_CREDITO",
  "05": "NOTA_DEBITO",
  "06": "GUIA_REMISION",
  "07": "COMPROBANTE_RETENCION",
};

export function getCodDoc(documentType: DocumentType): string {
  return DOCUMENT_TYPE_COD_DOC[documentType];
}

export function isValidDocumentType(value: string): value is DocumentType {
  return value in DOCUMENT_TYPE_COD_DOC;
}
