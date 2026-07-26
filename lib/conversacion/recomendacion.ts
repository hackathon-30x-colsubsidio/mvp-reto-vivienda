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
  /**
   * El material oficial para que el lead **vea** el proyecto, si lo hay.
   *
   * Cae al recorrido 360 cuando no hay brochure, y no es un consuelo: de los 18
   * proyectos, 16 traen brochure y los 2 que no —ABETO y LA ARBOLEDA— sí traen
   * recorrido. Sin ese fallback, **el #1 de Diana se quedaría sin link**, que es
   * justo el personaje que abre el demo.
   */
  material?: { url: string; tipo: "brochure" | "recorrido" };
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
        ...(materialDe(ficha) ? { material: materialDe(ficha)! } : {}),
      },
    ];
  });
}

/**
 * El link con el que la persona puede ver el proyecto.
 *
 * `recorrido_360` puede traer VARIAS urls separadas por salto de línea (VERSALLES
 * trae una por tipología más una de amenidades): se manda la primera. Mandarle
 * cuatro links a alguien por WhatsApp no es darle más, es que no abra ninguno.
 */
function materialDe(ficha: {
  brochure?: string;
  recorrido_360?: string;
}): { url: string; tipo: "brochure" | "recorrido" } | undefined {
  if (ficha.brochure) return { url: ficha.brochure, tipo: "brochure" };
  const primera = ficha.recorrido_360?.split("\n")[0]?.trim();
  return primera ? { url: primera, tipo: "recorrido" } : undefined;
}

/**
 * La burbuja con el link del proyecto #1, o `null` si no hay material.
 *
 * Va en mensaje aparte y **sin pasar por el LLM** (`agregarBotInstantaneo`), por
 * dos razones: así es como se manda un link por WhatsApp, y así el modelo no
 * puede mutilar la url ni inventarse otra. El guard no tendría cómo atraparlo —
 * `cifra_inventada` mira números, no direcciones.
 *
 * Solo el #1: es el proyecto sobre el que se ofrece la cita. Tres links en el
 * cierre es un volante, no una recomendación.
 */
export function mensajeMaterialDelProyecto(
  proyecto: ProyectoVerbalizable | undefined,
): string | null {
  if (!proyecto?.material) return null;

  return proyecto.material.tipo === "brochure"
    ? `Y te dejo el brochure de ${proyecto.nombre} para que lo veas con calma 👇 ${proyecto.material.url}`
    : `Y te dejo el recorrido virtual de ${proyecto.nombre}, para que lo camines desde el celular 👇 ${proyecto.material.url}`;
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
 * Ratificado el 2026-07-26 (§7 punto 16) con **un arreglo**: la versión anterior
 * nombraba los proyectos y **no daba ni una razón**. Es el camino que corre
 * cuando el LLM se cae —o sea el que más probabilidad tiene de salir en una
 * demo— y dejaba al lead con tres nombres y ningún porqué, que es exactamente
 * lo que la restricción de cero caja negra prohíbe: *"la explicación pesa tanto
 * como la recomendación"*.
 *
 * Ahora cita el único hecho que es cierto para TODOS los recomendados por
 * construcción: pasaron el filtro de precio, que es el gate del 40% (Decreto
 * 583 de 2025). La zona NO se menciona aunque casi siempre coincida, porque
 * `ProyectoVerbalizable` no dice si alguno entró como alternativa fuera de
 * zona — y prometerle su ciudad a alguien que va a recibir otra es justo el bug
 * que la zona estricta arregló.
 *
 * Sigue diciendo menos que la versión con IA a propósito: el `porque` completo
 * de cada proyecto es del asesor. Cabe en las 3 líneas y 4 frases del guard.
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

  // El eco es deliberado: la pregunta del ingreso prometió "no mostrarte casas
  // que después te aprieten el bolsillo". Aquí se cumple esa promesa en voz alta.
  return proyectos.length === 1
    ? `Con todo lo que me contaste, este es el que te sirve: ${lista}. Te lo escogí porque te cabe en el presupuesto sin apretarte, que era lo que te prometí. El asesor te lleva el detalle.`
    : `Con todo lo que me contaste, estos son los que te sirven: ${lista}. Te los escogí porque todos te caben en el presupuesto sin apretarte, que era lo que te prometí. El asesor te lleva el detalle de cada uno.`;
}
