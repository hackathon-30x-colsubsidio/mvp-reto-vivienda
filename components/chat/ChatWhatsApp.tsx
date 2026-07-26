"use client";

import { useEffect, useRef, useState } from "react";
import type {
  Lead,
  LeadEvento,
  MensajeConversacion,
  PerfilConocido,
  ResultadoCurado,
} from "@/lib/types";
import {
  NOMBRE_AGENTE,
  completarDesdePerfil,
  construirPreguntas,
  mensajeAfiliacion,
  mensajeAutorizacion,
  mensajeCierre,
  mensajeConsentimiento,
  mensajeIngesta,
  mensajeSaludo,
  mensajeReenganche,
  mensajeSinAutorizacion,
  mensajeYaSabemos,
  preguntasDeReenganche,
  RESPUESTA_CONSENTIMIENTO,
  type PasoPregunta,
  type Respuesta,
} from "@/lib/conversacion/preguntas";
import {
  mensajeFueraDeTema,
  mensajeHandoffAsesor,
  notaSistemaHandoff,
  repreguntar,
  respuestaDeterministaDuda,
} from "@/lib/conversacion/desvio";
import { accionDeValor, respuestaDeAccion } from "@/lib/conversacion/preguntas";
import type { CampoPregunta } from "@/lib/conversacion/acciones";
import {
  cifrasDe,
  decidirTurno,
  mensajeMuchasPreguntas,
  notaSistemaMuchasPreguntas,
  notaSistemaSinInterpretar,
  MAX_DESVIOS_SEGUIDOS,
  TEXTO_ES_IA,
  TEXTO_NO_ENTENDI,
} from "@/lib/conversacion/maquina";
import {
  CAMPOS_IA,
  LIMITE_INTERPRETE_MS,
  validarInterpretacion,
} from "@/lib/conversacion/interprete-ia";
import type { CampoInterpretable } from "@/lib/conversacion/interpretacion";
import {
  notaSistemaGuard,
  postGuard,
  type ContextoGuard,
} from "@/lib/conversacion/guardas";
import {
  mensajeMaterialDelProyecto,
  mensajeRecomendacionDeterminista,
  proyectosParaVerbalizar,
  type ProyectoVerbalizable,
} from "@/lib/conversacion/recomendacion";
import { mensajeDeRecursos } from "@/lib/recursos/mensajes";
import { fechaLarga } from "@/lib/formato";
import { useDictado } from "./useDictado";
import { MensajeBurbuja, type Mensaje } from "./MensajeBurbuja";
import { SelloPerfil } from "./SelloPerfil";
import { BotonTema } from "@/components/ui/BotonTema";
import { IsotipoAzul, IsotipoBlanco, LockupBlanco } from "@/components/ui/Marca";

// "cerrando" es el rato en que el motor califica y se decide si hay cita que
// ofrecer: no se pinta el sello todavía, porque la conversación no acabó.
type Fase =
  | "consentimiento"
  | "pregunta"
  | "cerrando"
  | "agenda"
  | "terminado"
  | "rechazado";

/** Una franja de sala de ventas, tal como la sirve `GET /api/citas`. */
interface Franja {
  sala_ventas: string;
  proyecto_id: string;
  proyecto: string;
  fecha: string;
}

function horaActual(): string {
  return new Date().toLocaleTimeString("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

let contadorMensaje = 0;
function nuevoId(): string {
  contadorMensaje += 1;
  return `m-${contadorMensaje}`;
}

const pausa = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * ¿A este campo le puede ayudar el intérprete de la rama 4?
 *
 * `zona_interes` queda por fuera y no es un olvido: su intérprete acepta
 * cualquier cosa (guarda el texto crudo), así que nunca emite `no_entendido`
 * y no hay nada que rescatar.
 */
const esCampoIA = (campo: CampoPregunta): campo is CampoInterpretable =>
  (CAMPOS_IA as readonly string[]).includes(campo);

/**
 * Lo que trae un lead que vuelve porque se le disparó el trigger de nutrición
 * (criterio de aceptación 3, ticket 007). Si viene, la conversación NO arranca
 * de cero: retoma.
 */
export interface Reenganche {
  /** Lo que ya contó la primera vez. No se le vuelve a preguntar. */
  respuestasPrevias: Lead["respuestas"];
  /** La regla que no pasó, para nombrarla en el primer mensaje. */
  reglaFallida?: string;
  /** El trigger que se disparó. Queda en el hilo como fila de sistema. */
  trigger?: string;
}

export function ChatWhatsApp({
  evento,
  perfil,
  reenganche,
  onTerminar,
  onVolver,
}: {
  evento: LeadEvento;
  perfil: PerfilConocido;
  reenganche?: Reenganche;
  /**
   * Cierra el flujo: manda el `Lead` y el hilo completo a `/api/curar`, que
   * califica y persiste. Devuelve el veredicto para que el chat pueda decir
   * la verdad si NO se guardó, en vez de fingir que sí.
   */
  onTerminar: (lead: Lead, transcripcion: MensajeConversacion[]) => Promise<ResultadoCurado>;
  onVolver: () => void;
}) {
  // Al re-enganchar solo se pregunta lo que pudo cambiar: el resto ya lo contó
  // y repreguntarlo rompería el criterio 1 en el peor momento (spec 05 D4).
  const [pasos] = useState<PasoPregunta[]>(() =>
    reenganche ? preguntasDeReenganche() : construirPreguntas(perfil),
  );
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  // El que vuelve ya autorizó sus datos la primera vez: no se le vuelve a pedir
  // (y por eso se le puede escribir — nunca contacto frío).
  const [fase, setFase] = useState<Fase>(reenganche ? "pregunta" : "consentimiento");
  const [indicePaso, setIndicePaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Lead["respuestas"]>(
    reenganche?.respuestasPrevias ?? {
      consentimiento: { otorgado: false, timestamp: "" },
    },
  );
  const [textoInput, setTextoInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  // Telón de arranque. No retrasa nada: el efecto de abajo dispara el primer
  // agregarBot() de inmediato, así que este medio segundo largo se lo come la
  // latencia real del primer token en vez de sumarse a ella.
  const [cargando, setCargando] = useState(true);
  /** Veredicto de `/api/curar`. Null mientras la conversación no ha cerrado. */
  const [resultado, setResultado] = useState<ResultadoCurado | null>(null);
  /** Las 3 franjas de sala de ventas que se le ofrecen al lead listo (ticket 005). */
  const [franjas, setFranjas] = useState<Franja[]>([]);
  /** Contestar hablando: el dictado solo escribe en el campo de texto. */
  const dictado = useDictado({ onTexto: setTextoInput });
  const finRef = useRef<HTMLDivElement>(null);
  const iniciado = useRef(false);
  const historialRef = useRef<{ role: "user" | "assistant"; content: string }[]>(
    [],
  );
  /**
   * El hilo tal como va a quedar en la tabla `conversaciones` (ADR 0003).
   *
   * Es distinto de `historialRef`, que es el contexto que se le manda al LLM:
   * aquí también entran las filas `sistema` (ingesta, consentimiento), que son
   * eventos y no mensajes de nadie, y que son las que dejan el hilo auditable.
   */
  const transcripcionRef = useRef<MensajeConversacion[]>([]);
  /** En qué paso ya se repreguntó. Se concede una vez: insistir es interrogar. */
  const repreguntadoEn = useRef<number | null>(null);
  /**
   * Turnos seguidos sin avanzar el perfilamiento (dudas, fuera de tema,
   * identidad). Al llegar a `MAX_DESVIOS_SEGUIDOS` se ofrece un asesor. Se
   * reinicia en cuanto la persona contesta algo, porque el tope existe para
   * el bucle, no para castigar a quien pregunta.
   */
  const sinAvanzar = useRef(0);

  function anotar(rol: MensajeConversacion["rol"], mensaje: string) {
    transcripcionRef.current = [...transcripcionRef.current, { rol, mensaje }];
  }

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, escribiendo]);

  useEffect(() => {
    const t = setTimeout(() => setCargando(false), 1650);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (iniciado.current) return;
    iniciado.current = true;
    void (async () => {
      // Vuelve porque se le disparó el trigger: se retoma, no se empieza.
      if (reenganche) {
        anotar(
          "sistema",
          `Re-enganche: el lead vuelve a la conversación tras dispararse su trigger de nutrición.${
            reenganche.trigger ? ` Motivo: ${reenganche.trigger}` : ""
          }`,
        );
        await agregarBotInstantaneo(
          mensajeReenganche(evento.nombre, reenganche.reglaFallida),
          350,
        );
        await pausa(500);
        await agregarBot(pasos[0].pregunta);
        return;
      }

      // Primera fila del hilo: de dónde vino y qué se supo antes de hablarle.
      // Es la que hace legible el resto de la conversación en la DB.
      anotar("sistema", mensajeIngesta(evento, perfil));
      // El saludo va instantáneo (sin LLM): el chat tiene que sentirse vivo en
      // el primer segundo. La autorización sí se pule, porque es el mensaje
      // donde más gente se cae (charla-mentor.md #puntos-de-fuga).
      await agregarBotInstantaneo(
        mensajeSaludo(evento.nombre, evento.proyecto_interes),
        350,
      );
      await agregarBot(mensajeAutorizacion());
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function agregarUsuario(texto: string) {
    historialRef.current = [...historialRef.current, { role: "user", content: texto }];
    anotar("lead", texto);
    setMensajes((prev) => [
      ...prev,
      { id: nuevoId(), autor: "usuario", texto, hora: horaActual() },
    ]);
  }

  function pintarBurbuja(id: string, texto: string) {
    setEscribiendo(false);
    setMensajes((prev) => {
      if (prev.some((m) => m.id === id)) {
        return prev.map((m) => (m.id === id ? { ...m, texto } : m));
      }
      return [...prev, { id, autor: "bot", texto, hora: horaActual() }];
    });
  }

  /**
   * Mensaje del agente que NO pasa por el LLM: los acuses ("¡la primera! 🎉"),
   * el saludo y el cierre. Son la mitad humana de la conversación —reaccionar a
   * lo que la persona acaba de decir antes de seguir preguntando— y por eso
   * tienen que llegar rápido: pagarles una llamada al LLM los volvería lentos
   * y el chat volvería a sentirse un formulario con pausas. La pausa corta
   * imita el tiempo real de alguien escribiendo.
   */
  async function agregarBotInstantaneo(texto: string, pausaMs = 550) {
    setEscribiendo(true);
    await pausa(pausaMs);
    pintarBurbuja(nuevoId(), texto);
    historialRef.current = [
      ...historialRef.current,
      { role: "assistant", content: texto },
    ];
    anotar("asistente", texto);
  }

  /**
   * Muestra el mensaje del bot. Intenta redactarlo con el LLM vía /api/chat
   * (streaming) para sonar natural; si no hay key, falla la red, o el stream no
   * produce texto (p. ej. LLM sin cupo), cae al texto determinístico tal cual.
   * El demo nunca depende de la IA para funcionar (ADR 0002: la lógica de qué
   * preguntar es TS puro). Garantías: el indicador "escribiendo" SIEMPRE se
   * apaga y SIEMPRE queda un mensaje visible.
   *
   * Blindaje de latencia: se aborta la petición si el LLM no entrega el primer
   * token en LIMITE_PRIMER_TOKEN_MS. En producción un lambda FRÍO de Vercel
   * tarda ~7s en el intercambio JWT→OAuth de Vertex y a veces devuelve 500;
   * sin este corte el chat se congelaba en "escribiendo…" esos 7s antes de
   * rendirse. Con el corte cae al texto determinístico en pocos segundos y el
   * demo deja de depender de que el lambda esté caliente. En cuanto llega el
   * primer chunk se cancela el timeout y el stream corre hasta el final.
   *
   * `duda` cambia el MODO de la llamada, no el mecanismo: el LLM ya no pule un
   * texto, sino que responde lo que la persona preguntó (con el catálogo y la
   * tabla de subsidios como grounding, ver `prompt-maestro.ts`). Todo el
   * blindaje de arriba se reutiliza tal cual, y el fallback sigue siendo
   * `textoBase` — que en modo duda es una respuesta correcta por sí sola.
   */
  async function agregarBot(
    textoBase: string,
    extra?:
      | { modo: "duda"; pregunta: string }
      | { modo: "recomendacion"; lead: Lead },
    guard: ContextoGuard = {},
  ) {
    setEscribiendo(true);
    const id = nuevoId();
    let acumulado = "";

    const pintar = (texto: string) => pintarBurbuja(id, texto);

    // 3s separa limpio el caso caliente (primer token medido en 1–2s) del frío
    // (500 a los ~7s). El costo de cortar de más es solo perder el pulido del
    // LLM en ese mensaje, no la corrección: el fallback es la pregunta real.
    const LIMITE_PRIMER_TOKEN_MS = 3000;
    const control = new AbortController();
    const timeout = setTimeout(() => control.abort(), LIMITE_PRIMER_TOKEN_MS);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: historialRef.current,
          mensaje_a_redactar: textoBase,
          ...(extra ?? {}),
          proyecto_interes: evento.proyecto_interes,
        }),
        signal: control.signal,
      });
      if (!resp.ok || !resp.body) throw new Error("sin streaming disponible");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) {
          clearTimeout(timeout); // ya hay texto: dejar que el stream fluya sin límite
          acumulado += chunk;
          pintar(acumulado);
        }
      }
    } catch {
      // red/stream caídos o timeout del primer token: fallback de abajo
    } finally {
      clearTimeout(timeout);
    }

    // ── Lo último que pasa antes de que el lead lea (rama 3, cableada aquí) ──
    //
    // Hasta hoy el stream de Gemini iba CRUDO a la burbuja: las prohibiciones
    // del agente ("nunca le recites sus datos", "nunca prometas precios",
    // "nunca recomiendes") vivían solo como frases dentro de los prompts y
    // ningún código las hacía cumplir. El corte de 3s de arriba es de
    // latencia, no de contenido.
    //
    // `postGuard` cubre también el caso vacío: con el stream sin texto
    // devuelve `textoBase`, que es la misma garantía final de antes.
    //
    // El texto ya se pintó mientras streameaba, así que si el guard bloquea
    // la burbuja se reemplaza. Se acepta a propósito: el streaming no es
    // negociable (ADR 0002) y bloquear es el camino raro. Mejor un cambio de
    // texto en pantalla que dejar una violación puesta.
    const resultado = postGuard(acumulado, textoBase, { nombre: evento.nombre, ...guard });
    const textoFinal = resultado.textoFinal;
    pintar(textoFinal);

    // El rastro auditable: fila `sistema` cuando el guard bloqueó o cambió el
    // sentido; el aseo de formato puro devuelve `null` y no ensucia el hilo.
    const nota = notaSistemaGuard(resultado);
    if (nota) anotar("sistema", nota);

    historialRef.current = [
      ...historialRef.current,
      { role: "assistant", content: textoFinal },
    ];
    anotar("asistente", textoFinal);
  }

  async function responderConsentimiento(acepta: boolean) {
    agregarUsuario(acepta ? RESPUESTA_CONSENTIMIENTO : "Ahora no");
    const timestamp = new Date().toISOString();
    const nuevasRespuestas: Lead["respuestas"] = {
      ...respuestas,
      consentimiento: { otorgado: acepta, timestamp },
    };
    setRespuestas(nuevasRespuestas);

    // Evidencia auditable de habeas data (Ley 1581 de 2012), en el hilo y con
    // hora. Va como fila `sistema` porque no es un mensaje de nadie.
    anotar("sistema", mensajeConsentimiento(acepta, timestamp));

    if (!acepta) {
      setFase("rechazado");
      await agregarBot(mensajeSinAutorizacion(evento.nombre));
      return;
    }

    await agregarBot(mensajeYaSabemos(perfil, evento.nombre));

    if (pasos.length === 0) {
      await terminar(nuevasRespuestas);
      return;
    }

    setFase("pregunta");
    setIndicePaso(0);
    await pausa(650);
    await agregarBot(pasos[0].pregunta);
  }

  /**
   * Una respuesta —venga de un chip o de texto libre— deja dos cosas: el patch
   * con el dato, y el acuse con el que el agente reacciona antes de seguir.
   * Los dos caminos entran por aquí a propósito: escribir "ya tengo casa" tiene
   * que valer exactamente lo mismo que tocar el chip (híbrido, spec 02 D4).
   */
  async function responderPregunta(etiquetaUsuario: string, respuesta: Respuesta) {
    agregarUsuario(etiquetaUsuario);
    // Contestó: el contador de turnos sin avanzar vuelve a cero. El tope de
    // desvíos existe para el bucle, no para castigar a quien pregunta mucho.
    sinAvanzar.current = 0;
    const nuevasRespuestas: Lead["respuestas"] = {
      ...respuestas,
      ...respuesta.patch,
    };
    setRespuestas(nuevasRespuestas);

    // La respuesta no dejó un dato usable (hoy: un ingreso ilegible, que es el
    // insumo del gate del 40%). Se vuelve a preguntar SIN avanzar, igual que en
    // un desvío. Solo una vez por paso: a la segunda se sigue con lo que haya,
    // porque insistir deja de ser cuidado y se vuelve interrogatorio.
    if (respuesta.repreguntar && repreguntadoEn.current !== indicePaso) {
      repreguntadoEn.current = indicePaso;
      if (respuesta.acuse) await agregarBotInstantaneo(respuesta.acuse);
      await pausa(400);
      await agregarBot(repreguntar(pasos[indicePaso]));
      return;
    }

    // Casi todos los acuses son instantáneos a propósito: humanizan sin costar
    // latencia. Los marcados `pulir` (hoy, la zona) pasan por el LLM porque la
    // respuesta es impredecible y un acuse de plantilla se nota de lejos —
    // `agregarBot` trae su propio blindaje de 3s y cae a este mismo texto.
    const acuse = respuesta.repreguntar
      ? (respuesta.acuseSiInsiste ?? respuesta.acuse)
      : respuesta.acuse;
    if (acuse) {
      if (respuesta.pulir) await agregarBot(acuse);
      else await agregarBotInstantaneo(acuse);
    }

    const siguienteIndice = indicePaso + 1;
    if (siguienteIndice < pasos.length) {
      setIndicePaso(siguienteIndice);
      await agregarBot(pasos[siguienteIndice].pregunta);
    } else {
      await terminar(nuevasRespuestas);
    }
  }

  async function terminar(respuestasFinales: Lead["respuestas"]) {
    setFase("cerrando");

    // El motor necesita el ingreso como número para el tope del 40%. Si el
    // enriquecimiento trajo el rango, no se le vuelve a preguntar a la persona
    // (criterio 1) — se toma el punto medio del rango que ya se conocía.
    const lead: Lead = {
      evento,
      perfil,
      respuestas: completarDesdePerfil(perfil, respuestasFinales),
    };

    await agregarBotInstantaneo(mensajeCierre(evento.nombre), 700);

    // Aquí se cierra la cadena: el Lead va a /api/curar, que lo califica con el
    // motor y lo persiste con su hilo. Antes esto terminaba en un console.log y
    // nada de lo que contó la persona llegaba ni al motor ni a la DB.
    const veredicto = await onTerminar(lead, transcripcionRef.current);
    setResultado(veredicto);

    // Si no se guardó, se dice. Un demo que finge haber guardado es peor que
    // uno que falla a la vista: el jurado se entera igual al abrir /asesor.
    if (!veredicto.guardado) {
      await agregarBotInstantaneo(
        `⚠️ Nota del demo: tu perfil se calificó, pero no se pudo guardar en la base (${veredicto.error ?? "razón desconocida"}), así que no va a aparecer en la bandeja del asesor.`,
        400,
      );
      setFase("terminado");
      return;
    }

    if (veredicto.advertencia) {
      await agregarBotInstantaneo(`⚠️ Nota del demo: ${veredicto.advertencia}`, 400);
    }

    // El lead OYE los proyectos que el motor le eligió. Hasta esta rama,
    // `curar()` los calculaba con su porqué y solo los veía el asesor: al lead
    // le llegaban como un número (`ResultadoCurado.proyectos`). La
    // conversación terminaba en entrevista y promesa, sin devolverle nada.
    await agregarRecomendacion(lead);

    // Criterio de aceptación 4: el lead listo sale con una CITA, no solo con
    // proyectos. Sin esto la conversación terminaba en "te escribe un asesor",
    // que es justo el silencio que el reto quiere quitar.
    if (veredicto.proyecto_cita) {
      await ofrecerFranjas(veredicto);
      return;
    }

    await cerrar(veredicto);
    setFase("terminado");
  }

  /**
   * Los proyectos que el motor eligió, dichos en voz alta.
   *
   * El motor corre PRIMERO y el modelo solo redacta lo que ya eligió: la lista
   * cerrada viaja al prompt y el guard bloquea cualquier nombre fuera de ella.
   * Sara pone la voz; la decisión sigue siendo del matcher, con sus reglas
   * visibles (cero caja negra).
   *
   * Si el lead cayó en nutrición, o si nada del catálogo le cabe, no se dice
   * nada: no hay recomendación que dar y decir algo igual sería inventarla.
   */
  async function agregarRecomendacion(lead: Lead) {
    let proyectos: ProyectoVerbalizable[];
    try {
      proyectos = proyectosParaVerbalizar(lead);
    } catch {
      return; // el motor no pudo calificar: no hay nada que recomendar
    }

    const base = mensajeRecomendacionDeterminista(proyectos);
    if (!base) return;

    await agregarBot(base, { modo: "recomendacion", lead }, {
      // Lo único que Sara puede nombrar aquí. Cualquier otro de los 18 sería
      // recomendar sin motor, y su precio sería una cifra inventada.
      proyectosPermitidos: proyectos.map((p) => p.nombre),
      // Los precios MÁS los números del `porque` de cada proyecto: la
      // similitud cita porcentajes ("el 63% de quienes compraron ahí son
      // afiliados") que el motor calculó y que viajan al prompt. Sin esto el
      // guard los leía como inventados y el lead veía siempre el texto
      // determinista — medido en el navegador el 2026-07-26.
      cifrasPermitidas: proyectos.flatMap((p) => [
        p.precio_desde,
        ...cifrasDe(p.porque),
      ]),
    });

    // El link para que pueda VER el proyecto, en burbuja aparte y sin pasar por
    // el LLM: así se manda un link por WhatsApp, y así el modelo no puede
    // mutilar la url. Solo el #1, que es sobre el que se ofrece la cita.
    const material = mensajeMaterialDelProyecto(proyectos[0]);
    if (material) await agregarBotInstantaneo(material, 700);
  }

  /**
   * El cierre: la puerta que le queda abierta al lead, dicha una sola vez.
   *
   * Va de ÚLTIMO a propósito: primero se le resuelve lo que vino a buscar
   * —sus proyectos, su cita, o la razón honesta de por qué todavía no— y solo
   * después se le abre la puerta. Al revés se leería como que le estamos
   * vendiendo la afiliación en vez de ayudarle.
   *
   * DEDUPE (decisión 2026-07-25, la que la capa de recursos dejó abierta): la
   * invitación a afiliarse de spec 04 D3 y el recurso `afiliacion` le hablan a
   * la MISMA persona (el no afiliado) sobre lo mismo. Mandar los dos era decirle
   * dos veces lo mismo con dos textos distintos. Manda el recurso, porque dice
   * además POR QUÉ se lo mostramos y **cuándo** cumpliría los 6 meses que el
   * subsidio exige (el "caso con fecha" de spec 05 D2). La invitación suelta
   * queda como respaldo para cuando no viajan recursos.
   */
  async function cerrar(veredicto: ResultadoCurado) {
    const recursos = veredicto.recursos ?? [];
    const traeAfiliacion = recursos.some((r) => r.recurso_id === "afiliacion");

    if (veredicto.afiliado === false && !traeAfiliacion) {
      await agregarBotInstantaneo(mensajeAfiliacion(), 700);
    }

    // Capa ORTOGONAL: un lead `listo` con cita también recibe su recurso. Nunca
    // es "esto en vez del asesor" — el copy de cada molde lo dice (mensajes.ts).
    // Sin `salida` no se muestra: el molde de nutrición y el de listo dicen
    // cosas distintas, y elegir mal el tono es peor que no decir nada.
    const mensaje = veredicto.salida
      ? mensajeDeRecursos(evento.nombre, veredicto.salida, recursos)
      : null;
    if (mensaje) await agregarBotInstantaneo(mensaje, 700);
  }

  /**
   * Ofrece 3 franjas de la sala de ventas del proyecto #1 del match.
   *
   * Se agenda sobre el proyecto mejor rankeado y no se le pide antes al lead que
   * elija entre los tres: en un chat, cada paso extra es gente que se cae, y el
   * asesor puede cambiarlo en la llamada. Los otros proyectos igual le llegan al
   * asesor en la ficha.
   */
  async function ofrecerFranjas(veredicto: ResultadoCurado) {
    const proyecto = veredicto.proyecto_cita!;
    try {
      const resp = await fetch(
        `/api/citas?proyecto_id=${encodeURIComponent(proyecto.proyecto_id)}&limite=3`,
      );
      const datos = (await resp.json()) as { franjas?: Franja[] };
      if (!resp.ok || !datos.franjas?.length) throw new Error("sin franjas");

      setFranjas(datos.franjas);
      setFase("agenda");
      await agregarBotInstantaneo(
        `Y lo mejor: puedes ir a ver ${proyecto.nombre} sin compromiso. ¿Cuándo te queda bien pasar por la sala de ventas? 🗓️`,
        700,
      );
    } catch {
      // "No pudo agendar" es uno de los tres triggers reales de handoff a humano
      // (spec 02 D6). No se finge una cita que no existe.
      //
      // Hasta esta rama se le decía al lead pero NO quedaba rastro: el asesor
      // lo veía como un mensaje más del hilo, no como el trigger que es. La
      // fila `sistema` es lo que lo convierte en algo que se puede atender.
      anotar(
        "sistema",
        `No se pudieron cargar las franjas de la sala de ventas de ${proyecto.nombre} (trigger "no pudo agendar", spec 02 D6). Se le dijo al lead que un asesor lo contacta.`,
      );
      await agregarBotInstantaneo(
        "Los horarios de la sala de ventas no me cargaron en este momento 😕 No se pierde nada: un asesor te escribe para cuadrar la visita, y ya tiene todo lo que me contaste.",
        500,
      );
      await cerrar(veredicto);
      setFase("terminado");
    }
  }

  /** El lead eligió su franja: se persiste y queda la cita (POST /api/citas). */
  async function elegirFranja(franja: Franja) {
    const cuando = fechaLarga(franja.fecha);
    agregarUsuario(cuando);
    setFase("terminado");

    try {
      const resp = await fetch("/api/citas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead_id: evento.lead_id,
          fecha: franja.fecha,
          sala_ventas: franja.sala_ventas,
        }),
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      await agregarBotInstantaneo(
        `¡Listo! 🎉 Te espero el ${cuando} en ${franja.sala_ventas}. Le paso tu cita y tu historia completa al asesor, así que llegas y no tienes que explicar nada otra vez.`,
        600,
      );
      if (resultado) await cerrar(resultado);
    } catch {
      await agregarBotInstantaneo(
        `Anoté que quieres ir el ${cuando}, pero no pude confirmar la cita en el sistema. Un asesor te la confirma — no la pierdes.`,
        500,
      );
      if (resultado) await cerrar(resultado);
    }
  }

  function enviarTexto() {
    const texto = textoInput.trim();
    if (!texto || fase !== "pregunta" || escribiendo) return;
    setTextoInput("");

    void manejarTurno(texto);
  }

  /**
   * Qué se hace con lo que la persona escribió.
   *
   * La DECISIÓN vive en `maquina.ts` y es pura: aquí solo se ejecutan los
   * efectos (pintar, llamar al LLM, guardar). Antes esta lógica estaba
   * repartida entre `enviarTexto` y `responderPregunta` y no se podía probar
   * sin montar el chat entero.
   *
   * Ninguna de las ramas que NO son respuesta avanza `indicePaso`: se atiende
   * lo que la persona dijo y se vuelve a la misma pregunta. Es lo que hace que
   * salirse del guion no le cueste el dato que estaba dando.
   */
  async function manejarTurno(texto: string) {
    const paso = pasos[indicePaso];
    const accion = decidirTurno(texto, {
      campo: paso.campo,
      yaRespondidos: pasos.slice(0, indicePaso).map((p) => p.campo),
    });

    switch (accion.tipo) {
      // Preguntó si habla con una máquina. Se le dice la verdad: hasta esta
      // rama caía en duda `general` y contestaba "esa no te la puedo
      // confirmar", que es una evasiva justo donde importa no darla.
      case "identidad":
        return atenderSinAvanzar(texto, () => agregarBotInstantaneo(TEXTO_ES_IA));

      case "handoff_asesor":
        return atenderSinAvanzar(texto, async () => {
          anotar("sistema", notaSistemaHandoff());
          await agregarBotInstantaneo(mensajeHandoffAsesor(evento.nombre));
        });

      case "responder_duda":
        return atenderSinAvanzar(texto, () =>
          // El texto determinista viaja como fallback de la llamada que lo va a
          // reemplazar: si el LLM no contesta, la persona igual recibe respuesta.
          //
          // Los dos proyectos que Sara SÍ puede nombrar: el que la persona
          // acaba de mencionar y aquel por el que entró por la pauta. Nombrar
          // cualquier otro de los 18 sería recomendar sin motor, y el guard lo
          // bloquea.
          agregarBot(
            respuestaDeterministaDuda(
              { tipo: "duda", clase: accion.clase, ...(accion.proyecto ? { proyecto: accion.proyecto } : {}) },
              evento.proyecto_interes,
            ),
            { modo: "duda", pregunta: texto },
            {
              proyectosPermitidos: [accion.proyecto?.nombre, evento.proyecto_interes].filter(
                (n): n is string => Boolean(n),
              ),
            },
          ),
        );

      // No era un intento de responder (una risa, un emoji, una cuenta). Se
      // reconoce en una línea y se retoma, sin regañar ni disculparse.
      case "fuera_de_tema":
        return atenderSinAvanzar(texto, () => agregarBotInstantaneo(mensajeFueraDeTema()));

      // Está cambiando algo que ya había dicho. Se sobrescribe y se retoma:
      // corregir no puede costarle el paso en el que iba.
      case "corregir_dato":
        return atenderSinAvanzar(
          texto,
          () => agregarBotInstantaneo(accion.acuse),
          accion.patch,
        );

      // Ni el regex ni la IA: se repregunta una vez y a la segunda se sigue,
      // pero dejando dicho en el hilo qué no se entendió.
      case "no_entendido":
        return manejarNoEntendido(texto, accion.campo);

      // `responder_paso` y `confirmar_dato`: el camino de siempre.
      default:
        return responderPregunta(texto, respuestaDeAccion(accion));
    }
  }

  /**
   * Atiende algo que NO es una respuesta y vuelve a la pregunta pendiente.
   *
   * Lleva la cuenta de cuántos turnos seguidos van sin avanzar: al tercero se
   * ofrece un asesor y se sigue conversando. Hasta esta rama no había tope y
   * se podía preguntar indefinidamente sin que la conversación se moviera.
   */
  async function atenderSinAvanzar(
    texto: string,
    atender: () => Promise<void>,
    patch?: Partial<Lead["respuestas"]>,
  ) {
    agregarUsuario(texto);
    if (patch) setRespuestas((prev) => ({ ...prev, ...patch }));

    await atender();

    sinAvanzar.current += 1;
    if (sinAvanzar.current === MAX_DESVIOS_SEGUIDOS) {
      anotar("sistema", notaSistemaMuchasPreguntas(sinAvanzar.current));
      await pausa(400);
      await agregarBotInstantaneo(mensajeMuchasPreguntas());
    }

    await pausa(500);
    await agregarBot(repreguntar(pasos[indicePaso]));
  }

  /**
   * El regex no entendió. Antes de repreguntar, se le da un intento a la IA.
   *
   * Regex primero, IA de respaldo (§3 del plan): la mayoría de respuestas las
   * resuelve el regex a 0 ms y solo las difíciles pagan la llamada. Si la IA no
   * contesta a tiempo o devuelve algo fuera del menú, se cae a repreguntar —
   * que es exactamente el comportamiento sin IA.
   */
  async function manejarNoEntendido(texto: string, campo: CampoPregunta) {
    const rescatada = await rescatarConIA(campo, texto);
    if (rescatada) return responderPregunta(texto, respuestaDeAccion(rescatada));

    const mudo = respuestaDeAccion({ tipo: "no_entendido", campo, textoCrudo: texto });

    // Ya se repreguntó una vez: se sigue, pero el hilo dice qué se perdió. Sin
    // esto el dato desaparecía con un acuse amable y nadie se enteraba —
    // ni la persona, ni el motor, ni el asesor.
    if (repreguntadoEn.current === indicePaso) {
      anotar("sistema", notaSistemaSinInterpretar(campo, texto));
    }

    return responderPregunta(texto, {
      ...mudo,
      repreguntar: true,
      acuse: TEXTO_NO_ENTENDI,
      acuseSiInsiste: mudo.acuse,
    });
  }

  /**
   * El intérprete de la rama 4, cableado.
   *
   * Devuelve una acción ya lista si el modelo clasificó dentro del menú del
   * campo, o `null` en cualquier otro caso: sin key, sin red, fuera del enum,
   * o pasados los 3 s. `zona_interes` no pasa por aquí — su intérprete acepta
   * cualquier cosa, así que nunca emite `no_entendido`.
   */
  async function rescatarConIA(campo: CampoPregunta, texto: string) {
    if (!esCampoIA(campo)) return null;

    const control = new AbortController();
    const timeout = setTimeout(() => control.abort(), LIMITE_INTERPRETE_MS);
    try {
      const resp = await fetch("/api/interpretar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ campo, texto, pregunta: pasos[indicePaso].pregunta }),
        signal: control.signal,
      });
      if (!resp.ok) return null;

      // Se le pasa el SOBRE completo (`{ valor }`), que es la forma que valida
      // `validarInterpretacion` — la misma con la que el modelo contestó. Ahí
      // adentro, el ingreso pasa por dos puertas: zod y `plausible()`.
      const validado = validarInterpretacion(campo, await resp.json());
      return validado === undefined ? null : accionDeValor(campo, validado, texto);
    } catch {
      return null; // red caída, abortado o JSON inválido: el camino sin IA
    } finally {
      clearTimeout(timeout);
    }
  }

  const pasoActual = fase === "pregunta" ? pasos[indicePaso] : undefined;

  return (
    // El chat ya no toma prestado el mundo de WhatsApp: vive en un escenario
    // de marca Colsubsidio (DESIGN.md, "El escenario"). El riel de la
    // izquierda dice de qué va la conversación antes de que empiece; la
    // banda amarilla sigue declarando que el canal es simulado.
    <div className="stage">
      <div className="stage__motif" />
      <IsotipoBlanco className="stage__watermark" />
      <div className="stage__brand">
        <LockupBlanco priority />
        <span>Perfilador de Vivienda</span>
      </div>
      <BotonTema />

      <div className="win">
        <div className={cargando ? "load" : "load hide"} aria-hidden={!cargando}>
          <LockupBlanco priority />
          <div className="load__bar">
            <i />
          </div>
          <div className="load__tag">Conectando con tu asesor…</div>
        </div>

        <div className="win__bar">
          <i className="r" />
          <i className="y" />
          <i className="g" />
          <span className="win__title">Perfilador de Vivienda · Colsubsidio</span>
        </div>

        <div className="win__body">
          <aside className="rail">
            <LockupBlanco className="logo" />
            <div className="rail__h">Encontremos tu vivienda, paso a paso.</div>
            <div className="rail__p">
              Te hago unas preguntas rápidas para saber si calificas a un subsidio y
              recomendarte proyectos a tu medida. Nunca te pregunto lo que ya sabemos.
            </div>
            <div className="rail__steps">
              <div className="rail__step">
                <b>1</b>Autorización de datos
              </div>
              <div className="rail__step">
                <b>2</b>Lo que nos falta de tu perfil
              </div>
              <div className="rail__step">
                <b>3</b>Perfil sellado y asesor asignado
              </div>
            </div>
            <IsotipoBlanco className="rail__mark" />
          </aside>

          <div className="screen">
            <div className="hdr">
              <button className="hdr__back" onClick={onVolver} aria-label="Volver">
                ←
              </button>
              <div className="hdr__avatar">
                <IsotipoAzul />
              </div>
              <div className="hdr__meta">
                {/* El agente se presenta con nombre en el saludo; la cabecera
                    tiene que decir lo mismo o la pantalla se contradice. */}
                <span className="hdr__name">{NOMBRE_AGENTE} · Colsubsidio Vivienda</span>
                <span className="hdr__status">
                  {escribiendo ? (
                    <>
                      <span className="dots">
                        <i />
                        <i />
                        <i />
                      </span>
                      escribiendo…
                    </>
                  ) : (
                    "en línea"
                  )}
                </span>
              </div>
            </div>

            {/* Aviso del canal simulado. */}
            <div className="disc">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>Demo: en producción este chat corre sobre WhatsApp Business API.</span>
            </div>

            {/* Mensajes */}
            <div className="msgs">
              <span className="day">Hoy</span>
              {mensajes.map((m) => (
                <MensajeBurbuja key={m.id} mensaje={m} />
              ))}
              {escribiendo && (
                <div className="row bot">
                  <div className="typing" role="status" aria-label="escribiendo">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              )}
              {fase === "terminado" && (
                <SelloPerfil perfil={perfil} respuestas={respuestas} />
              )}
              <div ref={finRef} />
            </div>

            {/* Pie: los chips son atajos, el campo de texto nunca desaparece. */}
            <div className="footer">
              {fase === "consentimiento" && (
                <div className="qr">
                  <button
                    onClick={() => void responderConsentimiento(true)}
                    className="btn btn--primary"
                  >
                    Sí, la comparto
                  </button>
                  <button
                    onClick={() => void responderConsentimiento(false)}
                    className="btn btn--ghost"
                  >
                    Ahora no
                  </button>
                </div>
              )}

              {/* Híbrido (spec 02 D4): chips arriba, campo libre siempre. Los pasos
                  de ingreso y zona llegan sin `opciones` a propósito — la lista
                  sesga— y aquí eso sale gratis: no se pinta la fila y ya. */}
              {fase === "pregunta" && pasoActual && (
                <>
                  {pasoActual.opciones && (
                    <div className="chips">
                      {pasoActual.opciones.map((opcion) => (
                        <button
                          key={opcion.etiqueta}
                          disabled={escribiendo}
                          onClick={() => void responderPregunta(opcion.etiqueta, opcion)}
                          className="chip"
                        >
                          {opcion.etiqueta}
                        </button>
                      ))}
                    </div>
                  )}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      enviarTexto();
                    }}
                    className="form"
                  >
                    <input
                      value={textoInput}
                      onChange={(e) => setTextoInput(e.target.value)}
                      placeholder={
                        dictado.estado === "escuchando"
                          ? "Te escucho…"
                          : pasoActual.placeholder
                      }
                      aria-label="Tu respuesta"
                    />

                    {/* Contestar hablando. El mentor lo pidió ("unas personas
                        prefieren escribir y otras mandar notas de voz") y es
                        inclusión real: se puede responder desde una obra o
                        manejando. Solo LLENA este campo — la persona alcanza a
                        leer y corregir antes de enviar, y el texto entra por el
                        mismo camino que si lo hubiera escrito. Si el navegador
                        no soporta la API, este botón no existe. */}
                    {dictado.estado !== "no-soportado" && (
                      <button
                        type="button"
                        className={`mic${dictado.estado === "escuchando" ? " mic--vivo" : ""}`}
                        onClick={() =>
                          dictado.estado === "escuchando"
                            ? dictado.detener()
                            : dictado.arrancar(textoInput)
                        }
                        disabled={escribiendo || dictado.estado === "sin-permiso"}
                        aria-pressed={dictado.estado === "escuchando"}
                        aria-label={
                          dictado.estado === "escuchando"
                            ? "Dejar de dictar"
                            : "Contestar hablando"
                        }
                        title={
                          dictado.estado === "sin-permiso"
                            ? "Sin permiso del micrófono — puedes contestar escribiendo"
                            : "Contestar hablando"
                        }
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="22" />
                        </svg>
                      </button>
                    )}

                    <button
                      type="submit"
                      className="send"
                      aria-label="Enviar"
                      disabled={!textoInput.trim()}
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                        <polyline points="12 5 19 12 12 19" />
                      </svg>
                    </button>
                  </form>
                </>
              )}

              {/* Las franjas de sala de ventas: el paso que convierte un lead
                  calificado en un lead con cita (criterio 4). Son chips porque
                  aquí la lista NO sesga — es el catálogo real de horarios. */}
              {fase === "agenda" && (
                <div className="chips">
                  {franjas.map((franja) => (
                    <button
                      key={franja.fecha}
                      disabled={escribiendo}
                      onClick={() => void elegirFranja(franja)}
                      className="chip"
                    >
                      {fechaLarga(franja.fecha)}
                    </button>
                  ))}
                </div>
              )}

              {(fase === "terminado" || fase === "rechazado") && (
                <div className="qr">
                  {/* El demo es autogestionado: si el lead quedó guardado, el
                      jurado tiene que poder ver cómo lo recibe el asesor sin
                      escribir una URL a mano. */}
                  {resultado?.guardado && resultado.lead_id && (
                    <a
                      href={`/asesor/${resultado.lead_id}`}
                      className="btn btn--primary btn--bloque"
                    >
                      Ver cómo le llega al asesor →
                    </a>
                  )}
                  <button onClick={onVolver} className="btn btn--seal btn--bloque">
                    Volver al inicio
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
