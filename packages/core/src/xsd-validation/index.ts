/**
 * XSD validation for SRI electronic documents.
 *
 * Uses xmllint-wasm (WebAssembly port of libxml2) for cross-platform
 * XSD validation without native dependencies or Java runtime.
 *
 * The XSD files are derived from the Ficha Tecnica SRI v2.28
 * and validated against real SRI PRUEBAS responses.
 */

import type { DocumentType } from "../types/document-type.js";
import { schemaRegistry } from "../schema-registry/index.js";
import { getXsdContent, getXmldsigSchema, XSD_FILENAMES } from "./xsd-contents.js";

export { registerXsdSearchPath } from "./xsd-contents.js";

/** Result of XSD validation. */
export interface XsdValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate an XML string against the SRI XSD schema for a given document type.
 *
 * Uses xmllint-wasm (WebAssembly) for full XSD validation.
 * Returns detailed error messages with line/column information.
 *
 * @param documentType - The SRI document type
 * @param xml - The XML string to validate (unsigned, before signing)
 * @returns Validation result with errors if any
 *
 * @example
 * ```typescript
 * import { validateXmlAgainstXsd } from 'facturacion-electronica-ec';
 *
 * const result = await validateXmlAgainstXsd('FACTURA', xmlString);
 * if (!result.valid) {
 *   console.error('XSD errors:', result.errors);
 * }
 * ```
 */
export async function validateXmlAgainstXsd(
  documentType: DocumentType,
  xml: string
): Promise<XsdValidationResult> {
  const xsdContent = getXsdContent(documentType);
  const schema = schemaRegistry.get(documentType);

  // Dynamic import — xmllint-wasm is optional
  let validateXML: typeof import("xmllint-wasm").validateXML;
  try {
    const mod = await import("xmllint-wasm");
    validateXML = mod.validateXML;
  } catch {
    throw new Error(
      "xmllint-wasm is required for XSD validation. Install it: npm install xmllint-wasm"
    );
  }

  // The official SRI XSDs import xmldsig-core-schema.xsd for the
  // ds:Signature element. We must provide it as a dependency.
  const xmldsigContent = getXmldsigSchema();

  const result = await validateXML({
    xml: [{ fileName: `${schema.rootTag}.xml`, contents: xml }],
    schema: [
      { fileName: "xmldsig-core-schema.xsd", contents: xmldsigContent },
      { fileName: `${schema.rootTag}.xsd`, contents: xsdContent },
    ],
  });

  if (result.valid) {
    return { valid: true, errors: [] };
  }

  const errors = (result.errors ?? [])
    .map((e) => (typeof e === "string" ? e : String(e)))
    .filter((e) => e.trim().length > 0);

  return { valid: false, errors };
}

/**
 * Get the list of document types that have XSD schemas available.
 */
export function getAvailableXsdTypes(): DocumentType[] {
  return Object.keys(XSD_FILENAMES) as DocumentType[];
}
