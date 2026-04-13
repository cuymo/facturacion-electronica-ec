import { describe, it, expect } from "vitest";
import { validateFactura } from "../../packages/core/src/validation/validate-factura.js";
import { validateRetencion } from "../../packages/core/src/validation/validate-retencion.js";
import {
  isValidRuc,
  isValidCedula,
  isValidFecha,
  isValidTipoIdentificacion,
  isValidNumDocumento,
} from "../../packages/core/src/validation/validators.js";

describe("primitive validators", () => {
  it("isValidRuc", () => {
    expect(isValidRuc("0992877878001")).toBe(true);
    expect(isValidRuc("099287787800")).toBe(false);
    expect(isValidRuc("abc")).toBe(false);
  });

  it("isValidCedula", () => {
    expect(isValidCedula("0912345678")).toBe(true);
    expect(isValidCedula("091234567")).toBe(false);
  });

  it("isValidFecha", () => {
    expect(isValidFecha("20/02/2026")).toBe(true);
    expect(isValidFecha("2026-02-20")).toBe(false);
    expect(isValidFecha("")).toBe(false);
  });

  it("isValidTipoIdentificacion", () => {
    expect(isValidTipoIdentificacion("04")).toBe(true);
    expect(isValidTipoIdentificacion("07")).toBe(true);
    expect(isValidTipoIdentificacion("01")).toBe(false);
  });

  it("isValidNumDocumento", () => {
    expect(isValidNumDocumento("001-001-000000001")).toBe(true);
    expect(isValidNumDocumento("001001000000001")).toBe(false);
  });
});

describe("validateFactura", () => {
  const validFactura = {
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
        descripcion: "Test",
        cantidad: 1,
        precioUnitario: 100.0,
        descuento: 0,
        precioTotalSinImpuesto: 100.0,
        impuestos: [
          { codigo: "2", codigoPorcentaje: "4", tarifa: 15, baseImponible: 100.0, valor: 15.0 },
        ],
      },
    ],
  };

  it("should pass for valid factura data", () => {
    const result = validateFactura(validFactura);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("should fail for missing fechaEmision", () => {
    const result = validateFactura({ ...validFactura, fechaEmision: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "fechaEmision")).toBe(true);
  });

  it("should fail for invalid tipoIdentificacion", () => {
    const result = validateFactura({
      ...validFactura,
      tipoIdentificacionComprador: "99",
    });
    expect(result.valid).toBe(false);
  });

  it("should fail for negative amounts", () => {
    const result = validateFactura({
      ...validFactura,
      totalSinImpuestos: -1,
    });
    expect(result.valid).toBe(false);
  });

  it("should fail for empty detalles", () => {
    const result = validateFactura({ ...validFactura, detalles: [] });
    expect(result.valid).toBe(false);
  });
});

describe("validateRetencion", () => {
  it("should require periodoFiscal in mm/aaaa format", () => {
    const result = validateRetencion({
      fechaEmision: "20/02/2026",
      tipoIdentificacionSujetoRetenido: "04",
      razonSocialSujetoRetenido: "TEST",
      identificacionSujetoRetenido: "0992877878001",
      periodoFiscal: "2026/02", // wrong format
      docsSustento: [{ codSustento: "01" } as any],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === "periodoFiscal")).toBe(true);
  });
});
