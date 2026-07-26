import {
  diagnosticoCredenciales,
  hayKeyGemini,
  streamGemini,
  type MensajeLLM,
} from "@/lib/gemini";
import {
  PROMPT_TONO,
  promptDuda,
  promptRecomendacion,
} from "@/lib/conversacion/prompt-maestro";
import {
  listaParaPrompt,
  proyectosParaVerbalizar,
} from "@/lib/conversacion/recomendacion";
import type { Lead } from "@/lib/types";

// La key solo vive aquí (server-side, API route) — nunca en el cliente ni en el repo.
// Streaming obligatorio (ADR 0002): evita el límite de tiempo de las funciones de Vercel.
// Proveedor LLM: Gemini (ver ADR 0002 → nota de 2026-07-23).
export const runtime = "nodejs";

// Los prompts viven en lib/conversacion/prompt-maestro.ts, no aquí: esta ruta es
// HTTP y streaming, y lo que el agente ES no se descubre leyendo un handler.

/**
 * Dos modos, un endpoint.
 *
 * No se creó una ruta nueva a propósito: el ADR 0002 fija que la IA vive en
 * `/api/chat` y `/api/explicacion`, y el cliente ya tiene todo el blindaje
 * (abort a 3s, fallback al texto determinista) montado sobre esta.
 *
 * `modo` es opcional: sin él la ruta se comporta exactamente como antes del
 * 2026-07-25, así que nada de lo que ya funcionaba cambia.
 */
interface CuerpoPeticion {
  mensajes: MensajeLLM[];
  /** Modo tono: el texto que TypeScript ya redactó y el LLM solo pule. */
  mensaje_a_redactar?: string;
  modo?: "tono" | "duda" | "recomendacion";
  /** Modo duda: lo que la persona preguntó, textual. */
  pregunta?: string;
  /** El proyecto por el que entró, para responder sin inventar. */
  proyecto_interes?: string;
  /**
   * Modo recomendación: el lead completo, para correr el motor AQUÍ.
   *
   * Viaja el lead y no la lista de proyectos porque la lista no existe en el
   * cliente: `ResultadoCurado.proyectos` es un número y el `porque` de cada uno
   * nunca cruza al navegador. Calcularla server-side con `curar()` —que es
   * determinista y sin red— evita cambiar `lib/types.ts`, que es de otra rama.
   */
  lead?: Lead;
}

export async function POST(req: Request) {
  let cuerpo: CuerpoPeticion;
  try {
    cuerpo = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const { mensajes, mensaje_a_redactar, modo, pregunta, proyecto_interes, lead } =
    cuerpo;
  const esDuda = modo === "duda";
  const esRecomendacion = modo === "recomendacion";

  if (esRecomendacion ? !lead : esDuda ? !pregunta : !mensaje_a_redactar) {
    return new Response(
      esRecomendacion ? "Falta lead" : esDuda ? "Falta pregunta" : "Falta mensaje_a_redactar",
      { status: 400 },
    );
  }

  if (!hayKeyGemini()) {
    return new Response(diagnosticoCredenciales(), { status: 503 });
  }

  if (esRecomendacion) {
    // El motor corre ANTES del modelo: si no eligió nada (nutrición, o nada del
    // catálogo le cabe), no hay recomendación que redactar y se responde vacío.
    // El cliente ya sabe qué hacer con un stream sin texto: cae a su
    // determinista, que en ese caso es no decir nada.
    let proyectos;
    try {
      proyectos = proyectosParaVerbalizar(lead!);
    } catch {
      return new Response("", { headers: TEXTO_PLANO });
    }
    if (proyectos.length === 0) return new Response("", { headers: TEXTO_PLANO });

    return new Response(
      streamGemini({
        system: promptRecomendacion({ listaCerrada: listaParaPrompt(proyectos) }),
        // Alcanza de sobra para 3 frases; el techo bajo es parte de que no se
        // ponga a describir proyectos que no puede describir.
        maxTokens: 260,
        messages: [
          ...(mensajes ?? []),
          {
            role: "user",
            content:
              "Cuéntame cuáles proyectos me elegiste y por qué, con la lista que tienes.",
          },
        ],
      }),
      { headers: TEXTO_PLANO },
    );
  }

  const cuerpoStream = esDuda
    ? streamGemini({
        system: promptDuda({ proyecto_interes }),
        // Más corto que el modo tono: una duda se responde en 1-3 frases, y el
        // techo bajo es parte de que no se ponga a recomendar.
        maxTokens: 220,
        messages: [...(mensajes ?? []), { role: "user", content: pregunta! }],
      })
    : streamGemini({
        system: PROMPT_TONO,
        maxTokens: 300,
        messages: [
          ...(mensajes ?? []),
          {
            role: "user",
            content: `Redacta este contenido como mensaje de WhatsApp, sin cambiar su sentido ni agregar preguntas: "${mensaje_a_redactar}"`,
          },
        ],
      });

  return new Response(cuerpoStream, { headers: TEXTO_PLANO });
}

const TEXTO_PLANO = { "Content-Type": "text/plain; charset=utf-8" } as const;
