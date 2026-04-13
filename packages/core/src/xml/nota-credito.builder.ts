/**
 * XML builder for Nota de Credito (codDoc 04).
 * Ported from EmiteYa. Uses SchemaRegistry for version.
 */

import type { NotaCreditoData, NotaCreditoDetail } from "../documents/nota-credito.js";
import type { TotalTax } from "../types/common.js";
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

export function buildNotaCreditoXml(
  ctx: XmlBuildContext,
  data: NotaCreditoData
): string {
  const schema = schemaRegistry.get("NOTA_CREDITO");

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

  const detallesXml = data.detalles
    .map((d: NotaCreditoDetail) => {
      // notaCredito XSD uses codigoInterno/codigoAdicional (NOT codigoPrincipal/codigoAuxiliar)
      const codigoAdicionalXml = d.codigoAuxiliar
        ? `<codigoAdicional>${escapeXml(d.codigoAuxiliar)}</codigoAdicional>`
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
      <codigoInterno>${escapeXml(d.codigoPrincipal)}</codigoInterno>
      ${codigoAdicionalXml}
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

  // SRI XSD notaCredito: strict xs:sequence for element order
  return `<?xml version="1.0" encoding="UTF-8"?>
<notaCredito id="comprobante" version="${schema.version}">
  ${buildInfoTributariaXml(ctx)}
  <infoNotaCredito>
    <fechaEmision>${data.fechaEmision}</fechaEmision>
    ${dirEstablecimientoTag(ctx)}
    <tipoIdentificacionComprador>${data.tipoIdentificacionComprador}</tipoIdentificacionComprador>
    <razonSocialComprador>${escapeXml(data.razonSocialComprador)}</razonSocialComprador>
    <identificacionComprador>${escapeXml(data.identificacionComprador)}</identificacionComprador>
    ${contribuyenteEspecialTag(ctx)}
    ${obligadoContabilidadTag(ctx)}
    <codDocModificado>${data.codDocModificado}</codDocModificado>
    <numDocModificado>${escapeXml(data.numDocModificado)}</numDocModificado>
    <fechaEmisionDocSustento>${escapeXml(data.fechaEmisionDocSustento)}</fechaEmisionDocSustento>
    <totalSinImpuestos>${toFixed2(data.totalSinImpuestos)}</totalSinImpuestos>
    <valorModificacion>${toFixed2(data.valorModificacion)}</valorModificacion>
    <moneda>DOLAR</moneda>
    <totalConImpuestos>
      ${totalConImpuestosXml}
    </totalConImpuestos>
    <motivo>${escapeXml(data.motivo)}</motivo>
  </infoNotaCredito>
  <detalles>
    ${detallesXml}
  </detalles>
</notaCredito>`;
}
