import type { Lead } from "@/lib/types";
import * as curados from "@/lib/fixtures/leads-curados";

// Fallback determinístico del experto (ticket 010). Si /api/explicacion no puede
// llamar al LLM —sin credencial, cold-start de Vertex que tira 500, o timeout—,
// la ficha del asesor NO puede quedar en blanco: el demo es autogestionado y nadie
// va a estar ahí para reintentar (restricción no-negociable de AGENTS.md).
//
// La fuente es la explicación de referencia escrita a mano de cada personaje
// canónico (docs/explicaciones-referencia.md), que ya vive tipada en
// lib/fixtures/leads-curados.ts. NO se duplica el texto: se lee de ahí, así el
// fallback y el estándar de calidad no pueden divergir.
//
// Solo aplica a los 3 personajes pre-sembrados (lead-001/002/003). El "soy yo" con
// formulario libre no tiene guion y degrada honestamente (null): ahí el consumidor
// muestra un mensaje sincero de que el asistente no está disponible, sin inventar.

const PORLEAD: Record<string, string> = {
  "lead-001": curados.afiliadoListo.explicacion,
  "lead-002": curados.noAfiliadoListo.explicacion,
  "lead-003": curados.nutricion.explicacion,
};

/** La explicación de referencia del personaje, o `null` si el lead no es canónico. */
export function explicacionFallback(lead: Lead): string | null {
  return PORLEAD[lead.evento.lead_id] ?? null;
}
