import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ChatWhatsApp } from "./ChatWhatsApp";
import * as leadsEvento from "@/lib/fixtures/leads-evento";
import * as perfilesConocidos from "@/lib/fixtures/perfiles-conocidos";

// =====================================================================
// Contestar hablando (spec 02, pregunta 12 — el mentor pidió notas de voz).
//
// Lo que estos tests protegen no es la transcripción —esa la hace el
// navegador— sino las dos reglas que la rodean:
//   1. el dictado SOLO llena el campo de texto, nunca envía ni decide;
//   2. si el navegador no lo soporta, o la persona niega el micrófono, el chat
//      funciona idéntico — el campo de texto nunca desaparece.
// =====================================================================

/** Un doble de la Web Speech API: guarda la instancia para dispararle eventos. */
function instalarReconocimientoFalso() {
  const instancias: FakeReconocimiento[] = [];

  class FakeReconocimiento {
    lang = "";
    continuous = false;
    interimResults = false;
    iniciado = false;
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;

    constructor() {
      instancias.push(this);
    }
    start() {
      this.iniciado = true;
    }
    stop() {
      this.iniciado = false;
      this.onend?.();
    }
    abort() {
      this.iniciado = false;
    }
    /** Simula a alguien hablando. */
    dictar(texto: string) {
      this.onresult?.({
        resultIndex: 0,
        results: { length: 1, 0: { isFinal: true, length: 1, 0: { transcript: texto } } },
      });
    }
  }

  (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition =
    FakeReconocimiento;

  return { instancias };
}

function abrirChat() {
  render(
    <ChatWhatsApp
      evento={leadsEvento.afiliadoListo}
      perfil={perfilesConocidos.afiliadoListo}
      onTerminar={async () => ({ guardado: true })}
      onVolver={() => {}}
    />,
  );
}

/** Llega hasta la primera pregunta, que es donde vive el campo de texto. */
async function llegarALaPrimeraPregunta() {
  const autorizar = await screen.findByRole("button", { name: /Sí, la comparto/i });
  await waitFor(() => expect(autorizar).not.toBeDisabled(), { timeout: 10_000 });
  fireEvent.click(autorizar);
  return screen.findByLabelText("Tu respuesta", undefined, { timeout: 10_000 });
}

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
  // Sin LLM: el chat sigue con su texto determinista.
  globalThis.fetch = vi.fn(async () => {
    throw new Error("sin red en los tests");
  }) as unknown as typeof fetch;
});

afterEach(() => {
  delete (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;
  vi.restoreAllMocks();
});

describe("dictado por voz", () => {
  it("sin soporte del navegador no se pinta el micrófono, y se contesta escribiendo", async () => {
    // happy-dom no trae la Web Speech API: es el caso de Firefox.
    abrirChat();
    const campo = await llegarALaPrimeraPregunta();

    expect(screen.queryByRole("button", { name: /contestar hablando/i })).toBeNull();
    expect(campo).toBeInTheDocument();
  });

  it("lo dictado cae en el campo de texto, sin enviarse solo", { timeout: 20_000 }, async () => {
    const { instancias } = instalarReconocimientoFalso();
    abrirChat();
    const campo = await llegarALaPrimeraPregunta();

    fireEvent.click(screen.getByRole("button", { name: /contestar hablando/i }));
    expect(instancias).toHaveLength(1);
    expect(instancias[0].lang).toBe("es-CO");

    instancias[0].dictar("sería la primera");

    await waitFor(() => expect(campo).toHaveValue("sería la primera"));
    // NO se envía solo: la persona alcanza a leer y corregir. Si se hubiera
    // enviado, el campo estaría vacío y habría una burbuja suya en el hilo.
    expect(campo).toHaveValue("sería la primera");
    expect(screen.queryByText("sería la primera", { selector: ".b" })).toBeNull();
  });

  it("respeta lo que la persona ya había escrito: se lo añade, no lo pisa", { timeout: 20_000 }, async () => {
    const { instancias } = instalarReconocimientoFalso();
    abrirChat();
    const campo = await llegarALaPrimeraPregunta();

    fireEvent.change(campo, { target: { value: "no tengo casa" } });
    fireEvent.click(screen.getByRole("button", { name: /contestar hablando/i }));
    instancias[0].dictar("sería la primera");

    await waitFor(() => expect(campo).toHaveValue("no tengo casa sería la primera"));
  });

  it("si la persona niega el micrófono, no se insiste y sigue el texto", { timeout: 20_000 }, async () => {
    const { instancias } = instalarReconocimientoFalso();
    abrirChat();
    const campo = await llegarALaPrimeraPregunta();

    fireEvent.click(screen.getByRole("button", { name: /contestar hablando/i }));
    instancias[0].onerror?.({ error: "not-allowed" });

    await waitFor(() =>
      expect(screen.getByRole("button", { name: /contestar hablando/i })).toBeDisabled(),
    );
    // El camino que siempre existe sigue intacto.
    fireEvent.change(campo, { target: { value: "sería la primera" } });
    expect(campo).toHaveValue("sería la primera");
  });
});
