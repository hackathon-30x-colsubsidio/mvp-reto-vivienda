import { hayKeyGemini, streamGemini, type MensajeLLM } from "@/lib/gemini";

// La key solo vive aquí (server-side, API route) — nunca en el cliente ni en el repo.
// Streaming obligatorio (ADR 0002): evita el límite de tiempo de las funciones de Vercel.
// Proveedor LLM: Gemini (ver ADR 0002 → nota de 2026-07-23).
export const runtime = "nodejs";

const SYSTEM_PROMPT = `Eres el asistente conversacional de Colsubsidio Vivienda dentro de un chat
con estética WhatsApp. Tu único trabajo es redactar de forma natural y cálida el mensaje que se
te pide, en español, como un mensaje de WhatsApp real: 1-3 frases, sin párrafos largos.

Reglas que no puedes romper:
- NUNCA inventes una pregunta nueva, ni agregues preguntas adicionales a las que se te piden.
- NUNCA cambies el orden ni el sentido del contenido que se te pide redactar.
- NUNCA pidas un dato que el mensaje ya dice que se conoce.
- Conserva todos los datos y cifras del contenido original, solo mejora el tono y la fluidez.
- Responde solo con el mensaje redactado, sin comillas ni texto adicional.`;

interface CuerpoPeticion {
  mensajes: MensajeLLM[];
  mensaje_a_redactar: string;
}

export async function POST(req: Request) {
  let cuerpo: CuerpoPeticion;
  try {
    cuerpo = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const { mensajes, mensaje_a_redactar } = cuerpo;
  if (!mensaje_a_redactar) {
    return new Response("Falta mensaje_a_redactar", { status: 400 });
  }

  if (!hayKeyGemini()) {
    return new Response("GEMINI_API_KEY no configurada", { status: 503 });
  }

  const cuerpoStream = streamGemini({
    system: SYSTEM_PROMPT,
    maxTokens: 300,
    messages: [
      ...(mensajes ?? []),
      {
        role: "user",
        content: `Redacta este contenido como mensaje de WhatsApp, sin cambiar su sentido ni agregar preguntas: "${mensaje_a_redactar}"`,
      },
    ],
  });

  return new Response(cuerpoStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
