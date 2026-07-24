"use client";

import { useEffect, useRef, useState } from "react";
import type { Lead, LeadEvento, PerfilConocido } from "@/lib/types";
import {
  construirPreguntas,
  mensajeYaSabemos,
  type PasoPregunta,
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
    const primerNombre = evento.nombre.split(" ")[0];
    agregarBot(
      `¡Hola, ${primerNombre}! 👋 Soy el asistente de Colsubsidio Vivienda. Antes de continuar, necesito tu autorización para tratar tus datos personales según la Ley 1581 de 2012 (habeas data). ¿Nos autorizas?`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function agregarUsuario(texto: string) {
    historialRef.current = [...historialRef.current, { role: "user", content: texto }];
    setMensajes((prev) => [
      ...prev,
      { id: nuevoId(), autor: "usuario", texto, hora: horaActual() },
    ]);
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

    // Crea la burbuja la primera vez y la va actualizando; apaga "escribiendo".
    const pintar = (texto: string) => {
      setEscribiendo(false);
      setMensajes((prev) => {
        if (prev.some((m) => m.id === id)) {
          return prev.map((m) => (m.id === id ? { ...m, texto } : m));
        }
        return [...prev, { id, autor: "bot", texto, hora: horaActual() }];
      });
    };

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

  function responderConsentimiento(acepta: boolean) {
    agregarUsuario(acepta ? "Sí, acepto" : "No, gracias");
    const timestamp = new Date().toISOString();
    const nuevasRespuestas: Lead["respuestas"] = {
      ...respuestas,
      consentimiento: { otorgado: acepta, timestamp },
    };
    setRespuestas(nuevasRespuestas);

    if (!acepta) {
      setFase("rechazado");
      agregarBot(
        "Entiendo. Sin tu autorización no podemos continuar con el perfilamiento. Si cambias de opinión, aquí estaré.",
      );
      return;
    }

    agregarBot(mensajeYaSabemos(perfil, evento.nombre));

    if (pasos.length === 0) {
      terminar(nuevasRespuestas);
      return;
    }

    setFase("pregunta");
    setIndicePaso(0);
    setTimeout(() => agregarBot(pasos[0].pregunta), 650);
  }

  function guardarRespuesta(campo: PasoPregunta["campo"], valor: string | boolean | string[]) {
    return { ...respuestas, [campo]: valor } as Lead["respuestas"];
  }

  function responderPregunta(etiquetaUsuario: string, valor: string | boolean | string[]) {
    const pasoActual = pasos[indicePaso];
    agregarUsuario(etiquetaUsuario);
    const nuevasRespuestas = guardarRespuesta(pasoActual.campo, valor);
    setRespuestas(nuevasRespuestas);

    const siguienteIndice = indicePaso + 1;
    if (siguienteIndice < pasos.length) {
      setIndicePaso(siguienteIndice);
      agregarBot(pasos[siguienteIndice].pregunta);
    } else {
      terminar(nuevasRespuestas);
    }
  }

  function terminar(respuestasFinales: Lead["respuestas"]) {
    setFase("terminado");
    agregarBot(
      `¡Listo, ${evento.nombre.split(" ")[0]}! Ya tengo todo lo que necesito. Un asesor va a revisar tu perfil y te contacta muy pronto. 🙌`,
    );
    onTerminar({ evento, perfil, respuestas: respuestasFinales });
  }

  function enviarTexto() {
    const texto = textoInput.trim();
    if (!texto || fase !== "pregunta") return;
    const pasoActual = pasos[indicePaso];
    if (pasoActual.campo === "subsidios") {
      const valor =
        texto.toLowerCase() === "ninguno"
          ? []
          : texto.split(",").map((s) => s.trim()).filter(Boolean);
      responderPregunta(texto, valor);
    } else {
      responderPregunta(texto, texto);
    }
    setTextoInput("");
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

      {/* Footer: quick replies o input libre */}
      <div className="bg-[#f0f0f0] p-3 dark:bg-[#1f2c34]">
        {fase === "consentimiento" && (
          <div className="flex gap-2">
            <button
              onClick={() => responderConsentimiento(true)}
              className="flex-1 rounded-full bg-[#075e54] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#064e44] dark:bg-[#00a884] dark:text-[#111b21] dark:hover:bg-[#02c39a]"
            >
              Sí, acepto
            </button>
            <button
              onClick={() => responderConsentimiento(false)}
              className="flex-1 rounded-full border-2 border-[#075e54] px-4 py-2 text-sm font-semibold text-[#075e54] transition-colors hover:bg-black/5 dark:border-[#00a884] dark:text-[#00a884] dark:hover:bg-white/5"
            >
              No, gracias
            </button>
          </div>
        )}

        {fase === "pregunta" && pasoActual?.tipo === "si_no" && (
          <div className="flex gap-2">
            <button
              onClick={() => responderPregunta("Sí", true)}
              className="flex-1 rounded-full bg-[#075e54] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#064e44] dark:bg-[#00a884] dark:text-[#111b21] dark:hover:bg-[#02c39a]"
            >
              Sí
            </button>
            <button
              onClick={() => responderPregunta("No", false)}
              className="flex-1 rounded-full border-2 border-[#075e54] px-4 py-2 text-sm font-semibold text-[#075e54] transition-colors hover:bg-black/5 dark:border-[#00a884] dark:text-[#00a884] dark:hover:bg-white/5"
            >
              No
            </button>
          </div>
        )}

        {fase === "pregunta" && pasoActual?.tipo === "texto" && (
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
              placeholder="Escribe tu respuesta..."
              className="flex-1 rounded-full bg-white px-4 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 dark:bg-[#2a3942] dark:text-zinc-50 dark:placeholder:text-zinc-400"
            />
            <button
              type="submit"
              className="rounded-full bg-[#075e54] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#064e44] dark:bg-[#00a884] dark:text-[#111b21] dark:hover:bg-[#02c39a]"
            >
              Enviar
            </button>
          </form>
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
