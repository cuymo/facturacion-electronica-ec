import type { TaxInfo, TotalTax } from "../types/common.js";

/** Line item detail for a nota de credito. */
export interface NotaCreditoDetail {
  /** Maps to <codigoInterno> in nota credito XSD. */
  codigoPrincipal: string;
  /** Maps to <codigoAdicional>. */
  codigoAuxiliar?: string;
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
  descuento: number;
  precioTotalSinImpuesto: number;
  impuestos: TaxInfo[];
}

/** Input data to build a nota de credito XML. */
export interface NotaCreditoData {
  fechaEmision: string; // dd/mm/yyyy
  tipoIdentificacionComprador: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  /** SRI codDoc of the modified document. E.g. "01" for factura. */
  codDocModificado: string;
  /** Full document number of the modified document. Format: 001-001-000000001. */
  numDocModificado: string;
  /** Emission date of the modified document. dd/mm/yyyy. */
  fechaEmisionDocSustento: string;
  totalSinImpuestos: number;
  valorModificacion: number;
  totalConImpuestos: TotalTax[];
  motivo: string;
  detalles: NotaCreditoDetail[];
}
