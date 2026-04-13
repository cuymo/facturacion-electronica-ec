import type { TaxInfo, TotalTax, Payment } from "../types/common.js";

/** Line item detail for a liquidacion de compra. Same structure as factura. */
export interface LiquidacionCompraDetail {
  codigoPrincipal: string;
  codigoAuxiliar?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  impuestos: TaxInfo[];
}

/** Input data to build a liquidacion de compra XML. */
export interface LiquidacionCompraData {
  fechaEmision: string; // dd/mm/yyyy
  tipoIdentificacionProveedor: string;
  razonSocialProveedor: string;
  identificacionProveedor: string;
  direccionProveedor?: string;
  totalSinImpuestos: number;
  totalDescuento: number;
  totalConImpuestos: TotalTax[];
  importeTotal: number;
  pagos: Payment[];
  detalles: LiquidacionCompraDetail[];
}
