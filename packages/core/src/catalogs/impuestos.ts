import type { CatalogEntry } from "./catalog-registry.js";

/**
 * SRI IVA tax rate codes.
 * Source: Ficha Tecnica SRI v2.28 + Resoluciones vigentes.
 *
 * IMPORTANT: These rates change over time (e.g. IVA went from 12% to 15% in 2024).
 * Use CatalogRegistry.override() to update without waiting for a library release.
 */
export const IMPUESTOS_IVA: Record<string, CatalogEntry> = {
  "0": { code: "0", description: "IVA 0%", rate: 0 },
  "2": { code: "2", description: "IVA 12%", rate: 12 },
  "3": { code: "3", description: "IVA 14%", rate: 14 },
  "4": { code: "4", description: "IVA 15%", rate: 15 },
  "6": { code: "6", description: "No objeto de impuesto", rate: 0 },
  "7": { code: "7", description: "Exento de IVA", rate: 0 },
  "8": { code: "8", description: "IVA diferenciado", rate: 5 },
};

/**
 * SRI IVA retention codes.
 * These are the porcentajes de retencion de IVA.
 */
export const RETENCION_IVA: Record<string, CatalogEntry> = {
  "1": { code: "1", description: "Retencion 10% IVA", rate: 10 },
  "2": { code: "2", description: "Retencion 20% IVA", rate: 20 },
  "3": { code: "3", description: "Retencion 30% IVA", rate: 30 },
  "4": { code: "4", description: "Retencion 50% IVA", rate: 50 },
  "7": { code: "7", description: "Retencion 70% IVA", rate: 70 },
  "8": { code: "8", description: "Retencion 100% IVA", rate: 100 },
  "9": { code: "9", description: "Retencion 10% IVA", rate: 10 },
  "10": { code: "10", description: "Retencion 20% IVA", rate: 20 },
};

/**
 * SRI tax type codes (codigo de impuesto).
 * Used in the <codigo> field inside tax blocks.
 */
export const CODIGOS_IMPUESTO: Record<string, CatalogEntry> = {
  "2": { code: "2", description: "IVA" },
  "3": { code: "3", description: "ICE" },
  "5": { code: "5", description: "IRBPNR" },
};
