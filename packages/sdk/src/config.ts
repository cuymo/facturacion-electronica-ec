import type { Emisor, Logger } from "@facturacion-ec/core";
import type { ISigner } from "@facturacion-ec/signer";
import type { ISriClient } from "@facturacion-ec/sri-client";
import type { ISequenceProvider } from "./sequence/sequence-provider.js";
import type { EmissionHooks } from "./hooks.js";

/**
 * Configuration for a FacturacionElectronicaEC SDK instance.
 */
export interface FacturacionElectronicaECConfig {
  /** Emisor (issuer) data. Used for all documents emitted by this instance. */
  emisor: Emisor;

  /** PKCS#12 (.p12) certificate buffer. */
  p12: Buffer;

  /** Password for the .p12 file. */
  p12Password: string;

  /**
   * Sequence provider. REQUIRED.
   *
   * The SDK does NOT provide a default production provider.
   * Use UnsafeMemorySequenceProvider for tests/examples only.
   * For production, implement ISequenceProvider backed by your database.
   */
  sequenceProvider: ISequenceProvider;

  /**
   * XML signer. Optional.
   * Defaults to EcSriSigner (wraps ec-sri-invoice-signer).
   */
  signer?: ISigner;

  /**
   * SRI SOAP client. Optional.
   * Defaults to SriClient with standard options.
   */
  sriClient?: ISriClient;

  /** Optional logger for observability. */
  logger?: Logger;

  /** Lifecycle hooks for the emission pipeline. */
  hooks?: EmissionHooks;

  // --- Retry/Polling Policy (separated concerns) ---

  /**
   * Delay in milliseconds before querying authorization after reception.
   * SRI needs time to process the document.
   * Default: 1500ms.
   */
  authorizationDelayMs?: number;

  /**
   * Validate generated XML against SRI XSD schemas before signing.
   * Catches structural errors locally instead of waiting for SRI rejection.
   * Requires xmllint-wasm to be installed.
   * Default: false.
   */
  validateXsd?: boolean;

  /**
   * Maximum number of retry attempts when SRI returns Error 70
   * (clave in processing or duplicate).
   * Each retry generates a new secuencial + clave de acceso.
   * Default: 3.
   */
  maxError70Retries?: number;

  /**
   * Maximum number of retry attempts for SRI communication errors
   * (HTTP failures, timeouts).
   * Default: 2.
   */
  maxSendRetries?: number;

  /**
   * Delay in milliseconds between send retries.
   * Default: 2000ms.
   */
  sendRetryDelayMs?: number;
}
