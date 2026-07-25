import { calcularScore } from "./scoring";
import { cabeEnElTope, cuotaNetaDe, precioMaximoDe } from "./scoring/capacidad";
import { recursosPara } from "./recursos";
import { matchear } from "./matching";
import { catalogo as catalogoReal } from "./matching/catalogo";
import type { FichaProyecto } from "./matching/tipos";
import type { Lead, LeadCurado, ProyectoCatalogo, ProyectoRecomendado, Score } from "./types";

// =====================================================================
// Curar un lead: de la conversación terminada al LeadCurado que ve el asesor.
//
// Es la costura S4 del plan (ticket 006) y va aquí, en lib/, y no dentro de
// la API route, por dos razones: se testea sin levantar el server, y deja la
// ruta reducida a HTTP + persistencia.
//
// TODO puro y determinista — sin LLM y sin red (ADR 0002, "cero caja negra").
// La IA solo pule texto en /api/chat y /api/explicacion; el veredicto no
// depende de que un modelo esté vivo.
// =====================================================================

/**
 * Contra qué proyecto se califica.
 *
 * El gate del 40% compara la cuota de UN proyecto contra el ingreso, así que
 * calificar exige elegir uno. Se usa el proyecto por el que el lead entró
 * —igual que la operación real: si entra por Araucaria, se le habla de
 * Araucaria— y si no se puede resolver, **el más económico del catálogo**.
 *
 * Ese fallback no es arbitrario: si a alguien no le alcanza ni el proyecto más
 * barato que vendemos, la respuesta honesta es nutrición, y el trigger le dice
 * qué lo destrabaría. Calificarlo contra uno caro lo mandaría a nutrición por
 * el proyecto que miró, no por su capacidad.
 *
 * ⚠️ Hoy los 3 personajes canónicos entran con proyectos que NO existen en el
 * catálogo real (ticket 001), así que caen al fallback. Es la costura conocida.
 */
export function resolverProyectoDeReferencia(
  lead: Lead,
  fichas: FichaProyecto[],
): FichaProyecto | null {
  if (fichas.length === 0) return null;

  const buscado = lead.evento.proyecto_interes?.trim().toLowerCase();
  if (buscado) {
    const exacto = fichas.find(
      (p) =>
        p.nombre.trim().toLowerCase() === buscado ||
        p.proyecto_id.trim().toLowerCase() === buscado,
    );
    if (exacto) return exacto;
  }

  return fichas.reduce((masBarato, p) =>
    p.precio_desde < masBarato.precio_desde ? p : masBarato,
  );
}

/**
 * Capacidad primero, proyecto después (ticket 023).
 *
 * El gate compara la cuota de UN proyecto contra el ingreso, así que calificar
 * obliga a elegir uno — pero elegir mal castigaba al lead por la vivienda que
 * miró, no por lo que puede pagar: quien entraba por ARAUCARIA ($619.800.000)
 * con $4.000.000 de ingreso salía a nutrición con CERO proyectos, aunque 13 de
 * los 18 del catálogo le cupieran. El catálogo entero no se miraba.
 *
 * Ahora la capacidad se resuelve antes: si el proyecto de referencia no le cabe
 * pero alguno del catálogo sí, se recalifica contra ese. El elegido es **el más
 * económico que le cabe**, que es el mismo criterio del fallback de arriba: si
 * ni el más barato entra bajo el 40%, la respuesta honesta es nutrición.
 *
 * Se devuelve también el proyecto descartado, y no es un detalle de
 * implementación: cambiar de referencia sin decirlo es caja negra
 * (`AGENTS.md`), así que la explicación lo nombra con su número.
 *
 * Si NADA del catálogo cabe, la referencia sigue siendo la original: el trigger
 * de nutrición habla entonces del proyecto que el lead sí tenía en la cabeza.
 */
export function referenciaParaCalificar(
  lead: Lead,
  fichas: FichaProyecto[],
): { referencia: FichaProyecto | null; no_le_cabe?: FichaProyecto } {
  const referencia = resolverProyectoDeReferencia(lead, fichas);
  if (!referencia) return { referencia: null };

  const cabe = (p: FichaProyecto) => cabeEnElTope(lead, p.precio_desde, p.vis ?? false);
  if (cabe(referencia)) return { referencia };

  const alcanzables = fichas.filter(cabe);
  if (alcanzables.length === 0) return { referencia };

  const masBarato = alcanzables.reduce((barato, p) =>
    p.precio_desde < barato.precio_desde ? p : barato,
  );
  return { referencia: masBarato, no_le_cabe: referencia };
}

/**
 * El porqué global, redactado sin LLM.
 *
 * Se arma con los `valor` de los factores que el motor ya calculó, así que
 * cita cifras reales y no puede inventar: si un número no lo produjo el motor,
 * no aparece aquí. `/api/explicacion` sigue existiendo para la versión pulida
 * por el experto en la ficha del asesor; esta es la que queda guardada y la
 * que sostiene el demo cuando el LLM no está.
 */
export function explicacionDeterminista(
  lead: Lead,
  score: Score,
  proyectos: ProyectoRecomendado[],
  /** `true` cuando TODO lo recomendado es alternativa fuera de la zona pedida. */
  fueraDeZona = false,
  /** El puente del ticket 023: contra qué se calificó cuando no fue el proyecto de entrada. */
  puente?: { descartado: FichaProyecto; referencia: FichaProyecto },
): string {
  const primerNombre = lead.evento.nombre.split(" ")[0];
  const valorDe = (nombre: string) =>
    score.factores.find((f) => f.nombre === nombre)?.valor ?? "";

  const cuota = valorDe("cuota_ingreso_40");
  const partes: string[] = [];

  if (score.salida === "nutricion") {
    partes.push(`${primerNombre} todavía no puede comprar, y la razón es una sola: ${cuota}.`);
    partes.push(
      `No se descarta — queda en nutrición. ${score.trigger_nutricion ?? ""}`.trim(),
    );
    return partes.join(" ");
  }

  partes.push(`${primerNombre} puede comprar hoy: ${cuota}.`);

  if (puente) {
    // Cero caja negra: la referencia cambió, y el asesor tiene que ver por qué
    // el número de arriba no habla del proyecto que el lead vino a mirar.
    const ingreso = lead.respuestas.ingreso_hogar_mensual ?? 0;
    const cuotaDescartado = cuotaNetaDe(
      lead,
      puente.descartado.precio_desde,
      puente.descartado.vis ?? false,
    );
    const porcentaje = ingreso > 0 ? ((cuotaDescartado / ingreso) * 100).toFixed(1) : "—";
    partes.push(
      `Ojo: la calificación NO se hizo contra ${puente.descartado.nombre}, el proyecto por el que entró — ` +
        `esa vivienda (desde $${puente.descartado.precio_desde.toLocaleString("es-CO")}) le daría una cuota de ` +
        `$${Math.round(cuotaDescartado).toLocaleString("es-CO")}, el ${porcentaje}% de su ingreso, por encima del tope del 40%. ` +
        `Se calificó contra ${puente.referencia.nombre}, que sí le cabe, y las recomendaciones salen de todo el catálogo.`,
    );
  }

  partes.push(`${valorDe("afiliacion")}.`);

  if (score.salida === "listo_restriccion_cupo" && proyectos.length > 0) {
    // Ya no se le esconden los proyectos por el cupo (2026-07-24), pero el
    // asesor tiene que saber que ahí hay un límite regulatorio que validar.
    partes.push(
      "Va contra el cupo del 10% de no afiliados (regla 90/10), que estos proyectos ya tienen copado: hay que validar cupo antes de separar.",
    );
  } else if (score.salida === "listo_restriccion_cupo") {
    partes.push(`${valorDe("cupo_90_10")} — el límite es de cupo, no del lead.`);
  }

  if (proyectos.length > 0 && fueraDeZona) {
    // Zona estricta (2026-07-25): en su zona no hubo nada dentro del
    // presupuesto. No se le disfraza otra ciudad de match — se le dice.
    const nombres = proyectos.map((p) => p.nombre).join(", ");
    partes.push(
      `En la zona que pidió (${lead.respuestas.zona_interes ?? lead.perfil.ciudad}) ningún proyecto del catálogo cae dentro de su presupuesto. ` +
        `Se le muestran ${proyectos.length === 1 ? "una alternativa" : `${proyectos.length} alternativas`} en otra zona, marcada${proyectos.length === 1 ? "" : "s"} como tal: ${nombres}. ` +
        `Un asesor te contactará para más información.`,
    );
  } else if (proyectos.length > 0) {
    const nombres = proyectos.map((p) => p.nombre).join(", ");
    partes.push(
      `Le caben ${proyectos.length} proyecto${proyectos.length === 1 ? "" : "s"} del catálogo: ${nombres}.`,
    );
  } else if (score.salida === "listo_restriccion_cupo") {
    partes.push(
      "No le queda ningún proyecto disponible porque todos tienen el cupo de no afiliados agotado (regla 90/10). Pasa el corte financiero: lo que lo bloquea es el cupo.",
    );
  } else {
    partes.push(
      "Ningún proyecto del catálogo cae dentro de lo que puede pagar bajo el tope del 40%.",
    );
  }

  partes.push(`Puntaje de prioridad ${score.puntaje}/100, con los ${score.factores.length} factores a la vista.`);
  return partes.join(" ");
}

/**
 * Conversación terminada → `LeadCurado`: califica, matchea y redacta el porqué.
 *
 * No persiste nada: eso lo hace `/api/curar`, que es quien habla con la DB.
 */
export function curar(lead: Lead, fichas: FichaProyecto[] = catalogoReal): LeadCurado {
  const { referencia, no_le_cabe } = referenciaParaCalificar(lead, fichas);
  if (!referencia) {
    throw new Error("El catálogo de proyectos está vacío: no se puede calificar");
  }

  const score = calcularScore(lead, referencia as ProyectoCatalogo);
  const elegidos = matchear({
    lead,
    score,
    catalogo: fichas,
    precio_maximo: precioMaximoDe(lead),
  });

  const proyectos: ProyectoRecomendado[] = elegidos.map(({ ficha, razones }) => ({
    proyecto_id: ficha.proyecto_id,
    nombre: ficha.nombre,
    // `porque` en lenguaje natural, armado con la traza del matcher. El experto
    // lo reescribe más bonito en /api/explicacion; aquí se guarda el citable.
    porque: capitalizar(razones.join("; ")),
  }));

  return {
    lead,
    score,
    proyectos,
    explicacion: explicacionDeterminista(
      lead,
      score,
      proyectos,
      elegidos.length > 0 && elegidos.every((e) => e.fuera_de_zona === true),
      no_le_cabe ? { descartado: no_le_cabe, referencia } : undefined,
    ),
    // Capa ORTOGONAL a la salida: se deriva de los factores que el motor ya
    // calculó (cero caja negra). Un `listo` puede llevar recurso igual — no es
    // el premio de consolación de la nutrición. No se persiste: se recomputa
    // desde `score.factores` al leer de la DB (ver leadCuradoDesdeFila).
    recursos: recursosPara(lead, score),
  };
}

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
