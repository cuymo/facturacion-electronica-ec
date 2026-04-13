/**
 * XSD schema loader — uses official SRI XSD files.
 *
 * Resolution strategy (in priority order):
 * 1. Custom paths via registerXsdSearchPath() (advanced override)
 * 2. xsd/ sibling to dist/ in the published package
 *    (node_modules/facturacion-electronica-ec/xsd/)
 * 3. vendor/sri/xsd/ in the monorepo root (development)
 *
 * The official XSD files are from the SRI portal, stored unmodified.
 * See vendor/sri/xsd/MANIFEST.md for provenance and checksums.
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { DocumentType } from "../types/document-type.js";

const XSD_FILENAMES: Record<DocumentType, string> = {
  FACTURA: "factura_V1.1.0.xsd",
  LIQUIDACION_COMPRA: "LiquidacionCompra_V1.1.0.xsd",
  NOTA_CREDITO: "NotaCredito_V1.1.0.xsd",
  NOTA_DEBITO: "NotaDebito_V1.0.0.xsd",
  GUIA_REMISION: "GuiaRemision_V1.1.0.xsd",
  COMPROBANTE_RETENCION: "ComprobanteRetencion_V2.0.0.xsd",
};

const cache = new Map<DocumentType, string>();
const customPaths: string[] = [];

/**
 * Register an additional directory to search for XSD files.
 * Advanced override — not needed for normal use.
 */
export function registerXsdSearchPath(dir: string): void {
  if (!customPaths.includes(dir)) {
    customPaths.unshift(dir);
  }
}

/**
 * Find the package root by walking up from a starting directory
 * looking for a directory that contains an xsd/ folder.
 */
function findXsdDirUpward(startDir: string): string | null {
  let dir = startDir;
  for (let i = 0; i < 6; i++) {
    const candidate = join(dir, "xsd");
    if (existsSync(candidate)) return candidate;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function getSearchPaths(): string[] {
  const paths = [...customPaths];

  // Resolve thisDir from import.meta.url (ESM) using fileURLToPath
  // which correctly handles %20, drive letters, etc.
  let thisDir: string | null = null;
  try {
    thisDir = dirname(fileURLToPath(import.meta.url));
  } catch {
    // CJS fallback
    try {
      if (typeof __dirname === "string") thisDir = __dirname;
    } catch {
      // neither available
    }
  }

  if (thisDir) {
    // Strategy A: walk upward from this file to find xsd/ directory.
    // Works for both:
    //   - Published: dist/index.js -> ../xsd/ (1 level up)
    //   - Monorepo:  packages/core/src/xsd-validation/ -> walk up to find vendor/sri/xsd/
    const found = findXsdDirUpward(thisDir);
    if (found && !paths.includes(found)) paths.push(found);

    // Strategy B: explicit relative paths as fallback
    const candidates = [
      resolve(thisDir, "..", "xsd"),                          // dist/ -> ../xsd (published)
      resolve(thisDir, "..", "..", "xsd"),                     // dist/chunk/ -> ../../xsd
      resolve(thisDir, "..", "..", "..", "..", "vendor", "sri", "xsd"), // monorepo core/src/xsd-validation/
    ];
    for (const c of candidates) {
      if (!paths.includes(c)) paths.push(c);
    }
  }

  return paths;
}

function findXsdFile(filename: string): string {
  const paths = getSearchPaths();
  for (const dir of paths) {
    const full = resolve(dir, filename);
    if (existsSync(full)) {
      return readFileSync(full, "utf-8");
    }
  }
  throw new Error(
    `Official SRI XSD file not found: ${filename}. ` +
    `Searched: ${paths.map(p => resolve(p, filename)).join(", ")}. ` +
    `Ensure the xsd/ directory is present in the package or use registerXsdSearchPath().`
  );
}

export function getXsdContent(documentType: DocumentType): string {
  const cached = cache.get(documentType);
  if (cached) return cached;
  const filename = XSD_FILENAMES[documentType];
  if (!filename) throw new Error(`No XSD schema for document type: ${documentType}`);
  const content = findXsdFile(filename);
  cache.set(documentType, content);
  return content;
}

let _xmldsigCache: string | null = null;

export function getXmldsigSchema(): string {
  if (_xmldsigCache) return _xmldsigCache;
  _xmldsigCache = findXsdFile("xmldsig-core-schema.xsd");
  return _xmldsigCache;
}

export function clearXsdCache(): void {
  cache.clear();
  _xmldsigCache = null;
}

export { XSD_FILENAMES };
