import type { NotaCreditoData } from "../documents/nota-credito.js";
import type { ValidationResult } from "./validators.js";
import { ValidationContext } from "./validators.js";

export function validateNotaCredito(data: NotaCreditoData): ValidationResult {
  const v = new ValidationContext();

  v.requireFecha("fechaEmision", data.fechaEmision);
  v.requireTipoIdentificacion(
    "tipoIdentificacionComprador",
    data.tipoIdentificacionComprador
  );
  v.requireString("razonSocialComprador", data.razonSocialComprador);
  v.requireString("identificacionComprador", data.identificacionComprador);
  v.requireString("codDocModificado", data.codDocModificado);
  v.requireNumDocumento("numDocModificado", data.numDocModificado);
  v.requireFecha("fechaEmisionDocSustento", data.fechaEmisionDocSustento);
  v.requireNonNegativeNumber("totalSinImpuestos", data.totalSinImpuestos);
  v.requireNonNegativeNumber("valorModificacion", data.valorModificacion);
  v.requireNonEmptyArray("totalConImpuestos", data.totalConImpuestos);
  v.requireString("motivo", data.motivo);
  v.requireNonEmptyArray("detalles", data.detalles);

  return v.result();
}
