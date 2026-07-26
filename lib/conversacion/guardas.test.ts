import { describe, expect, it } from "vitest";
import { frasesDe, notaSistemaGuard, postGuard } from "./guardas";
import {
  construirPreguntas,
  mensajeAfiliacion,
  mensajeAutorizacion,
  mensajeCierre,
  mensajeReenganche,
  mensajeSaludo,
  mensajeSinAutorizacion,
  mensajeYaSabemos,
  preguntasDeReenganche,
} from "./preguntas";
import {
  mensajeHandoffAsesor,
  repreguntar,
  respuestaDeterministaDuda,
} from "./desvio";
import { catalogo } from "@/lib/matching/catalogo";
import type { PerfilConocido } from "@/lib/types";

// =====================================================================
// El guard tiene DOS obligaciones, y la segunda pesa más que la primera:
//
//   1. atrapar lo que el modelo no puede decir;
//   2. NO tocar NADA de lo que el equipo escribió a mano.
//
// Por eso el bloque grande de este archivo es el barrido: TODOS los
// mensajes reales del repo pasan por el guard y tienen que salir
// idénticos y en `ok`. Un guard con falsos positivos es peor que no
// tener guard — le quita el pulido del LLM a la conversación entera y
// nadie se entera, porque el fallback se ve bien.
// =====================================================================

const ARBOLEDA = catalogo.find((p) => p.nombre === "LA ARBOLEDA")!;
const DIANA = { nombre: "Diana Marcela Ríos" };

describe("bloquea · recita_datos_lead", () => {
  it("leerle su ingreso de vuelta cuando la base no lo hacía", () => {
    const r = postGuard(
      "Con lo que ganas al mes te alcanza de sobra, quédate tranquila.",
      "Listo, ya lo tengo en cuenta para buscarte opciones.",
      DIANA,
    );
    expect(r.severidad).toBe("bloquea");
    expect(r.violaciones).toContain("recita_datos_lead");
    expect(r.textoFinal).toBe("Listo, ya lo tengo en cuenta para buscarte opciones.");
  });

  it("NO bloquea cuando la base ya hablaba de eso, aunque el modelo lo parafrasee", () => {
    const base =
      "Última de las incómodas y te dejo en paz 🙏 ¿Cómo va tu vida crediticia hoy?";
    const r = postGuard(
      "Última y te dejo en paz 🙏 ¿Cómo va tu historial de crédito hoy?",
      base,
      DIANA,
    );
    expect(r.severidad).toBe("ok");
  });

  it("la ciudad NO es recitar: se usa a propósito (mensajeYaSabemos:723)", () => {
    const r = postGuard(
      "Gracias 🙌 Arranco buscándote opciones en Bogotá y te pregunto solo lo que falte.",
      "Gracias 🙌 Lo que ya nos habías dado está acá conmigo, así que te pregunto solo lo que falte.",
      DIANA,
    );
    expect(r.severidad).toBe("ok");
  });
});

describe("bloquea · cifra_inventada", () => {
  it("una cuota que nadie calculó", () => {
    const r = postGuard(
      `${ARBOLEDA.nombre} está desde $194.023.050 y la cuota te queda en $1.200.000 al mes.`,
      `${ARBOLEDA.nombre} está desde $194.023.050 en Bogotá.`,
      DIANA,
    );
    expect(r.severidad).toBe("bloquea");
    expect(r.violaciones).toContain("cifra_inventada");
  });

  it("una fecha de entrega inventada", () => {
    const r = postGuard(
      "Te cuadro la visita para el 15 de marzo, tranquila.",
      "El asesor te cuadra la visita.",
      DIANA,
    );
    expect(r.violaciones).toContain("cifra_inventada");
  });

  it("un porcentaje que la base no trae", () => {
    const r = postGuard(
      "Con eso financias hasta el 80% de la vivienda.",
      "Con eso ya puedo hacer cuentas.",
      DIANA,
    );
    expect(r.violaciones).toContain("cifra_inventada");
  });

  it("NO bloquea la misma cifra escrita como la escribe la gente", () => {
    const r = postGuard(
      "Hago las cuentas con 4 millones y medio al mes, ¿va?",
      "Entonces hago las cuentas con $4.500.000 al mes.",
      DIANA,
    );
    expect(r.severidad).toBe("ok");
  });

  it("NO bloquea un precio del catálogo: el prompt de duda se lo da para consultar", () => {
    const otro = catalogo.find((p) => p.nombre === "ZARZAL")!;
    const r = postGuard(
      `Ese arranca desde $${otro.precio_desde.toLocaleString("es-CO")}.`,
      "Ese precio te lo confirmo en un momento.",
      { ...DIANA, proyectosPermitidos: [otro.nombre] },
    );
    expect(r.severidad).toBe("ok");
  });

  it("NO bloquea números pequeños que no son promesa", () => {
    const r = postGuard(
      "Son 3 preguntas cortas y te dejo en paz, ¿te parece?",
      "Son unas preguntas cortas, nada de formulario eterno.",
      DIANA,
    );
    expect(r.severidad).toBe("ok");
  });

  // ── El porcentaje que el motor sí calculó ──────────────────────────
  //
  // Defecto de integración medido el 2026-07-26 (bitácora del plan, rama 5):
  // el `porque` del matcher está lleno de porcentajes de la similitud ("el 63%
  // de quienes compraron ahí son afiliados"), el prompt de la recomendación le
  // pide a Sara que los diga, y `cifrasPermitidas` los autorizaba **solo como
  // monto**. Resultado: `cifra_inventada` bloqueaba casi toda recomendación
  // redactada por la IA y el lead veía siempre el texto determinista.
  it("NO bloquea un porcentaje que el motor calculó y el turno autorizó", () => {
    const r = postGuard(
      "Te sirve LA ARBOLEDA: el 63% de quienes compraron ahí son afiliados, como tú.",
      "Te sirve LA ARBOLEDA. El asesor te lleva el detalle.",
      { ...DIANA, proyectosPermitidos: [ARBOLEDA.nombre], cifrasPermitidas: [63] },
    );
    expect(r.severidad).toBe("ok");
  });

  it("SIGUE bloqueando un porcentaje que el turno NO autorizó", () => {
    const r = postGuard(
      "Te sirve LA ARBOLEDA: el 91% de quienes compraron ahí son afiliados, como tú.",
      "Te sirve LA ARBOLEDA. El asesor te lleva el detalle.",
      { ...DIANA, proyectosPermitidos: [ARBOLEDA.nombre], cifrasPermitidas: [63] },
    );
    expect(r.violaciones).toContain("cifra_inventada");
  });

  // La fecha es la promesa más cara y la única que no se ensancha: autorizar el
  // número 15 para hablar de plata no autoriza prometer el 15 de marzo.
  it("una cifra autorizada NO autoriza una fecha con el mismo número", () => {
    const r = postGuard(
      "Te cuadro la visita para el 15 de marzo, tranquila.",
      "El asesor te cuadra la visita.",
      { ...DIANA, cifrasPermitidas: [15] },
    );
    expect(r.violaciones).toContain("cifra_inventada");
  });
});

describe("bloquea · recomienda_sin_motor", () => {
  it("nombrar un proyecto que el motor no eligió", () => {
    const r = postGuard(
      `${ARBOLEDA.nombre} está desde ese precio, aunque yo miraría ZARZAL que te queda mejor.`,
      `${ARBOLEDA.nombre} está desde $194.023.050 en Bogotá.`,
      { ...DIANA, proyectosPermitidos: [ARBOLEDA.nombre] },
    );
    expect(r.severidad).toBe("bloquea");
    expect(r.violaciones).toContain("recomienda_sin_motor");
  });

  it("NO bloquea el que sí viene del motor, aunque no esté en la base", () => {
    const r = postGuard(
      "Uno de los que te voy a mostrar es ZARZAL, en Bogotá.",
      "Ya te armo las opciones que te sirven de verdad.",
      { ...DIANA, proyectosPermitidos: ["ZARZAL"] },
    );
    expect(r.severidad).toBe("ok");
  });
});

describe("bloquea · suplanta_humano", () => {
  it("decir que es una persona", () => {
    const r = postGuard(
      "Tranquila, no soy un bot: soy una persona real del equipo.",
      "Soy Sara, del equipo de Vivienda de Colsubsidio.",
      DIANA,
    );
    expect(r.severidad).toBe("bloquea");
    expect(r.violaciones).toContain("suplanta_humano");
  });

  it("NO bloquea el asesor 'de carne y hueso' del handoff", () => {
    const base = mensajeHandoffAsesor("Diana Marcela Ríos");
    const r = postGuard(base, base, DIANA);
    expect(r.severidad).toBe("ok");
  });
});

describe("limpia · nombre_agregado", () => {
  it("quita el vocativo que la base no traía, sin dejar la coma coja", () => {
    const r = postGuard(
      "Perfecto, Diana, entonces sigamos.",
      "Perfecto, entonces sigamos.",
      DIANA,
    );
    expect(r.severidad).toBe("limpia");
    expect(r.violaciones).toContain("nombre_agregado");
    expect(r.textoFinal).toBe("Perfecto, entonces sigamos.");
  });

  it.each([
    ["¡Hola, Diana! ¿Cómo vas?", "¡Hola! ¿Cómo vas?"],
    ["Diana, cuéntame una cosa.", "cuéntame una cosa."],
  ])("las otras formas del vocativo: %s", (texto, esperado) => {
    expect(postGuard(texto, "Cuéntame una cosa.", DIANA).textoFinal).toBe(esperado);
  });

  // El bug que este bloque fija: `\b` de JavaScript no cuenta la `ñ` ni las
  // vocales con tilde como letra, así que `/\bJosé\b/` NUNCA casa. La regla
  // era ciega a José, Andrés, Iván y Nicolás, y pasaba los tests porque los
  // tres personajes del demo no llevan tilde en el primer nombre.
  it.each([
    ["José Luis Álvarez", "Claro, José, con eso sigo.", "Claro, con eso sigo."],
    ["Andrés Felipe Gil", "¡Hola, Andrés! ¿Cómo vas?", "¡Hola! ¿Cómo vas?"],
    ["Iván Muñoz", "Iván, cuéntame una cosa.", "cuéntame una cosa."],
  ])("el nombre con tilde también se quita: %s", (nombre, texto, esperado) => {
    const r = postGuard(texto, "Cuéntame una cosa.", { nombre });
    expect(r.violaciones).toContain("nombre_agregado");
    expect(r.textoFinal).toBe(esperado);
  });

  it("un nombre que es prefijo de otra palabra no se toca", () => {
    // Sin la frontera explícita, "Ana" se comería el de "Analiza".
    const r = postGuard("Analiza bien la opción.", "Analiza bien la opción.", {
      nombre: "Ana María",
    });
    expect(r.severidad).toBe("ok");
  });

  it("NO toca el nombre cuando la base ya lo trae", () => {
    const base = mensajeSaludo("Diana Marcela Ríos");
    const r = postGuard(base, base, DIANA);
    expect(r.severidad).toBe("ok");
  });
});

describe("limpia · formato_whatsapp", () => {
  it("markdown, viñetas y meta-comentario", () => {
    const r = postGuard(
      "Aquí tienes el mensaje:\n- **Primero** esto\n- Después lo otro",
      "Cuéntame una cosa.",
      DIANA,
    );
    expect(r.violaciones).toContain("formato_whatsapp");
    expect(r.textoFinal).not.toMatch(/[*#]|^-/m);
    expect(r.textoFinal).not.toMatch(/Aquí tienes/i);
  });

  it("las comillas que envuelven el mensaje entero", () => {
    const r = postGuard('"Listo, lo tengo en cuenta."', "Listo, lo tengo en cuenta.", DIANA);
    expect(r.textoFinal).toBe("Listo, lo tengo en cuenta.");
  });

  it("NO toca las comillas internas legítimas del precio", () => {
    const base = respuestaDeterministaDuda({
      tipo: "duda",
      clase: "precio",
      proyecto: ARBOLEDA,
    });
    const r = postGuard(base, base, DIANA);
    expect(r.severidad).toBe("ok");
    expect(r.textoFinal).toContain('"desde"');
  });
});

describe("limpia · exceso_emojis", () => {
  it("deja el primero y borra el resto", () => {
    const r = postGuard(
      "¡Eso suma! 🙌 Un subsidio baja la cuota de verdad 💪 en serio 🎉",
      "¡Eso suma! 🙌 Un subsidio baja la cuota mensual de verdad.",
      DIANA,
    );
    expect(r.violaciones).toContain("exceso_emojis");
    expect(r.textoFinal.match(/\p{Extended_Pictographic}/gu)?.length).toBe(1);
    expect(r.textoFinal).toContain("🙌");
  });

  it("el tope es relativo a la base: mensajeSaludo trae dos y no pierde ninguno", () => {
    const base = mensajeSaludo("Diana Marcela Ríos", ARBOLEDA.nombre);
    const r = postGuard(base, base, DIANA);
    expect(r.severidad).toBe("ok");
    expect(r.textoFinal).toBe(base);
  });
});

describe("limpia · exceso_lineas", () => {
  it("trunca a 4 frases", () => {
    const r = postGuard(
      "Uno. Dos. Tres. Cuatro. Cinco. Seis.",
      "Uno.",
      DIANA,
    );
    expect(r.violaciones).toContain("exceso_lineas");
    expect(frasesDe(r.textoFinal)).toHaveLength(4);
    expect(r.textoFinal).toBe("Uno. Dos. Tres. Cuatro.");
  });

  it("conserva la última frase cuando es la pregunta del paso", () => {
    const r = postGuard(
      "Mira. Te cuento algo. Y algo más. Y otra cosa. Y una más. ¿Con quién la compartirías?",
      "¿Con quién la compartirías?",
      DIANA,
    );
    expect(r.textoFinal).toMatch(/¿Con quién la compartirías\?$/);
    expect(frasesDe(r.textoFinal)).toHaveLength(4);
  });

  it("más de 3 líneas se vuelven prosa de WhatsApp", () => {
    const r = postGuard("Uno.\nDos.\nTres.\nCuatro.", "Uno.", DIANA);
    expect(r.violaciones).toContain("exceso_lineas");
    expect(r.textoFinal).not.toContain("\n");
  });

  it("NO trunca las 4 frases exactas de mensajeReenganche", () => {
    const base = mensajeReenganche("Diana Marcela Ríos", "gate_40");
    const r = postGuard(base, base, DIANA);
    expect(r.severidad).toBe("ok");
    expect(r.textoFinal).toBe(base);
  });
});

describe("frasesDe no parte los pesos colombianos", () => {
  it("$4.500.000 es una cifra, no tres frases", () => {
    expect(frasesDe("Hago las cuentas con $4.500.000 al mes.")).toHaveLength(1);
  });

  it("reconstruye el texto exacto", () => {
    const texto = mensajeAutorizacion();
    expect(frasesDe(texto).join("")).toBe(texto);
  });
});

describe("la fila sistema del hilo", () => {
  it("cuando bloquea, nombra la regla y dice qué se pintó", () => {
    const r = postGuard(
      "La cuota te queda en $1.200.000.",
      "El asesor te confirma la cuota.",
      DIANA,
    );
    const nota = notaSistemaGuard(r);
    expect(nota).toContain("regla: cifra_inventada");
    expect(nota).toMatch(/nunca vio la versión bloqueada/);
  });

  it("el aseo de formato puro NO ocupa el hilo: va solo a log", () => {
    const r = postGuard("**Listo**, lo tengo en cuenta.", "Listo, lo tengo en cuenta.", DIANA);
    expect(r.violaciones).toEqual(["formato_whatsapp"]);
    expect(notaSistemaGuard(r)).toBeNull();
  });

  it("truncar sí deja rastro: borra contenido", () => {
    const r = postGuard("Uno. Dos. Tres. Cuatro. Cinco.", "Uno.", DIANA);
    expect(notaSistemaGuard(r)).toContain("exceso_lineas");
  });

  it("sin violaciones no hay nota", () => {
    expect(notaSistemaGuard(postGuard("Listo.", "Listo.", DIANA))).toBeNull();
  });
});

// =====================================================================
// EL BARRIDO. Todo lo que el lead lee hoy, tal cual sale de `preguntas.ts`
// y de `desvio.ts`, pasa por el guard. Tiene que salir idéntico.
//
// Esto cubre además el caso más frecuente en producción: cuando el LLM no
// contesta (sin key, timeout de 3 s, lambda frío), `agregarBot` pinta el
// determinista y el guard lo ve con `texto === textoBase`. Si aquí hubiera
// un falso positivo, el guard estaría corrigiendo al equipo.
// =====================================================================

function mensajesReales(): { nombre: string; texto: string }[] {
  const NOMBRE = "Diana Marcela Ríos";
  const textos: string[] = [];

  const perfiles: PerfilConocido[] = [
    { match: false },
    { match: true },
    { match: true, ciudad: "Bogotá" },
    { match: true, ciudad: "Bogotá", rango_ingreso: "2-4 SMMLV", rango_edad: "20_35" },
  ];

  for (const perfil of perfiles) {
    textos.push(mensajeYaSabemos(perfil, NOMBRE));
    for (const paso of construirPreguntas(perfil)) {
      textos.push(paso.pregunta, repreguntar(paso));
      for (const opcion of paso.opciones ?? []) {
        if (opcion.acuse) textos.push(opcion.acuse);
      }
      // Los acuses del texto libre, con respuestas que la gente da de verdad.
      for (const respuesta of [
        "sería la primera",
        "ya tengo casa",
        "con mi pareja y los niños",
        "vivo con mi mamá y mi hermana",
        "yo sola con mi hija",
        "4.500.000",
        "2 millones y medio",
        "no sé",
        "ninguno todavía",
        "estoy al día",
        "tuve una mora hace poco",
        "tengo 29",
        "Bogotá, por el norte",
        "Medellín",
        "cerca al colegio de los niños",
      ]) {
        const r = paso.interpretarTexto(respuesta);
        if (r.acuse) textos.push(r.acuse);
        if (r.acuseSiInsiste) textos.push(r.acuseSiInsiste);
      }
    }
  }

  for (const paso of preguntasDeReenganche()) textos.push(paso.pregunta);

  textos.push(
    mensajeSaludo(NOMBRE),
    mensajeSaludo(NOMBRE, ARBOLEDA.nombre),
    mensajeAutorizacion(),
    mensajeSinAutorizacion(NOMBRE),
    mensajeReenganche(NOMBRE),
    mensajeReenganche(NOMBRE, "gate_40"),
    mensajeAfiliacion(),
    mensajeCierre(NOMBRE),
    mensajeHandoffAsesor(NOMBRE),
    respuestaDeterministaDuda({ tipo: "duda", clase: "precio", proyecto: ARBOLEDA }),
    respuestaDeterministaDuda({ tipo: "duda", clase: "ubicacion", proyecto: ARBOLEDA }),
    respuestaDeterministaDuda({ tipo: "duda", clase: "subsidio" }),
    respuestaDeterministaDuda({ tipo: "duda", clase: "general" }),
  );

  return [...new Set(textos)].map((texto) => ({ nombre: NOMBRE, texto }));
}

describe("barrido: el guard no toca ni un mensaje real del repo", () => {
  const reales = mensajesReales();

  it("hay corpus de verdad, no una lista vacía que pasa sola", () => {
    expect(reales.length).toBeGreaterThan(40);
  });

  it.each(reales)("intacto: $texto", ({ nombre, texto }) => {
    const r = postGuard(texto, texto, { nombre, proyectosPermitidos: [ARBOLEDA.nombre] });
    expect(r.violaciones).toEqual([]);
    expect(r.severidad).toBe("ok");
    expect(r.textoFinal).toBe(texto);
  });
});

describe("barrido: el pulido honesto del LLM tampoco se castiga", () => {
  // Reescrituras plausibles de Gemini sobre mensajes reales: cambian el tono,
  // no afirman nada nuevo. Si el guard toca alguna, está mal calibrado.
  it.each([
    [
      "Cuéntame una cosa primero, que cambia todo lo demás: ¿esta sería tu primera vivienda, o ya tienes una?",
      "Antes de nada, una cosita que cambia todo lo demás: ¿esta sería tu primera vivienda o ya tienes una?",
    ],
    [
      "¡La primera! 🎉 Eso es enorme, y además te deja el camino despejado para los subsidios que solo aplican a primera vivienda.",
      "¡La primera! 🎉 Qué emoción. Y te deja el camino despejado para los subsidios que solo aplican a primera vivienda.",
    ],
    [
      "Gracias por la confianza 🙏 Entonces hago las cuentas con $4.500.000 al mes — si me equivoqué, dime el número y lo corrijo.",
      "Gracias por la confianza 🙏 Entonces hago las cuentas con $4.500.000 al mes; si me equivoqué me dices y lo corrijo.",
    ],
  ])("pulido sin inventar: %s", (base, pulido) => {
    const r = postGuard(pulido, base, DIANA);
    expect(r.severidad).toBe("ok");
    expect(r.textoFinal).toBe(pulido);
  });
});
