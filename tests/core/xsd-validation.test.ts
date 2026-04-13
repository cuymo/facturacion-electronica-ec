/**
 * XSD validation tests.
 *
 * These tests validate that the XML builders produce output
 * that conforms to the SRI XSD schemas. This is the layer that
 * would have caught the numDocSustento format bug before sending to SRI.
 *
 * Requires: xmllint-wasm (installed at workspace root)
 */

import { describe, it, expect, beforeAll } from "vitest";
import {
  buildFacturaXml,
  buildLiquidacionCompraXml,
  buildNotaCreditoXml,
  buildNotaDebitoXml,
  buildGuiaRemisionXml,
  buildComprobanteRetencionXml,
} from "../../packages/core/src/xml/index.js";
import { validateXmlAgainstXsd, registerXsdSearchPath } from "../../packages/core/src/xsd-validation/index.js";
import type { XmlBuildContext } from "../../packages/core/src/types/xml-build-context.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Ensure catalogs are initialized
import "../../packages/core/src/catalogs/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Register XSD path — official SRI schemas in vendor/
beforeAll(() => {
  registerXsdSearchPath(resolve(__dirname, "../../vendor/sri/xsd"));
});

const CTX: XmlBuildContext = {
  ambiente: "1",
  ruc: "0992877878001",
  razonSocial: "EMPRESA TEST S.A.",
  nombreComercial: null,
  dirMatriz: "Quito",
  claveAcceso: "1204202601099287787800110010010000000011234567816",
  codDoc: "01",
  establecimiento: "001",
  puntoEmision: "001",
  secuencial: "000000001",
  direccionEstablecimiento: "Quito Sucursal",
  contribuyenteEspecial: null,
  obligadoContabilidad: false,
};

describe("XSD Validation — FACTURA", () => {
  it("valid factura passes XSD", async () => {
    const xml = buildFacturaXml(CTX, {
      fechaEmision: "12/04/2026",
      tipoIdentificacionComprador: "07",
      razonSocialComprador: "CONSUMIDOR FINAL",
      identificacionComprador: "9999999999999",
      totalSinImpuestos: 100,
      totalDescuento: 0,
      totalConImpuestos: [{ codigo: "2", codigoPorcentaje: "4", baseImponible: 100, valor: 15 }],
      propina: 0,
      importeTotal: 115,
      pagos: [{ formaPago: "01", total: 115 }],
      detalles: [{
        codigoPrincipal: "PROD001", descripcion: "Test", cantidad: 1,
        precioUnitario: 100, descuento: 0, precioTotalSinImpuesto: 100,
        impuestos: [{ codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 100, valor: 15 }],
      }],
    });
    const result = await validateXmlAgainstXsd("FACTURA", xml);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe("XSD Validation — LIQUIDACION_COMPRA", () => {
  it("valid liquidacion passes XSD", async () => {
    const xml = buildLiquidacionCompraXml({ ...CTX, codDoc: "03" }, {
      fechaEmision: "12/04/2026",
      tipoIdentificacionProveedor: "05",
      razonSocialProveedor: "PROVEEDOR TEST",
      identificacionProveedor: "0912345678",
      totalSinImpuestos: 100, totalDescuento: 0,
      totalConImpuestos: [{ codigo: "2", codigoPorcentaje: "0", baseImponible: 100, valor: 0 }],
      importeTotal: 100,
      pagos: [{ formaPago: "01", total: 100 }],
      detalles: [{
        codigoPrincipal: "MAT001", descripcion: "Materia prima", cantidad: 10,
        precioUnitario: 10, descuento: 0, precioTotalSinImpuesto: 100,
        impuestos: [{ codigo: "2", codigoPorcentaje: "0", tarifa: 0, baseImponible: 100, valor: 0 }],
      }],
    });
    const result = await validateXmlAgainstXsd("LIQUIDACION_COMPRA", xml);
    expect(result.valid).toBe(true);
  });
});

describe("XSD Validation — NOTA_CREDITO", () => {
  it("valid nota credito passes XSD", async () => {
    const xml = buildNotaCreditoXml({ ...CTX, codDoc: "04" }, {
      fechaEmision: "12/04/2026",
      tipoIdentificacionComprador: "04",
      razonSocialComprador: "COMPRADOR TEST",
      identificacionComprador: "0992877878001",
      codDocModificado: "01",
      numDocModificado: "001-001-000000001",
      fechaEmisionDocSustento: "01/04/2026",
      totalSinImpuestos: 50, valorModificacion: 57.5,
      totalConImpuestos: [{ codigo: "2", codigoPorcentaje: "4", baseImponible: 50, valor: 7.5 }],
      motivo: "Devolucion parcial",
      detalles: [{
        codigoPrincipal: "PROD001", descripcion: "Devuelto", cantidad: 1,
        precioUnitario: 50, descuento: 0, precioTotalSinImpuesto: 50,
        impuestos: [{ codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 50, valor: 7.5 }],
      }],
    });
    const result = await validateXmlAgainstXsd("NOTA_CREDITO", xml);
    expect(result.valid).toBe(true);
  });
});

describe("XSD Validation — NOTA_DEBITO", () => {
  it("valid nota debito passes XSD", async () => {
    const xml = buildNotaDebitoXml({ ...CTX, codDoc: "05" }, {
      fechaEmision: "12/04/2026",
      tipoIdentificacionComprador: "04",
      razonSocialComprador: "COMPRADOR TEST",
      identificacionComprador: "0992877878001",
      codDocModificado: "01",
      numDocModificado: "001-001-000000001",
      fechaEmisionDocSustento: "01/04/2026",
      totalSinImpuestos: 10,
      impuestos: [{ codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 10, valor: 1.5 }],
      valorTotal: 11.5,
      motivos: [{ razon: "Interes por mora", valor: 10 }],
    });
    const result = await validateXmlAgainstXsd("NOTA_DEBITO", xml);
    expect(result.valid).toBe(true);
  });
});

describe("XSD Validation — GUIA_REMISION", () => {
  it("valid guia remision passes XSD", async () => {
    const xml = buildGuiaRemisionXml({ ...CTX, codDoc: "06" }, {
      dirPartida: "Quito, Av. Amazonas",
      razonSocialTransportista: "TRANS S.A.",
      tipoIdentificacionTransportista: "04",
      rucTransportista: "0992877878001",
      fechaIniTransporte: "12/04/2026",
      fechaFinTransporte: "13/04/2026",
      placa: "ABC-1234",
      destinatarios: [{
        identificacionDestinatario: "0912345678",
        razonSocialDestinatario: "DESTINATARIO",
        dirDestinatario: "Guayaquil",
        motivoTraslado: "Venta",
        detalles: [{ codigoPrincipal: "X", descripcion: "Item", cantidad: 1 }],
      }],
    });
    const result = await validateXmlAgainstXsd("GUIA_REMISION", xml);
    expect(result.valid).toBe(true);
  });
});

describe("XSD Validation — COMPROBANTE_RETENCION", () => {
  it("valid retencion passes XSD", async () => {
    const xml = buildComprobanteRetencionXml({ ...CTX, codDoc: "07" }, {
      fechaEmision: "12/04/2026",
      tipoIdentificacionSujetoRetenido: "04",
      razonSocialSujetoRetenido: "SUJETO TEST",
      identificacionSujetoRetenido: "0992877878001",
      periodoFiscal: "04/2026",
      docsSustento: [{
        codSustento: "01", codDocSustento: "01",
        // WITH hyphens — the builder must strip them (XSD requires 15 digits)
        numDocSustento: "001-001-000000001",
        fechaEmisionDocSustento: "01/04/2026",
        numAutDocSustento: "1".repeat(49),
        pagoLocExt: "01",
        totalSinImpuestos: 100, importeTotal: 115,
        impuestosDocSustento: [{ codImpuestoDocSustento: "2", codigoPorcentaje: "4", baseImponible: 100, tarifa: 15, valorImpuesto: 15 }],
        retenciones: [{ codigo: "2", codigoRetencion: "1", baseImponible: 15, porcentajeRetener: 30, valorRetenido: 4.5 }],
        pagos: [{ formaPago: "20", total: 115 }],
      }],
    });
    const result = await validateXmlAgainstXsd("COMPROBANTE_RETENCION", xml);
    if (!result.valid) {
      console.error("XSD errors:", result.errors);
    }
    expect(result.valid).toBe(true);
  });

  it("retencion with hyphenated numDocSustento is auto-normalized", async () => {
    // This test proves the builder strips hyphens.
    // Before the fix, "001-001-000000001" would fail XSD pattern [0-9]{15}.
    const xml = buildComprobanteRetencionXml({ ...CTX, codDoc: "07" }, {
      fechaEmision: "12/04/2026",
      tipoIdentificacionSujetoRetenido: "04",
      razonSocialSujetoRetenido: "SUJETO TEST",
      identificacionSujetoRetenido: "0992877878001",
      periodoFiscal: "04/2026",
      docsSustento: [{
        codSustento: "01", codDocSustento: "01",
        numDocSustento: "001-001-000000001",
        fechaEmisionDocSustento: "01/04/2026",
        numAutDocSustento: "1".repeat(49),
        pagoLocExt: "01",
        totalSinImpuestos: 100, importeTotal: 115,
        impuestosDocSustento: [{ codImpuestoDocSustento: "2", codigoPorcentaje: "4", baseImponible: 100, tarifa: 15, valorImpuesto: 15 }],
        retenciones: [{ codigo: "2", codigoRetencion: "1", baseImponible: 15, porcentajeRetener: 30, valorRetenido: 4.5 }],
        pagos: [{ formaPago: "20", total: 115 }],
      }],
    });
    // The XML should contain 001001000000001 (no hyphens)
    expect(xml).toContain("<numDocSustento>001001000000001</numDocSustento>");
    const result = await validateXmlAgainstXsd("COMPROBANTE_RETENCION", xml);
    expect(result.valid).toBe(true);
  });
});
