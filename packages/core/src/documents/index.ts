export type { FacturaData, FacturaDetail } from "./factura.js";
export type {
  LiquidacionCompraData,
  LiquidacionCompraDetail,
} from "./liquidacion-compra.js";
export type { NotaCreditoData, NotaCreditoDetail } from "./nota-credito.js";
export type {
  NotaDebitoData,
  NotaDebitoMotivo,
} from "./nota-debito.js";
export type {
  GuiaRemisionData,
  GuiaRemisionDestinatario,
  GuiaRemisionDetailItem,
} from "./guia-remision.js";
export type {
  RetencionData,
  RetencionDocSustento,
  RetencionDocTax,
  RetencionRetencion,
} from "./retencion.js";

import type { FacturaData } from "./factura.js";
import type { LiquidacionCompraData } from "./liquidacion-compra.js";
import type { NotaCreditoData } from "./nota-credito.js";
import type { NotaDebitoData } from "./nota-debito.js";
import type { GuiaRemisionData } from "./guia-remision.js";
import type { RetencionData } from "./retencion.js";

/** Union of all document data types. Useful for generic handling. */
export type DocumentData =
  | FacturaData
  | LiquidacionCompraData
  | NotaCreditoData
  | NotaDebitoData
  | GuiaRemisionData
  | RetencionData;
