"use client";

import { useEffect, useRef, useState } from "react";
import type { Lead, LeadEvento, PerfilConocido } from "@/lib/types";
import {
  NOMBRE_AGENTE,
  construirPreguntas,
  ingresoDesdeRango,
  mensajeAutorizacion,
  mensajeCierre,
  mensajeSaludo,
  mensajeSinAutorizacion,
  mensajeYaSabemos,
  type PasoPregunta,
  type Respuesta,
} from "@/lib/conversacion/preguntas";
import { MensajeBurbuja, type Mensaje } from "./MensajeBurbuja";
import { SelloPerfil } from "./SelloPerfil";
import { BotonTema } from "@/components/ui/BotonTema";
import { IsotipoAzul, IsotipoBlanco, LockupBlanco } from "@/components/ui/Marca";

type Fase = "consentimiento" | "pregunta" | "terminado" | "rechazado";

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

export function ChatWhatsApp({
  evento,
  perfil,
  onTerminar,
  onVolver,
}: {
  evento: LeadEvento;
  perfil: PerfilConocido;
  onTerminar: (lead: Lead) => void;
  onVolver: () => void;
}) {
  const [pasos] = useState<PasoPregunta[]>(() => construirPreguntas(perfil));
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [fase, setFase] = useState<Fase>("consentimiento");
  const [indicePaso, setIndicePaso] = useState(0);
  const [respuestas, setRespuestas] = useState<Lead["respuestas"]>({
    consentimiento: { otorgado: false, timestamp: "" },
  });
  const [textoInput, setTextoInput] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  // Telón de arranque. No retrasa nada: el efecto de abajo dispara el primer
  // agregarBot() de inmediato, así que este medio segundo largo se lo come la
  // latencia real del primer token en vez de sumarse a ella.
  const [cargando, setCargando] = useState(true);
  const finRef = useRef<HTMLDivElement>(null);
  const iniciado = useRef(false);
  const historialRef = useRef<{ role: "user" | "assistant"; content: string }[]>(
    [],
  );

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
   */
  async function agregarBot(textoBase: string) {
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

    // Garantía final: si el stream no dejó texto, usar el determinístico.
    const textoFinal = acumulado.trim() ? acumulado : textoBase;
    pintar(textoFinal);
    historialRef.current = [
      ...historialRef.current,
      { role: "assistant", content: textoFinal },
    ];
  }

  async function responderConsentimiento(acepta: boolean) {
    agregarUsuario(acepta ? "Sí, la comparto" : "Ahora no");
    const timestamp = new Date().toISOString();
    const nuevasRespuestas: Lead["respuestas"] = {
      ...respuestas,
      consentimiento: { otorgado: acepta, timestamp },
    };
    setRespuestas(nuevasRespuestas);

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
    const nuevasRespuestas: Lead["respuestas"] = {
      ...respuestas,
      ...respuesta.patch,
    };
    setRespuestas(nuevasRespuestas);

    if (respuesta.acuse) await agregarBotInstantaneo(respuesta.acuse);

    const siguienteIndice = indicePaso + 1;
    if (siguienteIndice < pasos.length) {
      setIndicePaso(siguienteIndice);
      await agregarBot(pasos[siguienteIndice].pregunta);
    } else {
      await terminar(nuevasRespuestas);
    }
  }

  async function terminar(respuestasFinales: Lead["respuestas"]) {
    setFase("terminado");

    // El motor necesita el ingreso como número para el tope del 40%. Si el
    // enriquecimiento trajo el rango, no se le vuelve a preguntar a la persona
    // (criterio 1) — se toma el punto medio del rango que ya se conocía.
    const derivado =
      respuestasFinales.ingreso_hogar_mensual === undefined && perfil.rango_ingreso
        ? ingresoDesdeRango(perfil.rango_ingreso)
        : undefined;
    const lead: Lead = {
      evento,
      perfil,
      respuestas: derivado
        ? { ...respuestasFinales, ingreso_hogar_mensual: derivado }
        : respuestasFinales,
    };

    await agregarBotInstantaneo(mensajeCierre(evento.nombre), 700);
    onTerminar(lead);
  }

  function enviarTexto() {
    const texto = textoInput.trim();
    if (!texto || fase !== "pregunta" || escribiendo) return;
    setTextoInput("");
    void responderPregunta(texto, pasos[indicePaso].interpretarTexto(texto));
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
                      placeholder={pasoActual.placeholder}
                      aria-label="Tu respuesta"
                    />
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

              {(fase === "terminado" || fase === "rechazado") && (
                <div className="qr">
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
