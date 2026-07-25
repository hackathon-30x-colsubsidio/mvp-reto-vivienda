import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatWhatsApp } from "./ChatWhatsApp";
import * as leadsEvento from "@/lib/fixtures/leads-evento";
import * as perfilesConocidos from "@/lib/fixtures/perfiles-conocidos";
import { catalogo } from "@/lib/matching/catalogo";
import { pesos } from "@/lib/formato";
import type { Lead, MensajeConversacion } from "@/lib/types";

// =====================================================================
// El desvío, sobre el chat de verdad (Fase 3 de la rama 026, spec 02 D6).
//
// Lo que se prueba aquí no es que el agente conteste bonito: es que
// salirse del guion NO le cueste a la persona el paso en el que iba. El
// riesgo real de esta feature es ese —consumir la pregunta pendiente— y
// solo se ve montando el componente entero.
//
// Archivo aparte de `ChatWhatsApp.test.tsx` a propósito: ese es de otro
// dueño (P3) y esta rama no lo toca.
// =====================================================================

/** Las llamadas que hace el chat. `/api/chat` cae siempre al texto determinista. */
function stubFetch() {
  globalThis.fetch = vi.fn(async (entrada: RequestInfo | URL) => {
    const url = String(entrada);
    if (url.startsWith("/api/chat")) {
      // Sin LLM: el chat —y la respuesta a la duda— tienen que servir igual.
      throw new Error("sin LLM en los tests");
    }
    if (url.startsWith("/api/citas")) {
      return new Response(JSON.stringify({ franjas: [] }), { status: 200 });
    }
    throw new Error(`fetch no esperado: ${url}`);
  }) as unknown as typeof fetch;
}

async function tocar(nombre: RegExp) {
  const boton = await screen.findByRole("button", { name: nombre }, { timeout: 10_000 });
  await waitFor(() => expect(boton).not.toBeDisabled(), { timeout: 10_000 });
  fireEvent.click(boton);
}

/** Teclea en el campo libre, que nunca desaparece (convención del repo). */
async function teclear(texto: string) {
  const campo = await screen.findByLabelText(/Tu respuesta/i, undefined, {
    timeout: 10_000,
  });
  await waitFor(
    () => expect(screen.queryByRole("status", { name: /escribiendo/i })).toBeNull(),
    { timeout: 10_000 },
  );
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.submit(campo.closest("form")!);
}

const PRIMERA_PREGUNTA = /esta sería tu primera vivienda/i;

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("una duda a mitad del perfilamiento no consume el paso", () => {
  it(
    "responde con el catálogo real y vuelve a la misma pregunta",
    { timeout: 20_000 },
    async () => {
      stubFetch();
      const arboleda = catalogo.find((p) => p.nombre === "LA ARBOLEDA")!;
      let recibido: Lead | undefined;

      render(
        <ChatWhatsApp
          evento={leadsEvento.afiliadoListo} // entró por LA ARBOLEDA
          perfil={perfilesConocidos.afiliadoListo}
          onTerminar={async (lead) => {
            recibido = lead;
            return { guardado: true, lead_id: "lead-001", salida: "listo" };
          }}
          onVolver={() => {}}
        />,
      );

      await tocar(/Sí, la comparto/i);
      await screen.findByText(PRIMERA_PREGUNTA, undefined, { timeout: 10_000 });

      // No nombra el proyecto: se responde por el que entró por la pauta.
      await teclear("¿cuánto vale?");

      expect(
        await screen.findByText(new RegExp(escapar(pesos(arboleda.precio_desde))), undefined, {
          timeout: 10_000,
        }),
      ).toBeInTheDocument();

      // Y la pregunta pendiente vuelve: ahora está dos veces en el hilo.
      await waitFor(() => expect(screen.getAllByText(PRIMERA_PREGUNTA)).toHaveLength(2), {
        timeout: 10_000,
      });

      // El paso no se saltó: se contesta después y el dato llega completo.
      await tocar(/Sería la primera/i);
      await tocar(/Ninguno todavía/i);
      await tocar(/Al día con todo/i);

      await waitFor(() => expect(recibido).toBeDefined(), { timeout: 10_000 });
      expect(recibido!.respuestas.tiene_vivienda).toBe(false);
      expect(recibido!.respuestas.situacion_crediticia).toBe("buena");
    },
  );
});

describe("pedir un asesor humano deja rastro (spec 02 D6)", () => {
  it(
    "lo dice en el chat y lo anota en el hilo que ve el asesor",
    { timeout: 20_000 },
    async () => {
      stubFetch();
      let hilo: MensajeConversacion[] = [];

      render(
        <ChatWhatsApp
          evento={leadsEvento.afiliadoListo}
          perfil={perfilesConocidos.afiliadoListo}
          onTerminar={async (_lead, transcripcion) => {
            hilo = transcripcion;
            return { guardado: true, lead_id: "lead-001", salida: "listo" };
          }}
          onVolver={() => {}}
        />,
      );

      await tocar(/Sí, la comparto/i);
      await screen.findByText(PRIMERA_PREGUNTA, undefined, { timeout: 10_000 });

      await teclear("quiero hablar con un asesor");

      expect(
        await screen.findByText(/asesor de carne y hueso/i, undefined, { timeout: 10_000 }),
      ).toBeInTheDocument();

      // La conversación sigue: cada dato de más es uno que no repetirá.
      await waitFor(() => expect(screen.getAllByText(PRIMERA_PREGUNTA)).toHaveLength(2), {
        timeout: 10_000,
      });
      await tocar(/Sería la primera/i);
      await tocar(/Ninguno todavía/i);
      await tocar(/Al día con todo/i);

      await waitFor(() => expect(hilo.length).toBeGreaterThan(0), { timeout: 10_000 });
      expect(
        hilo.some((m) => m.rol === "sistema" && /asesor humano/i.test(m.mensaje)),
      ).toBe(true);
    },
  );
});

/** El `$` y los puntos de un monto formateado son sintaxis de RegExp. */
function escapar(texto: string): string {
  return texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
