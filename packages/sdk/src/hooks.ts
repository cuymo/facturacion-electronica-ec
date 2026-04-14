import type { FacturacionElectronicaECError } from "@facturacion-ec/core";
import type { SriRecepcionResult, SriAutorizacionResult } from "@facturacion-ec/sri-client";

/**
 * Lifecycle hooks for the emission pipeline.
 *
 * All hooks are optional and async-compatible. They are called
 * at key points during the emission process for observability,
 * logging, or custom side effects.
 *
 * Hooks should NOT throw -- errors in hooks are caught and logged.
 */
export interface EmissionHooks {
  /** Called after the XML document is built (before signing). */
  onXmlBuilt?(xml: string): void | Promise<void>;

  /** Called after the XML is signed. */
  onXmlSigned?(signedXml: string): void | Promise<void>;

  /** Called after receiving the SRI reception response. */
  onSriRecepcion?(result: SriRecepcionResult): void | Promise<void>;

  /** Called after receiving the SRI authorization response. */
  onSriAutorizacion?(result: SriAutorizacionResult): void | Promise<void>;

  /** Called when the document is successfully authorized. */
  onAuthorized?(claveAcceso: string, numeroAutorizacion: string): void | Promise<void>;

  /** Called on any error during the pipeline. */
  onError?(error: FacturacionElectronicaECError): void | Promise<void>;
}
