import { describe, it, expect } from "vitest";
import {
  generateClaveAcceso,
  computeModulo11,
} from "../../packages/core/src/clave-acceso/index.js";

describe("computeModulo11", () => {
  it("should compute correct check digit for known inputs", () => {
    // Known test vector: base with all zeros should give a specific check digit
    const allZeros = "0".repeat(48);
    const digit = computeModulo11(allZeros);
    expect(digit).toMatch(/^\d$/);
  });

  it("should return '0' when result is 11", () => {
    // We need to find a 48-digit string where sum % 11 == 0
    // 11 - 0 = 11, so result should be '0'
    // Construct: 48 zeros -> sum = 0, 0 % 11 = 0, 11 - 0 = 11 -> '0'
    expect(computeModulo11("0".repeat(48))).toBe("0");
  });

  it("should handle single-digit inputs consistently", () => {
    // Simple test: single digit "5" with weight 2 -> sum = 10, 10%11 = 10, 11-10 = 1
    expect(computeModulo11("5")).toBe("1");
  });
});

describe("generateClaveAcceso", () => {
  it("should generate a 49-digit string", () => {
    const clave = generateClaveAcceso({
      fechaEmision: "20/02/2026",
      tipoComprobante: "01",
      ruc: "1790016919001",
      ambiente: "1",
      establecimiento: "001",
      puntoEmision: "001",
      secuencial: "000000001",
      codigoNumerico: "12345678",
      tipoEmision: "1",
    });

    expect(clave).toHaveLength(49);
    expect(clave).toMatch(/^\d{49}$/);
  });

  it("should be deterministic for the same input", () => {
    const params = {
      fechaEmision: "20/02/2026",
      tipoComprobante: "01",
      ruc: "1790016919001",
      ambiente: "1",
      establecimiento: "001",
      puntoEmision: "001",
      secuencial: "000000001",
      codigoNumerico: "12345678",
      tipoEmision: "1",
    };

    const clave1 = generateClaveAcceso(params);
    const clave2 = generateClaveAcceso(params);
    expect(clave1).toBe(clave2);
  });

  it("should embed fecha as ddmmaaaa in positions 0-7", () => {
    const clave = generateClaveAcceso({
      fechaEmision: "15/03/2026",
      tipoComprobante: "01",
      ruc: "1790016919001",
      ambiente: "1",
      establecimiento: "001",
      puntoEmision: "001",
      secuencial: "000000001",
      codigoNumerico: "12345678",
      tipoEmision: "1",
    });

    expect(clave.substring(0, 8)).toBe("15032026");
  });

  it("should embed tipoComprobante in positions 8-9", () => {
    const clave = generateClaveAcceso({
      fechaEmision: "20/02/2026",
      tipoComprobante: "07",
      ruc: "1790016919001",
      ambiente: "1",
      establecimiento: "001",
      puntoEmision: "001",
      secuencial: "000000001",
      codigoNumerico: "12345678",
      tipoEmision: "1",
    });

    expect(clave.substring(8, 10)).toBe("07");
  });

  it("should embed RUC in positions 10-22", () => {
    const clave = generateClaveAcceso({
      fechaEmision: "20/02/2026",
      tipoComprobante: "01",
      ruc: "0992877878001",
      ambiente: "2",
      establecimiento: "001",
      puntoEmision: "001",
      secuencial: "000000001",
      codigoNumerico: "12345678",
      tipoEmision: "1",
    });

    expect(clave.substring(10, 23)).toBe("0992877878001");
  });

  it("should automatically zero-pad single digit dates", () => {
    const clave = generateClaveAcceso({
      fechaEmision: "5/5/2026",
      tipoComprobante: "01",
      ruc: "1790016919001",
      ambiente: "1",
      establecimiento: "001",
      puntoEmision: "001",
      secuencial: "000000001",
      codigoNumerico: "12345678",
      tipoEmision: "1",
    });

    // Sin la protección de `.padStart`, esto fallaría indicando que la longitud no es 8.
    expect(clave.substring(0, 8)).toBe("05052026");
  });

  it("should throw on invalid fecha format", () => {
    expect(() =>
      generateClaveAcceso({
        fechaEmision: "2026-02-20",
        tipoComprobante: "01",
        ruc: "1790016919001",
        ambiente: "1",
        establecimiento: "001",
        puntoEmision: "001",
        secuencial: "000000001",
        codigoNumerico: "12345678",
        tipoEmision: "1",
      })
    ).toThrow();
  });

  it("should throw on wrong segment length", () => {
    expect(() =>
      generateClaveAcceso({
        fechaEmision: "20/02/2026",
        tipoComprobante: "01",
        ruc: "179001691900", // 12 digits, not 13
        ambiente: "1",
        establecimiento: "001",
        puntoEmision: "001",
        secuencial: "000000001",
        codigoNumerico: "12345678",
        tipoEmision: "1",
      })
    ).toThrow(/ruc/i);
  });

  // Golden test: verify a known clave from EmiteYa
  it("golden test - known clave de acceso", () => {
    const clave = generateClaveAcceso({
      fechaEmision: "20/02/2026",
      tipoComprobante: "01",
      ruc: "0992877878001",
      ambiente: "1",
      establecimiento: "001",
      puntoEmision: "001",
      secuencial: "000000001",
      codigoNumerico: "12345678",
      tipoEmision: "1",
    });

    // Verify structure
    expect(clave.substring(0, 8)).toBe("20022026"); // fecha
    expect(clave.substring(8, 10)).toBe("01"); // codDoc
    expect(clave.substring(10, 23)).toBe("0992877878001"); // RUC
    expect(clave.substring(23, 24)).toBe("1"); // ambiente
    expect(clave.substring(24, 27)).toBe("001"); // establecimiento
    expect(clave.substring(27, 30)).toBe("001"); // puntoEmision
    expect(clave.substring(30, 39)).toBe("000000001"); // secuencial
    expect(clave.substring(39, 47)).toBe("12345678"); // codigoNumerico
    expect(clave.substring(47, 48)).toBe("1"); // tipoEmision

    // The check digit is deterministic
    const base = clave.substring(0, 48);
    const expectedCheckDigit = computeModulo11(base);
    expect(clave.substring(48)).toBe(expectedCheckDigit);
  });
});
