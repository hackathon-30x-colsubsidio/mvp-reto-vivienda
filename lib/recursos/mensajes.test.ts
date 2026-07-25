import { describe, expect, it } from "vitest";
import { mensajeDeRecursos, mensajeRecursoListo } from "./mensajes";
import type { RecursoRecomendado } from "../types";

const afiliacion: RecursoRecomendado = {
  recurso_id: "afiliacion",
  nombre: "Afiliación a Colsubsidio como independiente",
  url: "https://www.colsubsidio.com/afiliaciones/modalidades/independiente",
  tipo: "colsubsidio",
  factor_disparador: "afiliacion",
  porque: "No eres afiliado, afiliarte abre el subsidio.",
};

const educacion: RecursoRecomendado = {
  recurso_id: "educacion_financiera_habitat",
  nombre: "Educación e Inclusión Financiera — Secretaría del Hábitat",
  url: "https://habitatbogota.gov.co/",
  tipo: "aliado_externo",
  factor_disparador: "situacion_crediticia",
  porque: "Mejorar tu historial te acerca al crédito.",
};

describe("mensajeDeRecursos — moldes al lead", () => {
  it("sin recursos, no arma mensaje (el chat no muestra nada vacío)", () => {
    expect(mensajeDeRecursos("Diana Ríos", "listo", [])).toBeNull();
    expect(mensajeDeRecursos("Diana Ríos", "listo", undefined)).toBeNull();
  });

  it("un listo con recurso: el molde dice EXPLÍCITO que un asesor lo contacta", () => {
    const msg = mensajeDeRecursos("Carlos Andrés Muñoz", "listo_restriccion_cupo", [afiliacion])!;
    expect(msg).toMatch(/asesor/i);
    expect(msg).toContain(afiliacion.url);
  });

  it("nutrición con recurso: nunca se lee como rechazo", () => {
    const msg = mensajeDeRecursos("Yuliana Pérez", "nutricion", [afiliacion, educacion])!;
    // Regla de tono no negociable: jamás "no calificaste" ni "descartad".
    expect(msg.toLowerCase()).not.toMatch(/no calific|descartad|rechaz/);
    // Y sí dice que le escribimos cuando cambie: es nutrición, no adiós.
    expect(msg).toMatch(/te escribimos|escribimos/i);
  });

  it("un recurso externo se rotula como aliado externo, no como oferta propia", () => {
    const msg = mensajeRecursoListo("Yuliana Pérez", [educacion]);
    expect(msg).toMatch(/aliado externo/i);
  });
});
