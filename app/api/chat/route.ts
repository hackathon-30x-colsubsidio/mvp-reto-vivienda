import Anthropic from "@anthropic-ai/sdk";

// La key solo vive aquí (server-side, API route) — nunca en el cliente ni en el repo.
// Streaming obligatorio (ADR 0002): evita el límite de tiempo de las funciones de Vercel.
export const runtime = "nodejs";

const SYSTEM_PROMPT = `Eres el asistente conversacional de Colsubsidio Vivienda dentro de un chat
con estética WhatsApp. Tu único trabajo es redactar de forma natural y cálida el mensaje que se
te pide, en español, como un mensaje de WhatsApp real: 1-3 frases, sin párrafos largos.

Reglas que no puedes romper:
- NUNCA inventes una pregunta nueva, ni agregues preguntas adicionales a las que se te piden.
- NUNCA cambies el orden ni el sentido del contenido que se te pide redactar.
- NUNCA pidas un dato que el mensaje ya dice que se conoce.
- Conserva todos los datos y cifras del contenido original, solo mejora el tono y la fluidez.`;

interface MensajeEntrada {
  role: "user" | "assistant";
  content: string;
}

interface CuerpoPeticion {
  mensajes: MensajeEntrada[];
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

  if (!process.env.ANTHROPIC_API_KEY) {
    return new Response("ANTHROPIC_API_KEY no configurada", { status: 503 });
  }

  const client = new Anthropic();

  const stream = client.messages.stream({
    model: "claude-opus-4-8",
    max_tokens: 300,
    system: SYSTEM_PROMPT,
    messages: [
      ...(mensajes ?? []),
      {
        role: "user",
        content: `Redacta este contenido como mensaje de WhatsApp, sin cambiar su sentido ni agregar preguntas: "${mensaje_a_redactar}"`,
      },
    ],
  });

  const encoder = new TextEncoder();
  const cuerpoStream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        controller.error(err);
        return;
      }
      controller.close();
    },
  });

  return new Response(cuerpoStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
