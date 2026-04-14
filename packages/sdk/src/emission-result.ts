import type { Ambiente, SriMensaje } from "@facturacion-ec/core";
import type { SriRecepcionResult, SriAutorizacionResult } from "@facturacion-ec/sri-client";

/**
 * Terminal status of an emission attempt.
 */
export type EmissionEstado =
  | "AUTORIZADO"
  | "ENVIADO"
  | "FIRMADO"
  | "DEVUELTO"
  | "RECHAZADO";

/**
 * Full result of a document emission attempt.
 *
 * Includes both high-level status and raw SRI responses
 * for debugging and audit purposes.
 */
export interface EmissionResult {
  /** Terminal status after the full pipeline. */
  estado: EmissionEstado;

  /** SRI ambiente used for this emission. */
  ambiente: Ambiente;

  /** 49-digit clave de acceso. */
  claveAcceso: string;

  /** 9-digit zero-padded sequential number. */
  secuencial: string;

  /** Unsigned XML document. */
  xmlOriginal: string;

  /** Signed XML document (with XAdES-BES signature). */
  xmlFirmado: string;

  /** SRI authorization number. Equals claveAcceso if authorized. */
  numeroAutorizacion: string | null;

  /** SRI authorization timestamp. */
  fechaAutorizacion: Date | null;

  /** Estado returned by the reception endpoint. */
  recepcionEstado: "RECIBIDA" | "DEVUELTA" | null;

  /** Estado returned by the authorization endpoint. */
  autorizacionEstado: "AUTORIZADO" | "NO AUTORIZADO" | null;

  /** Raw reception response from SRI. Null if reception was not attempted. */
  rawRecepcion: SriRecepcionResult | null;

  /** Raw authorization response from SRI. Null if authorization was not attempted. */
  rawAutorizacion: SriAutorizacionResult | null;

  /** Consolidated SRI messages from both reception and authorization. */
  mensajes: SriMensaje[];

  /** Number of attempts made (for Error 70 retry scenarios). */
  attempts: number;
}
