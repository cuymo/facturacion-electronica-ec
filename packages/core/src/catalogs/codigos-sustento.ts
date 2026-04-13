import type { CatalogEntry } from "./catalog-registry.js";

/**
 * SRI supporting document sustento codes.
 * Used in comprobanteRetencion -> docSustento -> codSustento.
 * Source: Ficha Tecnica SRI v2.28, Tabla 5.
 *
 * NOTE: This is a subset of commonly used codes. The full list
 * has 20+ entries. Consumers can extend via CatalogRegistry.override().
 */
export const CODIGOS_SUSTENTO: Record<string, CatalogEntry> = {
  "01": {
    code: "01",
    description:
      "Credito tributario para declaracion de IVA (empresas y personas naturales obligadas)",
  },
  "02": {
    code: "02",
    description:
      "Costo o gasto para declaracion de IR (empresas y personas naturales obligadas)",
  },
  "03": {
    code: "03",
    description: "Activo fijo - credito tributario para declaracion de IVA",
  },
  "04": {
    code: "04",
    description: "Activo fijo - costo o gasto para declaracion de IR",
  },
  "05": {
    code: "05",
    description: "Liquidacion de gastos de viaje, hospedaje y alimentacion",
  },
  "06": {
    code: "06",
    description: "Inventario - credito tributario para declaracion de IVA",
  },
  "07": {
    code: "07",
    description: "Inventario - costo o gasto para declaracion de IR",
  },
  "08": {
    code: "08",
    description:
      "Valor pagado para solicitar reembolso de gasto (intermediario)",
  },
  "09": {
    code: "09",
    description: "Reembolso por siniestros",
  },
  "10": {
    code: "10",
    description: "Distribucion de dividendos, beneficios o utilidades",
  },
  "00": {
    code: "00",
    description:
      "Casos especiales cuyo sustento no aplica en las opciones anteriores",
  },
};
