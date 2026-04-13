/**
 * Standalone integration runner for SRI PRUEBAS.
 * Loads .env.test, enforces ambiente '1', runs FACTURA then optionally LIQUIDACION_COMPRA.
 * Outputs evidence without exposing secrets.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ─── Load .env.test ───
const envPath = resolve(ROOT, ".env.test");
let envContent;
try {
  envContent = readFileSync(envPath, "utf-8");
} catch {
  console.error("FATAL: .env.test not found at", envPath);
  process.exit(1);
}

const env = {};
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const eqIdx = trimmed.indexOf("=");
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx);
  let val = trimmed.substring(eqIdx + 1);
  // strip quotes
  if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
    val = val.slice(1, -1);
  }
  env[key] = val;
}

// ─── Safety checks ───
console.log("=== SAFETY CHECKS ===");

if (env.FACTURAYA_TEST_RUN_INTEGRATION !== "true") {
  console.error("FATAL: FACTURAYA_TEST_RUN_INTEGRATION is not 'true'");
  process.exit(1);
}
console.log("  Integration flag: true");

if (env.FACTURAYA_TEST_AMBIENTE && env.FACTURAYA_TEST_AMBIENTE !== "1") {
  console.error("FATAL: FACTURAYA_TEST_AMBIENTE=" + env.FACTURAYA_TEST_AMBIENTE + " — MUST be '1'");
  process.exit(1);
}
console.log("  Ambiente: 1 (PRUEBAS) — FORCED");

const p12Path = resolve(ROOT, env.FACTURAYA_TEST_P12_PATH || "");
let p12;
try {
  p12 = readFileSync(p12Path);
  console.log("  P12 loaded: " + p12.length + " bytes");
} catch (e) {
  console.error("FATAL: Cannot read P12 at configured path:", e.message);
  process.exit(1);
}

const p12Password = env.FACTURAYA_TEST_P12_PASSWORD || "";
if (!p12Password) {
  console.error("FATAL: FACTURAYA_TEST_P12_PASSWORD is empty");
  process.exit(1);
}
console.log("  P12 password: *** (loaded, " + p12Password.length + " chars)");

const ruc = env.FACTURAYA_TEST_RUC || "";
if (!/^\d{13}$/.test(ruc)) {
  console.error("FATAL: FACTURAYA_TEST_RUC must be 13 digits, got:", ruc.length, "chars");
  process.exit(1);
}
console.log("  RUC: " + ruc.substring(0, 4) + "..." + ruc.substring(10) + " (masked)");

console.log("  ALL SAFETY CHECKS PASSED\n");

// ─── Import SDK ───
// Import from built dist (run `pnpm -r build` first)
const { FacturaYa, UnsafeMemorySequenceProvider } = await import("../../packages/sdk/dist/index.js");

const sequenceProvider = new UnsafeMemorySequenceProvider();

function createFy() {
  return new FacturaYa({
    emisor: {
      ruc,
      razonSocial: "PRUEBA INTEGRACION FACTURAYA",
      dirMatriz: "Quito, Direccion de Prueba",
      establecimiento: "001",
      puntoEmision: "001",
      direccionEstablecimiento: "Quito, Sucursal de Prueba",
      obligadoContabilidad: false,
      ambiente: "1", // HARDCODED PRUEBAS
    },
    p12,
    p12Password,
    sequenceProvider,
    hooks: {
      onXmlBuilt(xml) {
        console.log("  [hook] XML built: " + xml.length + " chars");
        console.log("  [hook] Has <?xml: " + xml.startsWith("<?xml"));
        console.log("  [hook] Has <infoTributaria>: " + xml.includes("<infoTributaria>"));
      },
      onXmlSigned(signedXml) {
        console.log("  [hook] XML signed: " + signedXml.length + " chars (original was shorter)");
        console.log("  [hook] Has <ds:Signature>: " + signedXml.includes("<ds:Signature"));
      },
      onSriRecepcion(result) {
        console.log("  [hook] SRI recepcion: " + result.estado);
        if (result.mensajes.length > 0) {
          for (const m of result.mensajes) {
            console.log("    msg: [" + m.identificador + "] " + m.mensaje + (m.informacionAdicional ? " — " + m.informacionAdicional : ""));
          }
        }
      },
      onSriAutorizacion(result) {
        console.log("  [hook] SRI autorizacion: " + result.estado);
        console.log("  [hook] numAutorizacion: " + (result.numeroAutorizacion ? result.numeroAutorizacion.substring(0, 10) + "..." : "null"));
        if (result.mensajes.length > 0) {
          for (const m of result.mensajes) {
            console.log("    msg: [" + m.identificador + "] " + m.mensaje + (m.informacionAdicional ? " — " + m.informacionAdicional : ""));
          }
        }
      },
      onAuthorized(claveAcceso, numAut) {
        console.log("  [hook] AUTORIZADO: claveAcceso=" + claveAcceso.substring(0, 10) + "...");
      },
      onError(error) {
        console.log("  [hook] ERROR: [" + error.code + "] " + error.message);
      },
    },
  });
}

const today = new Date().toLocaleDateString("es-EC", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── TEST 1: FACTURA ───
console.log("=== TEST 1: FACTURA ===");
console.log("  Fecha emision: " + today);
console.log("  Ambiente: 1 (PRUEBAS)");
console.log("  Comprador: CONSUMIDOR FINAL (9999999999999)");
console.log("  Total: $1.15 ($1.00 + IVA 15%)");
console.log("");

const t1Start = Date.now();
let facturaResult;
try {
  facturaResult = await createFy().emitirFactura({
    fechaEmision: today,
    tipoIdentificacionComprador: "07",
    razonSocialComprador: "CONSUMIDOR FINAL",
    identificacionComprador: "9999999999999",
    totalSinImpuestos: 1.00,
    totalDescuento: 0,
    totalConImpuestos: [
      { codigo: "2", codigoPorcentaje: "4", baseImponible: 1.00, valor: 0.15 },
    ],
    propina: 0,
    importeTotal: 1.15,
    pagos: [{ formaPago: "01", total: 1.15 }],
    detalles: [{
      codigoPrincipal: "INTEG-TEST-001",
      descripcion: "Item de prueba integracion FacturaYa",
      cantidad: 1,
      precioUnitario: 1.00,
      descuento: 0,
      precioTotalSinImpuesto: 1.00,
      impuestos: [
        { codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 1.00, valor: 0.15 },
      ],
    }],
  });
} catch (error) {
  console.error("\n  EXCEPTION:", error.code || "UNKNOWN", "-", error.message);
  if (error.sriMensajes) {
    for (const m of error.sriMensajes) {
      console.error("    SRI: [" + m.identificador + "] " + m.mensaje);
    }
  }
  process.exit(1);
}
const t1Ms = Date.now() - t1Start;

console.log("\n--- FACTURA RESULT ---");
console.log("  Estado:              " + facturaResult.estado);
console.log("  Ambiente:            " + facturaResult.ambiente);
console.log("  ClaveAcceso:         " + facturaResult.claveAcceso);
console.log("  Secuencial:          " + facturaResult.secuencial);
console.log("  RecepcionEstado:     " + facturaResult.recepcionEstado);
console.log("  AutorizacionEstado:  " + facturaResult.autorizacionEstado);
console.log("  NumeroAutorizacion:  " + (facturaResult.numeroAutorizacion || "null"));
console.log("  FechaAutorizacion:   " + (facturaResult.fechaAutorizacion || "null"));
console.log("  XML original:        " + facturaResult.xmlOriginal.length + " chars");
console.log("  XML firmado:         " + facturaResult.xmlFirmado.length + " chars");
console.log("  Intentos:            " + facturaResult.attempts);
console.log("  Tiempo total:        " + t1Ms + "ms");
if (facturaResult.mensajes.length > 0) {
  console.log("  Mensajes SRI:");
  for (const m of facturaResult.mensajes) {
    console.log("    [" + m.identificador + "] " + m.mensaje + (m.informacionAdicional ? " — " + m.informacionAdicional : ""));
  }
}
console.log("--- END FACTURA ---\n");

if (facturaResult.estado !== "AUTORIZADO") {
  console.log("FACTURA NO AUTORIZADA. No se ejecuta LIQUIDACION_COMPRA.");
  console.log("Clasificacion del fallo:");
  if (!facturaResult.xmlFirmado || facturaResult.xmlFirmado.length <= facturaResult.xmlOriginal.length) {
    console.log("  => (b) FIRMADO: El XML firmado no crece respecto al original");
  } else if (facturaResult.recepcionEstado === "DEVUELTA") {
    console.log("  => (c) SOAP RECEPCION: SRI devolvio el comprobante");
  } else if (facturaResult.autorizacionEstado === "NO AUTORIZADO") {
    console.log("  => (d) AUTORIZACION: SRI no autorizo");
  } else {
    console.log("  => Estado inesperado: " + facturaResult.estado);
  }
  process.exit(1);
}

// ─── TEST 2: LIQUIDACION_COMPRA ───
console.log("=== TEST 2: LIQUIDACION_COMPRA ===");
console.log("  Fecha emision: " + today);
console.log("  Ambiente: 1 (PRUEBAS)");
console.log("  Proveedor: PROVEEDOR PRUEBA (cedula ficticia)");
console.log("  Total: $1.00 (IVA 0%)");
console.log("");

const t2Start = Date.now();
let liqResult;
try {
  liqResult = await createFy().emitirLiquidacionCompra({
    fechaEmision: today,
    tipoIdentificacionProveedor: "05",
    razonSocialProveedor: "PROVEEDOR DE PRUEBA INTEGRACION",
    identificacionProveedor: "0912345678",
    totalSinImpuestos: 1.00,
    totalDescuento: 0,
    totalConImpuestos: [
      { codigo: "2", codigoPorcentaje: "0", baseImponible: 1.00, valor: 0 },
    ],
    importeTotal: 1.00,
    pagos: [{ formaPago: "01", total: 1.00 }],
    detalles: [{
      codigoPrincipal: "INTEG-LIQ-001",
      descripcion: "Materia prima de prueba integracion",
      cantidad: 1,
      precioUnitario: 1.00,
      descuento: 0,
      precioTotalSinImpuesto: 1.00,
      impuestos: [
        { codigo: "2", codigoPorcentaje: "0", tarifa: 0, baseImponible: 1.00, valor: 0 },
      ],
    }],
  });
} catch (error) {
  const t2Ms = Date.now() - t2Start;
  console.error("\n  EXCEPTION: [" + (error.code || "UNKNOWN") + "] " + error.message);

  // Classify failure
  const msg = error.message || "";
  if (msg.includes("signDocumentXml") || msg.includes("Cannot sign liquidacionCompra") || msg.includes("Cannot find module")) {
    console.error("  CLASIFICACION: (a) IMPORT PRIVADO — ec-sri-invoice-signer no exporta signDocumentXml");
  } else if (error.code === "SIGNING") {
    console.error("  CLASIFICACION: (b) FIRMADO — Error al firmar el XML");
  } else if (error.code === "SRI_RECEPTION" || error.code === "SRI_COMMUNICATION") {
    console.error("  CLASIFICACION: (c) SOAP RECEPCION — Error de comunicacion o rechazo SRI");
  } else if (error.code === "SRI_AUTHORIZATION") {
    console.error("  CLASIFICACION: (d) AUTORIZACION — SRI no autorizo");
  } else if (error.code === "XML_STRUCTURE" || error.code === "XML_BUILD") {
    console.error("  CLASIFICACION: (e) ESTRUCTURA XML — XML generado no cumple esquema");
  } else {
    console.error("  CLASIFICACION: DESCONOCIDO — " + (error.code || "sin codigo"));
  }

  if (error.sriMensajes) {
    for (const m of error.sriMensajes) {
      console.error("    SRI: [" + m.identificador + "] " + m.mensaje + (m.informacionAdicional ? " — " + m.informacionAdicional : ""));
    }
  }
  console.error("  Tiempo: " + t2Ms + "ms");
  process.exit(1);
}
const t2Ms = Date.now() - t2Start;

console.log("\n--- LIQUIDACION_COMPRA RESULT ---");
console.log("  Estado:              " + liqResult.estado);
console.log("  Ambiente:            " + liqResult.ambiente);
console.log("  ClaveAcceso:         " + liqResult.claveAcceso);
console.log("  Secuencial:          " + liqResult.secuencial);
console.log("  RecepcionEstado:     " + liqResult.recepcionEstado);
console.log("  AutorizacionEstado:  " + liqResult.autorizacionEstado);
console.log("  NumeroAutorizacion:  " + (liqResult.numeroAutorizacion || "null"));
console.log("  FechaAutorizacion:   " + (liqResult.fechaAutorizacion || "null"));
console.log("  XML original:        " + liqResult.xmlOriginal.length + " chars");
console.log("  XML firmado:         " + liqResult.xmlFirmado.length + " chars");
console.log("  Intentos:            " + liqResult.attempts);
console.log("  Tiempo total:        " + t2Ms + "ms");
if (liqResult.mensajes.length > 0) {
  console.log("  Mensajes SRI:");
  for (const m of liqResult.mensajes) {
    console.log("    [" + m.identificador + "] " + m.mensaje + (m.informacionAdicional ? " — " + m.informacionAdicional : ""));
  }
}

if (liqResult.estado !== "AUTORIZADO") {
  console.log("\n  LIQUIDACION_COMPRA NO AUTORIZADA.");
  if (liqResult.recepcionEstado === "DEVUELTA") {
    console.log("  CLASIFICACION: (c) SOAP RECEPCION");
  } else if (liqResult.autorizacionEstado === "NO AUTORIZADO") {
    console.log("  CLASIFICACION: (d) AUTORIZACION");
  }
}
console.log("--- END LIQUIDACION_COMPRA ---\n");

// ─── SUMMARY ───
console.log("========================================");
console.log("  FACTURA:            " + facturaResult.estado + " (" + t1Ms + "ms)");
console.log("  LIQUIDACION_COMPRA: " + liqResult.estado + " (" + t2Ms + "ms)");
console.log("========================================");

const allPassed = facturaResult.estado === "AUTORIZADO" && liqResult.estado === "AUTORIZADO";
console.log(allPassed ? "\n  CONCLUSION: HABILITA v1" : "\n  CONCLUSION: BLOQUEA v1 — revisar fallos arriba");
process.exit(allPassed ? 0 : 1);
