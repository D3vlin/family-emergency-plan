export const STEP_TITLES: readonly string[] = [
  "Encabezado",
  "Grupo familiar",
  "Teléfonos importantes",
  "Personas con discapacidad",
  "Sitios y personas frecuentes",
  "Riesgos y puntos de encuentro",
  "Maletín de emergencias",
  "Verificación de la vivienda",
  "Mascotas",
];

export function stepTitle(step: number): string {
  return STEP_TITLES[step - 1] ?? "";
}
