/**
 * Context object passed to all XML builders.
 *
 * Contains the infoTributaria fields that are common to every
 * SRI electronic document. Built from Emisor + sequence + clave de acceso.
 */
export interface XmlBuildContext {
  /** SRI ambiente code: '1' = pruebas, '2' = produccion. */
  ambiente: string;

  /** 13-digit RUC. */
  ruc: string;

  /** Legal name. */
  razonSocial: string;

  /** Trade name. Null if not set. */
  nombreComercial: string | null;

  /** Headquarters address. */
  dirMatriz: string;

  /** 49-digit clave de acceso. */
  claveAcceso: string;

  /** 2-digit SRI document type code (01, 03, 04, 05, 06, 07). */
  codDoc: string;

  /** 3-digit establishment code. */
  establecimiento: string;

  /** 3-digit emission point code. */
  puntoEmision: string;

  /** 9-digit zero-padded sequential number. */
  secuencial: string;

  /** Address of the specific establishment. */
  direccionEstablecimiento: string;

  /** Contribuyente especial resolution number, or null. */
  contribuyenteEspecial: string | null;

  /** Whether the entity is required to keep accounting records. */
  obligadoContabilidad: boolean;
}
