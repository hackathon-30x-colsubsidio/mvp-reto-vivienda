import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatWhatsApp } from "./ChatWhatsApp";
import * as leadsEvento from "@/lib/fixtures/leads-evento";
import * as perfilesConocidos from "@/lib/fixtures/perfiles-conocidos";
import type { MensajeConversacion } from "@/lib/types";

// =====================================================================
// El guard, CABLEADO — rama 5.
//
// POR QUÉ ESTE ARCHIVO EXISTE: `guardas.ts` llegó a `main` con 96 tests
// verdes y **sin que lo importara nadie**. Un módulo perfecto que no
// está conectado protege exactamente cero. Estos dos tests fallan si
// alguien vuelve a desconectarlo, que es lo único que la suite de
// `guardas.test.ts` no puede ver desde adentro.
//
// Lo que se prueba NO es que el guard funcione (eso ya está probado):
// es que el texto que Gemini devuelve pasa por él antes de llegar a la
// burbuja, y que el rastro queda en el hilo que ve el asesor.
//
// Archivo aparte a propósito: `ChatWhatsApp.test.tsx` es de otro dueño.
// =====================================================================

/** Lo que un modelo suelto podría contestar. Ninguna de las dos puede llegar al lead. */
const CIFRA_INVENTADA =
  "Claro que sí. Ese proyecto te queda en $999.999.999 y lo puedes pagar en 12 cuotas de $83.000.000.";

/** `/api/chat` devuelve SIEMPRE la violación; el resto de rutas, lo mínimo. */
function stubFetchConLlmSuelto(respuestaDelModelo: string) {
  globalThis.fetch = vi.fn(async (entrada: RequestInfo | URL) => {
    const url = String(entrada);
    if (url.startsWith("/api/chat")) {
      return new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(new TextEncoder().encode(respuestaDelModelo));
            controller.close();
          },
        }),
        { status: 200, headers: { "Content-Type": "text/plain; charset=utf-8" } },
      );
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

const PRIMERA_PREGUNTA = /esta sería tu primera vivienda/i;

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("lo que el modelo inventa NO llega a la burbuja", () => {
  it(
    "pinta el texto determinista y deja el rastro en el hilo del asesor",
    { timeout: 25_000 },
    async () => {
      stubFetchConLlmSuelto(CIFRA_INVENTADA);
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

      // El texto que TypeScript redactó gana: la pregunta real aparece.
      await screen.findByText(PRIMERA_PREGUNTA, undefined, { timeout: 10_000 });

      // Y la cifra inventada no está en ninguna parte de la pantalla.
      expect(screen.queryByText(/999\.999\.999/)).toBeNull();
      expect(screen.queryByText(/83\.000\.000/)).toBeNull();

      await tocar(/Sería la primera/i);
      await tocar(/Con mi pareja/i);
      await tocar(/Ninguno todavía/i);
      await tocar(/Al día con todo/i);

      await waitFor(() => expect(hilo.length).toBeGreaterThan(0), { timeout: 10_000 });

      // El rastro auditable: el asesor puede ver que el agente se salió y que
      // el sistema lo corrigió. Sin esto, bloquear sería una caja negra.
      const bloqueos = hilo.filter(
        (m) => m.rol === "sistema" && /guard/i.test(m.mensaje),
      );
      expect(bloqueos.length).toBeGreaterThan(0);
      expect(bloqueos[0].mensaje).toMatch(/cifra_inventada/);

      // Y nada de lo que el asesor lee trae la cifra que el modelo se inventó.
      expect(hilo.some((m) => m.mensaje.includes("999.999.999"))).toBe(false);
    },
  );
});

describe("un modelo que se porta bien pasa sin que nadie lo note", () => {
  it(
    "el texto pulido llega tal cual y no ensucia el hilo con notas",
    { timeout: 25_000 },
    async () => {
      // Mismo sentido que la pregunta real, redactado distinto: es exactamente
      // para lo que existe el modo tono. El guard no puede estorbarlo.
      const PULIDO =
        "Cuéntame algo primero, que cambia todo lo demás: ¿sería tu primera vivienda o ya tienes una?";
      stubFetchConLlmSuelto(PULIDO);
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
      await screen.findByText(/sería tu primera vivienda o ya tienes una/i, undefined, {
        timeout: 10_000,
      });

      await tocar(/Sería la primera/i);
      await tocar(/Con mi pareja/i);
      await tocar(/Ninguno todavía/i);
      await tocar(/Al día con todo/i);

      await waitFor(() => expect(hilo.length).toBeGreaterThan(0), { timeout: 10_000 });
      expect(hilo.filter((m) => m.rol === "sistema" && /guard/i.test(m.mensaje))).toHaveLength(
        0,
      );
    },
  );
});
