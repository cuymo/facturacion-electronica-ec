/**
 * SRI ambiente code.
 * - '1' = Pruebas (testing)
 * - '2' = Produccion (production)
 */
export type Ambiente = "1" | "2";

/** Human-readable ambiente label, used in internal config lookups. */
export type AmbienteLabel = "PRUEBAS" | "PRODUCCION";

export function ambienteToLabel(ambiente: Ambiente): AmbienteLabel {
  return ambiente === "2" ? "PRODUCCION" : "PRUEBAS";
}

export function labelToAmbiente(label: AmbienteLabel): Ambiente {
  return label === "PRODUCCION" ? "2" : "1";
}
