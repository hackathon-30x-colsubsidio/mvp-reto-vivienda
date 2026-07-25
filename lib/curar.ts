import { calcularScore } from "./scoring";
import { precioMaximoDe } from "./scoring/capacidad";
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

  if (proyectos.length > 0) {
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
  const referencia = resolverProyectoDeReferencia(lead, fichas);
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
    explicacion: explicacionDeterminista(lead, score, proyectos),
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
