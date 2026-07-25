import { NextResponse } from "next/server";
import { curar } from "@/lib/curar";
import { guardarConversacion, guardarLeadCurado } from "@/lib/leads-repo";
import type { Lead, MensajeConversacion } from "@/lib/types";

// =====================================================================
// /api/curar — la costura S4 del plan (ticket 006).
//
// Termina la conversación → califica (motor TS puro) → matchea → redacta el
// porqué → PERSISTE lead + hilo. Es lo único que prueba que las partes
// encajan; antes de esto la conversación moría en un console.log y nada de
// lo que contaba el lead llegaba ni al motor ni a la DB.
//
// Determinista de punta a punta: sin LLM y sin red hacia afuera (ADR 0002).
// =====================================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Cuerpo {
  lead: Lead;
  transcripcion?: MensajeConversacion[];
}

export async function POST(request: Request) {
  let cuerpo: Cuerpo;
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El body no es JSON válido" }, { status: 400 });
  }

  const { lead, transcripcion = [] } = cuerpo;

  const problema = validarLead(lead);
  if (problema) return NextResponse.json({ error: problema }, { status: 400 });

  // Habeas data (Ley 1581 de 2012, spec §6): sin autorización no se guarda
  // NADA. La conversación existió, pero no deja rastro personal en la DB.
  if (!lead.respuestas?.consentimiento?.otorgado) {
    return NextResponse.json(
      { error: "Sin autorización de tratamiento de datos no se persiste el lead" },
      { status: 403 },
    );
  }

  // 1. Calificar y matchear. Si esto falla, es un bug nuestro: 500 honesto.
  let curado;
  try {
    curado = curar(lead);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: `No se pudo calificar: ${mensaje}` }, { status: 500 });
  }

  const veredicto = {
    lead_id: curado.lead.evento.lead_id,
    salida: curado.score.salida,
    puntaje: curado.score.puntaje,
    proyectos: curado.proyectos.length,
    explicacion: curado.explicacion,
    // Recursos recomendados (capa ortogonal): viajan en la respuesta para que el
    // chat le muestre al lead su(s) siguiente(s) paso(s). Ausente si ninguno aplica.
    ...(curado.recursos?.length ? { recursos: curado.recursos } : {}),
    // Sobre este proyecto el chat ofrece las franjas de sala de ventas: es el
    // #1 del match, el que el ranking dejó arriba (criterio 4, ticket 005).
    ...(curado.proyectos[0]
      ? {
          proyecto_cita: {
            proyecto_id: curado.proyectos[0].proyecto_id,
            nombre: curado.proyectos[0].nombre,
          },
        }
      : {}),
  };

  // 2. Persistir. El veredicto viaja en la respuesta pase lo que pase: si la
  // DB no está, el cliente igual sabe qué calificó el motor y lo puede decir
  // en voz alta en vez de fingir que guardó.
  let advertencia: string | undefined;
  try {
    ({ advertencia } = await guardarLeadCurado(curado));
    // El hilo va después: `conversaciones.lead_id` es FK contra `leads`.
    await guardarConversacion(curado.lead.evento.lead_id, transcripcion);
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    const sinDb = /no está configurado/i.test(mensaje);
    const esViolacion = /constraint|check|viola/i.test(mensaje);
    console.error("[/api/curar]", mensaje);
    return NextResponse.json(
      { error: mensaje, guardado: false, ...veredicto },
      { status: sinDb ? 503 : esViolacion ? 422 : 500 },
    );
  }

  return NextResponse.json(
    { ok: true, guardado: true, ...veredicto, ...(advertencia ? { advertencia } : {}) },
    { status: 201 },
  );
}

function validarLead(lead: Lead | undefined): string | null {
  if (!lead || typeof lead !== "object") return "Se esperaba un objeto Lead";
  if (!lead.evento?.lead_id) return "Falta lead.evento.lead_id";
  if (!lead.evento.nombre) return "Falta lead.evento.nombre";
  if (!lead.respuestas) return "Falta lead.respuestas";
  return null;
}
