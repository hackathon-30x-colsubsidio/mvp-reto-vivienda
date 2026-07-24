import { GoogleGenAI } from "@google/genai";

// Cliente LLM del MVP. El equipo decidió el stack sobre la API de Claude (ADR 0002),
// pero se cambió a Google Gemini por disponibilidad de key (ver ADR 0002 → nota de
// 2026-07-23). Soporta DOS modos de autenticación, en este orden:
//
//   1. Vertex AI (créditos de Google Cloud) — si están GOOGLE_APPLICATION_CREDENTIALS_JSON
//      y GOOGLE_CLOUD_PROJECT. Usa una cuenta de servicio con rol de Vertex/Gemini.
//   2. Gemini API (AI Studio) — si está GEMINI_API_KEY.
//
// Sin ninguno, los endpoints responden 503 y el cliente cae a su fallback
// determinístico. El contrato no cambia: credenciales solo server-side (repo público)
// y todas las llamadas en streaming (límite de Vercel + primer token < 2s).

// `gemini-2.5-flash` quedó RETIRADO ("no longer available to new users", 404): con
// él la IA del demo no habría funcionado nunca, con o sin credenciales. Elegido
// midiendo contra la API real, no por ser el más nuevo:
//
//   3.5-flash + thinkingBudget:0 ..... primer token 1,0s  ✅
//   3.6-flash (no acepta budget:0) ... primer token 2,7s  ❌ rompe el <2s del ADR 0002
//   2.0-flash ........................ retirado también
//
// O sea el modelo MÁS NUEVO no sirve aquí: no deja apagar el thinking, y con
// thinking encendido incumple la restricción de performance. Se fija una versión
// exacta y no el alias `gemini-flash-latest`, para que el modelo no cambie solo en
// mitad del demo. Cambiar de modelo es esta línea — pero vuelve a medir el primer
// token antes de dar por bueno el cambio.
export const MODELO_GEMINI = "gemini-3.5-flash";

export interface MensajeLLM {
  role: "user" | "assistant";
  content: string;
}

interface CredsVertex {
  project: string;
  location: string;
  credentials: Record<string, unknown>;
}

/** Lee y valida las credenciales de Vertex del entorno. `null` si no están completas
 *  o el JSON de la cuenta de servicio no parsea. */
function credencialesVertex(): CredsVertex | null {
  const json = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const project = process.env.GOOGLE_CLOUD_PROJECT;
  if (!json || !project) return null;
  try {
    return {
      project,
      location: process.env.GOOGLE_CLOUD_LOCATION || "us-central1",
      credentials: JSON.parse(json),
    };
  } catch {
    return null; // JSON inválido → cae a API key o 503
  }
}

/** ¿Hay alguna credencial de LLM configurada (Vertex o API key)? Los endpoints
 *  responden 503 si no, y el cliente cae a su fallback determinístico. */
export function hayKeyGemini(): boolean {
  return credencialesVertex() !== null || Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Por qué no hay credencial, en texto accionable para el 503.
 *
 * Reporta solo si cada variable ESTÁ o NO está — nunca su valor. El repo es
 * público y este mensaje sale por HTTP: un nombre de variable es diagnóstico,
 * un valor sería una fuga.
 *
 * Existe porque el 503 decía "GEMINI_API_KEY no configurada" incluso cuando el
 * modo previsto era Vertex, y eso mandó a buscar la variable equivocada.
 */
export function diagnosticoCredenciales(): string {
  const presentes = (nombres: string[]) =>
    nombres.map((n) => `${n}=${process.env[n] ? "ok" : "FALTA"}`).join(", ");

  const vertex = presentes([
    "GOOGLE_APPLICATION_CREDENTIALS_JSON",
    "GOOGLE_CLOUD_PROJECT",
  ]);

  const jsonPresente = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
  const jsonParsea = credencialesVertex() !== null;
  const notaJson =
    jsonPresente && !jsonParsea
      ? " · GOOGLE_APPLICATION_CREDENTIALS_JSON no es JSON válido (debe ser el archivo completo de la cuenta de servicio, en una sola línea)"
      : "";

  return (
    "Sin credencial de LLM. " +
    `Vertex: ${vertex}${notaJson}. ` +
    `API key: GEMINI_API_KEY=${process.env.GEMINI_API_KEY ? "ok" : "FALTA"}. ` +
    "Los nombres son case-sensitive y las env vars nuevas solo aplican tras un redeploy."
  );
}

function crearCliente(): GoogleGenAI {
  const vertex = credencialesVertex();
  if (vertex) {
    return new GoogleGenAI({
      vertexai: true,
      project: vertex.project,
      location: vertex.location,
      googleAuthOptions: { credentials: vertex.credentials },
    });
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
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
  const ai = crearCliente();

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
