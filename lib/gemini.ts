import { GoogleGenAI } from "@google/genai";

// Cliente LLM del MVP. El equipo decidió el stack sobre la API de Claude (ADR 0002),
// pero en la práctica solo había key de Gemini disponible, así que el proveedor se
// cambió a Google Gemini (ver ADR 0002 → nota de 2026-07-23). El contrato no cambia:
// la key vive solo server-side (repo público) y todas las llamadas van en streaming
// (límite de tiempo de las funciones de Vercel + primer token < 2s).

export const MODELO_GEMINI = "gemini-2.5-flash";

export interface MensajeLLM {
  role: "user" | "assistant";
  content: string;
}

/** ¿Hay key de Gemini configurada? Los endpoints responden 503 si no, y el cliente
 *  cae a su fallback determinístico. */
export function hayKeyGemini(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Redacta con Gemini y devuelve un ReadableStream de texto plano (UTF-8), el mismo
 * contrato que consumían los endpoints cuando corrían sobre Claude. `system` es la
 * instrucción de sistema; `messages` es el historial (rol `assistant` se mapea al
 * `model` de Gemini). Thinking desactivado: es redacción sobre hechos ya calculados.
 */
export function streamGemini(opts: {
  system: string;
  messages: MensajeLLM[];
  maxTokens: number;
}): ReadableStream<Uint8Array> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  const contents = opts.messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const respuesta = await ai.models.generateContentStream({
          model: MODELO_GEMINI,
          contents,
          config: {
            systemInstruction: opts.system,
            maxOutputTokens: opts.maxTokens,
            thinkingConfig: { thinkingBudget: 0 },
          },
        });
        for await (const chunk of respuesta) {
          if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });
}
