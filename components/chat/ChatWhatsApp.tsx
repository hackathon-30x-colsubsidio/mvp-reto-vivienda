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
   * Muestra el mensaje del bot. Intenta redactarlo con Claude vía /api/chat
   * (streaming) para sonar natural; si no hay key configurada o falla la red,
   * cae al texto determinístico tal cual — el demo nunca depende de la IA
   * para funcionar (ADR 0002: la lógica de qué preguntar es TS puro).
   */
  async function agregarBot(textoBase: string) {
    setEscribiendo(true);
    const id = nuevoId();

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensajes: historialRef.current,
          mensaje_a_redactar: textoBase,
        }),
      });
      if (!resp.ok || !resp.body) throw new Error("sin streaming disponible");

      setMensajes((prev) => [
        ...prev,
        { id, autor: "bot", texto: "", hora: horaActual() },
      ]);
      setEscribiendo(false);

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let acumulado = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acumulado += decoder.decode(value, { stream: true });
        const textoParcial = acumulado;
        setMensajes((prev) =>
          prev.map((m) => (m.id === id ? { ...m, texto: textoParcial } : m)),
        );
      }
      historialRef.current = [
        ...historialRef.current,
        { role: "assistant", content: acumulado || textoBase },
      ];
    } catch {
      setTimeout(() => {
        setEscribiendo(false);
        setMensajes((prev) => {
          const yaExiste = prev.some((m) => m.id === id);
          if (yaExiste) {
            return prev.map((m) =>
              m.id === id ? { ...m, texto: textoBase } : m,
            );
          }
          return [...prev, { id, autor: "bot", texto: textoBase, hora: horaActual() }];
        });
      }, 400);
      historialRef.current = [
        ...historialRef.current,
        { role: "assistant", content: textoBase },
      ];
    }
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
    <div className="flex h-[100dvh] flex-col bg-[#e5ddd5] dark:bg-zinc-900">
      {/* Header estilo WhatsApp */}
      <div className="flex items-center gap-3 bg-[#075e54] px-4 py-3 text-white">
        <button
          onClick={onVolver}
          aria-label="Volver"
          className="text-xl leading-none"
        >
          ←
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-sm font-semibold">
          CV
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold">Colsubsidio Vivienda</span>
          <span className="text-xs text-white/80">
            {escribiendo ? "escribiendo..." : "en línea"}
          </span>
        </div>
      </div>

      {/* Disclaimer del canal simulado */}
      <div className="border-b border-amber-300 bg-amber-100 px-4 py-2 text-xs text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-200">
        ⚠️ Demo: en producción este chat corre sobre WhatsApp Business API.
      </div>

      {/* Mensajes */}
      <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {mensajes.map((m) => (
          <MensajeBurbuja key={m.id} mensaje={m} />
        ))}
        {escribiendo && (
          <div className="flex justify-start">
            <div className="rounded-lg rounded-tl-none bg-white px-3 py-2 text-sm text-zinc-400 shadow-sm dark:bg-zinc-700">
              escribiendo...
            </div>
          </div>
        )}
        <div ref={finRef} />
      </div>

      {/* Footer: quick replies o input libre */}
      <div className="border-t border-zinc-300 bg-zinc-100 p-3 dark:border-zinc-700 dark:bg-zinc-800">
        {fase === "consentimiento" && (
          <div className="flex gap-2">
            <button
              onClick={() => responderConsentimiento(true)}
              className="flex-1 rounded-full bg-[#075e54] px-4 py-2 text-sm font-medium text-white"
            >
              Sí, acepto
            </button>
            <button
              onClick={() => responderConsentimiento(false)}
              className="flex-1 rounded-full border border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200"
            >
              No, gracias
            </button>
          </div>
        )}

        {fase === "pregunta" && pasoActual?.tipo === "si_no" && (
          <div className="flex gap-2">
            <button
              onClick={() => responderPregunta("Sí", true)}
              className="flex-1 rounded-full bg-[#075e54] px-4 py-2 text-sm font-medium text-white"
            >
              Sí
            </button>
            <button
              onClick={() => responderPregunta("No", false)}
              className="flex-1 rounded-full border border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200"
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
              className="flex-1 rounded-full border border-zinc-300 bg-white px-4 py-2 text-sm text-zinc-900 outline-none dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-50"
            />
            <button
              type="submit"
              className="rounded-full bg-[#075e54] px-4 py-2 text-sm font-medium text-white"
            >
              Enviar
            </button>
          </form>
        )}

        {(fase === "terminado" || fase === "rechazado") && (
          <button
            onClick={onVolver}
            className="w-full rounded-full border border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-200"
          >
            Volver al inicio
          </button>
        )}
      </div>
    </div>
  );
}
