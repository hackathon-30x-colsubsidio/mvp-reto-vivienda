import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatWhatsApp } from "./ChatWhatsApp";
import * as leadsEvento from "@/lib/fixtures/leads-evento";
import * as perfilesConocidos from "@/lib/fixtures/perfiles-conocidos";
import { leadsCurados } from "@/lib/fixtures";
import type { ResultadoCurado } from "@/lib/types";

// =====================================================================
// Los criterios de aceptación 3 y 4, verificados sobre el chat de verdad
// (tickets 005 y 007 · costuras S3 y S5 del plan).
//
// Los dos estaban SIN test porque las dos mitades vivían en tracks distintos:
// el criterio 4 exige que el lead listo salga con una CITA registrada, y el 3
// que el trigger de nutrición devuelva a la persona a la conversación. Que las
// rutas respondieran no probaba ninguno de los dos — nadie las llamaba.
// =====================================================================

const FRANJAS = [
  {
    sala_ventas: "Sala de ventas LA ARBOLEDA",
    proyecto_id: "la-arboleda",
    proyecto: "LA ARBOLEDA",
    fecha: "2026-07-27T09:00:00-05:00",
  },
  {
    sala_ventas: "Sala de ventas LA ARBOLEDA",
    proyecto_id: "la-arboleda",
    proyecto: "LA ARBOLEDA",
    fecha: "2026-07-28T11:00:00-05:00",
  },
];

/** Las llamadas que hace el chat. `/api/chat` cae siempre al texto determinista. */
function stubFetch() {
  const citasPost = vi.fn();

  globalThis.fetch = vi.fn(async (entrada: RequestInfo | URL, init?: RequestInit) => {
    const url = String(entrada);

    if (url.startsWith("/api/chat")) {
      // Sin LLM: el chat tiene que seguir funcionando con su texto base.
      throw new Error("sin LLM en los tests");
    }
    if (url.startsWith("/api/citas") && init?.method === "POST") {
      citasPost(JSON.parse(String(init.body)));
      return new Response(JSON.stringify({ cita: {} }), { status: 201 });
    }
    if (url.startsWith("/api/citas")) {
      return new Response(JSON.stringify({ franjas: FRANJAS }), { status: 200 });
    }
    throw new Error(`fetch no esperado: ${url}`);
  }) as unknown as typeof fetch;

  return { citasPost };
}

/**
 * Toca un atajo, esperando a que el agente termine de "escribir".
 *
 * Los chips existen desde que empieza el turno pero salen DESHABILITADOS
 * mientras la burbuja del agente se está pintando — a propósito: no se contesta
 * una pregunta que todavía no acabó de aparecer.
 */
async function tocar(nombre: RegExp) {
  const boton = await screen.findByRole("button", { name: nombre }, { timeout: 10_000 });
  await waitFor(() => expect(boton).not.toBeDisabled(), { timeout: 10_000 });
  fireEvent.click(boton);
}

beforeEach(() => {
  // happy-dom no implementa scrollIntoView y el chat lo llama en cada mensaje.
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("criterio 4 — el lead listo sale con una cita agendada", () => {
  it(
    "ofrece franjas del proyecto recomendado y persiste la que elige",
    { timeout: 20_000 },
    async () => {
      const { citasPost } = stubFetch();

      const veredicto: ResultadoCurado = {
        guardado: true,
        lead_id: "lead-001",
        salida: "listo",
        puntaje: 74,
        proyectos: 3,
        proyecto_cita: { proyecto_id: "la-arboleda", nombre: "LA ARBOLEDA" },
      };

      render(
        <ChatWhatsApp
          evento={leadsEvento.afiliadoListo}
          perfil={perfilesConocidos.afiliadoListo}
          onTerminar={async () => veredicto}
          onVolver={() => {}}
        />,
      );

      // Autoriza sus datos (habeas data) y contesta con los atajos.
      await tocar(/Sí, la comparto/i);
      await tocar(/Sería la primera/i);
      await tocar(/Ninguno todavía/i);
      await tocar(/Al día con todo/i);

      // Al cerrar, el chat ofrece las franjas de la sala de ventas.
      await tocar(/lunes, 27 de julio/i);

      await waitFor(() => expect(citasPost).toHaveBeenCalledTimes(1));
      expect(citasPost.mock.calls[0][0]).toMatchObject({
        lead_id: "lead-001",
        fecha: FRANJAS[0].fecha,
        sala_ventas: FRANJAS[0].sala_ventas,
      });

      // Y se lo confirma a la persona, con día y sala.
      expect(
        await screen.findByText(/Te espero el lunes, 27 de julio/i, undefined, {
          timeout: 10_000,
        }),
      ).toBeInTheDocument();
    },
  );
});

describe("criterio 3 — el trigger devuelve a la conversación, sin repreguntar", () => {
  it("retoma nombrando la razón original y solo pregunta lo que pudo cambiar", async () => {
    stubFetch();
    const { score, lead } = leadsCurados.nutricion;

    render(
      <ChatWhatsApp
        evento={leadsEvento.nutricion}
        perfil={perfilesConocidos.nutricion}
        reenganche={{
          respuestasPrevias: lead.respuestas,
          reglaFallida: score.regla_fallida,
          trigger: score.trigger_nutricion,
        }}
        onTerminar={async () => ({ guardado: true })}
        onVolver={() => {}}
      />,
    );

    // Nombra por qué no pudo la primera vez, sin hacerla repetir su historia.
    expect(
      await screen.findByText(/Hola de nuevo, Yuliana/i, undefined, { timeout: 10_000 }),
    ).toBeInTheDocument();
    expect(screen.getByText(/tope legal del 40%/i)).toBeInTheDocument();
    expect(screen.getByText(/No te voy a hacer repetir nada/i)).toBeInTheDocument();

    // El consentimiento NO se vuelve a pedir: ya lo dio, y por eso se le escribe.
    expect(screen.queryByRole("button", { name: /Sí, la comparto/i })).toBeNull();

    // Y lo único que se pregunta es lo que pudo cambiar: el ingreso.
    expect(
      await screen.findByText(/cuánto está entrando al mes en tu hogar hoy/i, undefined, {
        timeout: 10_000,
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/tu primera vivienda/i)).toBeNull();
    expect(screen.queryByText(/vida crediticia/i)).toBeNull();
  });
});
