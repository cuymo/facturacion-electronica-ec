/**
 * XML builder for Liquidacion de Compra (codDoc 03).
 * Ported from EmiteYa. Uses SchemaRegistry for version.
 */

import type {
  LiquidacionCompraData,
  LiquidacionCompraDetail,
} from "../documents/liquidacion-compra.js";
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

export function buildLiquidacionCompraXml(
  ctx: XmlBuildContext,
  data: LiquidacionCompraData
): string {
  const schema = schemaRegistry.get("LIQUIDACION_COMPRA");

  const direccionProveedorXml = data.direccionProveedor
    ? `<direccionProveedor>${escapeXml(data.direccionProveedor)}</direccionProveedor>`
    : "";

  const totalConImpuestosXml = data.totalConImpuestos
    .map(
      (t: TotalTax) =>
        `<totalImpuesto>
        <codigo>${t.codigo}</codigo>
        <codigoPorcentaje>${t.codigoPorcentaje}</codigoPorcentaje>
        <baseImponible>${toFixed2(t.baseImponible)}</baseImponible>
        <valor>${toFixed2(t.valor)}</valor>
      </totalImpuesto>`
    )
    .join("");

  const pagosXml = data.pagos
    .map((p: Payment) => {
      const plazoXml =
        p.plazo !== undefined
          ? `<plazo>${p.plazo}</plazo><unidadTiempo>${escapeXml(p.unidadTiempo ?? "dias")}</unidadTiempo>`
          : "";

      return `<pago>
        <formaPago>${p.formaPago}</formaPago>
        <total>${toFixed2(p.total)}</total>
        ${plazoXml}
      </pago>`;
    })
    .join("");

  const detallesXml = data.detalles
    .map((d: LiquidacionCompraDetail) => {
      const codigoAuxiliarXml = d.codigoAuxiliar
        ? `<codigoAuxiliar>${escapeXml(d.codigoAuxiliar)}</codigoAuxiliar>`
        : "";

      const impuestosXml = d.impuestos
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
      <codigoPrincipal>${escapeXml(d.codigoPrincipal)}</codigoPrincipal>
      ${codigoAuxiliarXml}
      <descripcion>${escapeXml(d.descripcion)}</descripcion>
      <cantidad>${toFixed6(d.cantidad)}</cantidad>
      <precioUnitario>${toFixed6(d.precioUnitario)}</precioUnitario>
      <descuento>${toFixed2(d.descuento)}</descuento>
      <precioTotalSinImpuesto>${toFixed2(d.precioTotalSinImpuesto)}</precioTotalSinImpuesto>
      <impuestos>
        ${impuestosXml}
      </impuestos>
    </detalle>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<liquidacionCompra id="comprobante" version="${schema.version}">
  ${buildInfoTributariaXml(ctx)}
  <infoLiquidacionCompra>
    <fechaEmision>${data.fechaEmision}</fechaEmision>
    ${dirEstablecimientoTag(ctx)}
    ${contribuyenteEspecialTag(ctx)}
    ${obligadoContabilidadTag(ctx)}
    <tipoIdentificacionProveedor>${data.tipoIdentificacionProveedor}</tipoIdentificacionProveedor>
    <razonSocialProveedor>${escapeXml(data.razonSocialProveedor)}</razonSocialProveedor>
    <identificacionProveedor>${escapeXml(data.identificacionProveedor)}</identificacionProveedor>
    ${direccionProveedorXml}
    <totalSinImpuestos>${toFixed2(data.totalSinImpuestos)}</totalSinImpuestos>
    <totalDescuento>${toFixed2(data.totalDescuento)}</totalDescuento>
    <totalConImpuestos>
      ${totalConImpuestosXml}
    </totalConImpuestos>
    <importeTotal>${toFixed2(data.importeTotal)}</importeTotal>
    <moneda>DOLAR</moneda>
    <pagos>
      ${pagosXml}
    </pagos>
  </infoLiquidacionCompra>
  <detalles>
    ${detallesXml}
  </detalles>
</liquidacionCompra>`;
}
