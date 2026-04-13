/**
 * Default ISigner implementation wrapping ec-sri-invoice-signer.
 *
 * RISK: For liquidacionCompra (codDoc 03), ec-sri-invoice-signer does not
 * export a dedicated sign function. We use the generic signDocumentXml()
 * from a private submodule path. This import is fragile and may break on
 * package updates.
 *
 * MITIGATION STRATEGY:
 * 1. This is the only file that touches ec-sri-invoice-signer.
 * 2. If the import breaks, update the path here only.
 * 3. If the upstream package is abandoned, fork it.
 * 4. ISigner interface allows consumers to swap implementations entirely.
 *
 * @see https://github.com/nicosommi/ec-sri-invoice-signer
 */

import { createRequire } from "node:module";
import type { DocumentType } from "@facturaya/core";
import type { ISigner, SignOptions } from "./signer.interface.js";

// In ESM, use createRequire(import.meta.url).
// In CJS (bundled by tsup), import.meta.url is undefined — fall back to native require.
const _require: NodeRequire =
  typeof import.meta.url === "string"
    ? createRequire(import.meta.url)
    : (typeof require !== "undefined"
        ? require
        : createRequire(__filename));

// Dynamic import type for the sign functions
type SignFn = (
  xml: string,
  p12: Buffer | string,
  opts: { pkcs12Password?: string }
) => string;

type GenericSignFn = (
  xml: string,
  p12: Buffer | string,
  rootTagName: string,
  opts?: { pkcs12Password?: string }
) => string;

/**
 * Lazily loaded sign functions from ec-sri-invoice-signer.
 * We load them on first use to avoid import errors at module load time.
 */
let _signFunctions: Map<DocumentType, (xml: string, p12: Buffer, password: string) => string> | null = null;

function getSignFunctions(): Map<DocumentType, (xml: string, p12: Buffer, password: string) => string> {
  if (_signFunctions) return _signFunctions;

  const pkg = _require("ec-sri-invoice-signer") as {
    signInvoiceXml: SignFn;
    signCreditNoteXml: SignFn;
    signDebitNoteXml: SignFn;
    signDeliveryGuideXml: SignFn;
    signWithholdingCertificateXml: SignFn;
  };

  // RISK: Private submodule import for liquidacionCompra.
  // ec-sri-invoice-signer does NOT export signDocumentXml from its entry point.
  let signDocumentXml: GenericSignFn;
  try {
    const submodule = _require("ec-sri-invoice-signer/dist/src/signature/signature") as {
      signDocumentXml: GenericSignFn;
    };
    signDocumentXml = submodule.signDocumentXml;
  } catch {
    // If the submodule path changes, provide a clear error
    signDocumentXml = () => {
      throw new Error(
        "[EcSriSigner] Cannot sign liquidacionCompra: " +
          "ec-sri-invoice-signer does not export signDocumentXml. " +
          "The internal path may have changed. See @facturaya/signer README."
      );
    };
  }

  const wrap = (fn: SignFn) => (xml: string, p12: Buffer, password: string) =>
    fn(xml, p12, { pkcs12Password: password });

  _signFunctions = new Map<DocumentType, (xml: string, p12: Buffer, password: string) => string>([
    ["FACTURA", wrap(pkg.signInvoiceXml)],
    ["NOTA_CREDITO", wrap(pkg.signCreditNoteXml)],
    ["NOTA_DEBITO", wrap(pkg.signDebitNoteXml)],
    ["GUIA_REMISION", wrap(pkg.signDeliveryGuideXml)],
    ["COMPROBANTE_RETENCION", wrap(pkg.signWithholdingCertificateXml)],
    [
      "LIQUIDACION_COMPRA",
      (xml: string, p12: Buffer, password: string) =>
        signDocumentXml(xml, p12, "liquidacionCompra", {
          pkcs12Password: password,
        }),
    ],
  ]);

  return _signFunctions;
}

/**
 * Default signer using ec-sri-invoice-signer for XAdES-BES signing.
 *
 * The sign() method is async per the ISigner contract, even though
 * the underlying library is synchronous. This ensures the interface
 * remains compatible with async implementations (HSM, cloud KMS).
 */
export class EcSriSigner implements ISigner {
  async sign(
    xml: string,
    documentType: DocumentType,
    options: SignOptions
  ): Promise<string> {
    const signFunctions = getSignFunctions();
    const signFn = signFunctions.get(documentType);

    if (!signFn) {
      throw new Error(
        `[EcSriSigner] No sign function registered for document type: ${documentType}`
      );
    }

    return signFn(xml, options.p12, options.p12Password);
  }
}
