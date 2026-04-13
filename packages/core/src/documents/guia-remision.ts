/** Item being transported in a delivery guide. */
export interface GuiaRemisionDetailItem {
  /** Maps to <codigoInterno> in guia remision XSD. */
  codigoPrincipal: string;
  /** Maps to <codigoAdicional>. */
  codigoAuxiliar?: string;
  descripcion: string;
  cantidad: number;
}

/** Recipient/destination in a delivery guide. */
export interface GuiaRemisionDestinatario {
  identificacionDestinatario: string;
  razonSocialDestinatario: string;
  dirDestinatario: string;
  motivoTraslado: string;
  ruta?: string;
  /** Supporting document type code, if applicable. */
  codDocSustento?: string;
  /** Supporting document number. Format: 001-001-000000001. */
  numDocSustento?: string;
  /** 49-digit clave de acceso of the supporting document. */
  numAutDocSustento?: string;
  /** Emission date of the supporting document. dd/mm/yyyy. */
  fechaEmisionDocSustento?: string;
  detalles: GuiaRemisionDetailItem[];
}

/** Input data to build a guia de remision XML. */
export interface GuiaRemisionData {
  dirPartida: string;
  razonSocialTransportista: string;
  tipoIdentificacionTransportista: string;
  rucTransportista: string;
  fechaIniTransporte: string; // dd/mm/yyyy
  fechaFinTransporte: string; // dd/mm/yyyy
  placa: string;
  destinatarios: GuiaRemisionDestinatario[];
}
