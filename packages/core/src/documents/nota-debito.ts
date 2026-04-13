import type { TaxInfo } from "../types/common.js";

/** Motive/reason for a debit note charge. */
export interface NotaDebitoMotivo {
  razon: string;
  valor: number;
}

/** Input data to build a nota de debito XML. */
export interface NotaDebitoData {
  fechaEmision: string; // dd/mm/yyyy
  tipoIdentificacionComprador: string;
  razonSocialComprador: string;
  identificacionComprador: string;
  codDocModificado: string;
  numDocModificado: string;
  fechaEmisionDocSustento: string;
  totalSinImpuestos: number;
  impuestos: TaxInfo[];
  valorTotal: number;
  motivos: NotaDebitoMotivo[];
}
