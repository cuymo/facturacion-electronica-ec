import type { FacturaYaErrorCode } from "./error-codes.js";

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
 * Base error class for all FacturaYa library errors.
 *
 * Carries a typed error code and optionally SRI-specific messages,
 * allowing consumers to handle errors programmatically.
 */
export class FacturaYaError extends Error {
  public readonly name = "FacturaYaError";

  constructor(
    public readonly code: FacturaYaErrorCode,
    message: string,
    public readonly sriMensajes?: SriMensaje[],
    options?: ErrorOptions
  ) {
    super(message, options);
  }

  static validation(message: string, options?: ErrorOptions): FacturaYaError {
    return new FacturaYaError("VALIDATION", message, undefined, options);
  }

  static claveAcceso(message: string, options?: ErrorOptions): FacturaYaError {
    return new FacturaYaError("CLAVE_ACCESO", message, undefined, options);
  }

  static xmlBuild(message: string, options?: ErrorOptions): FacturaYaError {
    return new FacturaYaError("XML_BUILD", message, undefined, options);
  }

  static xmlStructure(message: string, options?: ErrorOptions): FacturaYaError {
    return new FacturaYaError("XML_STRUCTURE", message, undefined, options);
  }

  static signing(message: string, options?: ErrorOptions): FacturaYaError {
    return new FacturaYaError("SIGNING", message, undefined, options);
  }

  static sriReception(
    message: string,
    mensajes?: SriMensaje[],
    options?: ErrorOptions
  ): FacturaYaError {
    return new FacturaYaError("SRI_RECEPTION", message, mensajes, options);
  }

  static sriAuthorization(
    message: string,
    mensajes?: SriMensaje[],
    options?: ErrorOptions
  ): FacturaYaError {
    return new FacturaYaError("SRI_AUTHORIZATION", message, mensajes, options);
  }

  static sriCommunication(
    message: string,
    options?: ErrorOptions
  ): FacturaYaError {
    return new FacturaYaError("SRI_COMMUNICATION", message, undefined, options);
  }

  static sriError70(
    message: string,
    mensajes?: SriMensaje[],
    options?: ErrorOptions
  ): FacturaYaError {
    return new FacturaYaError("SRI_ERROR_70", message, mensajes, options);
  }

  static sequence(message: string, options?: ErrorOptions): FacturaYaError {
    return new FacturaYaError("SEQUENCE", message, undefined, options);
  }

  static configuration(
    message: string,
    options?: ErrorOptions
  ): FacturaYaError {
    return new FacturaYaError("CONFIGURATION", message, undefined, options);
  }

  static certificate(message: string, options?: ErrorOptions): FacturaYaError {
    return new FacturaYaError("CERTIFICATE", message, undefined, options);
  }
}
