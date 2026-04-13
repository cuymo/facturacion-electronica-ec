import type { GuiaRemisionData } from "../documents/guia-remision.js";
import type { ValidationResult } from "./validators.js";
import { ValidationContext } from "./validators.js";

export function validateGuiaRemision(data: GuiaRemisionData): ValidationResult {
  const v = new ValidationContext();

  v.requireString("dirPartida", data.dirPartida);
  v.requireString("razonSocialTransportista", data.razonSocialTransportista);
  v.requireTipoIdentificacion(
    "tipoIdentificacionTransportista",
    data.tipoIdentificacionTransportista
  );
  v.requireString("rucTransportista", data.rucTransportista);
  v.requireFecha("fechaIniTransporte", data.fechaIniTransporte);
  v.requireFecha("fechaFinTransporte", data.fechaFinTransporte);
  v.requireString("placa", data.placa);
  v.requireNonEmptyArray("destinatarios", data.destinatarios);

  return v.result();
}
