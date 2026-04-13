/**
 * SOAP response parser for SRI web services.
 * Ported from EmiteYa src/config/sri.adapter.ts.
 */

import { XMLParser } from "fast-xml-parser";
import type { SriMensaje } from "@facturaya/core";

export const sriParser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: false,
  trimValues: true,
  removeNSPrefix: true,
  // SRI uses <mensaje> as BOTH the wrapper entry AND a child text field.
  // Force wrapper entries (inside <mensajes>) to always be an array.
  isArray: (_name, jpath) => String(jpath).endsWith("mensajes.mensaje"),
});

/** Recursively search a parsed XML tree for the first node matching `key`. */
export function findNode(obj: unknown, key: string): unknown {
  if (obj == null || typeof obj !== "object") return undefined;
  const record = obj as Record<string, unknown>;
  if (key in record) return record[key];
  for (const v of Object.values(record)) {
    const found = findNode(v, key);
    if (found !== undefined) return found;
  }
  return undefined;
}

/** Extract structured SriMensaje[] from a parsed <mensajes> node. */
export function parseMensajes(mensajesNode: unknown): SriMensaje[] {
  if (!mensajesNode || typeof mensajesNode !== "object") return [];
  const node = mensajesNode as Record<string, unknown>;
  if (!node.mensaje) return [];
  const arr = Array.isArray(node.mensaje) ? node.mensaje : [node.mensaje];
  return arr.map((m: unknown) => {
    const msg = (m ?? {}) as Record<string, unknown>;
    return {
      identificador: String(msg.identificador ?? ""),
      mensaje: String(msg.mensaje ?? ""),
      informacionAdicional: String(msg.informacionAdicional ?? ""),
      tipo: String(msg.tipo ?? ""),
    };
  });
}
