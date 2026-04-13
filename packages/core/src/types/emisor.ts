import type { Ambiente } from "./ambiente.js";

/**
 * Represents the issuer (emisor) of an electronic document.
 *
 * This is the pure SRI domain concept -- no database IDs, no tenant info.
 * Consumers build this from their own data sources.
 */
export interface Emisor {
  /** 13-digit RUC of the issuing entity. */
  ruc: string;

  /** Legal name (razon social). */
  razonSocial: string;

  /** Trade name (nombre comercial). Optional. */
  nombreComercial?: string;

  /** Headquarters address (direccion matriz). */
  dirMatriz: string;

  /** 3-digit establishment code, e.g. "001". */
  establecimiento: string;

  /** 3-digit emission point code, e.g. "001". */
  puntoEmision: string;

  /** Address of the specific establishment. */
  direccionEstablecimiento: string;

  /** Contribuyente especial resolution number, if applicable. */
  contribuyenteEspecial?: string;

  /** Whether the entity is required to keep accounting records. */
  obligadoContabilidad: boolean;

  /** SRI environment: '1' = pruebas, '2' = produccion. */
  ambiente: Ambiente;

  /**
   * Agente de retencion resolution number, if applicable.
   * Used in comprobanteRetencion documents.
   */
  agenteRetencion?: string;
}
