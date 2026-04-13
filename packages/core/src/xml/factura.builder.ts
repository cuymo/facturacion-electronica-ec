/**
 * XML builder for Factura (codDoc 01).
 *
 * Ported from EmiteYa src/infrastructure/templates/xml/factura.builder.ts.
 * Uses SchemaRegistry for the version string instead of hardcoding.
 */

import type { FacturaData, FacturaDetail } from "../documents/factura.js";
import type { TotalTax, Payment } from "../types/common.js";
import type { XmlBuildContext } from "../types/xml-build-context.js";
import { schemaRegistry } from "../schema-registry/index.js";
import {
  buildInfoTributariaXml,
  escapeXml,
  toFixed2,
  toFixed6,
  contribuyenteEspecialTag,
  obligadoContabilidadTag,
  dirEstablecimientoTag,
} from "./shared.js";

export function buildFacturaXml(
  ctx: XmlBuildContext,
  data: FacturaData
): string {
  const schema = schemaRegistry.get("FACTURA");

  const direccionCompradorXml = data.direccionComprador
    ? `<direccionComprador>${escapeXml(data.direccionComprador)}</direccionComprador>`
    : "";

  const totalConImpuestosXml = data.totalConImpuestos
    .map((t: TotalTax) => buildTotalImpuestoXml(t))
    .join("");

  const pagosXml = data.pagos
    .map((p: Payment) => buildPagoXml(p))
    .join("");

  const detallesXml = data.detalles
    .map((d: FacturaDetail) => buildDetalleXml(d))
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="${schema.version}">
  ${buildInfoTributariaXml(ctx)}
  <infoFactura>
    <fechaEmision>${data.fechaEmision}</fechaEmision>
    ${dirEstablecimientoTag(ctx)}
    ${contribuyenteEspecialTag(ctx)}
    ${obligadoContabilidadTag(ctx)}
    <tipoIdentificacionComprador>${data.tipoIdentificacionComprador}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(data.razonSocialComprador)}</razonSocialComprador>
    <identificacionComprador>${escapeXml(data.identificacionComprador)}</identificacionComprador>
    ${direccionCompradorXml}
    <totalSinImpuestos>${toFixed2(data.totalSinImpuestos)}</totalSinImpuestos>
    <totalDescuento>${toFixed2(data.totalDescuento)}</totalDescuento>
    <totalConImpuestos>
      ${totalConImpuestosXml}
    </totalConImpuestos>
    <propina>${toFixed2(data.propina)}</propina>
    <importeTotal>${toFixed2(data.importeTotal)}</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
      ${pagosXml}
    </pagos>
  </infoFactura>
  <detalles>
    ${detallesXml}
  </detalles>
</factura>`;
}

function buildTotalImpuestoXml(tax: TotalTax): string {
  return `<totalImpuesto>
        <codigo>${tax.codigo}</codigo>
        <codigoPorcentaje>${tax.codigoPorcentaje}</codigoPorcentaje>
        <baseImponible>${toFixed2(tax.baseImponible)}</baseImponible>
        <valor>${toFixed2(tax.valor)}</valor>
      </totalImpuesto>`;
}

function buildPagoXml(pago: Payment): string {
  const plazoXml =
    pago.plazo !== undefined
      ? `<plazo>${pago.plazo}</plazo><unidadTiempo>${escapeXml(pago.unidadTiempo ?? "dias")}</unidadTiempo>`
      : "";

  return `<pago>
        <formaPago>${pago.formaPago}</formaPago>
        <total>${toFixed2(pago.total)}</total>
        ${plazoXml}
      </pago>`;
}

function buildDetalleXml(detalle: FacturaDetail): string {
  const codigoAuxiliarXml = detalle.codigoAuxiliar
    ? `<codigoAuxiliar>${escapeXml(detalle.codigoAuxiliar)}</codigoAuxiliar>`
    : "";

  const impuestosXml = detalle.impuestos
    .map(
      (imp) => `<impuesto>
            <codigo>${imp.codigo}</codigo>
            <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>
            <tarifa>${toFixed2(imp.tarifa)}</tarifa>
            <baseImponible>${toFixed2(imp.baseImponible)}</baseImponible>
            <valor>${toFixed2(imp.valor)}</valor>
          </impuesto>`
    )
    .join("");

  return `<detalle>
      <codigoPrincipal>${escapeXml(detalle.codigoPrincipal)}</codigoPrincipal>
      ${codigoAuxiliarXml}
      <descripcion>${escapeXml(detalle.descripcion)}</descripcion>
      <cantidad>${toFixed6(detalle.cantidad)}</cantidad>
      <precioUnitario>${toFixed6(detalle.precioUnitario)}</precioUnitario>
      <descuento>${toFixed2(detalle.descuento)}</descuento>
      <precioTotalSinImpuesto>${toFixed2(detalle.precioTotalSinImpuesto)}</precioTotalSinImpuesto>
      <impuestos>
        ${impuestosXml}
      </impuestos>
    </detalle>`;
}
