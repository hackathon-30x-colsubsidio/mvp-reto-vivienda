// Mapeador de recursos — TS puro, determinista, SIN LLM (el LLM solo pule tono
// después, nunca decide qué recurso mostrar). Regla de AGENTS.md.
//
// El disparador es A NIVEL DE FACTOR, no de puntaje: reutiliza los factores que
// el motor YA emitió (Score.factores) y cada recurso cita el factor que lo
// activó (cero caja negra). NO hay corte numérico por factor (decisión Q1,
// 2026-07-25): se dispara solo por factores desfavorables categóricos.
//
// La capa es ORTOGONAL a Score.salida: un lead `listo` con cita puede recibir
// un recurso igual. Nunca reemplaza al asesor.

import { afiliadoEfectivo } from "../scoring";
import { CATALOGO_RECURSOS, type RecursoId } from "./catalogo";
import { fechaElegibilidadTexto } from "./elegibilidad";
import type { Lead, RecursoRecomendado, Score } from "../types";

/** Cuántos recursos ve el lead como máximo (Q2): 1 primario, hasta 2. */
export const MAX_RECURSOS = 2;

/** Un candidato antes de resolver prioridad y tope. */
interface Candidato {
  recurso_id: RecursoId;
  factor_disparador: string;
  porque: string;
  prioridad: number; // menor = más alta. Ordena qué recurso es el primario.
}

function cumpleFactor(score: Score, nombre: string): boolean | undefined {
  return score.factores.find((f) => f.nombre === nombre)?.cumple;
}

/**
 * Recursos recomendados para un lead, derivados de sus factores.
 *
 * Orden de las reglas = orden de lectura, no de prioridad (eso lo fija
 * `prioridad`). Cada regla es una condición categórica sobre un factor
 * desfavorable; ninguna usa un umbral numérico ajustable.
 */
export function recursosPara(
  lead: Lead,
  score: Score,
  hoy: Date = new Date(),
): RecursoRecomendado[] {
  const candidatos: Candidato[] = [];
  const afiliado = afiliadoEfectivo(lead);
  const tieneVivienda = lead.respuestas.tiene_vivienda === true;
  const subsidioDeclarado = cumpleFactor(score, "subsidio_aplicable") === true;
  const situacion = lead.respuestas.situacion_crediticia;

  // R1 · Afiliación — recurso-PUERTA para no afiliados: desbloquea el subsidio y
  // los saca del cupo del 10%. Ancla del trigger temporal (elegibilidad.ts).
  if (!afiliado) {
    // La fecha temporal vive AQUÍ, en el recurso (Q3): si se afilia hoy, cuándo
    // cumple los 6 meses de aporte que exige el subsidio. Es el "caso con fecha"
    // que pide spec 05 D2, derivado de un dato real, no inventado.
    const fechaSubsidio = fechaElegibilidadTexto(hoy);
    candidatos.push({
      recurso_id: "afiliacion",
      factor_disparador: "afiliacion",
      porque:
        "No eres afiliado a Colsubsidio, así que hoy compites por el cupo del 10% de no afiliados. Afiliarte abre el subsidio de vivienda y te saca de ese cupo. " +
        `Si te afilias hoy y aportas el 2%, alrededor del ${fechaSubsidio} cumples los 6 meses continuos que el subsidio exige.`,
      prioridad: 1,
    });
  }

  // R2 · Subsidio — solo para AFILIADOS (el subsidio lo exige), que no sean
  // propietarios (tenerlo inhabilita) y que NO lo hayan declarado ya (guard
  // anti-absurdo: ofrecer un subsidio a quien dijo tenerlo es ridículo).
  const elegibleSubsidio = afiliado && !tieneVivienda && !subsidioDeclarado;
  if (elegibleSubsidio) {
    candidatos.push({
      recurso_id: "subsidio",
      factor_disparador: "subsidio_aplicable",
      porque:
        "No registraste ningún subsidio y, siendo afiliado y sin vivienda propia, podrías tener derecho a uno que baje lo que pagas.",
      prioridad: 2,
    });
    // Guía como companion de bajo compromiso del subsidio.
    candidatos.push({
      recurso_id: "guia_subsidios",
      factor_disparador: "subsidio_aplicable",
      porque: "Si vas a postular a un subsidio, esta guía te muestra el paso a paso.",
      prioridad: 5,
    });
  }

  // R3 · Crediticia mala o regular → educación financiera externa (el paso
  // honesto: Colsubsidio no repara crédito) + compra de cartera. Categórico, no
  // un umbral numérico.
  //
  // Cartera cuelga AQUÍ y en ningún otro lado. La tentación era colgarla del
  // gate del 40%, pero esa cuota se deriva del PRECIO de la vivienda, no de
  // deudas: consolidar no la mueve un peso (un lead a 89,8% seguiría a 89,8%).
  // Recomendarla contra el gate sería cero caja negra violado — una acción que
  // dice atender un factor cuya aritmética no toca. Contra la crediticia sí es
  // honesta: quien arrastra créditos suele tener el historial castigado, y
  // consolidar baja la carga real.
  if (situacion === "mala" || situacion === "regular") {
    candidatos.push({
      recurso_id: "educacion_financiera_habitat",
      factor_disparador: "situacion_crediticia",
      porque: `Reportaste tu situación crediticia como ${situacion}; mejorar tu historial te acerca al crédito hipotecario.`,
      prioridad: 3,
    });
    candidatos.push({
      recurso_id: "compra_cartera",
      factor_disparador: "situacion_crediticia",
      // Prosa para el lead: sin el valor crudo del factor ni paréntesis
      // anidados. Autocalificante ("si hoy pagas…"): el lead la descarta solo
      // si no tiene deudas. La trazabilidad la sostiene la tabla de factores de
      // la ficha + el `factor_disparador` que el bloque muestra.
      porque:
        "Si hoy pagas cuotas de otros créditos, consolidarlas en uno solo puede bajar tu carga mensual y ayudar a tu historial.",
      prioridad: 4,
    });
  }

  // Prioridad ascendente; a igual prioridad, el orden de inserción (estable).
  // Dedup por recurso_id (nadie ve el mismo recurso dos veces) y tope en 2.
  const vistos = new Set<RecursoId>();
  return candidatos
    .sort((a, b) => a.prioridad - b.prioridad)
    .filter((c) => (vistos.has(c.recurso_id) ? false : (vistos.add(c.recurso_id), true)))
    .slice(0, MAX_RECURSOS)
    .map((c) => {
      const base = CATALOGO_RECURSOS[c.recurso_id];
      return {
        recurso_id: base.id,
        nombre: base.nombre,
        url: base.url,
        tipo: base.tipo,
        factor_disparador: c.factor_disparador,
        porque: c.porque,
      };
    });
}
