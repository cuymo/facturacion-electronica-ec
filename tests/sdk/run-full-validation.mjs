/**
 * Full 6-document validation against SRI PRUEBAS.
 *
 * Strategy:
 * 1. FACTURA — base document, must AUTORIZAR first
 * 2. LIQUIDACION_COMPRA — independent document
 * 3. NOTA_CREDITO — references the FACTURA authorized in step 1
 * 4. NOTA_DEBITO — references the FACTURA authorized in step 1
 * 5. COMPROBANTE_RETENCION — references the FACTURA authorized in step 1
 * 6. GUIA_REMISION — independent transport document
 *
 * Uses high sequence numbers to avoid collision with previously authorized docs.
 */

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ─── Load .env.test ───
function loadEnv() {
  const content = readFileSync(resolve(ROOT, ".env.test"), "utf-8");
  const env = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let val = t.substring(eq + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1);
    env[t.substring(0, eq)] = val;
  }
  return env;
}

const env = loadEnv();

// ─── Safety ───
if (env.FACTURACION_EC_TEST_AMBIENTE && env.FACTURACION_EC_TEST_AMBIENTE !== "1") {
  console.error("FATAL: ambiente must be '1'. Got:", env.FACTURACION_EC_TEST_AMBIENTE);
  process.exit(1);
}

const p12Path = resolve(ROOT, env.FACTURACION_EC_TEST_P12_PATH || "");
const p12 = readFileSync(p12Path);
const p12Password = env.FACTURACION_EC_TEST_P12_PASSWORD || "";
const ruc = env.FACTURACION_EC_TEST_RUC || "";

console.log("=== SAFETY CHECKS ===");
console.log("  Ambiente: 1 (PRUEBAS) — FORCED");
console.log("  P12: " + p12.length + " bytes");
console.log("  Password: *** (" + p12Password.length + " chars)");
console.log("  RUC: " + ruc.substring(0, 4) + "..." + ruc.substring(10));
console.log("");

// ─── Import SDK ───
const { FacturacionElectronicaEC, UnsafeMemorySequenceProvider } = await import("../../packages/sdk/dist/index.js");

const sequenceProvider = new UnsafeMemorySequenceProvider();
// Start sequences high to avoid collision with previously authorized docs.
// Increment this number each run if sequences collide.
const SEQ_START = 700;
sequenceProvider.set("001", "001", "FACTURA", SEQ_START);
sequenceProvider.set("001", "001", "LIQUIDACION_COMPRA", SEQ_START);
sequenceProvider.set("001", "001", "NOTA_CREDITO", SEQ_START);
sequenceProvider.set("001", "001", "NOTA_DEBITO", SEQ_START);
sequenceProvider.set("001", "001", "COMPROBANTE_RETENCION", SEQ_START);
sequenceProvider.set("001", "001", "GUIA_REMISION", SEQ_START);

function createFy() {
  return new FacturacionElectronicaEC({
    emisor: {
      ruc,
      razonSocial: "PRUEBA INTEGRACION FACTURACION EC",
      dirMatriz: "Quito, Direccion de Prueba",
      establecimiento: "001",
      puntoEmision: "001",
      direccionEstablecimiento: "Quito, Sucursal de Prueba",
      obligadoContabilidad: false,
      ambiente: "1",
    },
    p12,
    p12Password,
    sequenceProvider,
  });
}

const today = (() => {
  const d = new Date();
  return String(d.getDate()).padStart(2, "0") + "/" +
    String(d.getMonth() + 1).padStart(2, "0") + "/" +
    d.getFullYear();
})();

const periodoFiscal = (() => {
  const d = new Date();
  return String(d.getMonth() + 1).padStart(2, "0") + "/" + d.getFullYear();
})();

const results = [];

function printResult(name, r, ms) {
  console.log("--- " + name + " ---");
  console.log("  Estado:              " + r.estado);
  console.log("  ClaveAcceso:         " + r.claveAcceso);
  console.log("  Secuencial:          " + r.secuencial);
  console.log("  XML original:        " + r.xmlOriginal.length + " chars");
  console.log("  XML firmado:         " + r.xmlFirmado.length + " chars");
  console.log("  Firmado OK:          " + (r.xmlFirmado.length > r.xmlOriginal.length));
  console.log("  ds:Signature:        " + r.xmlFirmado.includes("<ds:Signature"));
  console.log("  RecepcionEstado:     " + r.recepcionEstado);
  console.log("  AutorizacionEstado:  " + r.autorizacionEstado);
  console.log("  NumAutorizacion:     " + (r.numeroAutorizacion || "null"));
  console.log("  FechaAutorizacion:   " + (r.fechaAutorizacion || "null"));
  console.log("  Intentos:            " + r.attempts);
  console.log("  Tiempo:              " + ms + "ms");
  if (r.mensajes.length > 0) {
    console.log("  Mensajes SRI:");
    for (const m of r.mensajes) {
      console.log("    [" + m.identificador + "] " + m.mensaje +
        (m.informacionAdicional ? " — " + m.informacionAdicional : ""));
    }
  }
  console.log("");
}

function classify(r) {
  if (r.estado === "AUTORIZADO") return "AUTORIZADO";
  if (!r.xmlFirmado || r.xmlFirmado.length <= (r.xmlOriginal?.length || 0)) return "FALLA_FIRMADO";
  if (r.recepcionEstado === "DEVUELTA") {
    const xmlError = r.mensajes.some(m =>
      m.mensaje?.includes("ESTRUCTURA XML") || m.mensaje?.includes("XSD"));
    if (xmlError) return "FALLA_XML";
    return "FALLA_RECEPCION";
  }
  if (r.autorizacionEstado === "NO AUTORIZADO") return "FALLA_AUTORIZACION";
  if (r.estado === "ENVIADO") return "ENVIADO_SIN_RESPUESTA";
  return "FALLA_RECEPCION";
}

// ─── 1. FACTURA ───
console.log("=== 1. FACTURA (codDoc 01) ===");
console.log("  Comprador: propio RUC (como autoprueba)");
console.log("  Total: $1.15");
console.log("");

const t1 = Date.now();
const facturaResult = await createFy().emitirFactura({
  fechaEmision: today,
  tipoIdentificacionComprador: "04",
  razonSocialComprador: "PRUEBA INTEGRACION FACTURACION EC",
  identificacionComprador: ruc,
  totalSinImpuestos: 1.00,
  totalDescuento: 0,
  totalConImpuestos: [{ codigo: "2", codigoPorcentaje: "4", baseImponible: 1.00, valor: 0.15 }],
  propina: 0,
  importeTotal: 1.15,
  pagos: [{ formaPago: "01", total: 1.15 }],
  detalles: [{
    codigoPrincipal: "FULL-VAL-001",
    descripcion: "Item validacion completa factura",
    cantidad: 1, precioUnitario: 1.00, descuento: 0, precioTotalSinImpuesto: 1.00,
    impuestos: [{ codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 1.00, valor: 0.15 }],
  }],
});
printResult("FACTURA", facturaResult, Date.now() - t1);
results.push({ name: "FACTURA", result: facturaResult, ms: Date.now() - t1 });

if (facturaResult.estado !== "AUTORIZADO") {
  console.error("FACTURA no fue AUTORIZADA. No se puede continuar con NC/ND/RET que la referencian.");
  console.error("Clasificacion: " + classify(facturaResult));
  // Continue with remaining docs anyway to get full matrix
}

const facturaClaveAcceso = facturaResult.claveAcceso;
const facturaNumDoc = "001-001-" + facturaResult.secuencial;

// ─── 2. LIQUIDACION_COMPRA ───
console.log("=== 2. LIQUIDACION_COMPRA (codDoc 03) ===");
console.log("  Proveedor: cedula ficticia 0912345678");
console.log("  Total: $1.00 (IVA 0%)");
console.log("");

const t2 = Date.now();
const liqResult = await createFy().emitirLiquidacionCompra({
  fechaEmision: today,
  tipoIdentificacionProveedor: "05",
  razonSocialProveedor: "PROVEEDOR VALIDACION COMPLETA",
  identificacionProveedor: "0912345678",
  totalSinImpuestos: 1.00,
  totalDescuento: 0,
  totalConImpuestos: [{ codigo: "2", codigoPorcentaje: "0", baseImponible: 1.00, valor: 0 }],
  importeTotal: 1.00,
  pagos: [{ formaPago: "01", total: 1.00 }],
  detalles: [{
    codigoPrincipal: "FULL-VAL-LIQ-001",
    descripcion: "Item validacion completa liquidacion",
    cantidad: 1, precioUnitario: 1.00, descuento: 0, precioTotalSinImpuesto: 1.00,
    impuestos: [{ codigo: "2", codigoPorcentaje: "0", tarifa: 0, baseImponible: 1.00, valor: 0 }],
  }],
});
printResult("LIQUIDACION_COMPRA", liqResult, Date.now() - t2);
results.push({ name: "LIQUIDACION_COMPRA", result: liqResult, ms: Date.now() - t2 });

// ─── 3. NOTA_CREDITO ───
console.log("=== 3. NOTA_CREDITO (codDoc 04) ===");
console.log("  Modifica: FACTURA " + facturaNumDoc);
console.log("  ClaveAcceso ref: " + facturaClaveAcceso.substring(0, 15) + "...");
console.log("");

const t3 = Date.now();
const ncResult = await createFy().emitirNotaCredito({
  fechaEmision: today,
  tipoIdentificacionComprador: "04",
  razonSocialComprador: "PRUEBA INTEGRACION FACTURACION EC",
  identificacionComprador: ruc,
  codDocModificado: "01",
  numDocModificado: facturaNumDoc,
  fechaEmisionDocSustento: today,
  totalSinImpuestos: 0.50,
  valorModificacion: 0.58,
  totalConImpuestos: [{ codigo: "2", codigoPorcentaje: "4", baseImponible: 0.50, valor: 0.08 }],
  motivo: "Devolucion parcial validacion completa",
  detalles: [{
    codigoPrincipal: "FULL-VAL-001",
    descripcion: "Item devuelto validacion",
    cantidad: 1, precioUnitario: 0.50, descuento: 0, precioTotalSinImpuesto: 0.50,
    impuestos: [{ codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 0.50, valor: 0.08 }],
  }],
});
printResult("NOTA_CREDITO", ncResult, Date.now() - t3);
results.push({ name: "NOTA_CREDITO", result: ncResult, ms: Date.now() - t3 });

// ─── 4. NOTA_DEBITO ───
console.log("=== 4. NOTA_DEBITO (codDoc 05) ===");
console.log("  Modifica: FACTURA " + facturaNumDoc);
console.log("");

const t4 = Date.now();
const ndResult = await createFy().emitirNotaDebito({
  fechaEmision: today,
  tipoIdentificacionComprador: "04",
  razonSocialComprador: "PRUEBA INTEGRACION FACTURACION EC",
  identificacionComprador: ruc,
  codDocModificado: "01",
  numDocModificado: facturaNumDoc,
  fechaEmisionDocSustento: today,
  totalSinImpuestos: 0.50,
  impuestos: [{ codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 0.50, valor: 0.08 }],
  valorTotal: 0.58,
  motivos: [{ razon: "Cargo adicional validacion completa", valor: 0.50 }],
});
printResult("NOTA_DEBITO", ndResult, Date.now() - t4);
results.push({ name: "NOTA_DEBITO", result: ndResult, ms: Date.now() - t4 });

// ─── 5. COMPROBANTE_RETENCION ───
console.log("=== 5. COMPROBANTE_RETENCION (codDoc 07) ===");
console.log("  Sujeto retenido: propio RUC");
console.log("  DocSustento ref: FACTURA " + facturaNumDoc);
console.log("");

const t5 = Date.now();
const retResult = await createFy().emitirRetencion({
  fechaEmision: today,
  tipoIdentificacionSujetoRetenido: "04",
  razonSocialSujetoRetenido: "PRUEBA INTEGRACION FACTURACION EC",
  identificacionSujetoRetenido: ruc,
  periodoFiscal: periodoFiscal,
  docsSustento: [{
    codSustento: "01",
    codDocSustento: "01",
    numDocSustento: facturaNumDoc,
    fechaEmisionDocSustento: today,
    numAutDocSustento: facturaClaveAcceso,
    pagoLocExt: "01",
    totalSinImpuestos: 1.00,
    importeTotal: 1.15,
    impuestosDocSustento: [{
      codImpuestoDocSustento: "2",
      codigoPorcentaje: "4",
      baseImponible: 1.00,
      tarifa: 15.00,
      valorImpuesto: 0.15,
    }],
    retenciones: [
      {
        codigo: "2",
        codigoRetencion: "1",
        baseImponible: 0.15,
        porcentajeRetener: 30.00,
        valorRetenido: 0.05,
      },
    ],
    pagos: [{ formaPago: "01", total: 1.15 }],
  }],
});
printResult("COMPROBANTE_RETENCION", retResult, Date.now() - t5);
results.push({ name: "COMPROBANTE_RETENCION", result: retResult, ms: Date.now() - t5 });

// ─── 6. GUIA_REMISION ───
console.log("=== 6. GUIA_REMISION (codDoc 06) ===");
console.log("  Transportista: propio RUC");
console.log("");

const t6 = Date.now();
const grResult = await createFy().emitirGuiaRemision({
  dirPartida: "Quito, Av. Amazonas N36-152",
  razonSocialTransportista: "PRUEBA INTEGRACION FACTURACION EC",
  tipoIdentificacionTransportista: "04",
  rucTransportista: ruc,
  fechaIniTransporte: today,
  fechaFinTransporte: today,
  placa: "PBA-1234",
  destinatarios: [{
    identificacionDestinatario: "0912345678",
    razonSocialDestinatario: "DESTINATARIO VALIDACION",
    dirDestinatario: "Guayaquil, Av. 9 de Octubre",
    motivoTraslado: "Venta directa validacion completa",
    codDocSustento: "01",
    numDocSustento: facturaNumDoc,
    numAutDocSustento: facturaClaveAcceso,
    fechaEmisionDocSustento: today,
    detalles: [{
      codigoPrincipal: "FULL-VAL-GR-001",
      descripcion: "Mercaderia validacion completa",
      cantidad: 1,
    }],
  }],
});
printResult("GUIA_REMISION", grResult, Date.now() - t6);
results.push({ name: "GUIA_REMISION", result: grResult, ms: Date.now() - t6 });

// ─── MATRIX ───
console.log("============================================================");
console.log("  MATRIZ DE RESULTADOS");
console.log("============================================================");
console.log("");

let allAuthorized = true;
const blockers = [];

for (const { name, result: r, ms } of results) {
  const status = classify(r);
  const line = "  " + name.padEnd(28) + status.padEnd(22) + ms + "ms";
  console.log(line);
  if (status !== "AUTORIZADO") {
    allAuthorized = false;
    blockers.push({ name, status, mensajes: r.mensajes });
  }
}

console.log("");
console.log("============================================================");
if (allAuthorized) {
  console.log("  CONCLUSION: LISTO_PARA_DESPLEGAR");
} else {
  console.log("  CONCLUSION: NO_LISTO_PARA_DESPLEGAR");
  console.log("");
  console.log("  BLOQUEANTES:");
  for (const b of blockers) {
    console.log("    " + b.name + ": " + b.status);
    for (const m of b.mensajes) {
      console.log("      [" + m.identificador + "] " + m.mensaje +
        (m.informacionAdicional ? " — " + m.informacionAdicional : ""));
    }
  }
}
console.log("============================================================");

process.exit(allAuthorized ? 0 : 1);
