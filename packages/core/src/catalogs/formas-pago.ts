import type { CatalogEntry } from "./catalog-registry.js";

/**
 * SRI payment method codes.
 * Source: Ficha Tecnica SRI v2.28, Tabla 24.
 */
export const FORMAS_PAGO: Record<string, CatalogEntry> = {
  "01": {
    code: "01",
    description: "Sin utilizacion del sistema financiero",
  },
  "15": { code: "15", description: "Compensacion de deudas" },
  "16": { code: "16", description: "Tarjeta de debito" },
  "17": { code: "17", description: "Dinero electronico" },
  "18": { code: "18", description: "Tarjeta prepago" },
  "19": { code: "19", description: "Tarjeta de credito" },
  "20": {
    code: "20",
    description: "Otros con utilizacion del sistema financiero",
  },
  "21": { code: "21", description: "Endoso de titulos" },
};
