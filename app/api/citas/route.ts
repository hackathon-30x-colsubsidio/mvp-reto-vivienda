import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { franjaExiste, franjasDe } from "@/lib/citas";

// =====================================================================
// /api/citas — la mitad de D del ticket 005 (costura S3).
//
// Reparto del ticket:
//   A  ofrece 2-3 franjas al final de la conversación del lead listo.
//   D  (esto) sirve el catálogo y PERSISTE la elegida.
//
// El catálogo vive en data/sintetica/slots.json, NO en Supabase: es la
// regla del ADR 0002 al pie de la letra — a la DB va solo lo que muta,
// y un horario simulado no muta. Solo la franja ELEGIDA se persiste.
//
// Fuera de alcance por el propio ticket: disponibilidad real,
// conflictos y cancelación. Un slot elegido no se bloquea para otros.
// =====================================================================

export const dynamic = "force-dynamic";

/**
 * GET /api/citas?proyecto_id=la-macarena&limite=3
 *
 * Las franjas que el chat ofrece al cerrar la conversación de un lead listo.
 * Sin `proyecto_id` devuelve las de todas las salas. No toca la DB: es catálogo.
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const proyectoId = params.get("proyecto_id");
  const limite = Number(params.get("limite") ?? 3);

  return NextResponse.json({
    franjas: franjasDe(proyectoId, Number.isFinite(limite) ? limite : 3),
  });
}

/**
 * POST /api/citas — persiste la franja que el lead eligió.
 *
 * Body: `{ "lead_id": "lead-001", "fecha": "...", "sala_ventas": "..." }`
 *
 * Upsert por `lead_id`: un lead, una cita. Reagendar pisa la fila.
 */
export async function POST(request: Request) {
  // Lo que NO necesita DB se valida primero: así el Track A puede
  // probar el contrato del agendador sin tener credenciales de
  // Supabase, y un body malo devuelve 400/422 en vez de un 503 que
  // esconde el verdadero problema.
  let cuerpo: { lead_id?: string; fecha?: string; sala_ventas?: string };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El body no es JSON válido" }, { status: 400 });
  }

  const { lead_id, fecha, sala_ventas } = cuerpo;
  if (!lead_id || !fecha || !sala_ventas) {
    return NextResponse.json(
      { error: "Faltan lead_id, fecha o sala_ventas" },
      { status: 400 },
    );
  }

  // La franja tiene que existir en el catálogo: así el chat no puede
  // agendar una hora inventada y la ficha del asesor no muestra una
  // cita que no existe en ninguna sala.
  if (!franjaExiste(fecha, sala_ventas)) {
    return NextResponse.json(
      { error: "Esa franja no está en data/sintetica/slots.json" },
      { status: 422 },
    );
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Supabase no está configurado (falta .env)" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("citas")
    .upsert({ lead_id, fecha, sala_ventas }, { onConflict: "lead_id" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ cita: data }, { status: 201 });
}
