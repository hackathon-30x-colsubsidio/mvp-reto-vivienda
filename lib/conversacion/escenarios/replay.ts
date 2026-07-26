import type { Lead, PerfilConocido } from "@/lib/types";
import {
  completarDesdePerfil,
  construirPreguntas,
  type CampoPregunta,
  type PasoPregunta,
} from "../preguntas";
import { detectarDesvio, respuestaDeterministaDuda } from "../desvio";

// =====================================================================
// EL ARNÉS DE ESCENARIOS — la red del refactor (rama 1 del plan de
// arquitectura, docs/agents/plan-arquitectura-conversador.md).
//
// POR QUÉ EXISTE: la lógica de la conversación vive dentro de un
// componente React de 890 líneas, así que hoy la única forma de probar
// "qué pasa si alguien teclea esto" es montar el chat entero. La rama 5
// va a sacar esa lógica a un reducer, y sin una red que diga qué hace
// HOY, ese refactor va a ciegas.
//
// QUÉ HACE: replaya una lista de textos tecleados por el MISMO camino
// que toma `ChatWhatsApp.enviarTexto`, y devuelve el rastro turno por
// turno más el `Lead["respuestas"]` final.
//
// ⚠️ ESTO CONGELA EL COMPORTAMIENTO ACTUAL, NO EL DESEADO. Varios de
// los casos que prueba están mal a propósito (el dato que se pierde en
// silencio es el hueco 2 del plan). Un test que afirmara lo que
// queremos no serviría de red: solo diría que el refactor no arregló un
// bug que ya existía. Los casos malos van marcados `⚠️ BUG CONGELADO`.
//
// ⚠️ ESTE ARCHIVO ES UNA SEGUNDA IMPLEMENTACIÓN, y eso es deliberado
// pero temporal. Mientras la decisión de avanzar o no viva dentro del
// componente, la red tiene que reproducirla aquí. Cuando la rama 5
// exista, `replayEscenario` debe pasar a llamar al reducer real y este
// bloque de lógica se borra — si no, quedan dos fuentes que pueden
// divergir, que es justo el hueco 3 del plan.
//
// ⚠️ ALCANCE: solo la fase `pregunta`. El consentimiento, el cierre, la
// agenda de la cita y el re-enganche NO se modelan aquí — los cubren
// `ChatWhatsApp.test.tsx` (criterios 3 y 4), que siguen siendo la única
// red de esas transiciones. Quien haga la rama 5 no debe leer un verde
// de este archivo como "la conversación entera está cubierta".
// =====================================================================

/** Lo que pasó en un turno, con el detalle que permite afirmar sobre él. */
export type Turno =
  | { tipo: "ignorado"; tecleado: string }
  | { tipo: "desvio_asesor"; tecleado: string }
  | {
      tipo: "desvio_duda";
      tecleado: string;
      clase: "precio" | "ubicacion" | "subsidio" | "general";
      proyecto?: string;
      /** La respuesta SIN LLM, que es el fallback y ya es correcta sola. */
      respuesta: string;
    }
  | {
      tipo: "repregunta";
      tecleado: string;
      campo: CampoPregunta;
      acuse?: string;
    }
  | {
      tipo: "respondio";
      tecleado: string;
      campo: CampoPregunta;
      patch: Partial<Lead["respuestas"]>;
      acuse?: string;
      pulir: boolean;
    };

export interface Escenario {
  perfil: PerfilConocido;
  /** Lo que la persona teclea, en orden. */
  tecleado: string[];
}

export interface ResultadoEscenario {
  turnos: Turno[];
  /** El paso en el que quedó la conversación. `null` si se completó. */
  pasoPendiente: CampoPregunta | null;
  /** Las respuestas finales, ya pasadas por `completarDesdePerfil`. */
  respuestas: Lead["respuestas"];
  /** Los campos que quedaron sin llenar. Es la medida del hueco 2. */
  camposVacios: CampoPregunta[];
  pasos: PasoPregunta[];
}

const CONSENTIMIENTO_TS = "2026-07-26T09:00:00.000Z";

/**
 * Replaya un escenario contra el conversador real.
 *
 * El orden de las decisiones es el de `ChatWhatsApp.enviarTexto:548`:
 *   1. texto vacío → se ignora, no pasa nada
 *   2. `detectarDesvio` → se atiende y el paso NO avanza
 *   3. `interpretarTexto` → se aplica el patch y el paso avanza
 *
 * Y dentro de (3), el de `responderPregunta:359`: el patch se aplica
 * SIEMPRE, incluso cuando se va a repreguntar — por eso un ingreso
 * ilegible igual deja su texto crudo en `rango_ingreso_hogar`.
 */
export function replayEscenario({ perfil, tecleado }: Escenario): ResultadoEscenario {
  const pasos = construirPreguntas(perfil);
  const turnos: Turno[] = [];

  let indicePaso = 0;
  /** En qué paso ya se repreguntó. Se concede una vez (`repreguntadoEn`). */
  let repreguntadoEn: number | null = null;
  let respuestas: Lead["respuestas"] = {
    consentimiento: { otorgado: true, timestamp: CONSENTIMIENTO_TS },
  };

  for (const crudo of tecleado) {
    const texto = crudo.trim();

    // `enviarTexto:550` — sin texto no pasa nada.
    if (!texto) {
      turnos.push({ tipo: "ignorado", tecleado: crudo });
      continue;
    }

    // La conversación ya terminó: no hay paso al que responder.
    if (indicePaso >= pasos.length) {
      turnos.push({ tipo: "ignorado", tecleado: crudo });
      continue;
    }

    const paso = pasos[indicePaso];

    // `enviarTexto:557` — el desvío gana, y el paso NO avanza.
    const desvio = detectarDesvio(texto);
    if (desvio) {
      if (desvio.tipo === "asesor") {
        turnos.push({ tipo: "desvio_asesor", tecleado: texto });
      } else {
        turnos.push({
          tipo: "desvio_duda",
          tecleado: texto,
          clase: desvio.clase,
          ...(desvio.proyecto ? { proyecto: desvio.proyecto.nombre } : {}),
          respuesta: respuestaDeterministaDuda(desvio),
        });
      }
      continue;
    }

    const respuesta = paso.interpretarTexto(texto);

    // `responderPregunta:361` — el patch se aplica antes de decidir si se
    // repregunta. Un dato a medias igual queda guardado.
    respuestas = { ...respuestas, ...respuesta.patch };

    // `responderPregunta:371` — se repregunta una sola vez por paso.
    if (respuesta.repreguntar && repreguntadoEn !== indicePaso) {
      repreguntadoEn = indicePaso;
      turnos.push({
        tipo: "repregunta",
        tecleado: texto,
        campo: paso.campo,
        ...(respuesta.acuse ? { acuse: respuesta.acuse } : {}),
      });
      continue;
    }

    // `responderPregunta:383` — a la segunda se sigue, con el acuse de
    // insistencia si lo hay.
    const acuse = respuesta.repreguntar
      ? (respuesta.acuseSiInsiste ?? respuesta.acuse)
      : respuesta.acuse;

    turnos.push({
      tipo: "respondio",
      tecleado: texto,
      campo: paso.campo,
      patch: respuesta.patch,
      ...(acuse ? { acuse } : {}),
      pulir: respuesta.pulir === true,
    });

    indicePaso += 1;
  }

  // `terminar:406` — el motor recibe el ingreso y la edad completados
  // desde el perfil cuando la conversación no los preguntó.
  //
  // Solo si la conversación LLEGÓ al final: `terminar()` se llama desde
  // `responderPregunta` cuando se consume el último paso, así que una
  // conversación abandonada a mitad nunca pasa por aquí. Sin esta
  // condición el arnés rellenaba datos que en el chat real no existen,
  // y un escenario de abandono habría mentido sobre qué se alcanzó a
  // saber del lead.
  const completo = indicePaso >= pasos.length;
  const finales = completo ? completarDesdePerfil(perfil, respuestas) : respuestas;

  return {
    turnos,
    pasoPendiente: completo ? null : pasos[indicePaso].campo,
    respuestas: finales,
    camposVacios: pasos
      .map((p) => p.campo)
      .filter((campo) => finales[campo] === undefined),
    pasos,
  };
}

/** Azúcar para los tests: qué dejó en el lead un solo texto sobre un campo. */
export function interpretarUno(
  perfil: PerfilConocido,
  campo: CampoPregunta,
  texto: string,
) {
  const paso = construirPreguntas(perfil).find((p) => p.campo === campo);
  if (!paso) throw new Error(`el conversador no pregunta ${campo} a este perfil`);
  return paso.interpretarTexto(texto);
}
