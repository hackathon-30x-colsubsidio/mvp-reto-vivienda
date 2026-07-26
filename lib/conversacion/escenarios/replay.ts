import type { Lead, PerfilConocido } from "@/lib/types";
import {
  completarDesdePerfil,
  construirPreguntas,
  respuestaDeAccion,
  type CampoPregunta,
  type PasoPregunta,
} from "../preguntas";
import { notaSistemaHandoff, respuestaDeterministaDuda } from "../desvio";
import {
  decidirTurno,
  MAX_DESVIOS_SEGUIDOS,
  notaSistemaMuchasPreguntas,
  notaSistemaSinInterpretar,
  TEXTO_NO_ENTENDI,
} from "../maquina";

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
// ✅ YA NO ES UNA SEGUNDA IMPLEMENTACIÓN (2026-07-26, después del merge
// de la rama 5). La clasificación del turno la hace `decidirTurno` de
// `maquina.ts` — el MISMO reducer que corre `ChatWhatsApp.manejarTurno`.
// Lo que queda aquí es la contabilidad de estado que en el chat vive en
// React (`indicePaso`, `repreguntadoEn`, `sinAvanzar`) y los efectos en
// su versión sin pantalla; el archivo dejó de poder divergir en la parte
// que importa, que es la decisión.
//
// Hasta este cambio, el arnés reimplementaba esa decisión y por eso la
// red medía un camino que la rama 5 ya había reemplazado: no sabía de
// `identidad`, ni de `corregir_dato`, ni de `fuera_de_tema`, ni del tope
// de desvíos, y trataba un `no_entendido` como una respuesta válida que
// avanzaba el paso. O sea que un verde de este archivo NO significaba lo
// que decía. Era el hueco 3 del plan, mudado a los tests.
//
// ⚠️ LO QUE SIGUE SIN MODELARSE, y hay que saberlo antes de leer un
// verde de aquí como cobertura: la capa de IA (el rescate de
// `/api/interpretar`, que es un efecto asíncrono) y el banco de
// preguntas. El arnés corre el camino SIN IA, que es el fallback y el
// más probable en una demo.
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
  /** Preguntó si habla con una máquina. Sara se declara IA y el paso no avanza. */
  | { tipo: "identidad"; tecleado: string }
  /** No era un intento de responder (una risa, un emoji, una cuenta). */
  | { tipo: "fuera_de_tema"; tecleado: string }
  /** Cambió algo que ya había dicho: se sobrescribe y se retoma el paso. */
  | { tipo: "correccion"; tecleado: string; patch: Partial<Lead["respuestas"]>; acuse?: string }
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
  /**
   * Las filas `sistema` que la conversación dejó en el hilo — el rastro que el
   * asesor lee en su ficha. Es lo que hace verificable que un dato perdido
   * **deje de perderse en silencio** (hueco 2 del plan).
   */
  notasSistema: string[];
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
 * Quién decide qué pasó: `decidirTurno` de `maquina.ts`, el mismo que llama
 * `ChatWhatsApp.manejarTurno`. Lo que este arnés pone de su lado son las tres
 * piezas de estado que en el chat viven en React, y sus efectos sin pantalla:
 *
 *   `indicePaso`     — en qué pregunta va (`manejarTurno` la lee de `pasos`)
 *   `repreguntadoEn` — en qué paso ya se concedió la repregunta
 *   `sinAvanzar`     — turnos seguidos sin avanzar, para el tope de desvíos
 *
 * Ninguna rama que no sea respuesta avanza el paso: es lo que hace que salirse
 * del guion no le cueste el dato que estaba dando (`atenderSinAvanzar:880`).
 *
 * ⚠️ El camino SIN IA. `manejarNoEntendido:909` le da primero un intento a
 * `/api/interpretar`, que es asíncrono y aquí no existe; el arnés corre el
 * fallback, o sea lo que pasa cuando el modelo no rescata el dato.
 */
export function replayEscenario({ perfil, tecleado }: Escenario): ResultadoEscenario {
  const pasos = construirPreguntas(perfil);
  const turnos: Turno[] = [];
  const notasSistema: string[] = [];

  let indicePaso = 0;
  /** En qué paso ya se repreguntó. Se concede una vez (`repreguntadoEn`). */
  let repreguntadoEn: number | null = null;
  /** Turnos seguidos sin avanzar. Al tercero se ofrece un asesor (§3). */
  let sinAvanzar = 0;
  let respuestas: Lead["respuestas"] = {
    consentimiento: { otorgado: true, timestamp: CONSENTIMIENTO_TS },
  };

  /** `atenderSinAvanzar:880`: se atiende, se cuenta, y se vuelve a preguntar. */
  const atenderSinAvanzar = (turno: Turno, patch?: Partial<Lead["respuestas"]>) => {
    if (patch) respuestas = { ...respuestas, ...patch };
    turnos.push(turno);
    sinAvanzar += 1;
    if (sinAvanzar === MAX_DESVIOS_SEGUIDOS) {
      notasSistema.push(notaSistemaMuchasPreguntas(sinAvanzar));
    }
  };

  /** `responderPregunta:454`: aplica el dato y decide si avanza o repregunta. */
  const responderPaso = (texto: string, campo: CampoPregunta, respuesta: ReturnType<typeof respuestaDeAccion>) => {
    // Contestó: el contador de desvíos vuelve a cero.
    sinAvanzar = 0;
    // El patch se aplica ANTES de decidir si se repregunta: un dato a medias
    // igual queda guardado (por eso un ingreso ilegible deja su texto crudo).
    respuestas = { ...respuestas, ...respuesta.patch };

    if (respuesta.repreguntar && repreguntadoEn !== indicePaso) {
      repreguntadoEn = indicePaso;
      turnos.push({
        tipo: "repregunta",
        tecleado: texto,
        campo,
        ...(respuesta.acuse ? { acuse: respuesta.acuse } : {}),
      });
      return;
    }

    // A la segunda se sigue, con el acuse de insistencia si lo hay.
    const acuse = respuesta.repreguntar
      ? (respuesta.acuseSiInsiste ?? respuesta.acuse)
      : respuesta.acuse;

    turnos.push({
      tipo: "respondio",
      tecleado: texto,
      campo,
      patch: respuesta.patch,
      ...(acuse ? { acuse } : {}),
      pulir: respuesta.pulir === true,
    });

    indicePaso += 1;
  };

  for (const crudo of tecleado) {
    const texto = crudo.trim();

    // `enviarTexto:775` — sin texto no pasa nada.
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
    const accion = decidirTurno(texto, {
      campo: paso.campo,
      yaRespondidos: pasos.slice(0, indicePaso).map((p) => p.campo),
    });

    switch (accion.tipo) {
      case "identidad":
        atenderSinAvanzar({ tipo: "identidad", tecleado: texto });
        break;

      case "handoff_asesor":
        notasSistema.push(notaSistemaHandoff());
        atenderSinAvanzar({ tipo: "desvio_asesor", tecleado: texto });
        break;

      case "responder_duda":
        atenderSinAvanzar({
          tipo: "desvio_duda",
          tecleado: texto,
          clase: accion.clase,
          ...(accion.proyecto ? { proyecto: accion.proyecto.nombre } : {}),
          respuesta: respuestaDeterministaDuda({
            tipo: "duda",
            clase: accion.clase,
            ...(accion.proyecto ? { proyecto: accion.proyecto } : {}),
          }),
        });
        break;

      case "fuera_de_tema":
        atenderSinAvanzar({ tipo: "fuera_de_tema", tecleado: texto });
        break;

      case "corregir_dato":
        atenderSinAvanzar(
          {
            tipo: "correccion",
            tecleado: texto,
            patch: accion.patch,
            ...(accion.acuse ? { acuse: accion.acuse } : {}),
          },
          accion.patch,
        );
        break;

      // `manejarNoEntendido:909`, sin el rescate de la IA: se repregunta una
      // vez y a la segunda se sigue, pero dejando dicho en el hilo qué no se
      // entendió. Ese rastro es el hueco 2 dejando de ser silencioso.
      case "no_entendido": {
        const mudo = respuestaDeAccion(accion);
        if (repreguntadoEn === indicePaso) {
          notasSistema.push(notaSistemaSinInterpretar(accion.campo, texto));
        }
        responderPaso(texto, accion.campo, {
          ...mudo,
          repreguntar: true,
          acuse: TEXTO_NO_ENTENDI,
          ...(mudo.acuse ? { acuseSiInsiste: mudo.acuse } : {}),
        });
        break;
      }

      // `responder_paso` y `confirmar_dato`: el camino de siempre.
      case "responder_paso":
      case "confirmar_dato":
        responderPaso(texto, paso.campo, respuestaDeAccion(accion));
        break;

      // `responder_libre` solo lo emite `decidirTurnoLibre`, que es el turno de
      // una pregunta del BANCO, y este arnés solo construye las 7 base. Si
      // aparece, alguien amplió el alcance y hay que modelarlo, no ignorarlo.
      default:
        throw new Error(
          `el arnés de escenarios no modela la acción "${accion.tipo}" (¿entró el banco?)`,
        );
    }
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
    notasSistema,
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
