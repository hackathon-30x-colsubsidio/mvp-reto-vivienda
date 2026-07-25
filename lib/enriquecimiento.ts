import identidades from "@/data/sintetica/identidades.json";
import type { PerfilConocido } from "@/lib/types";
import * as leadsEvento from "@/lib/fixtures/leads-evento";
import * as perfilesConocidos from "@/lib/fixtures/perfiles-conocidos";

// =====================================================================
// Enriquecimiento por cédula — costura S1 del plan (ticket 003).
//
// Es lo que hace posible el criterio de aceptación 1: con la cédula ya sabemos
// afiliación, ciudad, segmento y rango de ingreso, así que la conversación
// pregunta SOLO lo que falta (spec §6, spec 01 D7).
//
// La base son las 303 identidades sintéticas de `data/sintetica/identidades.json`,
// generadas con las distribuciones reales del Excel. La data real es anónima (no
// trae cédulas), así que el "ya te conocemos" del demo se SIMULA — y eso se dice,
// no se esconde.
//
// ⚠️ Vive del lado del servidor (`/api/enriquecer`) a propósito: el JSON pesa
// ~100 KB y no tiene por qué viajar al navegador de nadie. Antes el chat resolvía
// solo 3 cédulas fixture y cualquier otra daba `match: false`, así que el "soy
// yo" del jurado NUNCA veía el momento de "ya sabemos quién eres".
// =====================================================================

interface IdentidadSintetica {
  cedula: string;
  afiliado: boolean;
  ciudad?: string;
  segmento?: string;
  rango_ingreso?: string;
}

/** Los rangos que la base marca como desconocidos no son un rango. */
function rangoUtil(rango: string | undefined): string | undefined {
  if (!rango) return undefined;
  return /no disponible|sin dato|desconocid/i.test(rango) ? undefined : rango;
}

function perfilDesdeIdentidad(identidad: IdentidadSintetica): PerfilConocido {
  return {
    match: true,
    afiliado: identidad.afiliado,
    ...(identidad.ciudad ? { ciudad: identidad.ciudad } : {}),
    ...(identidad.segmento ? { segmento: identidad.segmento } : {}),
    ...(rangoUtil(identidad.rango_ingreso)
      ? { rango_ingreso: rangoUtil(identidad.rango_ingreso) }
      : {}),
  };
}

/**
 * El índice: primero los 3 personajes canónicos (sus perfiles son los que el
 * demo enseña y los que siembra el seed), después las 303 identidades.
 */
const BASE: Map<string, PerfilConocido> = new Map([
  [leadsEvento.afiliadoListo.cedula, perfilesConocidos.afiliadoListo],
  [leadsEvento.noAfiliadoListo.cedula, perfilesConocidos.noAfiliadoListo],
  [leadsEvento.nutricion.cedula, perfilesConocidos.nutricion],
  ...(identidades as IdentidadSintetica[]).map(
    (identidad) => [identidad.cedula, perfilDesdeIdentidad(identidad)] as const,
  ),
]);

/**
 * Cédula → lo que sabemos de esa persona sin haberle preguntado nada.
 *
 * Sin match devuelve `{ match: false }`, que NO es un error: es el caso que hace
 * visible la conversación adaptativa (spec §6), porque ahí se pregunta todo.
 */
export function enriquecerPorCedula(cedula: string): PerfilConocido {
  return BASE.get(cedula.trim()) ?? { match: false };
}

/** Cuántas identidades resuelve la base. Lo usa el test y sirve para el pitch. */
export const TOTAL_IDENTIDADES = BASE.size;
