import type { Lead, Score } from "@/lib/types";

// Tipos propios del Track C. NO son contratos entre tracks (eso es lib/types.ts):
// aquí vive lo que el matcher necesita y que ningún contrato cubre todavía.

/**
 * Ficha de un proyecto del catálogo. La produce el Track B en
 * `data/sintetica/proyectos.json` a partir de los 18 proyectos oficiales
 * (spec §6). Esta es la forma que el matcher espera; **anunciada a B** antes de
 * que publique el JSON, porque si no coincide hay que reescribir el matcher.
 */
export interface FichaProyecto {
  proyecto_id: string;
  nombre: string;
  ciudad: string;
  /** Barrio o sector, cuando se conoce. El matcher funciona sin esto. */
  zona?: string;
  /** Pesos colombianos, ya limpio: el Excel real trae 4 ceros de más (AGENTS.md). */
  precio_desde: number;
  vis: boolean;
  /**
   * Cupo de la regla 90/10: cuántas unidades no afiliadas puede vender el
   * proyecto y cuántas lleva. Es dato de primera clase, no metadata (spec §6).
   */
  cupo_no_afiliados: { usado: number; total: number };
  brochure?: string;
  recorrido_360?: string;
}

/**
 * Lo que recibe el matcher.
 *
 * `precio_maximo` viaja aparte porque el `Score` todavía no lo trae: es el
 * ticket 002 (dueño A, tras el kickoff). Cuando aterrice, `/api/match` pasa
 * `score.precio_maximo` aquí y este campo desaparece. Lo calcula
 * `lib/scoring/capacidad.ts` (ticket 004, dueño B): **el Track C no
 * reimplementa el tope del 40%**, solo consume el número.
 */
export interface EntradaMatch {
  lead: Lead;
  score: Score;
  catalogo: FichaProyecto[];
  precio_maximo: number;
}

/**
 * Un proyecto elegido por las reglas, con la traza de por qué entró.
 *
 * La traza es la materia prima del experto: el LLM redacta
 * `ProyectoRecomendado.porque` **a partir de estas razones**, no de su criterio.
 * Sin traza no hay explicación citable, y sin explicación citable el proyecto
 * no entra al demo (restricción "cero caja negra" de AGENTS.md).
 */
export interface ProyectoElegido {
  ficha: FichaProyecto;
  razones: string[];
}
