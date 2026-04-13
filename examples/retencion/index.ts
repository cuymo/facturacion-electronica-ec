/**
 * Example: Emit a comprobante de retencion.
 *
 * Run: npx tsx examples/retencion/index.ts
 */

import { readFileSync } from "fs";
import { FacturaYa, UnsafeMemorySequenceProvider } from "facturacion-electronica-ec";

async function main() {
  const fy = new FacturaYa({
    emisor: {
      ruc: "0992877878001",
      razonSocial: "MI EMPRESA S.A.",
      dirMatriz: "Guayaquil",
      establecimiento: "001",
      puntoEmision: "001",
      direccionEstablecimiento: "Guayaquil, Sucursal",
      obligadoContabilidad: true,
      ambiente: "1",
    },
    p12: readFileSync("./firma.p12"),
    p12Password: "clave",
    sequenceProvider: new UnsafeMemorySequenceProvider(),
  });

  const result = await fy.emitirRetencion({
    fechaEmision: "12/04/2026",
    tipoIdentificacionSujetoRetenido: "04",
    razonSocialSujetoRetenido: "PROVEEDOR ABC CIA LTDA",
    identificacionSujetoRetenido: "0991234567001",
    periodoFiscal: "04/2026",
    docsSustento: [
      {
        codSustento: "01",
        codDocSustento: "01",
        numDocSustento: "001-001-000000100",
        fechaEmisionDocSustento: "01/04/2026",
        numAutDocSustento: "0".repeat(49),
        pagoLocExt: "01",
        totalSinImpuestos: 1000.0,
        importeTotal: 1150.0,
        impuestosDocSustento: [
          {
            codImpuestoDocSustento: "2",
            codigoPorcentaje: "4",
            baseImponible: 1000.0,
            tarifa: 15.0,
            valorImpuesto: 150.0,
          },
        ],
        retenciones: [
          {
            codigo: "1",
            codigoRetencion: "3",
            baseImponible: 150.0,
            porcentajeRetener: 30.0,
            valorRetenido: 45.0,
          },
          {
            codigo: "2",
            codigoRetencion: "312",
            baseImponible: 1000.0,
            porcentajeRetener: 1.75,
            valorRetenido: 17.5,
          },
        ],
        pagos: [{ formaPago: "20", total: 1150.0 }],
      },
    ],
  });

  console.log("Retencion emitida:", result.estado);
  console.log("Clave:", result.claveAcceso);
}

main().catch(console.error);
