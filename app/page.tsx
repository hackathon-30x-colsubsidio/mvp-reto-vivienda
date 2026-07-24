"use client";

import { useState } from "react";
import type {
  Lead,
  LeadEvento,
  MensajeConversacion,
  PerfilConocido,
  ResultadoCurado,
} from "@/lib/types";
import { LandingJurado } from "@/components/landing/LandingJurado";
import { ChatWhatsApp } from "@/components/chat/ChatWhatsApp";

type Conversacion = { evento: LeadEvento; perfil: PerfilConocido };

/**
 * Cierra la cadena del demo (costura S4 del plan, ticket 006): la conversación
 * terminada va a `/api/curar`, que califica con el motor, matchea y persiste el
 * lead con su hilo. Devuelve el veredicto para que el chat pueda decir la
 * verdad si algo falló — nunca se traga el error en silencio.
 */
async function curarLead(
  lead: Lead,
  transcripcion: MensajeConversacion[],
): Promise<ResultadoCurado> {
  try {
    const resp = await fetch("/api/curar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lead, transcripcion }),
    });

    const datos = (await resp.json().catch(() => ({}))) as Partial<ResultadoCurado>;
    if (!resp.ok) {
      console.error("[curar] no se guardó:", datos.error ?? resp.status, lead);
      return { ...datos, guardado: false, error: datos.error ?? `HTTP ${resp.status}` };
    }
    return { ...datos, guardado: true } as ResultadoCurado;
  } catch (e) {
    const error = e instanceof Error ? e.message : "sin conexión con el servidor";
    console.error("[curar] no se guardó:", error, lead);
    return { guardado: false, error };
  }
}

export default function Home() {
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);

  if (!conversacion) {
    return (
      <LandingJurado
        onIniciar={(evento, perfil) => setConversacion({ evento, perfil })}
      />
    );
  }

  return (
    <ChatWhatsApp
      evento={conversacion.evento}
      perfil={conversacion.perfil}
      onVolver={() => setConversacion(null)}
      onTerminar={curarLead}
    />
  );
}
