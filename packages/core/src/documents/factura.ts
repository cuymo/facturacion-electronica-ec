import type { TaxInfo, TotalTax, Payment } from "../types/common.js";

/** Line item detail for a factura. */
export interface FacturaDetail {
  codigoPrincipal: string;
  codigoAuxiliar?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  impuestos: TaxInfo[];
}

/** Input data to build a factura XML. Pure SRI domain, no SaaS fields. */
export interface FacturaData {
  fechaEmision: string; // dd/mm/yyyy
  tipoIdentificacionComprador: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  direccionComprador?: string;
  totalSinImpuestos: number;
  totalDescuento: number;
  totalConImpuestos: TotalTax[];
  propina: number;
  importeTotal: number;
  pagos: Payment[];
  detalles: FacturaDetail[];
}
