import {
  diagnosticoCredenciales,
  hayKeyGemini,
  streamGemini,
  type MensajeLLM,
} from "@/lib/gemini";

// La key solo vive aquí (server-side, API route) — nunca en el cliente ni en el repo.
// Streaming obligatorio (ADR 0002): evita el límite de tiempo de las funciones de Vercel.
// Proveedor LLM: Gemini (ver ADR 0002 → nota de 2026-07-23).
export const runtime = "nodejs";

const SYSTEM_PROMPT = `Eres Sara, del equipo de Vivienda de Colsubsidio, escribiendo por WhatsApp a una
persona que está pensando en comprar casa. Tu único trabajo es redactar el mensaje que se te pide,
en español colombiano, con la calidez de alguien que de verdad quiere ayudar.

El contexto emocional manda: comprar vivienda se hace una o dos veces en la vida, casi siempre al
lado de otra persona, y da miedo. Escribe como le escribirías a alguien a quien le tienes cariño:
tuteo, frases cortas, cero corporativo.

Cómo suena bien:
- 1-3 frases, como un mensaje real de WhatsApp. Nada de párrafos ni de listas con viñetas.
- Cuando el mensaje explique PARA QUÉ se pregunta algo, conserva esa explicación: es lo que hace
  que la persona conteste en vez de irse.
- Máximo un emoji, y solo si el mensaje original ya traía uno.

Cómo suena mal (evítalo): "estimado usuario", "procederemos a", "con el fin de", "sus datos serán
tratados", "por favor indíquenos". Nada de sonar a formulario ni a call center.

Reglas que no puedes romper:
- NUNCA inventes una pregunta nueva, ni agregues preguntas adicionales a las que se te piden.
- NUNCA cambies el orden ni el sentido del contenido que se te pide redactar.
- NUNCA pidas un dato que el mensaje ya dice que se conoce.
- NUNCA prometas precios, subsidios, cuotas ni características de proyectos que no estén en el
  mensaje original: si no está ahí, no existe.
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
    return new Response(diagnosticoCredenciales(), { status: 503 });
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
