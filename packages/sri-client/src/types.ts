import type { SriMensaje } from "@facturaya/core";

/** Result from the SRI reception (validarComprobante) endpoint. */
export interface SriRecepcionResult {
  estado: "RECIBIDA" | "DEVUELTA";
  mensajes: SriMensaje[];
}

/** Result from the SRI authorization (autorizacionComprobante) endpoint. */
export interface SriAutorizacionResult {
  estado: "AUTORIZADO" | "NO AUTORIZADO";
  numeroAutorizacion: string | null;
  fechaAutorizacion: string | null;
  mensajes: SriMensaje[];
}

/** Re-export for convenience. */
export type { SriMensaje };
