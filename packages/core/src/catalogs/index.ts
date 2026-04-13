export type { CatalogEntry, CatalogMeta } from "./catalog-registry.js";
export { CatalogRegistry, catalogRegistry } from "./catalog-registry.js";

export { TIPOS_IDENTIFICACION } from "./tipos-identificacion.js";
export { TIPOS_COMPROBANTE } from "./tipos-comprobante.js";
export { FORMAS_PAGO } from "./formas-pago.js";
export {
  IMPUESTOS_IVA,
  RETENCION_IVA,
  CODIGOS_IMPUESTO,
} from "./impuestos.js";
export { CODIGOS_SUSTENTO } from "./codigos-sustento.js";

import { catalogRegistry } from "./catalog-registry.js";
import { TIPOS_IDENTIFICACION } from "./tipos-identificacion.js";
import { TIPOS_COMPROBANTE } from "./tipos-comprobante.js";
import { FORMAS_PAGO } from "./formas-pago.js";
import { IMPUESTOS_IVA, RETENCION_IVA, CODIGOS_IMPUESTO } from "./impuestos.js";
import { CODIGOS_SUSTENTO } from "./codigos-sustento.js";

const SRI_SOURCE = "Ficha Tecnica SRI v2.28";
const UPDATED_AT = "2026-04-12";

/**
 * Initialize the singleton catalog registry with all SRI defaults.
 * Called once at module load time.
 */
function initDefaults(): void {
  catalogRegistry.registerDefault(
    "tipos-identificacion",
    TIPOS_IDENTIFICACION,
    { source: SRI_SOURCE, updatedAt: UPDATED_AT }
  );

  catalogRegistry.registerDefault("tipos-comprobante", TIPOS_COMPROBANTE, {
    source: SRI_SOURCE,
    updatedAt: UPDATED_AT,
  });

  catalogRegistry.registerDefault("formas-pago", FORMAS_PAGO, {
    source: SRI_SOURCE,
    updatedAt: UPDATED_AT,
  });

  catalogRegistry.registerDefault("impuestos-iva", IMPUESTOS_IVA, {
    source: SRI_SOURCE,
    updatedAt: UPDATED_AT,
    notes: "IVA 15% vigente desde abril 2024",
  });

  catalogRegistry.registerDefault("retencion-iva", RETENCION_IVA, {
    source: SRI_SOURCE,
    updatedAt: UPDATED_AT,
  });

  catalogRegistry.registerDefault("codigos-impuesto", CODIGOS_IMPUESTO, {
    source: SRI_SOURCE,
    updatedAt: UPDATED_AT,
  });

  catalogRegistry.registerDefault("codigos-sustento", CODIGOS_SUSTENTO, {
    source: SRI_SOURCE,
    updatedAt: UPDATED_AT,
    notes: "Subset of commonly used codes. Extend via override().",
  });
}

initDefaults();
