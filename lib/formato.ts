// Formato de fechas para la vista del asesor.
//
// Locale y zona horaria FIJOS (es-CO / America/Bogota): el demo se
// graba en video y no puede verse distinto según la máquina que lo
// abra. Además evita el desfase servidor/cliente al hidratar.

const FECHA_LARGA = new Intl.DateTimeFormat("es-CO", {
  weekday: "long",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Bogota",
});

const FECHA_CORTA = new Intl.DateTimeFormat("es-CO", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "America/Bogota",
});

export function fechaLarga(iso: string): string {
  return FECHA_LARGA.format(new Date(iso));
}

export function fechaCorta(iso: string): string {
  return FECHA_CORTA.format(new Date(iso));
}

/** "meta" -> "Meta Ads". Para que el asesor vea de dónde vino el lead. */
export const NOMBRE_FUENTE: Record<string, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  web: "Formulario web",
};
