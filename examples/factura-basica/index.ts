/**
 * Example: Emit a basic factura using FacturacionElectronicaEC SDK.
 *
 * Prerequisites:
 * - A .p12 certificate file for SRI testing
 * - Node.js 18+
 *
 * Run: npx tsx examples/factura-basica/index.ts
 */

import { readFileSync } from "fs";
import { FacturacionElectronicaEC, UnsafeMemorySequenceProvider } from "facturacion-electronica-ec";

async function main() {
  // WARNING: UnsafeMemorySequenceProvider is for testing ONLY.
  // In production, implement ISequenceProvider backed by your database.
  const sequenceProvider = new UnsafeMemorySequenceProvider();

  const fy = new FacturacionElectronicaEC({
    emisor: {
      ruc: "0992877878001",
      razonSocial: "MI EMPRESA DE PRUEBA S.A.",
      nombreComercial: "MI TIENDA",
      dirMatriz: "Guayaquil, Av. 9 de Octubre 123",
      establecimiento: "001",
      puntoEmision: "001",
      direccionEstablecimiento: "Guayaquil, Sucursal Centro",
      obligadoContabilidad: true,
      ambiente: "1", // pruebas
    },
    p12: readFileSync("./firma.p12"),
    p12Password: "mi-clave",
    sequenceProvider,
  });

  const result = await fy.emitirFactura({
    fechaEmision: "12/04/2026",
    tipoIdentificacionComprador: "07",
    razonSocialComprador: "CONSUMIDOR FINAL",
    identificacionComprador: "9999999999999",
    totalSinImpuestos: 100.0,
    totalDescuento: 0,
    totalConImpuestos: [
      {
        codigo: "2",
        codigoPorcentaje: "4",
        baseImponible: 100.0,
        valor: 15.0,
      },
    ],
    propina: 0,
    importeTotal: 115.0,
    pagos: [{ formaPago: "01", total: 115.0 }],
    detalles: [
      {
        codigoPrincipal: "SERV001",
        descripcion: "Servicio de consultoria",
        cantidad: 1,
        precioUnitario: 100.0,
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
  });

  console.log("Estado:", result.estado);
  console.log("Clave de acceso:", result.claveAcceso);
  console.log("Secuencial:", result.secuencial);
  console.log("Autorizacion:", result.numeroAutorizacion);
  console.log("Intentos:", result.attempts);

  if (result.mensajes.length > 0) {
    console.log("Mensajes SRI:", result.mensajes);
  }
}

main().catch(console.error);
