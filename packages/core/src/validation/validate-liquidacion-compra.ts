import type { LiquidacionCompraData } from "../documents/liquidacion-compra.js";
import type { ValidationResult } from "./validators.js";
import { ValidationContext } from "./validators.js";

export function validateLiquidacionCompra(
  data: LiquidacionCompraData
): ValidationResult {
  const v = new ValidationContext();

  v.requireFecha("fechaEmision", data.fechaEmision);
  v.requireTipoIdentificacion(
    "tipoIdentificacionProveedor",
    data.tipoIdentificacionProveedor
  );
  v.requireString("razonSocialProveedor", data.razonSocialProveedor);
  v.requireString("identificacionProveedor", data.identificacionProveedor);
  v.requireNonNegativeNumber("totalSinImpuestos", data.totalSinImpuestos);
  v.requireNonNegativeNumber("totalDescuento", data.totalDescuento);
  v.requireNonEmptyArray("totalConImpuestos", data.totalConImpuestos);
  v.requireNonNegativeNumber("importeTotal", data.importeTotal);
  v.requireNonEmptyArray("pagos", data.pagos);
  v.requireNonEmptyArray("detalles", data.detalles);

  return v.result();
}
