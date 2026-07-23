"use client";

import { useState } from "react";

// =====================================================================
// CRITERIO DE ACEPTACIÓN 3 — nadie se descarta.  ·  Ticket 007 (S5)
//
// "Al pulsar 'simular trigger' vuelve a la conversación."
//
// La mitad de D: el botón, el cambio de estado en la DB y la
// NAVEGACIÓN de vuelta al chat con el lead_id.
// La mitad de A: el mensaje de reentrada, que retoma la conversación
// citando el trigger que se cumplió, sin repetir el consentimiento.
//
// El criterio solo se verifica de punta a punta, así que esto NO se da
// por hecho hasta que A lea el parámetro. Contrato acordado:
//
//     /?lead_id=<id>&reenganche=1
//
// Además, el re-enganche deja una fila `rol='sistema'` en
// `conversaciones` con el trigger exacto — de ahí lo puede leer A para
// redactar la reentrada sin inventarse el motivo.
//
// El lead NO cambia de estado: sigue siendo de nutrición, solo que ya
// lo tocamos (`re_enganchado_en`, ADR 0003).
// =====================================================================

interface Props {
  leadId: string;
  reEnganchadoEn: string | null;
}

export function BotonSimularTrigger({ leadId, reEnganchadoEn }: Props) {
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const urlChat = `/?lead_id=${encodeURIComponent(leadId)}&reenganche=1`;

  async function disparar() {
    setError(null);
    setEnCurso(true);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "re_enganchar" }),
      });

      if (!res.ok) {
        const cuerpo = await res.json().catch(() => ({}));
        throw new Error(cuerpo.error ?? `Error ${res.status}`);
      }

      // El lead vuelve a la conversación: un clic, no dos.
      window.location.href = urlChat;
    } catch (e) {
      setEnCurso(false);
      setError(e instanceof Error ? e.message : "No se pudo disparar el trigger");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={disparar}
        disabled={enCurso}
        className="rounded-lg bg-violet-700 px-5 py-3 text-base font-bold text-white hover:bg-violet-800 disabled:opacity-60"
      >
        {enCurso ? "Llevando al chat…" : "Simular trigger"}
      </button>

      {reEnganchadoEn && (
        <p data-testid="re-enganche-hecho" className="text-base text-violet-900">
          Ya se le disparó el trigger.{" "}
          <a href={urlChat} className="font-bold underline">
            Volver a abrir la conversación
          </a>
        </p>
      )}

      {error && <p className="text-base font-semibold text-red-700">{error}</p>}
    </div>
  );
}
