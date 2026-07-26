import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatWhatsApp } from "./ChatWhatsApp";
import * as leadsEvento from "@/lib/fixtures/leads-evento";
import * as perfilesConocidos from "@/lib/fixtures/perfiles-conocidos";
import { MAX_PREGUNTAS_BANCO } from "@/lib/conversacion/banco-preguntas";
import type { Lead } from "@/lib/types";

// =====================================================================
// EL BANCO, CABLEADO.
//
// POR QUÉ ESTE ARCHIVO EXISTE: es la misma historia del guard. El banco
// llegó a `main` con sus 4 preguntas medidas contra los 18 brochures, su
// selector y su ruta `/api/banco`… y **nadie lo llamaba desde el chat**.
// La rama 5 se escribió antes de que `/api/banco` existiera, así que el
// cableado quedó como el único hueco del plan.
//
// Lo que se prueba NO es que el banco funcione por dentro (eso ya está
// en `banco-preguntas.test.ts` y `selector-banco.test.ts`): es que la
// conversación lo INVOCA al agotar las base, que su respuesta llega al
// `Lead` que se califica, y que las cuatro formas de fallar terminan la
// conversación como si el banco no existiera — porque es aditivo.
//
// Archivo aparte a propósito: `ChatWhatsApp.test.tsx` es de otro dueño.
// =====================================================================

/**
 * `/api/chat` cae a 503 a propósito: `agregarBot` entonces pinta el texto
 * DETERMINISTA, que es el que estos tests buscan por pantalla. Probar contra el
 * pulido del LLM sería probar contra algo que cambia en cada corrida.
 */
function stubFetch(idsDelBanco: (string | null)[]) {
  const pedidos: string[] = [];
  let llamada = 0;

  globalThis.fetch = vi.fn(async (entrada: RequestInfo | URL) => {
    const url = String(entrada);
    pedidos.push(url);

    if (url.startsWith("/api/chat")) {
      return new Response("sin LLM en el test", { status: 503 });
    }
    if (url.startsWith("/api/banco")) {
      const id = idsDelBanco[llamada] ?? null;
      llamada += 1;
      return new Response(JSON.stringify({ id }), { status: 200 });
    }
    if (url.startsWith("/api/citas")) {
      return new Response(JSON.stringify({ franjas: [] }), { status: 200 });
    }
    throw new Error(`fetch no esperado: ${url}`);
  }) as unknown as typeof fetch;

  return pedidos;
}

async function tocar(nombre: RegExp) {
  const boton = await screen.findByRole("button", { name: nombre }, { timeout: 10_000 });
  await waitFor(() => expect(boton).not.toBeDisabled(), { timeout: 10_000 });
  fireEvent.click(boton);
}

/** Las 7 base de Diana, hasta dejar la conversación a las puertas del banco. */
async function responderLasBase() {
  await tocar(/Sí, la comparto/i);
  await tocar(/Sería la primera/i);
  await tocar(/Con mi pareja/i);
  await tocar(/Ninguno todavía/i);
  await tocar(/Al día con todo/i);
}

function montar(alTerminar: (lead: Lead) => void) {
  render(
    <ChatWhatsApp
      evento={leadsEvento.afiliadoListo}
      perfil={perfilesConocidos.afiliadoListo}
      onTerminar={async (lead) => {
        alTerminar(lead);
        return { guardado: true, lead_id: "lead-001", salida: "listo" };
      }}
      onVolver={() => {}}
    />,
  );
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("al agotarse las preguntas base, el banco entra", () => {
  it(
    "pregunta lo que el selector eligió y su respuesta llega al lead que se califica",
    { timeout: 30_000 },
    async () => {
      stubFetch(["alcobas"]);
      let calificado: Lead | null = null;
      montar((lead) => {
        calificado = lead;
      });

      await responderLasBase();

      // La pregunta del banco se pinta con sus chips, sin que nadie tocara el
      // JSX: una `PreguntaBanco` es un paso más de la misma lista.
      await tocar(/^Dos$/);

      await waitFor(() => expect(calificado).not.toBeNull(), { timeout: 15_000 });
      // El dato entra al `Lead` que va al motor. Sin esto el banco sería una
      // pregunta que se le hace a la persona para nada, que es peor que no
      // preguntarla.
      expect(calificado!.respuestas.alcobas_deseadas).toBe(2);
    },
  );

  it(
    "se detiene en el tope aunque el selector siga ofreciendo preguntas",
    { timeout: 30_000 },
    async () => {
      // El selector pide tres seguidas. El tope es del cliente, no del modelo.
      stubFetch(["alcobas", "amenidades", "espacio"]);
      let calificado: Lead | null = null;
      montar((lead) => {
        calificado = lead;
      });

      await responderLasBase();
      await tocar(/^Dos$/);
      await tocar(/Que acepten mascotas/i);

      await waitFor(() => expect(calificado).not.toBeNull(), { timeout: 15_000 });

      // Las dos que sí se hicieron.
      expect(calificado!.respuestas.alcobas_deseadas).toBe(2);
      expect(calificado!.respuestas.amenidades_interes).toEqual(["mascotas"]);
      // Y la tercera nunca se preguntó: `espacio_preferido` sigue sin dato.
      expect(MAX_PREGUNTAS_BANCO).toBe(2);
      expect(calificado!.respuestas.espacio_preferido).toBeUndefined();
      expect(screen.queryByText(/compacto y bien aprovechado/i)).toBeNull();
    },
  );
});

describe("el banco es aditivo: cuando no aplica, nadie se entera", () => {
  it(
    "con `id: null` la conversación termina como si el banco no existiera",
    { timeout: 30_000 },
    async () => {
      // La respuesta NORMAL del selector cuando ninguna pregunta cambiaría la
      // recomendación. No es un error y no se le dice nada al lead.
      stubFetch([null]);
      let calificado: Lead | null = null;
      montar((lead) => {
        calificado = lead;
      });

      await responderLasBase();

      await waitFor(() => expect(calificado).not.toBeNull(), { timeout: 15_000 });
      expect(calificado!.respuestas.alcobas_deseadas).toBeUndefined();
      expect(calificado!.respuestas.momento_compra).toBeUndefined();
    },
  );

  it(
    "un id que el modelo se inventó no pregunta nada y no rompe el cierre",
    { timeout: 30_000 },
    async () => {
      stubFetch(["cuantos_perros_tienes"]);
      let calificado: Lead | null = null;
      montar((lead) => {
        calificado = lead;
      });

      await responderLasBase();

      await waitFor(() => expect(calificado).not.toBeNull(), { timeout: 15_000 });
      // Ni se inventó una pregunta, ni se quedó colgada la conversación.
      expect(calificado!.respuestas.alcobas_deseadas).toBeUndefined();
    },
  );
});
