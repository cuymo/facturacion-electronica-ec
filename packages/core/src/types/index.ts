export type { Ambiente, AmbienteLabel } from "./ambiente.js";
export { ambienteToLabel, labelToAmbiente } from "./ambiente.js";

export type { DocumentType } from "./document-type.js";
export {
  DOCUMENT_TYPE_COD_DOC,
  COD_DOC_TO_DOCUMENT_TYPE,
  getCodDoc,
  isValidDocumentType,
} from "./document-type.js";

export type { Emisor } from "./emisor.js";

export type { XmlBuildContext } from "./xml-build-context.js";

export type {
  TaxInfo,
  TotalTax,
  Payment,
  SimplePayment,
  TipoIdentificacion,
} from "./common.js";
