import { NextResponse } from "next/server";
import { marcarReEnganchado, obtenerLead } from "@/lib/leads-repo";

export const dynamic = "force-dynamic";

interface Contexto {
  params: Promise<{ leadId: string }>;
}

/** GET /api/leads/:leadId — el detalle de un lead. */
export async function GET(_request: Request, { params }: Contexto) {
  const { leadId } = await params;
  const { lead, origen } = await obtenerLead(leadId);

  if (!lead) {
    return NextResponse.json({ error: `No existe el lead ${leadId}` }, { status: 404 });
  }

  return NextResponse.json({ lead, origen });
}

/**
 * PATCH /api/leads/:leadId — acciones sobre un lead.
 *
 * Body: `{ "accion": "re_enganchar" }`
 *
 * Criterio de aceptación 3: dispara el trigger de nutrición. NO cambia
 * el estado — el lead sigue siendo de nutrición, solo que ya lo
 * tocamos (ADR 0003). Deja el evento en el hilo con rol='sistema',
 * que es el puente por el que el chat del Track A lo retoma.
 */
export async function PATCH(request: Request, { params }: Contexto) {
  const { leadId } = await params;

  let cuerpo: { accion?: string };
  try {
    cuerpo = await request.json();
  } catch {
    return NextResponse.json({ error: "El body no es JSON válido" }, { status: 400 });
  }

  if (cuerpo.accion !== "re_enganchar") {
    return NextResponse.json(
      { error: 'Acción no soportada. La única por ahora es "re_enganchar".' },
      { status: 400 },
    );
  }

  try {
    const reEnganchadoEn = await marcarReEnganchado(leadId);
    return NextResponse.json({ ok: true, re_enganchado_en: reEnganchadoEn });
  } catch (e) {
    const mensaje = e instanceof Error ? e.message : "Error desconocido";
    const noExiste = /no existe|no está en nutrición/i.test(mensaje);
    return NextResponse.json({ error: mensaje }, { status: noExiste ? 404 : 500 });
  }
}
