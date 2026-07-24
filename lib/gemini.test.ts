import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  hayKeyGemini,
  diagnosticoCredenciales,
  modeloActivo,
  MODELO_VERTEX,
  MODELO_AISTUDIO,
} from "./gemini";

// =====================================================================
// Credenciales de Vertex pegadas a mano en el panel de Vercel.
//
// Nace de un fallo real: las dos variables estaban bien puestas y el demo
// igual respondía 503 porque el JSON de la cuenta de servicio no parseaba.
// Las tres formas de abajo son las que produce un copy-paste normal, y
// desde afuera las tres se ven idénticas ("no es JSON válido").
//
// La cuenta de servicio es FALSA y la llave no es una llave: el repo es
// público y ningún test necesita una credencial real para ejercitar el
// parseo (AGENTS.md → contrato de secretos).
// =====================================================================

const CUENTA_FALSA = {
  type: "service_account",
  project_id: "proyecto-de-mentira",
  private_key_id: "0000000000000000000000000000000000000000",
  private_key:
    "-----BEGIN PRIVATE KEY-----\nLLAVE-FALSA-SOLO-PARA-TESTS\nSEGUNDA-LINEA\n-----END PRIVATE KEY-----\n",
  client_email: "falsa@proyecto-de-mentira.iam.gserviceaccount.com",
};

const JSON_BIEN = JSON.stringify(CUENTA_FALSA);

/** Lo que pasa cuando el `private_key` pierde el escape y trae saltos reales. */
const JSON_CON_SALTOS_REALES = JSON_BIEN.replace(/\\n/g, "\n");

const guardado = { ...process.env };

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  process.env.GOOGLE_CLOUD_PROJECT = "proyecto-de-mentira";
});

afterEach(() => {
  process.env = { ...guardado };
});

describe("credenciales de Vertex — formas en que llega el pegado", () => {
  it("acepta el JSON tal cual", () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON_BIEN;
    expect(hayKeyGemini()).toBe(true);
  });

  it("acepta el JSON envuelto en comillas", () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = `"${JSON_BIEN}"`;
    expect(hayKeyGemini()).toBe(true);
  });

  it("acepta el JSON en base64", () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON =
      Buffer.from(JSON_BIEN, "utf8").toString("base64");
    expect(hayKeyGemini()).toBe(true);
  });

  it("repara los saltos de línea crudos dentro del PEM — el fallo real", () => {
    // Sin la reparación esto es JSON inválido y el demo se queda sin IA.
    expect(() => JSON.parse(JSON_CON_SALTOS_REALES)).toThrow();

    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON_CON_SALTOS_REALES;
    expect(hayKeyGemini()).toBe(true);
  });

  it("acepta un JSON pretty-printed sin romper sus saltos estructurales", () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON.stringify(
      CUENTA_FALSA,
      null,
      2,
    );
    expect(hayKeyGemini()).toBe(true);
  });

  it("sigue rechazando lo que de verdad no es una cuenta de servicio", () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = "esto no es json";
    expect(hayKeyGemini()).toBe(false);
  });

  it("sin GOOGLE_CLOUD_PROJECT no hay Vertex, por más que el JSON sirva", () => {
    delete process.env.GOOGLE_CLOUD_PROJECT;
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON_BIEN;
    expect(hayKeyGemini()).toBe(false);
  });
});

describe("el modelo depende de la ruta de auth", () => {
  // Cada backend publica su propio catálogo y NO coinciden: `gemini-2.5-flash`
  // está retirado en AI Studio pero vivo en Vertex, y los `gemini-3.*` no
  // existen en Vertex. Una sola constante para ambas rutas rompe una de las
  // dos, siempre — y el sintoma seria un 404 en pleno demo.
  it("con credenciales de Vertex usa el modelo de Vertex", () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON_BIEN;
    expect(modeloActivo()).toBe(MODELO_VERTEX);
  });

  it("sin Vertex, cayendo a la API key, usa el modelo de AI Studio", () => {
    process.env.GEMINI_API_KEY = "no-importa-el-valor";
    expect(modeloActivo()).toBe(MODELO_AISTUDIO);
  });

  it("los dos modelos son distintos — si alguien los iguala, esto avisa", () => {
    expect(MODELO_VERTEX).not.toBe(MODELO_AISTUDIO);
  });
});

describe("diagnóstico del 503", () => {
  it("distingue 'falta la variable' de 'está pero no parsea'", () => {
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = "{roto";
    expect(diagnosticoCredenciales()).toContain("no es JSON válido");

    delete process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const sinVar = diagnosticoCredenciales();
    expect(sinVar).toContain("GOOGLE_APPLICATION_CREDENTIALS_JSON=FALTA");
    expect(sinVar).not.toContain("no es JSON válido");
  });

  it("nunca filtra el valor de una credencial — el mensaje sale por HTTP", () => {
    process.env.GEMINI_API_KEY = "SECRETO-QUE-NO-DEBE-SALIR";
    process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON = JSON_BIEN;

    const texto = diagnosticoCredenciales();
    expect(texto).not.toContain("SECRETO-QUE-NO-DEBE-SALIR");
    expect(texto).not.toContain("BEGIN PRIVATE KEY");
    expect(texto).not.toContain("falsa@proyecto-de-mentira");
  });
});
