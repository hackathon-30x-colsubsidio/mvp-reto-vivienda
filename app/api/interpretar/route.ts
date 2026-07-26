import { z } from "zod";
import { diagnosticoCredenciales, hayKeyGemini } from "@/lib/gemini";
import { CampoIASchema, interpretarConIA } from "@/lib/conversacion/interprete-ia";

// La key solo vive server-side (el repo es público). Ver ADR 0002.
export const runtime = "nodejs";

// =====================================================================
// EL SEGUNDO INTENTO — solo se llama cuando el regex emitió `no_entendido`.
//
// Ruta aparte de `/api/chat` y no un modo suyo, a propósito: aquella streamea
// texto que el lead lee, esta devuelve un valor del menú que nadie ve. Meterlas
// en el mismo handler obligaba a que una de las dos mintiera sobre su
// Content-Type.
//
// **Siempre responde 200 con `{ valor }`**, incluso cuando no entendió: `null`
// es una respuesta legítima ("yo tampoco sé") y no un error del cliente. El
// único no-200 es el 503 de "no hay credencial", que es diagnóstico para el
// equipo, no un caso de la conversación.
// =====================================================================

const CuerpoSchema = z.object({
  campo: CampoIASchema,
  texto: z.string().min(1),
  /** La pregunta que se le hizo, para que clasifique con contexto del turno.
   *  Opcional: sin ella el menú del campo alcanza. */
  pregunta: z.string().optional(),
});

export async function POST(req: Request) {
  let crudo: unknown;
  try {
    crudo = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const cuerpo = CuerpoSchema.safeParse(crudo);
  if (!cuerpo.success) {
    // Un campo que no está en el menú es un error de quien llama, no del lead.
    return new Response(`Petición inválida: ${cuerpo.error.issues[0]?.message}`, {
      status: 400,
    });
  }

  if (!hayKeyGemini()) {
    return new Response(diagnosticoCredenciales(), { status: 503 });
  }

  const { campo, texto, pregunta } = cuerpo.data;
  const valor = await interpretarConIA(campo, texto, pregunta);

  return Response.json({ valor: valor ?? null });
}
