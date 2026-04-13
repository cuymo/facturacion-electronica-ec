/**
 * A single entry in a catalog.
 */
export interface CatalogEntry {
  /** SRI code used in XML payloads. */
  code: string;

  /** Human-readable description. */
  description: string;

  /** Numeric value associated with the entry (e.g. tax rate percentage). Optional. */
  rate?: number;
}

/**
 * Metadata for a catalog, tracking its provenance and freshness.
 */
export interface CatalogMeta {
  /** Where this catalog data came from. E.g. "Ficha Tecnica SRI v2.28", "Manual override". */
  source: string;

  /** ISO 8601 date of the last update. */
  updatedAt: string;

  /** Optional notes about this catalog version. */
  notes?: string;
}

/**
 * Internal storage for a catalog: entries + metadata.
 */
interface CatalogData {
  entries: Map<string, CatalogEntry>;
  meta: CatalogMeta;
}

/**
 * Registry for SRI catalogs (tax rates, payment methods, ID types, etc.).
 *
 * Ships with defaults from the Ficha Tecnica SRI. Consumers can override
 * individual catalogs or entries when SRI changes rates (e.g. IVA 12% -> 15%).
 *
 * Catalog names are kebab-case strings: "impuestos-iva", "formas-pago", etc.
 */
export class CatalogRegistry {
  private catalogs = new Map<string, CatalogData>();
  private defaults = new Map<string, CatalogData>();

  /**
   * Register a full catalog with metadata.
   * Also saves as default for reset purposes.
   */
  registerDefault(
    name: string,
    entries: Record<string, CatalogEntry>,
    meta: CatalogMeta
  ): void {
    const entryMap = new Map(Object.entries(entries));
    const data: CatalogData = { entries: entryMap, meta };
    this.catalogs.set(name, data);
    // Deep clone for defaults so overrides don't affect them
    this.defaults.set(name, {
      entries: new Map(entryMap),
      meta: { ...meta },
    });
  }

  /** Get a single entry by catalog name and code. */
  get(catalogName: string, code: string): CatalogEntry | undefined {
    return this.catalogs.get(catalogName)?.entries.get(code);
  }

  /** List all entries in a catalog. */
  list(catalogName: string): CatalogEntry[] {
    const data = this.catalogs.get(catalogName);
    return data ? Array.from(data.entries.values()) : [];
  }

  /** Get metadata for a catalog. */
  getMeta(catalogName: string): CatalogMeta | undefined {
    return this.catalogs.get(catalogName)?.meta;
  }

  /** List all registered catalog names. */
  listCatalogs(): string[] {
    return Array.from(this.catalogs.keys());
  }

  /**
   * Override entries in an existing catalog.
   * Merges with existing entries (does not replace the entire catalog).
   * Updates the metadata to reflect the override.
   */
  override(
    catalogName: string,
    entries: Record<string, CatalogEntry>,
    meta?: Partial<CatalogMeta>
  ): void {
    const existing = this.catalogs.get(catalogName);
    if (!existing) {
      throw new Error(`Catalog "${catalogName}" not found. Register it first.`);
    }

    for (const [code, entry] of Object.entries(entries)) {
      existing.entries.set(code, entry);
    }

    if (meta) {
      if (meta.source) existing.meta.source = meta.source;
      if (meta.updatedAt) existing.meta.updatedAt = meta.updatedAt;
      if (meta.notes !== undefined) existing.meta.notes = meta.notes;
    } else {
      existing.meta.source = "Manual override";
      existing.meta.updatedAt = new Date().toISOString();
    }
  }

  /** Reset a catalog to its default values. */
  reset(catalogName: string): void {
    const defaultData = this.defaults.get(catalogName);
    if (defaultData) {
      this.catalogs.set(catalogName, {
        entries: new Map(defaultData.entries),
        meta: { ...defaultData.meta },
      });
    }
  }

  /** Reset all catalogs to defaults. */
  resetAll(): void {
    for (const name of this.defaults.keys()) {
      this.reset(name);
    }
  }
}

/** Singleton instance populated with SRI defaults. */
export const catalogRegistry = new CatalogRegistry();
