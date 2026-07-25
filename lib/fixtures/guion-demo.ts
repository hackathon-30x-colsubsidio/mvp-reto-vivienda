import {
  completarDesdePerfil,
  construirPreguntas,
  mensajeAutorizacion,
  mensajeCierre,
  mensajeConsentimiento,
  mensajeIngesta,
  mensajeSaludo,
  mensajeYaSabemos,
  RESPUESTA_CONSENTIMIENTO,
} from "@/lib/conversacion/preguntas";
import type { Lead, LeadEvento, MensajeConversacion, PerfilConocido } from "@/lib/types";

// =====================================================================
// El guion de los 3 personajes del demo — costura S6 del plan (ticket 001).
//
// POR QUÉ EXISTE: las respuestas de los personajes canónicos se escribían a
// mano en `leads.ts` y el hilo de su conversación a mano en `db/seed.sql`. Las
// dos cosas se desincronizaron **dos veces** (le faltó el ingreso al seed, y
// después el puntaje), y la ficha sembrada terminó mostrando números que el
// motor nunca calculó — que es exactamente la contradicción que la costura S6
// advierte: "si los números no coinciden entre tracks, el demo se contradice a
// sí mismo en pantalla".
//
// CÓMO SE ARREGLA DE RAÍZ: aquí no se escriben respuestas, se escribe lo que la
// persona TECLEA. El guion se replaya contra el MISMO código que corre en el
// chat (`construirPreguntas` + `interpretarTexto` + `completarDesdePerfil`), así que
// el personaje sembrado y ese mismo personaje conversado en vivo producen el
// mismo `Lead`, y de ahí el mismo `Score`. No hay dos fuentes que puedan
// divergir: hay una.
//
// Como efecto secundario, el hilo sembrado en la tabla `conversaciones` es la
// conversación literal —con sus acuses y su redacción de hoy—, no una
// transcripción escrita a mano que envejece cada vez que alguien mejora el tono.
// =====================================================================

/** Lo que el personaje teclea, en el orden en que el conversador le pregunta. */
export interface GuionDemo {
  evento: LeadEvento;
  perfil: PerfilConocido;
  /** Momento del consentimiento (habeas data). Fijo: el demo se graba en video. */
  consentimientoTs: string;
  /**
   * Una respuesta por paso que `construirPreguntas(perfil)` genere para ESTE
   * perfil. Si sobran o faltan, `replayGuion` lo grita: es la señal de que el
   * set de preguntas cambió y el personaje quedó a medias.
   */
  respuestasTecleadas: string[];
}

export interface ConversacionDemo {
  lead: Lead;
  hilo: MensajeConversacion[];
}

/**
 * Replaya el guion contra el conversador real y devuelve el `Lead` terminado
 * más el hilo tal como quedaría en la tabla `conversaciones`.
 */
export function replayGuion(guion: GuionDemo): ConversacionDemo {
  const { evento, perfil, consentimientoTs, respuestasTecleadas } = guion;
  const pasos = construirPreguntas(perfil);

  if (pasos.length !== respuestasTecleadas.length) {
    throw new Error(
      `Guion desalineado para ${evento.lead_id}: el conversador hace ${pasos.length} ` +
        `pregunta(s) a este perfil y el guion trae ${respuestasTecleadas.length} respuesta(s). ` +
        `Preguntas de hoy: ${pasos.map((p) => p.campo).join(", ")}.`,
    );
  }

  const hilo: MensajeConversacion[] = [
    { rol: "sistema", mensaje: mensajeIngesta(evento, perfil) },
    { rol: "asistente", mensaje: mensajeSaludo(evento.nombre, evento.proyecto_interes) },
    { rol: "asistente", mensaje: mensajeAutorizacion() },
    { rol: "lead", mensaje: RESPUESTA_CONSENTIMIENTO },
    { rol: "sistema", mensaje: mensajeConsentimiento(true, consentimientoTs) },
    { rol: "asistente", mensaje: mensajeYaSabemos(perfil, evento.nombre) },
  ];

  let respuestas: Lead["respuestas"] = {
    consentimiento: { otorgado: true, timestamp: consentimientoTs },
  };

  pasos.forEach((paso, i) => {
    const tecleado = respuestasTecleadas[i];
    // El mismo camino que toma una respuesta escrita en el chat: los chips son
    // atajos, el texto libre es el contrato (spec 02 D4).
    const respuesta = paso.interpretarTexto(tecleado);

    // Si el conversador le repreguntaría esto a una persona real, el personaje
    // del demo quedaría con el dato a medias y nadie se enteraría hasta ver la
    // ficha. Que grite aquí, como cuando el guion se desalinea.
    if (respuesta.repreguntar) {
      throw new Error(
        `Guion inválido para ${evento.lead_id}: el conversador NO entiende ` +
          `"${tecleado}" como respuesta a "${paso.campo}" y le repreguntaría. ` +
          `Corrige el guion en lib/fixtures/leads.ts.`,
      );
    }

    hilo.push({ rol: "asistente", mensaje: paso.pregunta });
    hilo.push({ rol: "lead", mensaje: tecleado });
    if (respuesta.acuse) hilo.push({ rol: "asistente", mensaje: respuesta.acuse });

    respuestas = { ...respuestas, ...respuesta.patch };
  });

  hilo.push({ rol: "asistente", mensaje: mensajeCierre(evento.nombre) });

  return {
    lead: { evento, perfil, respuestas: completarDesdePerfil(perfil, respuestas) },
    hilo,
  };
}
