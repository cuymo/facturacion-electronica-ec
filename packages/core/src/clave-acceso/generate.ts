import { computeModulo11 } from "./modulo11.js";

/**
 * Parameters for generating an SRI clave de acceso.
 */
export interface ClaveAccesoParams {
  /** Emission date in dd/mm/yyyy format. */
  fechaEmision: string;

  /** 2-digit SRI document type code (01, 03, 04, 05, 06, 07). */
  tipoComprobante: string;

  /** 13-digit RUC of the issuer. */
  ruc: string;

  /** SRI ambiente code: '1' = pruebas, '2' = produccion. */
  ambiente: string;

  /** 3-digit establishment code. */
  establecimiento: string;

  /** 3-digit emission point code. */
  puntoEmision: string;

  /** 9-digit zero-padded sequential number. */
  secuencial: string;

  /** 8-digit numeric code (random or deterministic). */
  codigoNumerico: string;

  /** Emission type. Always '1' for normal emission. */
  tipoEmision: string;
}

/**
 * Generates the 49-digit SRI clave de acceso (access key).
 *
 * Structure (48 base digits + 1 check digit):
 * [8]  fechaEmision (ddmmaaaa)
 * [2]  tipoComprobante
 * [13] RUC
 * [1]  tipoAmbiente
 * [3]  establecimiento
 * [3]  puntoEmision
 * [9]  secuencial
 * [8]  codigoNumerico
 * [1]  tipoEmision
 * [1]  digitoVerificador (modulo 11)
 *
 * Extracted from EmiteYa document.datasource.impl.ts.
 * Pure function -- throws on invalid input instead of logging.
 */
export function generateClaveAcceso(params: ClaveAccesoParams): string {
  // Convert dd/mm/yyyy -> ddmmaaaa
  const parts = params.fechaEmision.split("/");
  if (parts.length !== 3) {
    throw new Error(
      `Invalid fechaEmision format: "${params.fechaEmision}". Expected dd/mm/yyyy.`
    );
  }
  const fechaFormatted = parts[0]! + parts[1]! + parts[2]!;

  const segments: Array<{ name: string; value: string; expected: number }> = [
    { name: "fecha", value: fechaFormatted, expected: 8 },
    { name: "tipoComprobante", value: params.tipoComprobante, expected: 2 },
    { name: "ruc", value: params.ruc, expected: 13 },
    { name: "ambiente", value: params.ambiente, expected: 1 },
    { name: "establecimiento", value: params.establecimiento, expected: 3 },
    { name: "puntoEmision", value: params.puntoEmision, expected: 3 },
    { name: "secuencial", value: params.secuencial, expected: 9 },
    { name: "codigoNumerico", value: params.codigoNumerico, expected: 8 },
    { name: "tipoEmision", value: params.tipoEmision, expected: 1 },
  ];

  for (const seg of segments) {
    if (seg.value.length !== seg.expected) {
      throw new Error(
        `Clave de acceso segment "${seg.name}" has wrong length: ${seg.value.length} (expected ${seg.expected}), value: "${seg.value}"`
      );
    }
  }

  const base =
    fechaFormatted +
    params.tipoComprobante +
    params.ruc +
    params.ambiente +
    params.establecimiento +
    params.puntoEmision +
    params.secuencial +
    params.codigoNumerico +
    params.tipoEmision;

  if (base.length !== 48) {
    throw new Error(
      `Clave de acceso base has wrong length: ${base.length} (expected 48)`
    );
  }

  if (!/^\d{48}$/.test(base)) {
    throw new Error("Clave de acceso base contains non-numeric characters");
  }

  const checkDigit = computeModulo11(base);
  return base + checkDigit;
}

/**
 * Generates a random 8-digit numeric code for the clave de acceso.
 *
 * Uses crypto.randomInt for cryptographically secure randomness
 * when available, falls back to Math.random otherwise.
 */
export function generateCodigoNumerico(): string {
  // Node 18+ exposes crypto.randomInt globally via node:crypto.
  // We dynamic-import to avoid hard compile-time dependency on DOM types.
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const nodeCrypto = require("node:crypto") as {
      randomInt: (max: number) => number;
    };
    return nodeCrypto.randomInt(100_000_000).toString().padStart(8, "0");
  } catch {
    // Fallback for environments without node:crypto
    return Math.floor(Math.random() * 100_000_000)
      .toString()
      .padStart(8, "0");
  }
}
