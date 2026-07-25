import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatWhatsApp } from "./ChatWhatsApp";
import * as leadsEvento from "@/lib/fixtures/leads-evento";
import * as perfilesConocidos from "@/lib/fixtures/perfiles-conocidos";
import type { Lead } from "@/lib/types";

// =====================================================================
// La confirmación del ingreso, sobre el chat de verdad (ticket 024).
//
// El ingreso es el insumo del ÚNICO gate legal del sistema (el 40% del
// Decreto 583), así que un número mal leído cambia el veredicto sin que
// nadie se entere. Aquí se prueban las dos mitades que solo existen
// montando el componente:
//
//   1. que un número ilegible NO consuma la pregunta, y
//   2. que la repregunta se conceda UNA vez — un chat que insiste hasta
//      que le contesten bien es un bucle, y en el demo sería fatal.
// =====================================================================

function stubFetch() {
  globalThis.fetch = vi.fn(async (entrada: RequestInfo | URL) => {
    const url = String(entrada);
    // Sin LLM: los acuses del ingreso son instantáneos y tienen que servir igual.
    if (url.startsWith("/api/chat")) throw new Error("sin LLM en los tests");
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

async function teclear(texto: string) {
  const campo = await screen.findByLabelText(/Tu respuesta/i, undefined, { timeout: 10_000 });
  await waitFor(
    () => expect(screen.queryByRole("status", { name: /escribiendo/i })).toBeNull(),
    { timeout: 10_000 },
  );
  fireEvent.change(campo, { target: { value: texto } });
  fireEvent.submit(campo.closest("form")!);
}

const PREGUNTA_INGRESO = /cuánto entra al mes en tu hogar/i;
const PREGUNTA_SUBSIDIO = /el subsidio es lo que más gente deja sobre la mesa/i;

/** Carlos: está en la base pero no es afiliado, así que a él SÍ se le pregunta el ingreso. */
function montar(onTerminar: (lead: Lead) => void) {
  render(
    <ChatWhatsApp
      evento={leadsEvento.noAfiliadoListo}
      perfil={perfilesConocidos.noAfiliadoListo}
      onTerminar={async (lead) => {
        onTerminar(lead);
        return { guardado: true, lead_id: "lead-002", salida: "listo_restriccion_cupo" };
      }}
      onVolver={() => {}}
    />,
  );
}

/**
 * Hasta dejar la conversación parada en la pregunta del ingreso.
 *
 * Se espera a que cada pregunta esté en pantalla antes de contestar: si se
 * teclea mientras el agente "escribe", el envío se descarta en silencio.
 */
async function llegarAlIngreso() {
  await tocar(/Sí, la comparto/i);
  await tocar(/Sería la primera/i);
  await tocar(/Con mi familia e hijos/i);
  await screen.findByText(PREGUNTA_INGRESO, undefined, { timeout: 10_000 });
}

/** Contesta las que vienen después del ingreso y espera el lead terminado. */
async function terminarDespuesDelIngreso() {
  await tocar(/Ninguno todavía/i);
  await tocar(/Entre 36 y 45/i);
  await tocar(/Al día con todo/i);
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("un número que no se puede leer no se convierte en el gate del 40%", () => {
  it(
    "repregunta sin consumir el paso, y califica con lo que la persona confirme",
    { timeout: 25_000 },
    async () => {
      stubFetch();
      let recibido: Lead | undefined;
      montar((lead) => {
        recibido = lead;
      });

      await llegarAlIngreso();

      // "2+2" entraba como $2.000.000 hasta el 2026-07-25.
      await teclear("2+2");
      expect(
        await screen.findByText(/no logré leerlo bien/i, undefined, { timeout: 10_000 }),
      ).toBeInTheDocument();
      await waitFor(() => expect(screen.getAllByText(PREGUNTA_INGRESO)).toHaveLength(2), {
        timeout: 10_000,
      });

      // Al confirmar, el agente le DEVUELVE el número entendido y sigue.
      await teclear("4.000.000");
      expect(
        await screen.findByText(/hago las cuentas con \$4\.000\.000/i, undefined, {
          timeout: 10_000,
        }),
      ).toBeInTheDocument();
      await screen.findByText(PREGUNTA_SUBSIDIO, undefined, { timeout: 10_000 });

      await terminarDespuesDelIngreso();

      await waitFor(() => expect(recibido).toBeDefined(), { timeout: 10_000 });
      expect(recibido!.respuestas.ingreso_hogar_mensual).toBe(4_000_000);
    },
  );

  it(
    "solo insiste una vez: a la segunda sigue, con el texto crudo anotado",
    { timeout: 25_000 },
    async () => {
      stubFetch();
      let recibido: Lead | undefined;
      montar((lead) => {
        recibido = lead;
      });

      await llegarAlIngreso();

      await teclear("no sé");
      await waitFor(() => expect(screen.getAllByText(PREGUNTA_INGRESO)).toHaveLength(2), {
        timeout: 10_000,
      });

      // Segunda vez sin número: no se le vuelve a preguntar, se avanza.
      await teclear("depende del mes");
      await screen.findByText(PREGUNTA_SUBSIDIO, undefined, { timeout: 10_000 });
      expect(screen.getAllByText(PREGUNTA_INGRESO)).toHaveLength(2);

      await terminarDespuesDelIngreso();

      await waitFor(() => expect(recibido).toBeDefined(), { timeout: 10_000 });
      // No se adivina el monto, y lo que dijo no se pierde: el asesor lo ve.
      expect(recibido!.respuestas.ingreso_hogar_mensual).toBeUndefined();
      expect(recibido!.respuestas.rango_ingreso_hogar).toBe("depende del mes");
    },
  );
});
