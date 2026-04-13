import type { SimplePayment } from "../types/common.js";

/** Tax in a supporting document for a withholding. */
export interface RetencionDocTax {
  codImpuestoDocSustento: string;
  codigoPorcentaje: string;
  baseImponible: number;
  tarifa: number;
  valorImpuesto: number;
}

/** Individual retention line within a supporting document. */
export interface RetencionRetencion {
  /** "1" = Retencion IVA, "2" = Retencion Renta. */
  codigo: string;
  /** Retention code from SRI catalog. */
  codigoRetencion: string;
  baseImponible: number;
  porcentajeRetener: number;
  valorRetenido: number;
}

/** Supporting document block in a withholding. */
export interface RetencionDocSustento {
  codSustento: string;
  codDocSustento: string;
  numDocSustento: string; // 001-001-000000001
  fechaEmisionDocSustento: string; // dd/mm/yyyy
  fechaRegistroContable?: string; // dd/mm/yyyy
  numAutDocSustento: string; // 49-digit clave
  pagoLocExt: string; // "01" = local
  totalSinImpuestos: number;
  importeTotal: number;
  impuestosDocSustento: RetencionDocTax[];
  retenciones: RetencionRetencion[];
  pagos: SimplePayment[];
}

/** Input data to build a comprobante de retencion XML. */
export interface RetencionData {
  fechaEmision: string; // dd/mm/yyyy
  tipoIdentificacionSujetoRetenido: string;
  razonSocialSujetoRetenido: string;
  identificacionSujetoRetenido: string;
  periodoFiscal: string; // mm/yyyy
  parteRel?: string; // "SI" | "NO", defaults to "NO"
  docsSustento: RetencionDocSustento[];
}
