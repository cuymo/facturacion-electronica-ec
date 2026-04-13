/**
 * XML builder for Comprobante de Retencion (codDoc 07).
 * Ported from EmiteYa. Uses SchemaRegistry for version.
 */

import type {
  RetencionData,
  RetencionDocSustento,
  RetencionDocTax,
  RetencionRetencion,
} from "../documents/retencion.js";
import type { SimplePayment } from "../types/common.js";
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

export function buildComprobanteRetencionXml(
  ctx: XmlBuildContext,
  data: RetencionData
): string {
  const schema = schemaRegistry.get("COMPROBANTE_RETENCION");
  const parteRel = data.parteRel ?? "NO";

  const docsSustentoXml = data.docsSustento
    .map((doc: RetencionDocSustento) => {
      const impuestosDocXml = doc.impuestosDocSustento
        .map(
          (t: RetencionDocTax) =>
            `<impuestoDocSustento>
            <codImpuestoDocSustento>${t.codImpuestoDocSustento}</codImpuestoDocSustento>
            <codigoPorcentaje>${t.codigoPorcentaje}</codigoPorcentaje>
            <baseImponible>${toFixed2(t.baseImponible)}</baseImponible>
            <tarifa>${toFixed2(t.tarifa)}</tarifa>
            <valorImpuesto>${toFixed2(t.valorImpuesto)}</valorImpuesto>
          </impuestoDocSustento>`
        )
        .join("");

      const retencionesXml = doc.retenciones
        .map(
          (r: RetencionRetencion) =>
            `<retencion>
            <codigo>${r.codigo}</codigo>
            <codigoRetencion>${r.codigoRetencion}</codigoRetencion>
            <baseImponible>${toFixed2(r.baseImponible)}</baseImponible>
            <porcentajeRetener>${toFixed2(r.porcentajeRetener)}</porcentajeRetener>
            <valorRetenido>${toFixed2(r.valorRetenido)}</valorRetenido>
          </retencion>`
        )
        .join("");

      const pagosXml = doc.pagos
        .map(
          (p: SimplePayment) =>
            `<pago>
            <formaPago>${p.formaPago}</formaPago>
            <total>${toFixed2(p.total)}</total>
          </pago>`
        )
        .join("");

      const fechaRegistroContableXml = doc.fechaRegistroContable
        ? `<fechaRegistroContable>${escapeXml(doc.fechaRegistroContable)}</fechaRegistroContable>`
        : "";

      // XSD v2.0.0 strict xs:sequence order
      return `<docSustento>
      <codSustento>${doc.codSustento}</codSustento>
      <codDocSustento>${doc.codDocSustento}</codDocSustento>
      <numDocSustento>${escapeXml(doc.numDocSustento.replace(/-/g, ""))}</numDocSustento>
      <fechaEmisionDocSustento>${escapeXml(doc.fechaEmisionDocSustento)}</fechaEmisionDocSustento>
      ${fechaRegistroContableXml}
      <numAutDocSustento>${escapeXml(doc.numAutDocSustento)}</numAutDocSustento>
      <pagoLocExt>${doc.pagoLocExt}</pagoLocExt>
      <totalSinImpuestos>${toFixed2(doc.totalSinImpuestos)}</totalSinImpuestos>
      <importeTotal>${toFixed2(doc.importeTotal)}</importeTotal>
      <impuestosDocSustento>
        ${impuestosDocXml}
      </impuestosDocSustento>
      <retenciones>
        ${retencionesXml}
      </retenciones>
      <pagos>
        ${pagosXml}
      </pagos>
    </docSustento>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<comprobanteRetencion id="comprobante" version="${schema.version}">
  ${buildInfoTributariaXml(ctx)}
  <infoCompRetencion>
    <fechaEmision>${data.fechaEmision}</fechaEmision>
    ${dirEstablecimientoTag(ctx)}
    ${contribuyenteEspecialTag(ctx)}
    ${obligadoContabilidadTag(ctx)}
    <tipoIdentificacionSujetoRetenido>${data.tipoIdentificacionSujetoRetenido}</tipoIdentificacionSujetoRetenido>
    <parteRel>${parteRel}</parteRel>
    <razonSocialSujetoRetenido>${escapeXml(data.razonSocialSujetoRetenido)}</razonSocialSujetoRetenido>
    <identificacionSujetoRetenido>${escapeXml(data.identificacionSujetoRetenido)}</identificacionSujetoRetenido>
    <periodoFiscal>${data.periodoFiscal}</periodoFiscal>
  </infoCompRetencion>
  <docsSustento>
    ${docsSustentoXml}
  </docsSustento>
</comprobanteRetencion>`;
}
