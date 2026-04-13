/**
 * XML builder for Nota de Debito (codDoc 05).
 * Ported from EmiteYa. Uses SchemaRegistry for version.
 */

import type { NotaDebitoData, NotaDebitoMotivo } from "../documents/nota-debito.js";
import type { TaxInfo } from "../types/common.js";
import type { XmlBuildContext } from "../types/xml-build-context.js";
import { schemaRegistry } from "../schema-registry/index.js";
import {
  buildInfoTributariaXml,
  escapeXml,
  toFixed2,
  contribuyenteEspecialTag,
  obligadoContabilidadTag,
  dirEstablecimientoTag,
} from "./shared.js";

export function buildNotaDebitoXml(
  ctx: XmlBuildContext,
  data: NotaDebitoData
): string {
  const schema = schemaRegistry.get("NOTA_DEBITO");

  const impuestosXml = data.impuestos
    .map(
      (imp: TaxInfo) =>
        `<impuesto>
        <codigo>${imp.codigo}</codigo>
        <codigoPorcentaje>${imp.codigoPorcentaje}</codigoPorcentaje>
        <tarifa>${toFixed2(imp.tarifa)}</tarifa>
        <baseImponible>${toFixed2(imp.baseImponible)}</baseImponible>
        <valor>${toFixed2(imp.valor)}</valor>
      </impuesto>`
    )
    .join("");

  const motivosXml = data.motivos
    .map(
      (m: NotaDebitoMotivo) =>
        `<motivo>
        <razon>${escapeXml(m.razon)}</razon>
        <valor>${toFixed2(m.valor)}</valor>
      </motivo>`
    )
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<notaDebito id="comprobante" version="${schema.version}">
  ${buildInfoTributariaXml(ctx)}
  <infoNotaDebito>
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
    <impuestos>
      ${impuestosXml}
    </impuestos>
    <valorTotal>${toFixed2(data.valorTotal)}</valorTotal>
  </infoNotaDebito>
  <motivos>
    ${motivosXml}
  </motivos>
</notaDebito>`;
}
