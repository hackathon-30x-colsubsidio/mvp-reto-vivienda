import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { POST } from "./route";

// =====================================================================
// La ruta del intérprete de respaldo. Lo que se prueba SIN RED es lo
// único que el demo necesita garantizado: que la capa se apague sola.
//
// Si esta ruta lanzara, o colgara, o devolviera algo que el cliente no
// sabe leer, la conversación se rompería justo cuando el lead escribió
// algo que el regex no entendió — o sea, en el peor momento posible.
// =====================================================================

const CREDENCIALES = [
  "GEMINI_API_KEY",
  "GOOGLE_APPLICATION_CREDENTIALS_JSON",
  "GOOGLE_CLOUD_PROJECT",
] as const;

const guardadas: Record<string, string | undefined> = {};

beforeEach(() => {
  for (const clave of CREDENCIALES) {
    guardadas[clave] = process.env[clave];
    delete process.env[clave];
  }
});

afterEach(() => {
  for (const clave of CREDENCIALES) {
    if (guardadas[clave] === undefined) delete process.env[clave];
    else process.env[clave] = guardadas[clave];
  }
});

const pedir = (cuerpo: unknown) =>
  POST(
    new Request("http://localhost/api/interpretar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    }),
  );

describe("sin credencial de LLM la capa no se activa, y lo dice", () => {
  it("responde 503 con el diagnóstico, sin lanzar", async () => {
    const resp = await pedir({ campo: "composicion_familiar", texto: "vivo con mi mamá" });

    expect(resp.status).toBe(503);
    expect(await resp.text()).toMatch(/Sin credencial de LLM/);
  });

  it("el diagnóstico nombra las variables, nunca sus valores (el repo es público)", async () => {
    process.env.GEMINI_API_KEY = "secreto-que-no-debe-salir";
    // Con key, ya no es 503; se restaura el escenario sin credencial.
    delete process.env.GEMINI_API_KEY;

    const texto = await (await pedir({ campo: "rango_edad", texto: "treinta y ocho" })).text();
    expect(texto).toContain("GEMINI_API_KEY=FALTA");
    expect(texto).not.toContain("secreto-que-no-debe-salir");
  });
});

describe("la petición se valida antes de gastar una llamada al modelo", () => {
  it("un campo fuera del menú es 400, no un 500", async () => {
    const resp = await pedir({ campo: "color_favorito", texto: "azul" });
    expect(resp.status).toBe(400);
  });

  it("la zona no es interpretable por IA: su intérprete nunca falla", async () => {
    const resp = await pedir({ campo: "zona_interes", texto: "por el norte" });
    expect(resp.status).toBe(400);
  });

  it("texto vacío es 400: no hay nada que interpretar", async () => {
    const resp = await pedir({ campo: "rango_edad", texto: "" });
    expect(resp.status).toBe(400);
  });

  it("un cuerpo que no es JSON es 400, no una excepción", async () => {
    const resp = await POST(
      new Request("http://localhost/api/interpretar", {
        method: "POST",
        body: "{ esto no es json",
      }),
    );
    expect(resp.status).toBe(400);
  });
});
