import { describe, expect, it } from "vitest";
import type { PerfilConocido } from "@/lib/types";
import { replayEscenario, type Turno } from "./replay";

// =====================================================================
// LA RED, NIVEL 2 — conversaciones completas.
//
// Protege el refactor de la rama 5: cuando la lógica salga de
// `ChatWhatsApp.tsx` al reducer, estas afirmaciones tienen que seguir
// dando lo mismo. Lo que se fija aquí es la COMPOSICIÓN — quién gana
// entre el desvío y el paso, cuándo avanza el índice, qué llega al
// `Lead` al final — que es justo lo que hoy no se puede probar sin
// montar React.
//
// ⚠️ CONGELA EL COMPORTAMIENTO ACTUAL, NO EL DESEADO.
// =====================================================================

const SIN_DATOS: PerfilConocido = { match: false };
const CONOCIDO: PerfilConocido = {
  match: true,
  afiliado: true,
  ciudad: "Bogotá",
  rango_ingreso: "3-5 SMMLV",
  rango_edad: "36_45",
};

/** Las 7 respuestas que llenan todo, para el perfil sin datos. */
const LIMPIAS = [
  "sería la primera",
  "con mi pareja",
  "4.500.000",
  "ninguno",
  "tengo 29",
  "al día",
  "Bogotá, por el norte",
];

const tipos = (turnos: Turno[]) => turnos.map((t) => t.tipo);

// ── el camino feliz ────────────────────────────────────────

describe("conversación limpia", () => {
  const r = replayEscenario({ perfil: SIN_DATOS, tecleado: LIMPIAS });

  it("hace las 7 preguntas y las cierra todas", () => {
    expect(r.pasos).toHaveLength(7);
    expect(tipos(r.turnos)).toEqual(Array(7).fill("respondio"));
    expect(r.pasoPendiente).toBeNull();
    expect(r.camposVacios).toEqual([]);
  });

  it("deja el Lead que el motor necesita", () => {
    expect(r.respuestas).toMatchObject({
      tiene_vivienda: false,
      composicion_familiar: "pareja",
      ingreso_hogar_mensual: 4_500_000,
      subsidios: [],
      rango_edad: "20_35",
      situacion_crediticia: "buena",
      zona_interes: "Bogotá",
    });
  });

  it("cada respuesta recibe su acuse — es lo que separa conversar de encuestar", () => {
    for (const turno of r.turnos) {
      expect(turno.tipo).toBe("respondio");
      if (turno.tipo === "respondio") expect(turno.acuse).toBeTruthy();
    }
  });
});

// ── lo que ya funciona bien y hay que no romper ────────────

describe("desvíos: se atiende la duda y NO se pierde el paso", () => {
  const r = replayEscenario({
    perfil: SIN_DATOS,
    tecleado: ["¿cuánto cuesta ZARZAL?", "quiero hablar con alguien", ...LIMPIAS],
  });

  it("el desvío no consume la pregunta pendiente", () => {
    expect(tipos(r.turnos)).toEqual([
      "desvio_duda",
      "desvio_asesor",
      ...Array(7).fill("respondio"),
    ]);
  });

  it("el Lead sale igual de completo que sin desvíos", () => {
    expect(r.camposVacios).toEqual([]);
    expect(r.respuestas).toEqual(
      replayEscenario({ perfil: SIN_DATOS, tecleado: LIMPIAS }).respuestas,
    );
  });

  it("la duda de precio se responde con el catálogo real y su 'desde'", () => {
    const duda = r.turnos[0];
    expect(duda.tipo).toBe("desvio_duda");
    if (duda.tipo !== "desvio_duda") return;
    expect(duda.clase).toBe("precio");
    expect(duda.proyecto).toBe("ZARZAL");
    // Sin LLM la respuesta ya es correcta sola: el demo no depende de la IA.
    expect(duda.respuesta).toContain("ZARZAL");
    expect(duda.respuesta).toMatch(/desde/i);
  });
});

describe("el ingreso se confirma antes de calificar con él", () => {
  it("repregunta una vez y a la segunda sigue, sin inventar el monto", () => {
    const r = replayEscenario({
      perfil: SIN_DATOS,
      tecleado: [
        "sería la primera",
        "con mi pareja",
        "2+2",
        "2+2",
        "ninguno",
        "tengo 29",
        "al día",
        "Bogotá",
      ],
    });

    expect(tipos(r.turnos)).toEqual([
      "respondio",
      "respondio",
      "repregunta", // insistir una vez es cuidado
      "respondio", // insistir dos veces sería interrogar
      "respondio",
      "respondio",
      "respondio",
      "respondio",
    ]);
    // El texto crudo llega al asesor; el número NO se adivina.
    expect(r.respuestas.rango_ingreso_hogar).toBe("2+2");
    expect(r.respuestas.ingreso_hogar_mensual).toBeUndefined();
  });
});

describe("criterio de aceptación 1 — no se repregunta lo que ya sabemos", () => {
  const r = replayEscenario({
    perfil: CONOCIDO,
    tecleado: ["sería la primera", "con mi pareja", "ninguno", "al día"],
  });

  it("a quien reconocimos por su cédula se le pregunta menos", () => {
    expect(r.pasos.map((p) => p.campo)).toEqual([
      "tiene_vivienda",
      "composicion_familiar",
      "subsidios",
      "situacion_crediticia",
    ]);
  });

  it("el motor igual recibe ingreso y edad, desde el perfil", () => {
    // Punto medio de "3-5 SMMLV" — la conversación nunca los preguntó.
    expect(r.respuestas.ingreso_hogar_mensual).toBe(4 * 1_750_905);
    expect(r.respuestas.rango_edad).toBe("36_45");
  });

  // El completado desde el perfil pasa en `terminar()`, o sea SOLO al
  // consumir el último paso. Quien abandona a mitad no tiene ingreso,
  // aunque su cédula lo trajera. Si esto se relaja, un escenario de
  // abandono mentiría sobre qué se alcanzó a saber del lead.
  it("pero solo al terminar: quien abandona a mitad no lo recibe", () => {
    const aMedias = replayEscenario({
      perfil: CONOCIDO,
      tecleado: ["sería la primera", "con mi pareja"],
    });
    expect(aMedias.pasoPendiente).toBe("subsidios");
    expect(aMedias.respuestas.ingreso_hogar_mensual).toBeUndefined();
    expect(aMedias.respuestas.rango_edad).toBeUndefined();
  });
});

describe("el campo vacío no hace nada", () => {
  it("ni avanza el paso ni ensucia el hilo", () => {
    const r = replayEscenario({ perfil: SIN_DATOS, tecleado: ["", "   ", "sería la primera"] });
    expect(tipos(r.turnos)).toEqual(["ignorado", "ignorado", "respondio"]);
    expect(r.pasoPendiente).toBe("composicion_familiar");
  });
});

// ── los huecos, medidos ────────────────────────────────────

describe("HOY una conversación sucia termina normal y pierde datos", () => {
  // Todas las respuestas son plausibles: así contesta la gente de
  // verdad. Ninguna es un sabotaje.
  const r = replayEscenario({
    perfil: SIN_DATOS,
    tecleado: [
      "pues no sé", // ya NO se lee como "primera vivienda"
      "vivo con mi mamá y mi hermana", // ⚠️ se pierde
      "2 palos",
      "no tngo nada",
      "jajaja", // ⚠️ se pierde
      "jajaja", // ⚠️ queda como "nunca pidió crédito"
      "cerca al colegio de los niños", // ⚠️ entra al matcher como ubicación
    ],
  });

  it("la conversación se completa sin una sola señal de alarma", () => {
    expect(tipos(r.turnos)).toEqual(Array(7).fill("respondio"));
    expect(r.pasoPendiente).toBeNull();
    // Y cada una recibió su acuse amable, así que la persona cree que
    // contestó todo.
    for (const t of r.turnos) if (t.tipo === "respondio") expect(t.acuse).toBeTruthy();
  });

  // ⚠️ BUG CONGELADO — el hueco 2 del plan, que sigue abierto: 3 de 7
  // campos se pierden en silencio, y alimentan la similitud con
  // compradores reales, o sea que el error llega hasta qué proyecto se
  // le recomienda. **Esto NO lo arregla el intérprete de IA de la rama
  // 4** (ese solo se activa cuando ya hay un `no_entendido`, y quién lo
  // atiende lo decide la rama 5). Cuando la rama 5 lo cierre, este test
  // falla — y esa falla es la señal de que se arregló.
  //
  // Nota del 2026-07-26: eran 2, ahora son 3. No es un retroceso: es
  // `tiene_vivienda` que dejó de INVENTAR un `false` y ahora se declara
  // vacío, honestamente. Perder el dato es mejor que afirmarlo falso.
  // Actualizado 2026-07-26: son 4, y el nuevo es `zona_interes`. NO es un
  // retroceso, es la otra mitad del mismo arreglo: "cerca al colegio de los
  // niños" dejó de guardarse como si fuera una ciudad, así que ahora se declara
  // vacío y el texto vive en `preferencias_libres`, donde el asesor lo lee.
  // Declararse vacío es mejor que llenar el campo con algo que el matcher va a
  // leer mal (le costaba una recomendación: 3 proyectos → 2).
  it("pierde 4 de los 7 campos, sin decírselo a nadie", () => {
    expect(r.camposVacios).toEqual([
      "tiene_vivienda",
      "composicion_familiar",
      "rango_edad",
      "zona_interes",
    ]);
    expect(r.respuestas.preferencias_libres).toEqual(["cerca al colegio de los niños"]);
  });

  // ✅ ARREGLADO 2026-07-26 — era el peor de los seis. "pues no sé"
  // quedaba como `false`, o sea "primera vivienda": una afirmación sobre
  // la vida de alguien que esa persona nunca hizo, que le regalaba 5
  // puntos de 100 y ponía "No tiene vivienda propia" en la ficha del
  // asesor. Ahora no afirma nada.
  it("y ya NO afirma una vivienda que la persona nunca declaró", () => {
    expect(r.respuestas.tiene_vivienda).toBeUndefined();
  });
});

describe("HOY se puede preguntar sin límite y la conversación nunca avanza", () => {
  // ⚠️ BUG CONGELADO — no hay tope de desvíos. El plan lo cierra en la
  // rama 5: tras 3 seguidos sin avanzar, Sara ofrece asesor.
  it("cuatro dudas seguidas dejan el perfil en cero", () => {
    const r = replayEscenario({
      perfil: SIN_DATOS,
      tecleado: ["¿cuánto vale?", "¿y dónde queda?", "¿cuánto cuesta?", "¿cuánto vale eso?"],
    });

    expect(tipos(r.turnos)).toEqual(Array(4).fill("desvio_duda"));
    expect(r.pasoPendiente).toBe("tiene_vivienda");
    expect(r.camposVacios).toHaveLength(7);
  });
});

describe("HOY lo que no se detecta como desvío se traga como respuesta", () => {
  // ⚠️ BUG CONGELADO — `detectarDesvio` es conservador a propósito
  // (ante la duda, `null`), y el precio de eso es que una pregunta sin
  // signos o algo fuera de tema se consume como si fuera el dato que se
  // pidió. El plan lo cierra en la rama 2 con `fuera_de_tema`.
  it.each([
    ["q vale", "tiene_vivienda"],
    ["cuentame un chiste", "tiene_vivienda"],
  ])("'%s' se consume como respuesta a %s", (texto) => {
    const r = replayEscenario({ perfil: SIN_DATOS, tecleado: [texto] });
    expect(tipos(r.turnos)).toEqual(["respondio"]);
    expect(r.pasoPendiente).toBe("composicion_familiar");
  });

  // El caso más caro de los dos: "eres un bot?" SÍ se detecta como
  // desvío, pero cae a "general" y la respuesta determinista es "esa no
  // te la puedo confirmar". Hoy Sara no sabe decir que es una IA.
  // Es el punto 4 de la lista de consulta del plan.
  it("a '¿eres un bot?' hoy responde que no puede confirmarlo", () => {
    const r = replayEscenario({ perfil: SIN_DATOS, tecleado: ["eres un bot?"] });
    const turno = r.turnos[0];
    expect(turno.tipo).toBe("desvio_duda");
    if (turno.tipo !== "desvio_duda") return;
    expect(turno.clase).toBe("general");
    expect(turno.respuesta).toMatch(/no te la puedo confirmar/i);
  });
});
