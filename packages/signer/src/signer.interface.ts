import type { DocumentType } from "@facturaya/core";

/**
 * Options for signing an XML document.
 */
export interface SignOptions {
  /** PKCS#12 (.p12) certificate buffer. */
  p12: Buffer;

  /** Password for the .p12 file. */
  p12Password: string;
}

/**
 * Abstract signing interface.
 *
 * All methods are async to support implementations that may need
 * to call external services (HSM, cloud KMS, etc.) for signing.
 *
 * Consumers can implement this interface to replace the default
 * EcSriSigner with their own XAdES-BES implementation.
 */
export interface ISigner {
  /**
   * Sign an XML document for the specified SRI document type.
   *
   * @param xml - The unsigned XML string.
   * @param documentType - The SRI document type (determines which XAdES envelope to use).
   * @param options - Certificate and password.
   * @returns The signed XML string with embedded XAdES-BES signature.
   */
  sign(
    xml: string,
    documentType: DocumentType,
    options: SignOptions
  ): Promise<string>;
}
