/**
 * XML builder for Guia de Remision (codDoc 06).
 * Ported from EmiteYa. Uses SchemaRegistry for version.
 */

import type {
  GuiaRemisionData,
  GuiaRemisionDestinatario,
  GuiaRemisionDetailItem,
} from "../documents/guia-remision.js";
import type { XmlBuildContext } from "../types/xml-build-context.js";
import { schemaRegistry } from "../schema-registry/index.js";
import {
  buildInfoTributariaXml,
  escapeXml,
  toFixed6,
  contribuyenteEspecialTag,
  obligadoContabilidadTag,
  dirEstablecimientoTag,
} from "./shared.js";

export function buildGuiaRemisionXml(
  ctx: XmlBuildContext,
  data: GuiaRemisionData
): string {
  const schema = schemaRegistry.get("GUIA_REMISION");

  const destinatariosXml = data.destinatarios
    .map((dest: GuiaRemisionDestinatario) => {
      const rutaXml = dest.ruta
        ? `<ruta>${escapeXml(dest.ruta)}</ruta>`
        : "";

      const docSustentoXml =
        dest.codDocSustento && dest.numDocSustento
          ? `<codDocSustento>${escapeXml(dest.codDocSustento)}</codDocSustento>
      <numDocSustento>${escapeXml(dest.numDocSustento)}</numDocSustento>
      ${
        dest.numAutDocSustento
          ? `<numAutDocSustento>${escapeXml(dest.numAutDocSustento)}</numAutDocSustento>`
          : ""
      }
      ${
        dest.fechaEmisionDocSustento
          ? `<fechaEmisionDocSustento>${escapeXml(dest.fechaEmisionDocSustento)}</fechaEmisionDocSustento>`
          : ""
      }`
          : "";

      const detallesXml = dest.detalles
        .map((d: GuiaRemisionDetailItem) => {
          const codigoAdicionalXml = d.codigoAuxiliar
            ? `<codigoAdicional>${escapeXml(d.codigoAuxiliar)}</codigoAdicional>`
            : "";

          return `<detalle>
          <codigoInterno>${escapeXml(d.codigoPrincipal)}</codigoInterno>
          ${codigoAdicionalXml}
          <descripcion>${escapeXml(d.descripcion)}</descripcion>
          <cantidad>${toFixed6(d.cantidad)}</cantidad>
        </detalle>`;
        })
        .join("");

      return `<destinatario>
      <identificacionDestinatario>${escapeXml(dest.identificacionDestinatario)}</identificacionDestinatario>
      <razonSocialDestinatario>${escapeXml(dest.razonSocialDestinatario)}</razonSocialDestinatario>
      <dirDestinatario>${escapeXml(dest.dirDestinatario)}</dirDestinatario>
      <motivoTraslado>${escapeXml(dest.motivoTraslado)}</motivoTraslado>
      ${rutaXml}
      ${docSustentoXml}
      <detalles>
        ${detallesXml}
      </detalles>
    </destinatario>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<guiaRemision id="comprobante" version="${schema.version}">
  ${buildInfoTributariaXml(ctx)}
  <infoGuiaRemision>
    ${dirEstablecimientoTag(ctx)}
    <dirPartida>${escapeXml(data.dirPartida)}</dirPartida>
    <razonSocialTransportista>${escapeXml(data.razonSocialTransportista)}</razonSocialTransportista>
    <tipoIdentificacionTransportista>${data.tipoIdentificacionTransportista}</tipoIdentificacionTransportista>
    <rucTransportista>${escapeXml(data.rucTransportista)}</rucTransportista>
    ${contribuyenteEspecialTag(ctx)}
    ${obligadoContabilidadTag(ctx)}
    <fechaIniTransporte>${data.fechaIniTransporte}</fechaIniTransporte>
    <fechaFinTransporte>${data.fechaFinTransporte}</fechaFinTransporte>
    <placa>${escapeXml(data.placa)}</placa>
  </infoGuiaRemision>
  <destinatarios>
    ${destinatariosXml}
  </destinatarios>
</guiaRemision>`;
}
