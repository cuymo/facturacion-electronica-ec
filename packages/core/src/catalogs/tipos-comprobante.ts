import type { CatalogEntry } from "./catalog-registry.js";

/**
 * SRI document type codes.
 * Source: Ficha Tecnica SRI v2.28, Tabla 3.
 */
export const TIPOS_COMPROBANTE: Record<string, CatalogEntry> = {
  "01": { code: "01", description: "Factura" },
  "03": { code: "03", description: "Liquidacion de Compra" },
  "04": { code: "04", description: "Nota de Credito" },
  "05": { code: "05", description: "Nota de Debito" },
  "06": { code: "06", description: "Guia de Remision" },
  "07": { code: "07", description: "Comprobante de Retencion" },
};
