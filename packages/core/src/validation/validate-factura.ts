import type { FacturaData } from "../documents/factura.js";
import type { ValidationResult } from "./validators.js";
import { ValidationContext } from "./validators.js";

export function validateFactura(data: FacturaData): ValidationResult {
  const v = new ValidationContext();

  v.requireFecha("fechaEmision", data.fechaEmision);
  v.requireTipoIdentificacion(
    "tipoIdentificacionComprador",
    data.tipoIdentificacionComprador
  );
  v.requireString("razonSocialComprador", data.razonSocialComprador);
  v.requireString("identificacionComprador", data.identificacionComprador);
  v.requireNonNegativeNumber("totalSinImpuestos", data.totalSinImpuestos);
  v.requireNonNegativeNumber("totalDescuento", data.totalDescuento);
  v.requireNonEmptyArray("totalConImpuestos", data.totalConImpuestos);
  v.requireNonNegativeNumber("propina", data.propina);
  v.requireNonNegativeNumber("importeTotal", data.importeTotal);
  v.requireNonEmptyArray("pagos", data.pagos);
  v.requireNonEmptyArray("detalles", data.detalles);

  return v.result();
}
