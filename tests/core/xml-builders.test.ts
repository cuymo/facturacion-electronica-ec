import { describe, it, expect } from "vitest";
import {
  buildFacturaXml,
  buildNotaCreditoXml,
  buildNotaDebitoXml,
  buildGuiaRemisionXml,
  buildComprobanteRetencionXml,
  buildLiquidacionCompraXml,
  buildDocumentXml,
} from "../../packages/core/src/xml/index.js";
import type { XmlBuildContext } from "../../packages/core/src/types/xml-build-context.js";
import type { FacturaData } from "../../packages/core/src/documents/factura.js";

// Ensure catalogs are initialized (side-effect import)
import "../../packages/core/src/catalogs/index.js";

const BASE_CTX: XmlBuildContext = {
  ambiente: "1",
  ruc: "0992877878001",
  razonSocial: "EMPRESA DE PRUEBA S.A.",
  nombreComercial: "MI TIENDA",
  dirMatriz: "Guayaquil, Av. 9 de Octubre",
  claveAcceso: "2002202601099287787800110010010000000011234567816",
  codDoc: "01",
  establecimiento: "001",
  puntoEmision: "001",
  secuencial: "000000001",
  direccionEstablecimiento: "Guayaquil, Sucursal Centro",
  contribuyenteEspecial: null,
  obligadoContabilidad: true,
};

const FACTURA_DATA: FacturaData = {
  fechaEmision: "20/02/2026",
  tipoIdentificacionComprador: "07",
  razonSocialComprador: "CONSUMIDOR FINAL",
  identificacionComprador: "9999999999999",
  totalSinImpuestos: 100.0,
  totalDescuento: 0,
  totalConImpuestos: [
    { codigo: "2", codigoPorcentaje: "4", baseImponible: 100.0, valor: 15.0 },
  ],
  propina: 0,
  importeTotal: 115.0,
  pagos: [{ formaPago: "01", total: 115.0 }],
  detalles: [
    {
      codigoPrincipal: "PROD001",
      descripcion: "Producto de prueba",
      cantidad: 2,
      precioUnitario: 50.0,
      descuento: 0,
      precioTotalSinImpuesto: 100.0,
      impuestos: [
        {
          codigo: "2",
          codigoPorcentaje: "4",
          tarifa: 15,
          baseImponible: 100.0,
          valor: 15.0,
        },
      ],
    },
  ],
};

describe("buildFacturaXml", () => {
  it("should produce valid XML structure", () => {
    const xml = buildFacturaXml(BASE_CTX, FACTURA_DATA);

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<factura id="comprobante" version="1.1.0">');
    expect(xml).toContain("<infoTributaria>");
    expect(xml).toContain("<infoFactura>");
    expect(xml).toContain("<detalles>");
    expect(xml).toContain("</factura>");
  });

  it("should include clave de acceso in infoTributaria", () => {
    const xml = buildFacturaXml(BASE_CTX, FACTURA_DATA);
    expect(xml).toContain(
      `<claveAcceso>${BASE_CTX.claveAcceso}</claveAcceso>`
    );
  });

  it("should include buyer data", () => {
    const xml = buildFacturaXml(BASE_CTX, FACTURA_DATA);
    expect(xml).toContain("<tipoIdentificacionComprador>07</tipoIdentificacionComprador>");
    expect(xml).toContain("<razonSocialComprador>CONSUMIDOR FINAL</razonSocialComprador>");
    expect(xml).toContain("<identificacionComprador>9999999999999</identificacionComprador>");
  });

  it("should format numbers with correct precision", () => {
    const xml = buildFacturaXml(BASE_CTX, FACTURA_DATA);
    expect(xml).toContain("<totalSinImpuestos>100.00</totalSinImpuestos>");
    expect(xml).toContain("<importeTotal>115.00</importeTotal>");
    expect(xml).toContain("<cantidad>2.000000</cantidad>");
    expect(xml).toContain("<precioUnitario>50.000000</precioUnitario>");
  });

  it("should escape XML special characters", () => {
    const data = {
      ...FACTURA_DATA,
      razonSocialComprador: 'EMPRESA & CIA "TEST" <S.A.>',
    };
    const xml = buildFacturaXml(BASE_CTX, data);
    expect(xml).toContain("&amp;");
    expect(xml).toContain("&quot;");
    expect(xml).toContain("&lt;");
    expect(xml).toContain("&gt;");
  });

  it("should include obligadoContabilidad as SI/NO", () => {
    const xml = buildFacturaXml(BASE_CTX, FACTURA_DATA);
    expect(xml).toContain("<obligadoContabilidad>SI</obligadoContabilidad>");

    const ctxNo = { ...BASE_CTX, obligadoContabilidad: false };
    const xml2 = buildFacturaXml(ctxNo, FACTURA_DATA);
    expect(xml2).toContain("<obligadoContabilidad>NO</obligadoContabilidad>");
  });

  it("should survive null or undefined properties gracefully", () => {
    const data = {
      ...FACTURA_DATA,
      // Simulando datos incompletos
      direccionComprador: null,
      razonSocialComprador: undefined,
    } as any;

    const xml = buildFacturaXml(BASE_CTX, data);
    expect(xml).toContain("<razonSocialComprador></razonSocialComprador>");
  });
});

describe("buildDocumentXml dispatcher", () => {
  it("should dispatch FACTURA correctly", () => {
    const xml = buildDocumentXml("FACTURA", BASE_CTX, FACTURA_DATA);
    expect(xml).toContain("<factura");
  });

  it("should throw on unknown document type", () => {
    expect(() =>
      buildDocumentXml("UNKNOWN" as any, BASE_CTX, FACTURA_DATA)
    ).toThrow();
  });
});

describe("other builders produce valid root tags", () => {
  it("buildNotaCreditoXml", () => {
    const ctx = { ...BASE_CTX, codDoc: "04" };
    const xml = buildNotaCreditoXml(ctx, {
      fechaEmision: "20/02/2026",
      tipoIdentificacionComprador: "04",
      razonSocialComprador: "TEST",
      identificacionComprador: "0992877878001",
      codDocModificado: "01",
      numDocModificado: "001-001-000000001",
      fechaEmisionDocSustento: "15/02/2026",
      totalSinImpuestos: 50.0,
      valorModificacion: 57.5,
      totalConImpuestos: [
        { codigo: "2", codigoPorcentaje: "4", baseImponible: 50.0, valor: 7.5 },
      ],
      motivo: "Devolucion parcial",
      detalles: [
        {
          codigoPrincipal: "PROD001",
          descripcion: "Producto devuelto",
          cantidad: 1,
          precioUnitario: 50.0,
          descuento: 0,
          precioTotalSinImpuesto: 50.0,
          impuestos: [
            { codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 50.0, valor: 7.5 },
          ],
        },
      ],
    });
    expect(xml).toContain("<notaCredito");
    expect(xml).toContain("<codigoInterno>"); // nota credito uses codigoInterno, not codigoPrincipal
  });

  it("buildNotaDebitoXml", () => {
    const ctx = { ...BASE_CTX, codDoc: "05" };
    const xml = buildNotaDebitoXml(ctx, {
      fechaEmision: "20/02/2026",
      tipoIdentificacionComprador: "04",
      razonSocialComprador: "TEST",
      identificacionComprador: "0992877878001",
      codDocModificado: "01",
      numDocModificado: "001-001-000000001",
      fechaEmisionDocSustento: "15/02/2026",
      totalSinImpuestos: 10.0,
      impuestos: [
        { codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 10.0, valor: 1.5 },
      ],
      valorTotal: 11.5,
      motivos: [{ razon: "Interes por mora", valor: 10.0 }],
    });
    expect(xml).toContain("<notaDebito");
    expect(xml).toContain("<motivos>");
  });

  it("buildLiquidacionCompraXml", () => {
    const ctx = { ...BASE_CTX, codDoc: "03" };
    const xml = buildLiquidacionCompraXml(ctx, {
      fechaEmision: "20/02/2026",
      tipoIdentificacionProveedor: "05",
      razonSocialProveedor: "PROVEEDOR TEST",
      identificacionProveedor: "0912345678",
      totalSinImpuestos: 100.0,
      totalDescuento: 0,
      totalConImpuestos: [
        { codigo: "2", codigoPorcentaje: "0", baseImponible: 100.0, valor: 0 },
      ],
      importeTotal: 100.0,
      pagos: [{ formaPago: "01", total: 100.0 }],
      detalles: [
        {
          codigoPrincipal: "MAT001",
          descripcion: "Materia prima",
          cantidad: 10,
          precioUnitario: 10.0,
          descuento: 0,
          precioTotalSinImpuesto: 100.0,
          impuestos: [
            { codigo: "2", codigoPorcentaje: "0", tarifa: 0, baseImponible: 100.0, valor: 0 },
          ],
        },
      ],
    });
    expect(xml).toContain("<liquidacionCompra");
    expect(xml).toContain("<infoLiquidacionCompra>");
  });
});
