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

/**
 * Día calendario en Bogotá, `YYYY-MM-DD`.
 *
 * Es la llave con la que el tablero agrupa por día. Va aquí, con el
 * resto del formato de fechas, porque quien genera un lead y quien lo
 * cuenta en una barra tienen que estar de acuerdo en qué día es: si
 * cada uno lo calculara por su lado, un lead podría generarse "hace 13
 * días" y caer fuera de la ventana de 14.
 */
const DIA_BOGOTA = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: "America/Bogota",
});

export function diaBogota(fecha: Date | string): string {
  return DIA_BOGOTA.format(typeof fecha === "string" ? new Date(fecha) : fecha);
}

/** "meta" -> "Meta Ads". Para que el asesor vea de dónde vino el lead. */
export const NOMBRE_FUENTE: Record<string, string> = {
  meta: "Meta Ads",
  google: "Google Ads",
  web: "Formulario web",
};

/**
 * `situacion_crediticia` viaja como enum entre el conversador y el motor, y el
 * enum NO se le enseña a nadie: "sin_info" en una pantalla se lee como un error
 * del sistema. Vive aquí, y no en un componente, porque lo usan las dos caras —
 * el sello del lead al cerrar el chat y la ficha del asesor— y con dos copias
 * una se queda vieja.
 *
 * Ninguna etiqueta suena a veredicto: no se califica a la persona, se refleja
 * lo que dijo.
 */
export const ETIQUETA_CREDITICIA: Record<string, string> = {
  buena: "Al día",
  regular: "En proceso de arreglo",
  mala: "Con algo pendiente",
  sin_info: "Por confirmar",
};

export function etiquetaCrediticia(valor: string): string {
  return ETIQUETA_CREDITICIA[valor] ?? valor;
}
