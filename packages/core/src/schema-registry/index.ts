import type { DocumentType } from "../types/document-type.js";
import { DOCUMENT_TYPE_COD_DOC } from "../types/document-type.js";

/**
 * Schema definition for an SRI document type.
 *
 * Centralizes version, root tag, and codDoc so that builders
 * and validators can look them up instead of hardcoding.
 */
export interface DocumentSchema {
  /** SRI document type. */
  documentType: DocumentType;

  /** 2-digit SRI codDoc. */
  codDoc: string;

  /** XML root element name. */
  rootTag: string;

  /** XSD version string used in the root element. E.g. "1.1.0", "2.0.0". */
  version: string;

  /**
   * Date from which this schema version is valid (ISO 8601).
   * Null means "since the beginning".
   */
  validFrom: string | null;

  /**
   * Date until which this schema version is valid (ISO 8601).
   * Null means "currently active / no end date".
   */
  validTo: string | null;
}

/**
 * Default SRI schema definitions based on Ficha Tecnica v2.28.
 *
 * DESIGN NOTE: The versions here reflect what EmiteYa produces today
 * and what SRI currently accepts. When SRI releases new schema versions,
 * consumers can register new entries without waiting for a library update.
 */
const DEFAULT_SCHEMAS: DocumentSchema[] = [
  {
    documentType: "FACTURA",
    codDoc: "01",
    rootTag: "factura",
    version: "1.1.0",
    validFrom: null,
    validTo: null,
  },
  {
    documentType: "LIQUIDACION_COMPRA",
    codDoc: "03",
    rootTag: "liquidacionCompra",
    version: "1.1.0",
    validFrom: null,
    validTo: null,
  },
  {
    documentType: "NOTA_CREDITO",
    codDoc: "04",
    rootTag: "notaCredito",
    version: "1.1.0",
    validFrom: null,
    validTo: null,
  },
  {
    documentType: "NOTA_DEBITO",
    codDoc: "05",
    rootTag: "notaDebito",
    version: "1.0.0",
    validFrom: null,
    validTo: null,
  },
  {
    documentType: "GUIA_REMISION",
    codDoc: "06",
    rootTag: "guiaRemision",
    version: "1.1.0",
    validFrom: null,
    validTo: null,
  },
  {
    documentType: "COMPROBANTE_RETENCION",
    codDoc: "07",
    rootTag: "comprobanteRetencion",
    version: "2.0.0",
    validFrom: null,
    validTo: null,
  },
];

/**
 * Central registry for SRI document schemas.
 *
 * Provides lookup by DocumentType and allows consumers to register
 * new schema versions or override existing ones. Builders consult
 * this registry instead of hardcoding versions.
 */
export class SchemaRegistry {
  private schemas: Map<DocumentType, DocumentSchema>;

  constructor() {
    this.schemas = new Map();
    for (const schema of DEFAULT_SCHEMAS) {
      this.schemas.set(schema.documentType, schema);
    }
  }

  /** Get the active schema for a document type. */
  get(documentType: DocumentType): DocumentSchema {
    const schema = this.schemas.get(documentType);
    if (!schema) {
      throw new Error(
        `No schema registered for document type: ${documentType}`
      );
    }
    return schema;
  }

  /** Get the XML root tag for a document type. */
  getRootTag(documentType: DocumentType): string {
    return this.get(documentType).rootTag;
  }

  /** Get the codDoc for a document type. */
  getCodDoc(documentType: DocumentType): string {
    return this.get(documentType).codDoc;
  }

  /** Get the XSD version for a document type. */
  getVersion(documentType: DocumentType): string {
    return this.get(documentType).version;
  }

  /**
   * Register or override a schema for a document type.
   *
   * Use this when SRI publishes a new schema version and you
   * need to update before the library releases a new version.
   */
  register(schema: DocumentSchema): void {
    // Validate codDoc consistency
    const expectedCodDoc = DOCUMENT_TYPE_COD_DOC[schema.documentType];
    if (expectedCodDoc && schema.codDoc !== expectedCodDoc) {
      throw new Error(
        `codDoc mismatch for ${schema.documentType}: expected ${expectedCodDoc}, got ${schema.codDoc}`
      );
    }
    this.schemas.set(schema.documentType, schema);
  }

  /** List all registered schemas. */
  list(): DocumentSchema[] {
    return Array.from(this.schemas.values());
  }

  /** Reset a document type to its default schema. */
  reset(documentType: DocumentType): void {
    const defaultSchema = DEFAULT_SCHEMAS.find(
      (s) => s.documentType === documentType
    );
    if (defaultSchema) {
      this.schemas.set(documentType, defaultSchema);
    }
  }

  /** Reset all schemas to defaults. */
  resetAll(): void {
    this.schemas.clear();
    for (const schema of DEFAULT_SCHEMAS) {
      this.schemas.set(schema.documentType, schema);
    }
  }
}

/** Singleton instance for convenience. Consumers can also create their own. */
export const schemaRegistry = new SchemaRegistry();
