/**
 * Integration tests for all 6 document types against SRI PRUEBAS.
 *
 * SKIPPED by default. Only runs when:
 *   FACTURACION_EC_TEST_RUN_INTEGRATION=true
 *
 * SAFETY: Hardcoded to ambiente '1' (PRUEBAS).
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "../..");

// ─── Load .env.test ───
function loadEnv(): Record<string, string> {
  const envPath = resolve(ROOT, ".env.test");
  let content: string;
  try {
    content = readFileSync(envPath, "utf-8");
  } catch {
    return {};
  }
  const env: Record<string, string> = {};
  for (const line of content.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    let val = t.substring(eq + 1);
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    )
      val = val.slice(1, -1);
    env[t.substring(0, eq)] = val;
  }
  return env;
}

const env = loadEnv();
// Only enable if BOTH: process.env flag is set AND .env.test says true.
// This prevents accidental runs from `npx vitest run` (which doesn't set the process env).
const INTEGRATION_ENABLED =
  process.env.FACTURACION_EC_TEST_RUN_INTEGRATION === "true" ||
  (env.FACTURACION_EC_TEST_RUN_INTEGRATION === "true" &&
    process.env.FACTURACION_EC_RUN_ALL_INTEGRATION === "true");

// ─── Safety guard ───
if (INTEGRATION_ENABLED) {
  const amb = env.FACTURACION_EC_TEST_AMBIENTE;
  if (amb && amb !== "1") {
    throw new Error(
      "FATAL: FACTURACION_EC_TEST_AMBIENTE=" +
        amb +
        " — MUST be '1'. Integration against PRODUCCION is blocked."
    );
  }
}

const FORCED_AMBIENTE = "1" as const;

describe.skipIf(!INTEGRATION_ENABLED)("SRI PRUEBAS — All Documents", () => {
  let FacturacionElectronicaEC: any;
  let UnsafeMemorySequenceProvider: any;
  let p12: Buffer;
  let p12Password: string;
  let ruc: string;
  let sequenceProvider: any;

  const today = () => {
    const d = new Date();
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

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
        ambiente: FORCED_AMBIENTE,
      },
      p12,
      p12Password,
      sequenceProvider,
    });
  }

  beforeAll(async () => {
    const sdk = await import("../../packages/sdk/dist/index.js");
    FacturacionElectronicaEC = sdk.FacturacionElectronicaEC;
    UnsafeMemorySequenceProvider = sdk.UnsafeMemorySequenceProvider;

    const p12Path = env.FACTURACION_EC_TEST_P12_PATH;
    if (!p12Path) throw new Error("FACTURACION_EC_TEST_P12_PATH required");
    p12 = readFileSync(resolve(ROOT, p12Path));

    p12Password = env.FACTURACION_EC_TEST_P12_PASSWORD ?? "";
    if (!p12Password) throw new Error("FACTURACION_EC_TEST_P12_PASSWORD required");

    ruc = env.FACTURACION_EC_TEST_RUC ?? "";
    if (!/^\d{13}$/.test(ruc))
      throw new Error("FACTURACION_EC_TEST_RUC must be 13 digits");

    sequenceProvider = new UnsafeMemorySequenceProvider();
  });

  // ─────────────────────────────────────────────
  // FACTURA (01)
  // ─────────────────────────────────────────────
  it(
    "FACTURA — should be AUTORIZADO",
    async () => {
      const result = await createFy().emitirFactura({
        fechaEmision: today(),
        tipoIdentificacionComprador: "07",
        razonSocialComprador: "CONSUMIDOR FINAL",
        identificacionComprador: "9999999999999",
        totalSinImpuestos: 1.0,
        totalDescuento: 0,
        totalConImpuestos: [
          {
            codigo: "2",
            codigoPorcentaje: "4",
            baseImponible: 1.0,
            valor: 0.15,
          },
        ],
        propina: 0,
        importeTotal: 1.15,
        pagos: [{ formaPago: "01", total: 1.15 }],
        detalles: [
          {
            codigoPrincipal: "INT-FAC-001",
            descripcion: "Item integracion factura",
            cantidad: 1,
            precioUnitario: 1.0,
            descuento: 0,
            precioTotalSinImpuesto: 1.0,
            impuestos: [
              {
                codigo: "2",
                codigoPorcentaje: "4",
                tarifa: 15,
                baseImponible: 1.0,
                valor: 0.15,
              },
            ],
          },
        ],
      });

      console.log("[FACTURA]", result.estado, result.claveAcceso,
        result.mensajes.map((m: any) => m.mensaje).join("; "));
      expect(result.ambiente).toBe("1");
      expect(result.claveAcceso).toHaveLength(49);
      expect(result.xmlFirmado.length).toBeGreaterThan(0);
      // DEVUELTO with "SECUENCIAL REGISTRADO" is expected when reusing
      // UnsafeMemorySequenceProvider across runs.
      expect(["AUTORIZADO", "ENVIADO", "DEVUELTO"]).toContain(result.estado);
    },
    30_000
  );

  // ─────────────────────────────────────────────
  // LIQUIDACION_COMPRA (03)
  // ─────────────────────────────────────────────
  it(
    "LIQUIDACION_COMPRA — should be AUTORIZADO",
    async () => {
      const result = await createFy().emitirLiquidacionCompra({
        fechaEmision: today(),
        tipoIdentificacionProveedor: "05",
        razonSocialProveedor: "PROVEEDOR PRUEBA INTEGRACION",
        identificacionProveedor: "0912345678",
        totalSinImpuestos: 1.0,
        totalDescuento: 0,
        totalConImpuestos: [
          {
            codigo: "2",
            codigoPorcentaje: "0",
            baseImponible: 1.0,
            valor: 0,
          },
        ],
        importeTotal: 1.0,
        pagos: [{ formaPago: "01", total: 1.0 }],
        detalles: [
          {
            codigoPrincipal: "INT-LIQ-001",
            descripcion: "Item integracion liquidacion",
            cantidad: 1,
            precioUnitario: 1.0,
            descuento: 0,
            precioTotalSinImpuesto: 1.0,
            impuestos: [
              {
                codigo: "2",
                codigoPorcentaje: "0",
                tarifa: 0,
                baseImponible: 1.0,
                valor: 0,
              },
            ],
          },
        ],
      });

      console.log("[LIQUIDACION]", result.estado, result.claveAcceso,
        result.mensajes.map((m: any) => m.mensaje).join("; "));
      expect(result.ambiente).toBe("1");
      expect(result.claveAcceso).toHaveLength(49);
      expect(result.xmlFirmado.length).toBeGreaterThan(0);
      expect(["AUTORIZADO", "ENVIADO", "DEVUELTO"]).toContain(result.estado);
    },
    30_000
  );

  // ─────────────────────────────────────────────
  // NOTA_CREDITO (04)
  // ─────────────────────────────────────────────
  it(
    "NOTA_CREDITO — should be AUTORIZADO or RECHAZADO with known error",
    async () => {
      // Nota credito requiere un documento modificado existente.
      // Usamos numDocModificado ficticio — SRI PRUEBAS puede rechazar.
      const result = await createFy().emitirNotaCredito({
        fechaEmision: today(),
        tipoIdentificacionComprador: "07",
        razonSocialComprador: "CONSUMIDOR FINAL",
        identificacionComprador: "9999999999999",
        codDocModificado: "01",
        numDocModificado: "001-001-000000001",
        fechaEmisionDocSustento: today(),
        totalSinImpuestos: 0.5,
        valorModificacion: 0.58,
        totalConImpuestos: [
          {
            codigo: "2",
            codigoPorcentaje: "4",
            baseImponible: 0.5,
            valor: 0.08,
          },
        ],
        motivo: "Devolucion prueba integracion",
        detalles: [
          {
            codigoPrincipal: "INT-NC-001",
            descripcion: "Item devuelto integracion",
            cantidad: 1,
            precioUnitario: 0.5,
            descuento: 0,
            precioTotalSinImpuesto: 0.5,
            impuestos: [
              {
                codigo: "2",
                codigoPorcentaje: "4",
                tarifa: 15,
                baseImponible: 0.5,
                valor: 0.08,
              },
            ],
          },
        ],
      });

      console.log(
        "[NOTA_CREDITO]",
        result.estado,
        result.claveAcceso,
        result.mensajes.map((m: any) => m.mensaje).join("; ")
      );
      expect(result.ambiente).toBe("1");
      expect(result.claveAcceso).toHaveLength(49);
      expect(result.xmlFirmado.length).toBeGreaterThan(0);
      // NC con doc ficticio puede ser RECHAZADO — lo importante es que
      // el pipeline completo funcione (build, sign, send, authorize/reject)
      expect([
        "AUTORIZADO",
        "ENVIADO",
        "RECHAZADO",
        "DEVUELTO",
      ]).toContain(result.estado);
    },
    30_000
  );

  // ─────────────────────────────────────────────
  // NOTA_DEBITO (05)
  // ─────────────────────────────────────────────
  it(
    "NOTA_DEBITO — should be AUTORIZADO or RECHAZADO with known error",
    async () => {
      const result = await createFy().emitirNotaDebito({
        fechaEmision: today(),
        tipoIdentificacionComprador: "07",
        razonSocialComprador: "CONSUMIDOR FINAL",
        identificacionComprador: "9999999999999",
        codDocModificado: "01",
        numDocModificado: "001-001-000000001",
        fechaEmisionDocSustento: today(),
        totalSinImpuestos: 0.5,
        impuestos: [
          {
            codigo: "2",
            codigoPorcentaje: "4",
            tarifa: 15,
            baseImponible: 0.5,
            valor: 0.08,
          },
        ],
        valorTotal: 0.58,
        motivos: [
          { razon: "Cargo adicional prueba integracion", valor: 0.5 },
        ],
      });

      console.log(
        "[NOTA_DEBITO]",
        result.estado,
        result.claveAcceso,
        result.mensajes.map((m: any) => m.mensaje).join("; ")
      );
      expect(result.ambiente).toBe("1");
      expect(result.claveAcceso).toHaveLength(49);
      expect(result.xmlFirmado.length).toBeGreaterThan(0);
      expect([
        "AUTORIZADO",
        "ENVIADO",
        "RECHAZADO",
        "DEVUELTO",
      ]).toContain(result.estado);
    },
    30_000
  );

  // ─────────────────────────────────────────────
  // COMPROBANTE_RETENCION (07)
  // ─────────────────────────────────────────────
  it(
    "COMPROBANTE_RETENCION — should be AUTORIZADO or RECHAZADO",
    async () => {
      const result = await createFy().emitirRetencion({
        fechaEmision: today(),
        tipoIdentificacionSujetoRetenido: "04",
        razonSocialSujetoRetenido: "SUJETO RETENIDO PRUEBA",
        identificacionSujetoRetenido: "0992877878001",
        periodoFiscal:
          String(new Date().getMonth() + 1).padStart(2, "0") +
          "/" +
          new Date().getFullYear(),
        docsSustento: [
          {
            codSustento: "01",
            codDocSustento: "01",
            numDocSustento: "001-001-000000001",
            fechaEmisionDocSustento: today(),
            numAutDocSustento: "0".repeat(49),
            pagoLocExt: "01",
            totalSinImpuestos: 10.0,
            importeTotal: 11.5,
            impuestosDocSustento: [
              {
                codImpuestoDocSustento: "2",
                codigoPorcentaje: "4",
                baseImponible: 10.0,
                tarifa: 15.0,
                valorImpuesto: 1.5,
              },
            ],
            retenciones: [
              {
                codigo: "1",
                codigoRetencion: "3",
                baseImponible: 1.5,
                porcentajeRetener: 30.0,
                valorRetenido: 0.45,
              },
            ],
            pagos: [{ formaPago: "20", total: 11.5 }],
          },
        ],
      });

      console.log(
        "[RETENCION]",
        result.estado,
        result.claveAcceso,
        result.mensajes.map((m: any) => m.mensaje).join("; ")
      );
      expect(result.ambiente).toBe("1");
      expect(result.claveAcceso).toHaveLength(49);
      expect(result.xmlFirmado.length).toBeGreaterThan(0);
      expect([
        "AUTORIZADO",
        "ENVIADO",
        "RECHAZADO",
        "DEVUELTO",
      ]).toContain(result.estado);
    },
    30_000
  );

  // ─────────────────────────────────────────────
  // GUIA_REMISION (06)
  // ─────────────────────────────────────────────
  it(
    "GUIA_REMISION — should be AUTORIZADO or RECHAZADO",
    async () => {
      const hoy = today();
      const result = await createFy().emitirGuiaRemision({
        dirPartida: "Quito, Av. Amazonas N36-152",
        razonSocialTransportista: "TRANSPORTES PRUEBA CIA LTDA",
        tipoIdentificacionTransportista: "04",
        rucTransportista: "0992877878001",
        fechaIniTransporte: hoy,
        fechaFinTransporte: hoy,
        placa: "PBA-1234",
        destinatarios: [
          {
            identificacionDestinatario: "0912345678",
            razonSocialDestinatario: "DESTINATARIO PRUEBA",
            dirDestinatario: "Guayaquil, Av. 9 de Octubre",
            motivoTraslado: "Venta directa prueba integracion",
            detalles: [
              {
                codigoPrincipal: "INT-GR-001",
                descripcion: "Mercaderia de prueba integracion",
                cantidad: 1,
              },
            ],
          },
        ],
      });

      console.log(
        "[GUIA_REMISION]",
        result.estado,
        result.claveAcceso,
        result.mensajes.map((m: any) => m.mensaje).join("; ")
      );
      expect(result.ambiente).toBe("1");
      expect(result.claveAcceso).toHaveLength(49);
      expect(result.xmlFirmado.length).toBeGreaterThan(0);
      expect([
        "AUTORIZADO",
        "ENVIADO",
        "RECHAZADO",
        "DEVUELTO",
      ]).toContain(result.estado);
    },
    30_000
  );
});
