// Fecha temporal de elegibilidad al subsidio — la "rama temporal" de la
// nutrición (spec 05 D2) se materializa AQUÍ, en la capa de recursos, no dentro
// de triggerDelGate: son condiciones distintas (el gate del 40% no es temporal;
// la antigüedad de afiliación sí). Decisión Q3 (2026-07-25): la fecha vive en el
// recurso, `Score.trigger_nutricion` queda intacto.
//
// TS puro y determinista: recibe `desde` para poder probarse con una fecha fija
// (por defecto, hoy). Locale/zona FIJOS (es-CO / America/Bogota), igual que
// lib/formato.ts, porque el demo se graba en video y no puede verse distinto
// según la máquina.

/**
 * Meses de afiliación continua con aporte del 2% del IBC que exige el subsidio
 * de vivienda a un afiliado independiente o pensionado. Dato del recurso de
 * afiliación (catalogo.ts), no inventado.
 */
export const MESES_AFILIACION_SUBSIDIO = 6;

const FECHA_DIA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "America/Bogota",
});

/** La fecha en que se cumplen los 6 meses de afiliación contados desde `desde`. */
export function fechaElegibilidadSubsidio(desde: Date = new Date()): Date {
  const fecha = new Date(desde);
  fecha.setMonth(fecha.getMonth() + MESES_AFILIACION_SUBSIDIO);
  return fecha;
}

/** La misma fecha, ya redactada en español ("3 de febrero de 2027"). */
export function fechaElegibilidadTexto(desde: Date = new Date()): string {
  return FECHA_DIA.format(fechaElegibilidadSubsidio(desde));
}
