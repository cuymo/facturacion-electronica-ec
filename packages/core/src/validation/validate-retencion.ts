import type { RetencionData } from "../documents/retencion.js";
import type { ValidationResult } from "./validators.js";
import { ValidationContext } from "./validators.js";

export function validateRetencion(data: RetencionData): ValidationResult {
  const v = new ValidationContext();

  v.requireFecha("fechaEmision", data.fechaEmision);
  v.requireTipoIdentificacion(
    "tipoIdentificacionSujetoRetenido",
    data.tipoIdentificacionSujetoRetenido
  );
  v.requireString(
    "razonSocialSujetoRetenido",
    data.razonSocialSujetoRetenido
  );
  v.requireString(
    "identificacionSujetoRetenido",
    data.identificacionSujetoRetenido
  );
  v.requirePeriodoFiscal("periodoFiscal", data.periodoFiscal);
  v.requireNonEmptyArray("docsSustento", data.docsSustento);

  return v.result();
}
