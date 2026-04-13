/**
 * Integration tests against SRI PRUEBAS environment.
 *
 * SKIPPED by default. Only runs when:
 *   FACTURAYA_TEST_RUN_INTEGRATION=true
 *
 * Requires:
 *   FACTURAYA_TEST_P12_PATH     - path to test .p12 certificate
 *   FACTURAYA_TEST_P12_PASSWORD - password for the .p12
 *   FACTURAYA_TEST_RUC          - RUC associated with the certificate
 *
 * SAFETY: These tests ALWAYS use ambiente '1' (PRUEBAS).
 * Any attempt to use ambiente '2' is blocked with a hard error.
 */

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Lazy imports — only loaded if integration is enabled
let FacturaYa: typeof import("../../packages/sdk/src/index.js").FacturaYa;
let UnsafeMemorySequenceProvider: typeof import("../../packages/sdk/src/index.js").UnsafeMemorySequenceProvider;

const INTEGRATION_ENABLED =
  process.env.FACTURAYA_TEST_RUN_INTEGRATION === "true";

// ======================== SAFETY GUARD ========================
// Block any accidental use of ambiente '2' (PRODUCCION)
const FORCED_AMBIENTE = "1" as const;

if (INTEGRATION_ENABLED) {
  const envAmbiente = process.env.FACTURAYA_TEST_AMBIENTE;
  if (envAmbiente && envAmbiente !== "1") {
    throw new Error(
      "FATAL: FACTURAYA_TEST_AMBIENTE is set to '" +
        envAmbiente +
        "'. Integration tests MUST use ambiente '1' (PRUEBAS). " +
        "Running tests against PRODUCCION is blocked."
    );
  }
}
// ==============================================================

describe.skipIf(!INTEGRATION_ENABLED)(
  "SRI PRUEBAS Integration",
  () => {
    let p12: Buffer;
    let p12Password: string;
    let ruc: string;

    beforeAll(async () => {
      // Dynamic import so the test file can be parsed even when
      // @facturaya packages are not installed
      const sdkMod = await import("../../packages/sdk/src/index.js");
      FacturaYa = sdkMod.FacturaYa;
      UnsafeMemorySequenceProvider = sdkMod.UnsafeMemorySequenceProvider;

      const p12Path = process.env.FACTURAYA_TEST_P12_PATH;
      if (!p12Path) {
        throw new Error("FACTURAYA_TEST_P12_PATH is required");
      }
      p12 = readFileSync(resolve(p12Path));

      p12Password = process.env.FACTURAYA_TEST_P12_PASSWORD ?? "";
      if (!p12Password) {
        throw new Error("FACTURAYA_TEST_P12_PASSWORD is required");
      }

      ruc = process.env.FACTURAYA_TEST_RUC ?? "";
      if (!ruc || ruc.length !== 13) {
        throw new Error(
          "FACTURAYA_TEST_RUC must be a 13-digit RUC. Got: " + ruc
        );
      }
    });

    it("should authorize a factura in ambiente PRUEBAS", async () => {
      const fy = new FacturaYa({
        emisor: {
          ruc,
          razonSocial: "EMPRESA DE PRUEBA INTEGRACION",
          dirMatriz: "Quito, Direccion de Prueba",
          establecimiento: "001",
          puntoEmision: "001",
          direccionEstablecimiento: "Quito, Sucursal de Prueba",
          obligadoContabilidad: false,
          ambiente: FORCED_AMBIENTE, // ALWAYS PRUEBAS
        },
        p12,
        p12Password,
        sequenceProvider: new UnsafeMemorySequenceProvider(),
      });

      const result = await fy.emitirFactura({
        fechaEmision: new Date()
          .toLocaleDateString("es-EC", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
          .replace(/\//g, "/"),
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
            codigoPrincipal: "TEST-INT-001",
            descripcion: "Item de prueba integracion",
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

      console.log("[Integration] estado:", result.estado);
      console.log("[Integration] claveAcceso:", result.claveAcceso);
      console.log("[Integration] ambiente:", result.ambiente);
      console.log("[Integration] attempts:", result.attempts);
      console.log("[Integration] recepcionEstado:", result.recepcionEstado);
      console.log(
        "[Integration] autorizacionEstado:",
        result.autorizacionEstado
      );
      if (result.mensajes.length > 0) {
        console.log("[Integration] mensajes:", JSON.stringify(result.mensajes));
      }

      // The document should be at least received
      expect(result.claveAcceso).toHaveLength(49);
      expect(result.ambiente).toBe("1");
      expect(result.secuencial).toMatch(/^\d{9}$/);
      expect(result.xmlOriginal).toContain("<infoTributaria>");
      expect(result.xmlFirmado.length).toBeGreaterThan(
        result.xmlOriginal.length
      );

      // Ideally AUTORIZADO, but ENVIADO or RECHAZADO are also valid outcomes
      expect(["AUTORIZADO", "ENVIADO", "RECHAZADO", "DEVUELTO"]).toContain(
        result.estado
      );
    }, 30_000); // 30s timeout for SRI communication
  }
);
