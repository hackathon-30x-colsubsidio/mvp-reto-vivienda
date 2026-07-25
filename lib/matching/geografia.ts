// Geografía del matcher: cómo se decide que un proyecto está "en la zona"
// que el lead pidió. Antes era un `===` exacto, y como el chat guarda el texto
// crudo ("Bogotá, por el sur"), un bogotano no matcheaba NADA en Bogotá y el
// fallback lo mandaba a Girardot en silencio. Ahora se comparan TOKENS
// normalizados: lo que el lead teclee vale, mientras nombre la ciudad o el
// sector.

import type { FichaProyecto } from "./tipos";

/**
 * Palabras que no localizan nada por sí solas. "Ciudadela" está aquí a
 * propósito: escribir "una ciudadela" no puede matchear las dos Ciudadelas del
 * catálogo a la vez — el token que localiza es "Calle 80" o "Maiporé".
 */
const STOPWORDS = new Set([
  "por", "el", "la", "los", "las", "de", "del", "en", "o", "y", "un", "una",
  "cerca", "zona", "barrio", "sector", "parte", "lado", "ciudadela", "norte",
  "sur", "centro", "occidente", "oriente",
]);

/** Minúsculas, sin tildes, sin espacios sobrantes. */
export function normalizarZona(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** "Bogotá, por el norte" → {"bogota"} · "Ricaurte o Bogotá" → {"ricaurte","bogota"} */
function tokensDe(texto: string): Set<string> {
  return new Set(
    normalizarZona(texto)
      .split(/[^a-z0-9ñ]+/)
      .filter((t) => t.length >= 2 && !STOPWORDS.has(t)),
  );
}

function hayInterseccion(a: Set<string>, b: Set<string>): boolean {
  return [...a].some((t) => b.has(t));
}

/** ¿La zona que pidió el lead nombra la CIUDAD del proyecto? */
export function coincideCiudad(proyecto: FichaProyecto, zonaLead: string | undefined): boolean {
  // Un proyecto con la ciudad en duda (dos fuentes se contradicen) NUNCA cuenta
  // como coincidencia: prometerle a alguien que queda en su zona cuando la
  // fuente dice dos ciudades distintas es inventar. Se puede recomendar igual
  // por precio, con la advertencia encima (ver razonesDe en index.ts).
  if (!zonaLead || proyecto.ubicacion_incierta) return false;
  return hayInterseccion(tokensDe(proyecto.ciudad), tokensDe(zonaLead));
}

/** ¿Nombra el BARRIO/SECTOR del proyecto? (señal más fina que la ciudad) */
export function coincideBarrio(proyecto: FichaProyecto, zonaLead: string | undefined): boolean {
  if (!zonaLead || !proyecto.zona || proyecto.ubicacion_incierta) return false;
  return hayInterseccion(tokensDe(proyecto.zona), tokensDe(zonaLead));
}

/** Ciudad o barrio: la puerta de entrada del filtro de zona del matcher. */
export function coincideZona(proyecto: FichaProyecto, zonaLead: string | undefined): boolean {
  return coincideCiudad(proyecto, zonaLead) || coincideBarrio(proyecto, zonaLead);
}
