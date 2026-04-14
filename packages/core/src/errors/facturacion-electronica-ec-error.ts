import type { FacturacionElectronicaECErrorCode } from "./error-codes.js";

/**
 * SRI message structure returned in reception and authorization responses.
 */
export interface SriMensaje {
  identificador: string;
  mensaje: string;
  informacionAdicional: string;
  tipo: string;
}

/**
 * Base error class for all FacturacionElectronicaEC library errors.
 *
 * Carries a typed error code and optionally SRI-specific messages,
 * allowing consumers to handle errors programmatically.
 */
export class FacturacionElectronicaECError extends Error {
  public readonly name = "FacturacionElectronicaECError";

  constructor(
    public readonly code: FacturacionElectronicaECErrorCode,
    message: string,
    public readonly sriMensajes?: SriMensaje[],
    options?: ErrorOptions
  ) {
    super(message, options);
  }

  static validation(message: string, options?: ErrorOptions): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("VALIDATION", message, undefined, options);
  }

  static claveAcceso(message: string, options?: ErrorOptions): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("CLAVE_ACCESO", message, undefined, options);
  }

  static xmlBuild(message: string, options?: ErrorOptions): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("XML_BUILD", message, undefined, options);
  }

  static xmlStructure(message: string, options?: ErrorOptions): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("XML_STRUCTURE", message, undefined, options);
  }

  static signing(message: string, options?: ErrorOptions): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("SIGNING", message, undefined, options);
  }

  static sriReception(
    message: string,
    mensajes?: SriMensaje[],
    options?: ErrorOptions
  ): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("SRI_RECEPTION", message, mensajes, options);
  }

  static sriAuthorization(
    message: string,
    mensajes?: SriMensaje[],
    options?: ErrorOptions
  ): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("SRI_AUTHORIZATION", message, mensajes, options);
  }

  static sriCommunication(
    message: string,
    options?: ErrorOptions
  ): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("SRI_COMMUNICATION", message, undefined, options);
  }

  static sriError70(
    message: string,
    mensajes?: SriMensaje[],
    options?: ErrorOptions
  ): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("SRI_ERROR_70", message, mensajes, options);
  }

  static sequence(message: string, options?: ErrorOptions): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("SEQUENCE", message, undefined, options);
  }

  static configuration(
    message: string,
    options?: ErrorOptions
  ): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("CONFIGURATION", message, undefined, options);
  }

  static certificate(message: string, options?: ErrorOptions): FacturacionElectronicaECError {
    return new FacturacionElectronicaECError("CERTIFICATE", message, undefined, options);
  }
}
