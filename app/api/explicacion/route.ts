import type { Lead, Score } from "@/lib/types";
import { matchear } from "@/lib/matching";
import { catalogo } from "@/lib/matching/catalogo";
import { preciosMaximos } from "@/lib/matching/fixtures";
import { explicacionFallback } from "@/lib/matching/explicacion-fallback";
import {
  SYSTEM_PROMPT,
  promptExplicacionGlobal,
  promptPorqueProyecto,
} from "@/lib/matching/prompt-experto";
import { diagnosticoCredenciales, hayKeyGemini, streamGemini } from "@/lib/gemini";

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

  // Fallback determinístico del ticket 010: la explicación de referencia escrita a
  // mano del personaje canónico. Solo existe para la explicación global (la que ve
  // el asesor en la ficha), que es la crítica del demo; el "soy yo" da null.
  const fallback = tipo === "global" ? explicacionFallback(lead) : null;

  // Sin credencial no se puede llamar al LLM. Si hay guion para este personaje, se
  // sirve en vez del 503 pelado: el demo es autogestionado y la ficha no puede
  // quedar en blanco. Sin guion (lead libre), el 503 con diagnóstico sigue siendo
  // la respuesta honesta.
  if (!hayKeyGemini()) {
    if (fallback) return respuestaTexto(streamTexto(fallback));
    return new Response(diagnosticoCredenciales(), { status: 503 });
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

  // Si el LLM cae al conectarse (el cold-start de Vertex tira 500 a los ~6s), en vez
  // del 500 mudo se sirve el guion del personaje. El cliente aún así debe cortar por
  // timeout si el LLM se cuelga, igual que el conversador (ChatWhatsApp.tsx).
  return respuestaTexto(conFallback(cuerpoStream, fallback));
}

function precioMaximoDeFixture(salida: Score["salida"]): number {
  if (salida === "nutricion") return preciosMaximos.nutricion;
  if (salida === "listo_restriccion_cupo") return preciosMaximos.noAfiliadoListo;
  return preciosMaximos.afiliadoListo;
}

function respuestaTexto(cuerpo: ReadableStream<Uint8Array>): Response {
  return new Response(cuerpo, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}

/** Un texto fijo servido como stream, para que el fallback use el mismo contrato. */
function streamTexto(texto: string): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(texto));
      controller.close();
    },
  });
}

/**
 * Envuelve el stream del LLM: si falla ANTES de emitir nada (el caso del cold-start,
 * que rompe al conectar), sirve el `fallback` y cierra limpio en vez de propagar el
 * 500. Si ya salió texto parcial no se puede reempezar, así que se cierra con lo que
 * hay. Sin fallback (lead libre), deja pasar el error tal cual.
 */
function conFallback(
  fuente: ReadableStream<Uint8Array>,
  fallback: string | null,
): ReadableStream<Uint8Array> {
  if (!fallback) return fuente;
  const encoder = new TextEncoder();
  const lector = fuente.getReader();
  let emitido = false;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await lector.read();
        if (done) {
          controller.close();
          return;
        }
        emitido = true;
        controller.enqueue(value);
      } catch {
        if (!emitido) controller.enqueue(encoder.encode(fallback));
        controller.close();
      }
    },
    cancel(motivo) {
      return lector.cancel(motivo);
    },
  });
}
