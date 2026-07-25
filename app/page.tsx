"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type {
  Lead,
  LeadCurado,
  LeadEvento,
  MensajeConversacion,
  PerfilConocido,
  ResultadoCurado,
} from "@/lib/types";
import { LandingJurado } from "@/components/landing/LandingJurado";
import { ChatWhatsApp, type Reenganche } from "@/components/chat/ChatWhatsApp";

type Conversacion = {
  evento: LeadEvento;
  perfil: PerfilConocido;
  reenganche?: Reenganche;
};

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

function Inicio() {
  const [conversacion, setConversacion] = useState<Conversacion | null>(null);
  const parametros = useSearchParams();
  const leadIdReenganche = parametros.get("lead_id");
  const esReenganche = parametros.get("reenganche") === "1";

  /**
   * Criterio de aceptación 3, la mitad que faltaba (ticket 007).
   *
   * El botón "simular trigger" de la ficha del asesor manda a
   * `/?lead_id=X&reenganche=1`. Hasta ahora nadie leía esos parámetros y el clic
   * aterrizaba en el landing como si fuera un lead nuevo: el criterio no se
   * podía demostrar de punta a punta. Ahora se trae el lead de la DB y la
   * conversación **retoma** — con su razón original y sin repreguntar nada.
   */
  useEffect(() => {
    if (!leadIdReenganche || conversacion) return;

    let cancelado = false;
    void (async () => {
      try {
        const resp = await fetch(`/api/leads/${encodeURIComponent(leadIdReenganche)}`);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

        const { lead } = (await resp.json()) as { lead: { curado: LeadCurado } };
        const { evento, perfil, respuestas } = lead.curado.lead;
        if (cancelado) return;

        setConversacion({
          evento,
          perfil,
          // Solo se retoma de verdad si venía de nutrición: a un lead listo no
          // hay nada que re-engancharle.
          ...(esReenganche && lead.curado.score.salida === "nutricion"
            ? {
                reenganche: {
                  respuestasPrevias: respuestas,
                  reglaFallida: lead.curado.score.regla_fallida,
                  trigger: lead.curado.score.trigger_nutricion,
                },
              }
            : {}),
        });
      } catch (e) {
        // Sin lead no se inventa una conversación: se queda en el landing, que
        // es la pantalla honesta.
        console.error("[reenganche] no se pudo cargar el lead:", e);
      }
    })();

    return () => {
      cancelado = true;
    };
  }, [leadIdReenganche, esReenganche, conversacion]);

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
      reenganche={conversacion.reenganche}
      onVolver={() => setConversacion(null)}
      onTerminar={curarLead}
    />
  );
}

export default function Home() {
  // `useSearchParams` obliga a un límite de Suspense en el App Router.
  return (
    <Suspense fallback={null}>
      <Inicio />
    </Suspense>
  );
}
