/**
 * Shared XML utilities for SRI document builders.
 *
 * Ported from EmiteYa src/infrastructure/templates/xml/shared.ts.
 * Zero changes to the core logic -- only import paths adjusted.
 */

import type { XmlBuildContext } from "../types/xml-build-context.js";

export function escapeXml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function toFixed2(n: number): string {
  return n.toFixed(2);
}

export function toFixed6(n: number): string {
  return n.toFixed(6);
}

export function buildInfoTributariaXml(ctx: XmlBuildContext): string {
  const nombreComercialXml = ctx.nombreComercial
    ? `<nombreComercial>${escapeXml(ctx.nombreComercial)}</nombreComercial>`
    : "";

  return `<infoTributaria>
    <ambiente>${ctx.ambiente}</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>${escapeXml(ctx.razonSocial)}</razonSocial>
    ${nombreComercialXml}
    <ruc>${ctx.ruc}</ruc>
    <claveAcceso>${ctx.claveAcceso}</claveAcceso>
    <codDoc>${ctx.codDoc}</codDoc>
    <estab>${ctx.establecimiento}</estab>
    <ptoEmi>${ctx.puntoEmision}</ptoEmi>
    <secuencial>${ctx.secuencial}</secuencial>
    <dirMatriz>${escapeXml(ctx.dirMatriz)}</dirMatriz>
  </infoTributaria>`;
}

export function contribuyenteEspecialTag(ctx: XmlBuildContext): string {
  return ctx.contribuyenteEspecial
    ? `<contribuyenteEspecial>${escapeXml(ctx.contribuyenteEspecial)}</contribuyenteEspecial>`
    : "";
}

export function obligadoContabilidadTag(ctx: XmlBuildContext): string {
  return `<obligadoContabilidad>${ctx.obligadoContabilidad ? "SI" : "NO"}</obligadoContabilidad>`;
}

export function dirEstablecimientoTag(ctx: XmlBuildContext): string {
  return `<dirEstablecimiento>${escapeXml(ctx.direccionEstablecimiento)}</dirEstablecimiento>`;
}
