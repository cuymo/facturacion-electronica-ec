import { describe, expect, it, vi } from "vitest";
import {
  FacturacionElectronicaEC,
  FacturacionElectronicaECError,
  UnsafeMemorySequenceProvider,
} from "../../packages/sdk/src/index.js";
import type {
  Emisor,
  FacturaData,
  ISequenceProvider,
  ISigner,
  ISriClient,
} from "../../packages/sdk/src/index.js";

const EMISOR: Emisor = {
  ruc: "0992877878001",
  razonSocial: "EMPRESA TEST S.A.",
  dirMatriz: "Quito",
  establecimiento: "001",
  puntoEmision: "001",
  direccionEstablecimiento: "Quito Sucursal",
  obligadoContabilidad: false,
  ambiente: "1",
};

const FACTURA: FacturaData = {
  fechaEmision: "12/04/2026",
  tipoIdentificacionComprador: "07",
  razonSocialComprador: "CONSUMIDOR FINAL",
  identificacionComprador: "9999999999999",
  totalSinImpuestos: 100,
  totalDescuento: 0,
  totalConImpuestos: [
    { codigo: "2", codigoPorcentaje: "4", baseImponible: 100, valor: 15 },
  ],
  propina: 0,
  importeTotal: 115,
  pagos: [{ formaPago: "01", total: 115 }],
  detalles: [
    {
      codigoPrincipal: "PROD001",
      descripcion: "Producto test",
      cantidad: 1,
      precioUnitario: 100,
      descuento: 0,
      precioTotalSinImpuesto: 100,
      impuestos: [
        {
          codigo: "2",
          codigoPorcentaje: "4",
          tarifa: 15,
          baseImponible: 100,
          valor: 15,
        },
      ],
    },
  ],
};

const signer: ISigner = {
  async sign(xml) {
    return `${xml}<Signature />`;
  },
};

const receivedSriClient: ISriClient = {
  async enviarComprobante() {
    return { estado: "RECIBIDA", mensajes: [] };
  },
  async autorizarComprobante() {
    return {
      estado: "AUTORIZADO",
      numeroAutorizacion: "1".repeat(49),
      fechaAutorizacion: "2026-04-12T12:00:00-05:00",
      mensajes: [],
    };
  },
};

function createSdk(overrides: {
  sequenceProvider?: ISequenceProvider;
  signer?: ISigner;
  sriClient?: ISriClient;
  onError?: (error: FacturacionElectronicaECError) => void | Promise<void>;
} = {}): FacturacionElectronicaEC {
  return new FacturacionElectronicaEC({
    emisor: EMISOR,
    p12: Buffer.from("p12"),
    p12Password: "secret",
    sequenceProvider:
      overrides.sequenceProvider ?? new UnsafeMemorySequenceProvider(),
    signer: overrides.signer ?? signer,
    sriClient: overrides.sriClient ?? receivedSriClient,
    authorizationDelayMs: 0,
    maxSendRetries: 0,
    maxError70Retries: 0,
    sendRetryDelayMs: 0,
    hooks: overrides.onError ? { onError: overrides.onError } : undefined,
  });
}

describe("SDK error handling hardening", () => {
  it("throws a typed CONFIGURATION error for missing runtime config", () => {
    expect(() => new FacturacionElectronicaEC(null as never)).toThrow(
      FacturacionElectronicaECError
    );
    try {
      new FacturacionElectronicaEC(null as never);
    } catch (error) {
      expect((error as FacturacionElectronicaECError).code).toBe(
        "CONFIGURATION"
      );
    }
  });

  it("turns invalid runtime document input into a typed VALIDATION error", async () => {
    const onError = vi.fn();
    const sdk = createSdk({ onError });

    await expect(sdk.emitirFactura(null as never)).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].code).toBe("VALIDATION");
  });

  it("turns sequence provider crashes into typed SEQUENCE errors", async () => {
    const onError = vi.fn();
    const sdk = createSdk({
      onError,
      sequenceProvider: {
        async next() {
          throw new Error("database unavailable");
        },
      },
    });

    await expect(sdk.emitirFactura(FACTURA)).rejects.toMatchObject({
      code: "SEQUENCE",
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].message).toContain(
      "database unavailable"
    );
  });

  it("wraps low-level XML builder crashes as typed XML_BUILD errors", () => {
    const onError = vi.fn();
    const sdk = createSdk({ onError });

    expect(() => sdk.buildXml("FACTURA", {} as never)).toThrow(
      FacturacionElectronicaECError
    );
    try {
      sdk.buildXml("FACTURA", {} as never);
    } catch (error) {
      expect((error as FacturacionElectronicaECError).code).toBe("XML_BUILD");
    }
  });

  it("returns FIRMADO and calls onError when SRI send communication fails", async () => {
    const onError = vi.fn();
    const sdk = createSdk({
      onError,
      sriClient: {
        async enviarComprobante() {
          throw new Error("network down");
        },
        async autorizarComprobante() {
          throw new Error("should not authorize");
        },
      },
    });

    const result = await sdk.emitirFactura(FACTURA);

    expect(result.estado).toBe("FIRMADO");
    expect(result.mensajes[0]?.mensaje).toContain("network down");
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].code).toBe("SRI_COMMUNICATION");
  });

  it("does not crash when rollback fails after SRI DEVUELTA", async () => {
    const onError = vi.fn();
    const sdk = createSdk({
      onError,
      sequenceProvider: {
        async next() {
          return "000000001";
        },
        async rollback() {
          throw new Error("rollback unavailable");
        },
      },
      sriClient: {
        async enviarComprobante() {
          return {
            estado: "DEVUELTA",
            mensajes: [
              {
                identificador: "35",
                mensaje: "Documento invalido",
                informacionAdicional: "",
                tipo: "ERROR",
              },
            ],
          };
        },
        async autorizarComprobante() {
          throw new Error("should not authorize");
        },
      },
    });

    const result = await sdk.emitirFactura(FACTURA);

    expect(result.estado).toBe("DEVUELTO");
    expect(result.mensajes.some((m) => m.tipo === "WARNING")).toBe(true);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].code).toBe("SEQUENCE");
  });

  it("wraps custom signer crashes as typed SIGNING errors", async () => {
    const onError = vi.fn();
    const sdk = createSdk({
      onError,
      signer: {
        async sign() {
          throw new Error("bad certificate");
        },
      },
    });

    await expect(sdk.emitirFactura(FACTURA)).rejects.toMatchObject({
      code: "SIGNING",
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0]![0].message).toContain("bad certificate");
  });
});
