import { hayKeyGemini } from "@/lib/gemini";
import { seleccionarDelBanco } from "@/lib/conversacion/selector-banco";
import type { Lead } from "@/lib/types";

// La key solo vive server-side (el repo es público). Ver ADR 0002.
export const runtime = "nodejs";

// =====================================================================
// QUÉ PREGUNTA DEL BANCO HACER — o ninguna.
//
// Ruta aparte de `/api/interpretar` porque son dos decisiones distintas:
// aquella clasifica lo que la persona ya dijo, esta decide si vale la pena
// pedirle una cosa más. El selector vive server-side porque necesita el
// catálogo y el matcher para saber qué separa a los candidatos de ESTE lead —
// no es algo que el cliente pueda calcular.
//
// **Siempre responde 200 con `{ id }`**, y `null` es la respuesta normal, no un
// error: significa "no hay ninguna que valga la pena". El banco es aditivo — si
// no se activa, la conversación termina con sus 7 preguntas, como hoy.
//
// Sin credencial devuelve `{ id: null }` en vez de 503: a diferencia del
// intérprete, aquí no hay nada que diagnosticar y el cliente no tiene que
// distinguir "no hay key" de "ninguna sirve". Falla cerrada y en silencio, que
// es lo que §4 pide para esta capa.
// =====================================================================

export async function POST(req: Request) {
  let crudo: unknown;
  try {
    crudo = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const { lead } = (crudo ?? {}) as { lead?: Lead };
  if (!lead?.respuestas || !lead?.evento) {
    return new Response("Petición inválida: falta el lead", { status: 400 });
  }

  if (!hayKeyGemini()) return Response.json({ id: null });

  const pregunta = await seleccionarDelBanco(lead);
  return Response.json({ id: pregunta?.id ?? null });
}
