import { NextResponse } from "next/server";
import { enriquecerPorCedula } from "@/lib/enriquecimiento";

// GET /api/enriquecer?cedula=1010123456 — costura S1 del plan (ticket 003).
//
// Devuelve el `PerfilConocido` con el que arranca la conversación: es lo que
// hace posible el criterio de aceptación 1 (no repreguntar lo que ya sabemos).
//
// Va del lado del servidor porque la base de 303 identidades pesa ~100 KB y no
// tiene por qué viajar al navegador. Sin match responde `{ match: false }` con
// 200: no encontrar a alguien no es un error, es el otro camino del demo.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cedula = new URL(request.url).searchParams.get("cedula");

  if (!cedula?.trim()) {
    return NextResponse.json({ error: "Falta el parámetro cedula" }, { status: 400 });
  }

  return NextResponse.json({ perfil: enriquecerPorCedula(cedula) });
}
