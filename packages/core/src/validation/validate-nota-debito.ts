import type { NotaDebitoData } from "../documents/nota-debito.js";
import type { ValidationResult } from "./validators.js";
import { ValidationContext } from "./validators.js";

export function validateNotaDebito(data: NotaDebitoData): ValidationResult {
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
  v.requireNonEmptyArray("impuestos", data.impuestos);
  v.requireNonNegativeNumber("valorTotal", data.valorTotal);
  v.requireNonEmptyArray("motivos", data.motivos);

  return v.result();
}
