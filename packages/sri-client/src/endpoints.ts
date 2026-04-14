import type { Ambiente } from "@facturacion-ec/core";

export interface SriEndpoints {
  recepcion: string;
  autorizacion: string;
}

/**
 * Official SRI WSDL endpoints.
 */
export const SRI_ENDPOINTS: Record<Ambiente, SriEndpoints> = {
  "1": {
    recepcion:
      "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline",
    autorizacion:
      "https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline",
  },
  "2": {
    recepcion:
      "https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline",
    autorizacion:
      "https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline",
  },
};
