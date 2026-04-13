import type { Ambiente } from "@facturaya/core";
import type { SriRecepcionResult, SriAutorizacionResult } from "./types.js";

/**
 * Abstract interface for SRI web service communication.
 *
 * Separates reception (enviar) from authorization (consultar)
 * as distinct operations. Retry and polling policies are NOT
 * part of this interface -- they belong in the SDK pipeline.
 */
export interface ISriClient {
  /**
   * Send a signed XML to the SRI reception endpoint.
   * Single attempt, no retry.
   */
  enviarComprobante(
    signedXml: string,
    ambiente: Ambiente
  ): Promise<SriRecepcionResult>;

  /**
   * Query authorization status by clave de acceso.
   * Single attempt, no polling.
   */
  autorizarComprobante(
    claveAcceso: string,
    ambiente: Ambiente
  ): Promise<SriAutorizacionResult>;
}
