/**
 * Shared sub-types used across multiple document types.
 * These map directly to SRI XML schema elements.
 */

/** Tax applied to a line item. Used in factura, nota credito, liquidacion compra. */
export interface TaxInfo {
  /** Tax type code. "2" = IVA, "3" = ICE, "5" = IRBPNR. */
  codigo: string;

  /** Tax rate code within the type. E.g. "0" = 0%, "2" = 12%, "4" = 15% for IVA. */
  codigoPorcentaje: string;

  /** Tax rate percentage. E.g. 0, 12, 15. */
  tarifa: number;

  /** Tax base amount. */
  baseImponible: number;

  /** Calculated tax value. */
  valor: number;
}

/** Summary tax at document level. Used in totalConImpuestos. */
export interface TotalTax {
  /** Tax type code. */
  codigo: string;

  /** Tax rate code. */
  codigoPorcentaje: string;

  /** Tax base amount. */
  baseImponible: number;

  /** Calculated total tax value. */
  valor: number;
}

/** Payment information. */
export interface Payment {
  /** SRI payment method code. E.g. "01" = cash, "20" = bank transfer. */
  formaPago: string;

  /** Payment amount. */
  total: number;

  /** Payment term (optional). */
  plazo?: number;

  /** Time unit for plazo: "dias", "meses" (optional). */
  unidadTiempo?: string;
}

/** Simple payment without term info. Used in withholdings. */
export interface SimplePayment {
  formaPago: string;
  total: number;
}

/**
 * SRI buyer/subject identification type.
 * - "04" = RUC
 * - "05" = Cedula
 * - "06" = Pasaporte
 * - "07" = Consumidor Final
 * - "08" = Identificacion del Exterior
 */
export type TipoIdentificacion = "04" | "05" | "06" | "07" | "08";
