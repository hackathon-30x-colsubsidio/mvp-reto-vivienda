import { NextResponse } from "next/server";
import { guardarLeadCurado, listarCola } from "@/lib/leads-repo";
import type { LeadCurado } from "@/lib/types";

// =====================================================================
// /api/leads — la puerta de entrada a la DB de leads.
//
// Nadie escribe a Supabase directo: los Tracks A y C llaman aquí. Un
// solo lugar valida, mapea y deja que los CHECK constraints del ADR
// 0003 defiendan los criterios de aceptación.
// =====================================================================

export const dynamic = "force-dynamic";

/** GET /api/leads — la cola priorizada del asesor. */
export async function GET() {
  const { leads, origen } = await listarCola();
  return NextResponse.json({ leads, origen });
}

/**
 * POST /api/leads — guarda un lead curado.
 *
 * Body: un `LeadCurado` (docs/reparto-inicial.md).
 * Lo llaman los Tracks A y C cuando termina el flujo.
 */
export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El body no es JSON válido" }, { status: 400 });
  }

  const problema = validarLeadCurado(cuerpo);
  if (problema) return NextResponse.json({ error: problema }, { status: 400 });

  try {
    await guardarLeadCurado(cuerpo as LeadCurado);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    // Si reventó un CHECK constraint, el lead viola un criterio de
    // aceptación. Devolvemos 422 para que se note que es el dato, no
    // el servidor.
    const esViolacion = /constraint|check|viola/i.test(mensaje);
    return NextResponse.json({ error: mensaje }, { status: esViolacion ? 422 : 500 });
  }
}

/**
 * Validación mínima antes de tocar la DB.
 *
 * No duplica lo que ya garantizan los CHECK constraints — solo atrapa
 * lo que reventaría con un mensaje incomprensible de Postgres.
 */
function validarLeadCurado(cuerpo: unknown): string | null {
  if (!cuerpo || typeof cuerpo !== "object") return "Se esperaba un objeto LeadCurado";

  const c = cuerpo as Partial<LeadCurado>;

  if (!c.lead?.evento?.lead_id) return "Falta lead.evento.lead_id";
  if (!c.lead.evento.nombre) return "Falta lead.evento.nombre";
  if (!c.score?.salida) return "Falta score.salida";

  const salidas = ["listo", "listo_restriccion_cupo", "nutricion"];
  if (!salidas.includes(c.score.salida)) {
    return `score.salida debe ser una de las 3 salidas del spec: ${salidas.join(", ")}`;
  }

  if (!Array.isArray(c.score.factores) || c.score.factores.length === 0) {
    return "score.factores no puede ir vacío — cero caja negra (criterio 2)";
  }

  if (c.score.salida === "nutricion") {
    if (!c.score.regla_fallida?.trim() || !c.score.trigger_nutricion?.trim()) {
      return "Un lead de nutrición necesita regla_fallida y trigger_nutricion (criterio 3)";
    }
  }

  return null;
}
