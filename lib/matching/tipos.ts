import type { AmenidadInteres, Lead, Score } from "@/lib/types";

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
  /**
   * La ciudad de este proyecto NO está confirmada: las dos hojas del insumo
   * original se contradicen.
   *
   * ⚠️ **Hoy no lo trae ningún proyecto.** Lo traían VIBO ONCE y KARAKALI, y el
   * 2026-07-25 se resolvió con el material comercial oficial: los dos son de
   * Bogotá (Chapinero y Centro, con dirección). El campo se conserva porque la
   * regla vale para el próximo dato contradictorio, no porque haya uno.
   *
   * El matcher lo necesita para no afirmar lo que no sabe: un proyecto con la
   * ubicación en duda **no cuenta como coincidencia de zona**, porque decirle a
   * alguien "queda en la ciudad que te interesa" cuando la fuente dice dos
   * ciudades distintas es inventar. Se puede recomendar igual por precio, con
   * la advertencia encima.
   */
  ubicacion_incierta?: boolean;

  // ── Lo que sale de los 18 brochures (rama 8) ───────────
  // Generado por `scripts/generar-catalogo-detalle.ts` a
  // `data/sintetica/proyectos-detalle.json`. Todos opcionales: el matcher
  // funciona sin ellos, solo ordena peor. Son EXACTAMENTE las tres cosas que
  // el banco de preguntas averigua — nada que el lead no haya podido pedir
  // entra al ranking.

  /** Alcobas de las tipologías del proyecto, únicas y ordenadas. Ej: `[1, 2]`. */
  alcobas?: number[];
  /** El área privada más pequeña que ofrece, en m². El catálogo va de 21,6 a 68,06. */
  area_privada_desde_m2?: number;
  /** Familias de amenidad, ya normalizadas contra las 60+ etiquetas del brochure. */
  amenidades?: AmenidadInteres[];
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
  /**
   * `true` cuando el proyecto se ofrece como ALTERNATIVA fuera de la zona que
   * el lead pidió (en su zona no hubo nada dentro del presupuesto). La primera
   * razón lo dice en voz alta; la ficha y la explicación no lo esconden.
   */
  fuera_de_zona?: boolean;
}
