import type { Lead } from "@/lib/types";
import * as eventos from "./leads-evento";
import * as perfiles from "./perfiles-conocidos";
import { replayGuion, type ConversacionDemo, type GuionDemo } from "./guion-demo";

// Los 3 personajes con su conversación terminada.
//
// ⚠️ NO se escriben las respuestas: se escribe lo que la persona TECLEA, y el
// guion se replaya contra el conversador real (ver guion-demo.ts). Así el
// personaje sembrado y el mismo personaje conversado en vivo por el jurado
// producen el mismo `Lead` — y por lo tanto el mismo puntaje en la ficha.
//
// Si cambias el set de preguntas en `lib/conversacion/preguntas.ts`, el replay
// falla en voz alta diciendo qué pregunta quedó sin respuesta. Es a propósito.

const GUION: Record<string, GuionDemo> = {
  // Diana: afiliada y conocida. NO se le pregunta ni ingreso (sale del rango del
  // enriquecimiento) ni ciudad → el criterio de aceptación 1, en vivo.
  afiliadoListo: {
    evento: eventos.afiliadoListo,
    perfil: perfiles.afiliadoListo,
    consentimientoTs: "2026-07-23T14:32:10-05:00",
    // Sin edad: su perfil ya la trae, así que el conversador no la pregunta.
    respuestasTecleadas: [
      "Sería la primera",
      "Con mi pareja",
      "Mi Casa Ya",
      "Estoy al día con todo",
    ],
  },

  // Carlos: está en la base pero no es afiliado, así que de él solo se sabe la
  // ciudad. A él SÍ se le pregunta cuánto entra al mes; la zona no.
  noAfiliadoListo: {
    evento: eventos.noAfiliadoListo,
    perfil: perfiles.noAfiliadoListo,
    consentimientoTs: "2026-07-23T15:05:41-05:00",
    // ⚠️ Su ingreso subió de $2.850.000 a $4.000.000 el 2026-07-25, y no es
    // maquillaje: al reemplazar el 0,6% plano por la cuota real, PAYANDÉ (que
    // es VIS y por eso financia el 80%) le da una cuota de $1.573.834, y con
    // $2.850.000 se iba al 45% — fuera del tope legal. Con $4.000.000 queda en
    // **39,3%: apenas pasa**, que es exactamente su historia y lo que explica
    // que su puntaje de prioridad sea bajo.
    respuestasTecleadas: [
      "No, sería la primera",
      "Con mi esposa y nuestros dos hijos",
      "4.000.000 entre mi esposa y yo",
      "Ninguno todavía",
      "38",
      "Al día, nunca me he atrasado",
    ],
  },

  // Yuliana: sin match. Se le pregunta todo, incluida la zona.
  nutricion: {
    evento: eventos.nutricion,
    perfil: perfiles.nutricion,
    consentimientoTs: "2026-07-23T16:20:03-05:00",
    respuestasTecleadas: [
      "No, vivo en arriendo",
      "Yo sola con mi hija",
      "Entre 1 y 2 salarios mínimos",
      "Ninguno",
      "Tengo 24 años",
      "Tuve una mora hace poco",
      "Bogotá, por el sur",
    ],
  },
};

/** La conversación completa de cada personaje: el lead y el hilo que se persiste. */
export const conversaciones: Record<string, ConversacionDemo> = {
  afiliadoListo: replayGuion(GUION.afiliadoListo),
  noAfiliadoListo: replayGuion(GUION.noAfiliadoListo),
  nutricion: replayGuion(GUION.nutricion),
};

export const afiliadoListo: Lead = conversaciones.afiliadoListo.lead;
export const noAfiliadoListo: Lead = conversaciones.noAfiliadoListo.lead;
export const nutricion: Lead = conversaciones.nutricion.lead;
