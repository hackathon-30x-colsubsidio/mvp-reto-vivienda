import { describe, expect, it } from "vitest";
import { CAMPOS_PREGUNTA, INTERPRETACION_POR_CAMPO } from "./acciones";
import {
  accionDeCorreccion,
  accionDeTexto,
  accionDeValor,
  respuestaDeAccion,
  construirPreguntas,
} from "./preguntas";

// =====================================================================
// EL CONTRATO DEL TURNO.
//
// Dos obligaciones, y la segunda es la que hace seguro el refactor:
//
//   1. la acción NOMBRA lo que pasó, incluido el `no_entendido` que hasta
//      ayer era un `{patch:{}}` mudo;
//   2. traducida de vuelta a `Respuesta`, el chat contesta EXACTAMENTE lo
//      mismo que antes. Nada cambia en pantalla en esta rama.
// =====================================================================

describe("qué acción emite cada turno", () => {
  it("un dato entendido responde el paso y lo llena", () => {
    const accion = accionDeTexto("tiene_vivienda", "sería la primera");
    expect(accion).toMatchObject({ tipo: "responder_paso", campo: "tiene_vivienda" });
    expect(accion.tipo === "responder_paso" && accion.patch.tiene_vivienda).toBe(false);
  });

  // El hueco 2 del plan, con nombre por primera vez.
  it("lo que no se entiende ya no se disfraza de respuesta", () => {
    expect(accionDeTexto("composicion_familiar", "vivo con mi mamá y mi hermana")).toEqual({
      tipo: "no_entendido",
      campo: "composicion_familiar",
      textoCrudo: "vivo con mi mamá y mi hermana",
    });
  });

  // El ingreso no cae en `no_entendido`: es el insumo del único gate legal, así
  // que se confirma en vez de seguir (ticket 024).
  it("un ingreso ilegible pide confirmación, no se lo traga", () => {
    const accion = accionDeTexto("rango_ingreso_hogar", "no sé");
    expect(accion.tipo).toBe("confirmar_dato");
    expect(accion.tipo === "confirmar_dato" && accion.patch.rango_ingreso_hogar).toBe("no sé");
    expect(accion.tipo === "confirmar_dato" && accion.patch.ingreso_hogar_mensual).toBeUndefined();
  });

  it("la zona siempre responde el paso: nunca se queda sin nada", () => {
    for (const texto of ["Bogotá", "en Medellín", "cerca al colegio", "por allá arribita"]) {
      expect(accionDeTexto("zona_interes", texto).tipo).toBe("responder_paso");
    }
  });
});

describe("el mismo valor acusa igual, venga de donde venga", () => {
  // Si el chip, el texto libre y (rama 4) el modelo no comparten esta tabla, el
  // lead percibe dos autores en la misma conversación.
  it.each([
    ["tiene_vivienda", "ya tengo apartamento", true],
    ["composicion_familiar", "con mi pareja", "pareja"],
    ["situacion_crediticia", "estoy al día", "buena"],
    ["rango_edad", "tengo 29", "20_35"],
  ] as const)("%s", (campo, texto, valor) => {
    const porTexto = accionDeTexto(campo, texto);
    const porValor = accionDeValor(campo, valor, texto);
    expect(porTexto).toEqual(porValor);
  });

  it("y el ingreso lee el número en voz alta por los dos caminos", () => {
    const texto = "4.500.000";
    expect(accionDeTexto("rango_ingreso_hogar", texto)).toEqual(
      accionDeValor("rango_ingreso_hogar", 4_500_000, texto),
    );
  });
});

describe("la corrección: sobrescribe, acusa el cambio, no avanza", () => {
  it("cambia el dato del campo que ya se había respondido", () => {
    const accion = accionDeCorreccion("me equivoqué, son 3 millones", [
      "tiene_vivienda",
      "rango_ingreso_hogar",
    ]);
    expect(accion).toMatchObject({ tipo: "corregir_dato", campo: "rango_ingreso_hogar" });
    expect(accion?.patch.ingreso_hogar_mensual).toBe(3_000_000);
    // El ingreso se corrige leyendo el número: de él sale el gate del 40%.
    expect(accion?.acuse).toContain("$3.000.000");
  });

  it("corrige el último campo dado, que es lo que uno corrige de verdad", () => {
    const accion = accionDeCorreccion("quise decir que ya tengo casa", [
      "tiene_vivienda",
      "composicion_familiar",
    ]);
    expect(accion).toMatchObject({ tipo: "corregir_dato", campo: "tiene_vivienda" });
    expect(accion?.patch.tiene_vivienda).toBe(true);
    expect(accion?.acuse).toMatch(/lo corrijo/i);
  });

  it("sin marca explícita NO es corrección: se contestó la pregunta actual", () => {
    expect(accionDeCorreccion("con mi pareja", ["tiene_vivienda", "composicion_familiar"])).toBeNull();
    expect(accionDeCorreccion("4.000.000", ["rango_ingreso_hogar"])).toBeNull();
  });

  it("con marca pero sin campo que reconozca el texto, tampoco", () => {
    expect(accionDeCorreccion("me equivoqué de chat", ["tiene_vivienda"])).toBeNull();
  });

  it("no corrige lo que todavía no se ha preguntado", () => {
    expect(accionDeCorreccion("me equivoqué, son 3 millones", ["tiene_vivienda"])).toBeNull();
  });
});

describe("traducida de vuelta, la conversación de hoy queda intacta", () => {
  // Es el puente que la rama 5 va a retirar. Mientras exista, esto es lo que
  // garantiza que el refactor no se vea en pantalla.
  it("el `no_entendido` reproduce el acuse mudo de hoy, sin dato", () => {
    const respuesta = respuestaDeAccion(
      accionDeTexto("composicion_familiar", "vivo con mi mamá y mi hermana"),
    );
    expect(respuesta.patch).toEqual({});
    expect(respuesta.acuse).toBe("Listo, lo tengo presente para buscarte lo que mejor te quede.");
  });

  it("el `confirmar_dato` sale con repreguntar y su acuse de insistencia", () => {
    const respuesta = respuestaDeAccion(accionDeTexto("rango_ingreso_hogar", "no sé"));
    expect(respuesta.repreguntar).toBe(true);
    expect(respuesta.acuseSiInsiste).toBeTruthy();
  });

  it("cada paso de hoy sigue devolviendo un `Respuesta` usable", () => {
    for (const paso of construirPreguntas({ match: false })) {
      const respuesta = paso.interpretarTexto("cualquier cosa que no se entienda");
      expect(respuesta).toHaveProperty("patch");
    }
  });
});

describe("el menú cerrado con el que la rama 4 valida al modelo", () => {
  it("cubre los mismos campos que la conversación pregunta", () => {
    expect(Object.keys(INTERPRETACION_POR_CAMPO).sort()).toEqual([...CAMPOS_PREGUNTA].sort());
  });

  it("rechaza una categoría que el motor no sabe puntuar", () => {
    // El caso que le importa a la rama 4: el modelo se inventa un enum.
    expect(INTERPRETACION_POR_CAMPO.composicion_familiar.safeParse("con_mi_mama").success).toBe(
      false,
    );
    expect(INTERPRETACION_POR_CAMPO.composicion_familiar.safeParse("pareja").success).toBe(true);
    expect(INTERPRETACION_POR_CAMPO.rango_edad.safeParse("40_50").success).toBe(false);
  });

  it("el ingreso solo pasa como número, y la plausibilidad la pone `plausible()`", () => {
    expect(INTERPRETACION_POR_CAMPO.rango_ingreso_hogar.safeParse("4.500.000").success).toBe(false);
    expect(INTERPRETACION_POR_CAMPO.rango_ingreso_hogar.safeParse(4_500_000).success).toBe(true);
  });
});
