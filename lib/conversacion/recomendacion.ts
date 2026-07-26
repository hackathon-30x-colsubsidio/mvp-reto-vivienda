import { curar } from "@/lib/curar";
import { catalogo } from "@/lib/matching/catalogo";
import { pesos } from "@/lib/formato";
import type { Lead } from "@/lib/types";

// =====================================================================
// LO QUE EL MOTOR ELIGIÓ, DICHO EN VOZ ALTA.
//
// Hasta hoy el lead nunca oía sus proyectos: `ResultadoCurado.proyectos` es un
// NÚMERO (`lib/types.ts`), y lo único que se nombraba en el chat era el #1,
// dentro del ofrecimiento de cita ("puedes ir a ver ARAUCARIA"). Los otros dos,
// y el `porque` de los tres, solo los veía el asesor en la ficha.
//
// ── Dónde corre, y por qué ahí ───────────────────────────────────────
//
// **Solo al final**, con el perfilamiento completo (decisión de Mani,
// 2026-07-26). No a mitad de la conversación: `precioMaximoDe` devuelve 0 sin
// ingreso —que es la 3ª de las 7 preguntas—, así que antes de eso `matchear()`
// filtra el catálogo entero y no hay nada que verbalizar. Si el lead pregunta
// qué le conviene antes, sigue respondiendo el texto determinista de hoy.
//
// ── Quién decide y quién habla ───────────────────────────────────────
//
// El matcher decide; Sara redacta. Esta función arma la LISTA CERRADA con el
// `porque` ya calculado, y el prompt no le da al modelo ninguna otra forma de
// nombrar un proyecto. Importa más de lo que parece: el guard de la rama 3
// atrapa "te sirve más ZARZAL" (compara contra los 18 nombres del catálogo)
// pero NO atrapa "Torres del Parque", porque no hay contra qué compararlo. La
// lista cerrada es lo que cubre ese hueco.
//
// No se llama a `curar()` para ver el veredicto: se llama para ver la lista.
// El puntaje y la salida NO entran al prompt (spec 02 D2) — si Sara los viera,
// se le saldría el veredicto en el tono.
// =====================================================================

/** Un proyecto elegido, con lo justo para nombrarlo sin inventar. */
export interface ProyectoVerbalizable {
  nombre: string;
  ciudad: string;
  precio_desde: number;
  vis: boolean;
  /** El porqué que ya calculó el matcher, citable tal cual. */
  porque: string;
}

/**
 * Los hasta 3 proyectos que el motor eligió para este lead, listos para nombrar.
 *
 * Vacío cuando el lead cayó en nutrición o cuando nada del catálogo le cabe: ahí
 * no hay recomendación que dar, y decir algo igual sería inventarla.
 */
export function proyectosParaVerbalizar(lead: Lead): ProyectoVerbalizable[] {
  const { proyectos } = curar(lead);

  return proyectos.flatMap((recomendado) => {
    const ficha = catalogo.find((f) => f.proyecto_id === recomendado.proyecto_id);
    if (!ficha) return [];
    return [
      {
        nombre: ficha.nombre,
        ciudad: ficha.ciudad,
        precio_desde: ficha.precio_desde,
        vis: ficha.vis,
        porque: recomendado.porque,
      },
    ];
  });
}

/** Los proyectos como los ve el modelo: numerados, con su porqué, y nada más. */
export function listaParaPrompt(proyectos: ProyectoVerbalizable[]): string {
  return proyectos
    .map(
      (p, i) =>
        `${i + 1}. ${p.nombre} — ${p.ciudad}, desde ${pesos(p.precio_desde)}${p.vis ? " (VIS)" : ""}. Por qué le sirve: ${p.porque}`,
    )
    .join("\n");
}

/**
 * El mismo mensaje sin IA, que es el que se pinta si Gemini no responde.
 *
 * 🔴 **Copy derivado, pendiente de ratificar** — se escribió porque la rama 4 no
 * puede entregar un mensaje que solo exista cuando el LLM está vivo ("el demo
 * nunca depende de la IA", ADR 0002), y el original aprobado es el del prompt.
 * Mismo registro, deliberadamente más corto.
 *
 * Dice menos que la versión con IA a propósito: nombra los proyectos con su
 * precio "desde" (dato duro, del catálogo) y manda el porqué al asesor, en vez
 * de resumir tres `porque` en una frase que ya no sería citable. Cabe en las 3
 * líneas y 4 frases que tolera el guard de la rama 3.
 */
export function mensajeRecomendacionDeterminista(
  proyectos: ProyectoVerbalizable[],
): string | null {
  if (proyectos.length === 0) return null;

  const nombrados = proyectos.map((p) => `${p.nombre} (desde ${pesos(p.precio_desde)})`);
  const lista =
    nombrados.length === 1
      ? nombrados[0]
      : `${nombrados.slice(0, -1).join(", ")} y ${nombrados[nombrados.length - 1]}`;

  return proyectos.length === 1
    ? `Con todo lo que me contaste, este es el que te sirve: ${lista}. El asesor te lleva el detalle y por qué te lo escogí.`
    : `Con todo lo que me contaste, estos son los que te sirven: ${lista}. El asesor te lleva el detalle de cada uno y por qué te los escogí.`;
}
