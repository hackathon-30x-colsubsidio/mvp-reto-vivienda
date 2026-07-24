"use client";

import { useEffect, useRef, useState } from "react";
import type { Lead, LeadEvento, PerfilConocido } from "@/lib/types";
import {
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
  const finRef = useRef<HTMLDivElement>(null);
  const iniciado = useRef(false);
  const historialRef = useRef<{ role: "user" | "assistant"; content: string }[]>(
    [],
  );

  useEffect(() => {
    finRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, escribiendo]);

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
    // El chat vive en el mundo de WhatsApp, no en el de Colsubsidio
    // (DESIGN.md, "El chat (mundo prestado)"): verde, burbujas y
    // píldoras son de allá, incluido su modo oscuro real. La marca
    // aparece en tres puntos y ningún otro: avatar, nombre y la banda
    // amarilla del disclaimer.
    <div className="flex h-[100dvh] flex-col bg-[#e5ddd5] dark:bg-[#0b141a]">
      {/* Header estilo WhatsApp */}
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white dark:bg-[#1f2c34]">
        <button
          onClick={onVolver}
          aria-label="Volver"
          className="text-xl leading-none"
        >
          ←
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd000] text-sm font-bold text-[#212529]">
          CV
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Colsubsidio Vivienda</span>
          <span className="text-xs text-white/80">
            {escribiendo ? "escribiendo..." : "en línea"}
          </span>
        </div>
      </div>

      {/* Disclaimer del canal simulado, en amarillo Colsubsidio. */}
      <div className="bg-[#ffd000] px-4 py-2 text-xs font-medium text-[#212529]">
        ⚠️ Demo: en producción este chat corre sobre WhatsApp Business API.
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {mensajes.map((m) => (
          <MensajeBurbuja key={m.id} mensaje={m} />
        ))}
        {escribiendo && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm text-zinc-500 shadow-sm dark:bg-[#202c33] dark:text-zinc-400">
              escribiendo...
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      {/* Footer: los chips son atajos, el input libre nunca desaparece. */}
      <div className="bg-[#f0f0f0] p-3 dark:bg-[#1f2c34]">
        {fase === "consentimiento" && (
          <div className="flex gap-2">
            <button
              onClick={() => void responderConsentimiento(true)}
              className="flex-1 rounded-full bg-[#075e54] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#064e44] dark:bg-[#00a884] dark:text-[#111b21] dark:hover:bg-[#02c39a]"
            >
              Sí, la comparto
            </button>
            <button
              onClick={() => void responderConsentimiento(false)}
              className="flex-1 rounded-full border-2 border-[#075e54] px-4 py-2 text-sm font-semibold text-[#075e54] transition-colors hover:bg-black/5 dark:border-[#00a884] dark:text-[#00a884] dark:hover:bg-white/5"
            >
              Ahora no
            </button>
          </div>
        )}

        {fase === "pregunta" && pasoActual && (
          <div className="flex flex-col gap-2">
            {pasoActual.opciones && (
              <div className="flex flex-wrap gap-2">
                {pasoActual.opciones.map((opcion) => (
                  <button
                    key={opcion.etiqueta}
                    disabled={escribiendo}
                    onClick={() => void responderPregunta(opcion.etiqueta, opcion)}
                    className="rounded-full border-2 border-[#075e54] px-3.5 py-1.5 text-sm font-semibold text-[#075e54] transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-[#00a884] dark:text-[#00a884] dark:hover:bg-white/5"
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
              className="flex gap-2"
            >
              <input
                value={textoInput}
                onChange={(e) => setTextoInput(e.target.value)}
                placeholder={pasoActual.placeholder}
                className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 dark:bg-[#2a3942] dark:text-zinc-50 dark:placeholder:text-zinc-400"
              />
              <button
                type="submit"
                className="rounded-full bg-[#075e54] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#064e44] dark:bg-[#00a884] dark:text-[#111b21] dark:hover:bg-[#02c39a]"
              >
                Enviar
              </button>
            </form>
          </div>
        )}

        {(fase === "terminado" || fase === "rechazado") && (
          <button
            onClick={onVolver}
            className="w-full rounded-full border-2 border-[#075e54] px-4 py-2 text-sm font-semibold text-[#075e54] transition-colors hover:bg-black/5 dark:border-[#00a884] dark:text-[#00a884] dark:hover:bg-white/5"
          >
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}
