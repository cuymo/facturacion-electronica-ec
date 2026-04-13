/**
 * Shared validation primitives for SRI document fields.
 * Ported from EmiteYa DTO validation logic.
 */

const FECHA_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;
const PERIODO_FISCAL_REGEX = /^\d{2}\/\d{4}$/;
const NUM_DOC_REGEX = /^\d{3}-\d{3}-\d{9}$/;
const RUC_REGEX = /^\d{13}$/;
const CEDULA_REGEX = /^\d{10}$/;
const VALID_TIPO_ID = ["04", "05", "06", "07", "08"];

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export function ok(): ValidationResult {
  return { valid: true, errors: [] };
}

export function fail(errors: ValidationError[]): ValidationResult {
  return { valid: false, errors };
}

/** Accumulator for building validation results. */
export class ValidationContext {
  private errors: ValidationError[] = [];

  require(field: string, value: unknown, message?: string): void {
    if (value === undefined || value === null || value === "") {
      this.errors.push({
        field,
        message: message ?? `El campo '${field}' es obligatorio`,
      });
    }
  }

  requireString(field: string, value: unknown): void {
    if (typeof value !== "string" || value.trim() === "") {
      this.errors.push({
        field,
        message: `El campo '${field}' es obligatorio y debe ser texto`,
      });
    }
  }

  requireNonNegativeNumber(field: string, value: unknown): void {
    if (typeof value !== "number" || value < 0 || !Number.isFinite(value)) {
      this.errors.push({
        field,
        message: `El campo '${field}' debe ser un numero mayor o igual a 0`,
      });
    }
  }

  requireNonEmptyArray(field: string, value: unknown): void {
    if (!Array.isArray(value) || value.length === 0) {
      this.errors.push({
        field,
        message: `El campo '${field}' debe ser un arreglo no vacio`,
      });
    }
  }

  requireFecha(field: string, value: unknown): void {
    if (typeof value !== "string" || !FECHA_REGEX.test(value)) {
      this.errors.push({
        field,
        message: `El campo '${field}' debe tener formato dd/mm/aaaa`,
      });
    }
  }

  requirePeriodoFiscal(field: string, value: unknown): void {
    if (typeof value !== "string" || !PERIODO_FISCAL_REGEX.test(value)) {
      this.errors.push({
        field,
        message: `El campo '${field}' debe tener formato mm/aaaa`,
      });
    }
  }

  requireTipoIdentificacion(field: string, value: unknown): void {
    if (typeof value !== "string" || !VALID_TIPO_ID.includes(value)) {
      this.errors.push({
        field,
        message: `El campo '${field}' debe ser uno de: ${VALID_TIPO_ID.join(", ")}`,
      });
    }
  }

  requireNumDocumento(field: string, value: unknown): void {
    if (typeof value !== "string" || !NUM_DOC_REGEX.test(value)) {
      this.errors.push({
        field,
        message: `El campo '${field}' debe tener formato 000-000-000000000`,
      });
    }
  }

  result(): ValidationResult {
    return this.errors.length === 0
      ? { valid: true, errors: [] }
      : { valid: false, errors: [...this.errors] };
  }
}

// Standalone utility functions
export function isValidRuc(value: string): boolean {
  return RUC_REGEX.test(value);
}

export function isValidCedula(value: string): boolean {
  return CEDULA_REGEX.test(value);
}

export function isValidFecha(value: string): boolean {
  return FECHA_REGEX.test(value);
}

export function isValidTipoIdentificacion(value: string): boolean {
  return VALID_TIPO_ID.includes(value);
}

export function isValidNumDocumento(value: string): boolean {
  return NUM_DOC_REGEX.test(value);
}
