import type { Lead, Score } from "@/lib/types";
import { matchear } from "@/lib/matching";
import { catalogo, preciosMaximos } from "@/lib/matching/fixtures";
import {
  SYSTEM_PROMPT,
  promptExplicacionGlobal,
  promptPorqueProyecto,
} from "@/lib/matching/prompt-experto";
import { hayKeyGemini, streamGemini } from "@/lib/gemini";

// La key solo vive aquí (server-side) — el repo es público.
// Streaming obligatorio (ADR 0002): evita el límite de tiempo de las funciones
// de Vercel y hace que la explicación se vea escribirse en el video.
// Proveedor LLM: Gemini (ver ADR 0002 → nota de 2026-07-23).
export const runtime = "nodejs";

interface Cuerpo {
  lead: Lead;
  score: Score;
  /** "global" = lo que ve el asesor · "proyecto" = el porqué que ve el lead */
  tipo?: "global" | "proyecto";
  proyecto_id?: string;
  precio_maximo?: number;
}

export async function POST(req: Request) {
  let cuerpo: Cuerpo;
  try {
    cuerpo = await req.json();
  } catch {
    return new Response("JSON inválido", { status: 400 });
  }

  const { lead, score, tipo = "global", proyecto_id } = cuerpo;
  if (!lead || !score) {
    return new Response("Faltan lead y score", { status: 400 });
  }
  if (tipo === "proyecto" && !proyecto_id) {
    return new Response("Falta proyecto_id", { status: 400 });
  }
  if (!hayKeyGemini()) {
    return new Response("GEMINI_API_KEY no configurada", { status: 503 });
  }

  // Se vuelve a correr el matcher acá (es determinista y sin red) para que quien
  // llama no tenga que cargar el catálogo ni las trazas de un lado a otro.
  const precio_maximo = cuerpo.precio_maximo ?? precioMaximoDeFixture(score.salida);
  const elegidos = matchear({ lead, score, catalogo, precio_maximo });

  let prompt: string;
  try {
    prompt =
      tipo === "proyecto"
        ? promptPorqueProyecto(lead, score, elegidos, proyecto_id!)
        : promptExplicacionGlobal(lead, score, elegidos);
  } catch (err) {
    return new Response(err instanceof Error ? err.message : "Petición inválida", {
      status: 400,
    });
  }

  // Sin thinking a propósito (lo maneja streamGemini): esto es redacción sobre
  // hechos ya calculados y lo que se juega es el primer token (< 2s, AGENTS.md).
  // El system prompt le pide responder solo con el texto final.
  const cuerpoStream = streamGemini({
    system: SYSTEM_PROMPT,
    maxTokens: tipo === "proyecto" ? 300 : 600,
    messages: [{ role: "user", content: prompt }],
  });

  return new Response(cuerpoStream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

function precioMaximoDeFixture(salida: Score["salida"]): number {
  if (salida === "nutricion") return preciosMaximos.nutricion;
  if (salida === "listo_restriccion_cupo") return preciosMaximos.noAfiliadoListo;
  return preciosMaximos.afiliadoListo;
}
