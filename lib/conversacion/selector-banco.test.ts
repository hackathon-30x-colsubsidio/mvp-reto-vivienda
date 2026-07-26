import { describe, expect, it } from "vitest";
import { dimensionesQueSeparan, seleccionarDelBanco } from "./selector-banco";
import { BANCO, bancoDisponible } from "./banco-preguntas";
import { catalogo } from "@/lib/matching/catalogo";
import type { FichaProyecto } from "@/lib/matching/tipos";
import type { Lead } from "@/lib/types";

// =====================================================================
// El selector escoge un id del banco; no escribe preguntas.
//
// Estos tests corren SIN credencial de Gemini, que es el caso que más
// importa: la capa tiene que fallar cerrada y dejar la conversación
// exactamente como está hoy. Lo que sí se prueba de verdad es la parte
// determinista —qué dimensión separa a los candidatos— porque es la que
// responde el §7 punto 9: qué le decimos al modelo que es "óptimo".
// =====================================================================

const LEAD: Lead = {
  evento: {
    lead_id: "sel-1",
    nombre: "Prueba Selector",
    celular: "3000000000",
    cedula: "1000000000",
    fuente: "meta",
  },
  perfil: { match: true, afiliado: true, ciudad: "Bogotá" },
  respuestas: {
    consentimiento: { otorgado: true, timestamp: "2026-07-26T08:00:00.000Z" },
    rango_ingreso_hogar: "6000000",
    ingreso_hogar_mensual: 6_000_000,
    tiene_vivienda: false,
    subsidios: [],
    situacion_crediticia: "buena",
    zona_interes: "Bogotá",
    rango_edad: "36_45",
    composicion_familiar: "familia_con_hijos",
  },
};

const ficha = (id: string) => catalogo.find((p) => p.proyecto_id === id)!;

describe("qué separa a los candidatos — la definición de 'óptimo' del punto 9", () => {
  it("una dimensión en la que todos coinciden NO separa", () => {
    // El mismo proyecto tres veces: no hay nada que preguntar.
    const iguales = [ficha("la-arboleda"), ficha("la-arboleda"), ficha("la-arboleda")];
    const opciones = dimensionesQueSeparan(BANCO, iguales);

    for (const o of opciones) {
      expect(o.separa, `${o.pregunta.id} dice separar y son idénticos`).toBe(0);
    }
  });

  it("con proyectos distintos, alguna dimensión sí separa", () => {
    const distintos = [ficha("la-arboleda"), ficha("karakali"), ficha("vibo-once")];
    const opciones = dimensionesQueSeparan(BANCO, distintos);
    expect(opciones.some((o) => o.separa > 0)).toBe(true);
  });

  it("`momento` nunca separa, y el hecho lo dice", () => {
    const distintos = [ficha("la-arboleda"), ficha("karakali")];
    const momento = dimensionesQueSeparan(BANCO, distintos).find(
      (o) => o.pregunta.id === "momento",
    )!;
    expect(momento.separa).toBe(0);
    expect(momento.hecho).toMatch(/no cambia qué proyectos/i);
  });

  it("cada opción llega con un hecho legible, no solo un número", () => {
    const opciones = dimensionesQueSeparan(BANCO, [ficha("la-arboleda"), ficha("karakali")]);
    for (const o of opciones) expect(o.hecho.length).toBeGreaterThan(20);
  });

  it("un solo candidato no separa nada: no hay orden que cambiar", () => {
    const opciones = dimensionesQueSeparan(BANCO, [ficha("la-arboleda")]);
    expect(opciones.every((o) => o.separa === 0 || o.pregunta.id === "alcobas")).toBe(true);
  });
});

describe("falla cerrada", () => {
  it("sin credencial de Gemini no escoge nada", async () => {
    // El entorno de test no tiene GEMINI_API_KEY: `generarJSON` devuelve null.
    await expect(seleccionarDelBanco(LEAD)).resolves.toBeUndefined();
  });

  it("si ya contestó todo el banco, no hay nada que escoger", async () => {
    const completo: Lead = {
      ...LEAD,
      respuestas: {
        ...LEAD.respuestas,
        alcobas_deseadas: 2,
        amenidades_interes: ["gimnasio"],
        espacio_preferido: "amplio",
        momento_compra: "explorando",
      },
    };
    expect(bancoDisponible(completo.respuestas)).toHaveLength(0);
    await expect(seleccionarDelBanco(completo)).resolves.toBeUndefined();
  });

  it("a quien cae en nutrición no se le pregunta nada más", async () => {
    // Sin proyectos que reordenar, la pregunta no le compra nada a nadie.
    const sinPlata: Lead = {
      ...LEAD,
      respuestas: { ...LEAD.respuestas, ingreso_hogar_mensual: 800_000 },
    };
    await expect(seleccionarDelBanco(sinPlata)).resolves.toBeUndefined();
  });
});

describe("el contrato con el banco", () => {
  it("solo se ofrecen preguntas sin contestar (criterio 1, versión banco)", () => {
    const conAlcobas = { ...LEAD.respuestas, alcobas_deseadas: 2 as const };
    const ids = bancoDisponible(conAlcobas).map((p) => p.id);
    expect(ids).not.toContain("alcobas");
    expect(ids.length).toBe(BANCO.length - 1);
  });

  it("cada pregunta ofrecida trae su `paraQueSirve` para el prompt", () => {
    const candidatos: FichaProyecto[] = [ficha("la-arboleda"), ficha("karakali")];
    for (const o of dimensionesQueSeparan(BANCO, candidatos)) {
      expect(o.pregunta.paraQueSirve.length).toBeGreaterThan(40);
    }
  });
});
