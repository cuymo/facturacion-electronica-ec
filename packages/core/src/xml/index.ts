export {
  escapeXml,
  toFixed2,
  toFixed6,
  buildInfoTributariaXml,
  contribuyenteEspecialTag,
  obligadoContabilidadTag,
  dirEstablecimientoTag,
} from "./shared.js";

export { buildFacturaXml } from "./factura.builder.js";
export { buildNotaCreditoXml } from "./nota-credito.builder.js";
export { buildNotaDebitoXml } from "./nota-debito.builder.js";
export { buildGuiaRemisionXml } from "./guia-remision.builder.js";
export { buildComprobanteRetencionXml } from "./retencion.builder.js";
export { buildLiquidacionCompraXml } from "./liquidacion-compra.builder.js";

import type { DocumentType } from "../types/document-type.js";
import type { XmlBuildContext } from "../types/xml-build-context.js";
import type { DocumentData } from "../documents/index.js";
import type { FacturaData } from "../documents/factura.js";
import type { NotaCreditoData } from "../documents/nota-credito.js";
import type { NotaDebitoData } from "../documents/nota-debito.js";
import type { GuiaRemisionData } from "../documents/guia-remision.js";
import type { RetencionData } from "../documents/retencion.js";
import type { LiquidacionCompraData } from "../documents/liquidacion-compra.js";

import { buildFacturaXml } from "./factura.builder.js";
import { buildNotaCreditoXml } from "./nota-credito.builder.js";
import { buildNotaDebitoXml } from "./nota-debito.builder.js";
import { buildGuiaRemisionXml } from "./guia-remision.builder.js";
import { buildComprobanteRetencionXml } from "./retencion.builder.js";
import { buildLiquidacionCompraXml } from "./liquidacion-compra.builder.js";

/**
 * Generic XML builder dispatcher.
 * Routes to the appropriate builder based on document type.
 */
export function buildDocumentXml(
  documentType: DocumentType,
  ctx: XmlBuildContext,
  data: DocumentData
): string {
  switch (documentType) {
    case "FACTURA":
      return buildFacturaXml(ctx, data as FacturaData);
    case "LIQUIDACION_COMPRA":
      return buildLiquidacionCompraXml(ctx, data as LiquidacionCompraData);
    case "NOTA_CREDITO":
      return buildNotaCreditoXml(ctx, data as NotaCreditoData);
    case "NOTA_DEBITO":
      return buildNotaDebitoXml(ctx, data as NotaDebitoData);
    case "GUIA_REMISION":
      return buildGuiaRemisionXml(ctx, data as GuiaRemisionData);
    case "COMPROBANTE_RETENCION":
      return buildComprobanteRetencionXml(ctx, data as RetencionData);
    default: {
      const _exhaustive: never = documentType;
      throw new Error(`Unknown document type: ${_exhaustive}`);
    }
  }
}
