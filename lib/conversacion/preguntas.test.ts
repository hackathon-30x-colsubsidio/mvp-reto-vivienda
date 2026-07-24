import { describe, expect, it } from "vitest";
import type { PerfilConocido } from "@/lib/types";
import {
  construirPreguntas,
  mensajeYaSabemos,
  parsearIngresoMensual,
  type PasoPregunta,
} from "./preguntas";

const SIN_DATOS: PerfilConocido = { match: false };
const CONOCIDO: PerfilConocido = {
  match: true,
  afiliado: true,
  ciudad: "Bogotá",
  rango_ingreso: "3-5 SMMLV",
};

function paso(perfil: PerfilConocido, campo: PasoPregunta["campo"]): PasoPregunta {
  const encontrado = construirPreguntas(perfil).find((p) => p.campo === campo);
  if (!encontrado) throw new Error(`no existe el paso ${campo}`);
  return encontrado;
}

describe("parsearIngresoMensual", () => {
  // La lista sesga en el ingreso (mentor), así que el input es libre: el parser
  // tiene que entender cómo escribe la gente de verdad, no un formato.
  it.each([
    ["4.500.000", 4_500_000],
    ["$1.200.000", 1_200_000],
    ["1'500.000", 1_500_000],
    ["2 millones y medio", 2_500_000],
    ["4.5 millones", 4_500_000],
    ["entre 2 y 3 millones", 2_500_000],
    ["3 salarios mínimos", 3 * 1_423_500],
    ["3-5 SMMLV", 4 * 1_423_500],
    ["800 mil", 800_000],
    ["gano 3", 3_000_000], // forma corta de "3 millones" al preguntar cuánto entra al mes
  ])("entiende %s", (texto, esperado) => {
    expect(parsearIngresoMensual(texto)).toBe(esperado);
  });

  it.each([["no sé"], ["depende del mes"], ["800"]])(
    "no adivina cuando %s es ambiguo",
    (texto) => {
      expect(parsearIngresoMensual(texto)).toBeUndefined();
    },
  );
});

describe("construirPreguntas", () => {
  it("no repregunta lo que trajo el enriquecimiento", () => {
    const campos = construirPreguntas(CONOCIDO).map((p) => p.campo);
    expect(campos).not.toContain("rango_ingreso_hogar");
    expect(campos).not.toContain("zona_interes");
  });

  it("pregunta todo cuando la cédula no hizo match", () => {
    const campos = construirPreguntas(SIN_DATOS).map((p) => p.campo);
    expect(campos).toContain("rango_ingreso_hogar");
    expect(campos).toContain("zona_interes");
  });

  // D4 del spec 02, cerrado por el mentor: hay que tener las dos opciones
  // siempre, porque unas personas escogen y otras escriben.
  it("acepta texto libre en todos los pasos", () => {
    for (const p of construirPreguntas(SIN_DATOS)) {
      expect(typeof p.interpretarTexto).toBe("function");
      expect(p.placeholder.length).toBeGreaterThan(0);
    }
  });

  // Donde la lista sesga no puede haber chips: "si tú dices que ganas 500.000,
  // el listado no tiene esa opción".
  it("no pone opciones cerradas en ingreso ni en zona", () => {
    expect(paso(SIN_DATOS, "rango_ingreso_hogar").opciones).toBeUndefined();
    expect(paso(SIN_DATOS, "zona_interes").opciones).toBeUndefined();
  });

  it("da atajos donde la lista no sesga", () => {
    expect(paso(SIN_DATOS, "tiene_vivienda").opciones?.length).toBeGreaterThan(1);
    expect(paso(SIN_DATOS, "subsidios").opciones?.length).toBeGreaterThan(1);
    expect(paso(SIN_DATOS, "situacion_crediticia").opciones?.length).toBeGreaterThan(1);
  });

  it("reacciona a cada respuesta en vez de saltar a la siguiente pregunta", () => {
    for (const p of construirPreguntas(SIN_DATOS)) {
      for (const opcion of p.opciones ?? []) {
        expect(opcion.acuse).toBeTruthy();
      }
    }
  });
});

describe("mensajeYaSabemos", () => {
  // Criterio 1: el lead tiene que SABER que no le vamos a repreguntar…
  it("le dice que no le vamos a hacer repetir lo que ya dio", () => {
    expect(mensajeYaSabemos(CONOCIDO, "Diana Marcela Ríos")).toMatch(/no te voy a hacer repetir/i);
  });

  // …pero recitarle su ficha suena a expediente y asusta. El ingreso es el
  // dato más sensible: no se menciona nunca, ni en pesos ni en salarios.
  it("no le recita sus propios datos, y menos el ingreso", () => {
    const mensaje = mensajeYaSabemos(CONOCIDO, "Diana Marcela Ríos");
    expect(mensaje).not.toMatch(/SMMLV|salarios|ingreso/i);
    expect(mensaje).not.toContain(CONOCIDO.rango_ingreso!);
    expect(mensaje).not.toMatch(/afiliad/i);
  });

  it("usa la ciudad en vez de recitarla, para demostrar que la conoce", () => {
    expect(mensajeYaSabemos(CONOCIDO, "Diana Marcela Ríos")).toContain("opciones en Bogotá");
  });

  it("es honesto cuando la cédula no hizo match", () => {
    expect(mensajeYaSabemos(SIN_DATOS, "Yuliana Andrea Pérez")).toMatch(/arrancamos de cero/i);
  });
});

describe("interpretación del texto libre", () => {
  it("escribir vale lo mismo que tocar el chip — vivienda", () => {
    const vivienda = paso(SIN_DATOS, "tiene_vivienda");
    expect(vivienda.interpretarTexto("sería la primera").patch.tiene_vivienda).toBe(false);
    expect(vivienda.interpretarTexto("vivo en arriendo").patch.tiene_vivienda).toBe(false);
    expect(vivienda.interpretarTexto("ya tengo apartamento").patch.tiene_vivienda).toBe(true);
  });

  it("normaliza la situación crediticia al enum que espera el motor", () => {
    const credito = paso(SIN_DATOS, "situacion_crediticia");
    expect(credito.interpretarTexto("estoy al día con todo").patch.situacion_crediticia).toBe("buena");
    expect(credito.interpretarTexto("tengo una mora").patch.situacion_crediticia).toBe("mala");
    expect(credito.interpretarTexto("estoy saliendo de un reporte").patch.situacion_crediticia).toBe("regular");
    expect(credito.interpretarTexto("nunca he pedido crédito").patch.situacion_crediticia).toBe("sin_info");
  });

  it("guarda el ingreso como texto y, si se puede, también como número", () => {
    const ingreso = paso(SIN_DATOS, "rango_ingreso_hogar");
    const claro = ingreso.interpretarTexto("como 4 millones entre los dos");
    expect(claro.patch.rango_ingreso_hogar).toBe("como 4 millones entre los dos");
    expect(claro.patch.ingreso_hogar_mensual).toBe(4_000_000);

    const ambiguo = ingreso.interpretarTexto("depende del mes");
    expect(ambiguo.patch.rango_ingreso_hogar).toBe("depende del mes");
    expect(ambiguo.patch.ingreso_hogar_mensual).toBeUndefined();
  });

  it("entiende que no tener subsidio es una respuesta válida", () => {
    const subsidios = paso(SIN_DATOS, "subsidios");
    expect(subsidios.interpretarTexto("ninguno").patch.subsidios).toEqual([]);
    expect(subsidios.interpretarTexto("no sé si aplico").patch.subsidios).toEqual([
      "Por confirmar",
    ]);
  });
});
