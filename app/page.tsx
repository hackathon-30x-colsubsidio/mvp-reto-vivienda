"use client";

import { useState } from "react";
import type { Lead, LeadEvento, PerfilConocido } from "@/lib/types";
import { LandingJurado } from "@/components/landing/LandingJurado";
import { ChatWhatsApp } from "@/components/chat/ChatWhatsApp";

type Conversacion = { evento: LeadEvento; perfil: PerfilConocido };

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
      onTerminar={(lead: Lead) => {
        // TODO(track A→B): hoy solo se registra en consola; /api/chat +
        // /api/score llegan cuando ese contrato esté listo (docs/reparto-inicial.md).
        console.log("Lead terminado:", lead);
      }}
    />
  );
}
