import type { CatalogEntry } from "./catalog-registry.js";

/**
 * SRI buyer/subject identification types.
 * Source: Ficha Tecnica SRI v2.28, Tabla 6.
 */
export const TIPOS_IDENTIFICACION: Record<string, CatalogEntry> = {
  "04": { code: "04", description: "RUC" },
  "05": { code: "05", description: "Cedula" },
  "06": { code: "06", description: "Pasaporte" },
  "07": { code: "07", description: "Consumidor Final" },
  "08": { code: "08", description: "Identificacion del Exterior" },
};
