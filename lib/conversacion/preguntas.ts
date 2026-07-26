import type { Lead, LeadEvento, PerfilConocido } from "@/lib/types";
import type { AccionTurno, CampoPregunta, ValorDe } from "./acciones";
import { INTERPRETES } from "./interpretacion";
import { pareceCorreccion } from "./interpretacion/correccion";
import { ingresoDesdeRango } from "./interpretacion/ingreso";
import { POR_CONFIRMAR } from "./interpretacion/subsidios";
import { CIUDADES_CON_PROYECTOS, clasificarZona, type Zona } from "./interpretacion/zona";

// Set de preguntas del spec §6: los 4 que el brief lista como capacidad de
// compra + la zona de interés para el matcher. NUNCA se pregunta lo que el
// enriquecimiento ya trajo (criterio de aceptación 1, spec §5).
//
// ⚠️ ESTE ARCHIVO ES COPY + WIRING. Cómo se ENTIENDE lo que la persona escribió
// vive en `interpretacion/`, un archivo puro por campo; lo que el agente
// CONTESTA vive aquí. Si vienes a arreglar un regex que no entiende algo, es
// allá. Si vienes a cambiar lo que Sara dice, es aquí — y se consulta antes
// (plan de arquitectura §0: personalidad y comportamiento no se improvisan).
//
// TONO — la conversación tiene que ENAMORAR, no encuestar. Es la obligación 4
// del spec 02 y son palabras del mentor: comprar vivienda "es algo que haces
// una vez en tu vida y probablemente al lado de otra persona". Reglas de
// redacción que se derivan de eso y que ningún linter chequea:
//
//   1. Cada pregunta dice PARA QUÉ sirve antes de preguntar. Nadie entrega su
//      ingreso por chat sin saber qué van a hacer con él.
//   2. Cada respuesta recibe un acuse (`acuse`) antes de la siguiente pregunta.
//      Sin acuse el chat se siente formulario: pregunta, respuesta, pregunta.
//   3. Nada de jerga interna: no se dice "perfilamiento", "scoring" ni "SMMLV".
//   4. Se habla de la casa, no del trámite.
//
// HÍBRIDO — D4 del spec 02, cerrado por el mentor: hay que tener las dos
// opciones porque unas personas prefieren escoger y otras escribir. Aquí eso
// significa que TODO paso acepta texto libre (`interpretarTexto`); los chips
// (`opciones`) son un atajo, nunca la única salida. Ingreso y zona van sin
// chips a propósito: ahí la lista sesga ("si tú dices que ganas 500.000, el
// listado no tiene esa opción").
//
// Y el chip y el texto libre pasan por la MISMA tabla (`RESPUESTA_DE`): escribir
// "ya tengo casa" no puede acusar distinto que tocar el chip.

/** El agente tiene nombre: un chat sin nombre al otro lado se siente máquina. */
export const NOMBRE_AGENTE = "Sara";

export type { CampoPregunta };

// El parser del ingreso se mudó a `interpretacion/ingreso.ts` (es lógica pura,
// no copy). Se re-exporta porque las fixtures y los tests lo piden por aquí.
export {
  INGRESO_MAXIMO_PLAUSIBLE,
  INGRESO_MINIMO_PLAUSIBLE,
  ingresoDesdeRango,
  parsearIngresoMensual,
  plausible,
} from "./interpretacion/ingreso";

/** Lo que una respuesta deja en el lead, más cómo reacciona el agente a ella. */
export interface Respuesta {
  patch: Partial<Lead["respuestas"]>;
  /** Lo que el agente contesta antes de seguir. Es lo que separa conversar de encuestar. */
  acuse?: string;
  /**
   * El acuse pasa por el LLM para que suene único en vez de plantilla.
   *
   * Se usa donde la respuesta es impredecible —la zona— y un acuse fijo se nota
   * de lejos. Cuesta latencia, así que NO se activa en todos: el resto de acuses
   * son instantáneos a propósito. El blindaje de 3s de `agregarBot` aplica igual,
   * y si el LLM no contesta se pinta este mismo texto.
   */
  pulir?: boolean;
  /**
   * La respuesta no dejó un dato usable: se acusa y se vuelve a preguntar SIN
   * avanzar el paso (mismo mecanismo del desvío). El chat solo lo concede una
   * vez por pregunta — a la segunda se sigue, porque insistir es interrogar.
   */
  repreguntar?: boolean;
  /** Qué decir cuando ya se repreguntó una vez y toca seguir de todos modos. */
  acuseSiInsiste?: string;
}

/** Un chip del footer. Lleva su valor, así el texto puede ser humano y el dato exacto. */
export interface OpcionRespuesta extends Respuesta {
  etiqueta: string;
}

export interface PasoPregunta {
  /** Qué dato llena. Se usa para saber qué falta, no para guardar (eso lo hace el patch). */
  campo: CampoPregunta;
  pregunta: string;
  placeholder: string;
  /** Atajos. Si no hay, el paso es de texto libre puro (ingreso y zona). */
  opciones?: OpcionRespuesta[];
  /** Siempre existe: el lead puede escribir en cualquier paso, haya chips o no. */
  interpretarTexto: (texto: string) => Respuesta;
}

/**
 * Deja el ingreso como NÚMERO, que es lo que el motor necesita para el gate del
 * 40%. Si la persona no lo escribió —porque el enriquecimiento ya traía su rango
 * y no se le repregunta (criterio de aceptación 1)— se toma el **punto medio**
 * del rango conocido.
 *
 * ⚠️ El punto medio es una de las dos decisiones que el TEAM ratifica o tumba
 * (spec 02, pregunta 6). Se revierte borrando esta función y volviendo a dejar
 * `ingreso_hogar_mensual` sin llenar — con la consecuencia de que todo lead
 * perfilado cae a nutrición por dato faltante.
 *
 * Vive aquí y no en el chat porque lo usan los dos lados: la conversación real
 * (`ChatWhatsApp`) y el guion con el que se siembran los personajes del demo
 * (`lib/fixtures/guion-demo.ts`). Con dos copias, el personaje sembrado y el
 * mismo personaje conversado darían números distintos.
 */
export function completarDesdePerfil(
  perfil: PerfilConocido,
  respuestas: Lead["respuestas"],
): Lead["respuestas"] {
  let completas = respuestas;

  // El ingreso: punto medio del rango conocido.
  if (completas.ingreso_hogar_mensual === undefined && perfil.rango_ingreso) {
    const derivado = ingresoDesdeRango(perfil.rango_ingreso);
    if (derivado) completas = { ...completas, ingreso_hogar_mensual: derivado };
  }

  // La edad: viene ya normalizada del enriquecimiento. No se le preguntó
  // porque ya la sabíamos, así que el motor la recibe por aquí — si no, la
  // similitud se quedaría sin uno de sus dos ejes.
  if (completas.rango_edad === undefined && perfil.rango_edad) {
    completas = { ...completas, rango_edad: perfil.rango_edad };
  }

  return completas;
}

// ── Las respuestas, con su acuse ─────────────────────────
// Se declaran aparte porque los chips y el texto libre reusan las mismas: tocar
// el chip "Ya tengo vivienda" y escribir "ya tengo casa" tienen que valer igual.

const OPCION_PRIMERA_VIVIENDA: Respuesta = {
  patch: { tiene_vivienda: false },
  acuse:
    "¡La primera! 🎉 Eso es enorme, y además te deja el camino despejado para los subsidios que solo aplican a primera vivienda.",
};

const OPCION_YA_TIENE_VIVIENDA: Respuesta = {
  patch: { tiene_vivienda: true },
  acuse:
    "Listo, eso cambia a qué subsidios puedes aplicar, así que mejor saberlo ahora y no cuando ya te ilusionaste con algo.",
};

const ACUSE_SUBSIDIO =
  "¡Eso suma! 🙌 Un subsidio baja la cuota mensual de verdad, no es letra chiquita. Lo meto en la cuenta.";

const SIN_SUBSIDIO: Respuesta = {
  patch: { subsidios: [] },
  // Sin género: el agente no sabe con quién habla, y "tranquila" a un Carlos
  // rompe la ilusión de que alguien lo está escuchando de verdad.
  acuse:
    "No pasa nada, la mayoría llega así. Si aplicas a alguno, el asesor te lo dice y se postula contigo.",
};

const SUBSIDIO_POR_CONFIRMAR: Respuesta = {
  patch: { subsidios: [POR_CONFIRMAR] },
  acuse:
    "Ese es de los que más se dejan sobre la mesa por no preguntar. Lo dejo marcado para que el asesor lo revise contigo.",
};

const CREDITO_AL_DIA: Respuesta = {
  patch: { situacion_crediticia: "buena" },
  acuse: "Eso vale oro con el banco 💪 Te abre puertas que mucha gente no tiene.",
};

const CREDITO_SALIENDO: Respuesta = {
  patch: { situacion_crediticia: "regular" },
  acuse:
    "Gracias por la honestidad. Salir de un reporte cuenta a favor, no en contra: lo importante es que ya está en camino.",
};

const CREDITO_EN_MORA: Respuesta = {
  patch: { situacion_crediticia: "mala" },
  acuse:
    "Te agradezco que me lo digas de frente 🙏 No es un no: es saber hoy qué hay que ordenar, en vez de enterarte el día que pidas el crédito.",
};

const CREDITO_SIN_HISTORIAL: Respuesta = {
  patch: { situacion_crediticia: "sin_info" },
  acuse:
    "Sin historial también hay camino — se empieza a construir, y hay proyectos pensados justo para eso.",
};

// Composición del hogar — alimenta la similitud con compradores reales
// (ticket 016). Se pregunta por la CASA ("con quién la compartirías"), no por
// el estado civil: es la misma regla de hablar de la casa y no del trámite.

const OPCION_SOLO: Respuesta = {
  patch: { composicion_familiar: "solo" },
  acuse: "Tu espacio, tus reglas 🙌 Hay proyectos donde medio edificio empezó exactamente así.",
};

const OPCION_PAREJA: Respuesta = {
  patch: { composicion_familiar: "pareja" },
  acuse: "Qué bonito arrancar eso de a dos 💛 Lo tengo en cuenta para el espacio que necesitan.",
};

const OPCION_FAMILIA_HIJOS: Respuesta = {
  patch: { composicion_familiar: "familia_con_hijos" },
  acuse:
    "Con razón la estás buscando en serio: una casa para los hijos no es cualquier compra. Busco donde ya viven familias como la tuya.",
};

const OPCION_MONOPARENTAL: Respuesta = {
  patch: { composicion_familiar: "monoparental" },
  acuse:
    "Sacar esto adelante así tiene doble mérito 💪 Y ojo: hay subsidios donde eso cuenta a favor, no en contra.",
};

// Edad — el otro dato que más separa a los proyectos entre sí en el histórico
// de compradores. Rango, nunca fecha de nacimiento: menos dato, misma señal.

const OPCION_EDAD_20_35: Respuesta = {
  patch: { rango_edad: "20_35" },
  acuse: "Buena etapa para meterse en esto: el crédito largo juega a tu favor.",
};

const OPCION_EDAD_36_45: Respuesta = {
  patch: { rango_edad: "36_45" },
  acuse: "Perfecto, lo anoto — es de las etapas donde más gente da el paso.",
};

const OPCION_EDAD_46_MAS: Respuesta = {
  patch: { rango_edad: "46_mas" },
  acuse: "Anotado 🙌 Nunca es tarde para dejar de pagar arriendo.",
};

/**
 * El ingreso es el único dato con el que el sistema puede equivocarse en serio:
 * de él sale el gate del 40% (Decreto 583 de 2025). Por eso, cuando se entiende,
 * **se devuelve el número entendido** para que la persona lo corrija si está mal.
 */
function respuestaIngreso(monto: number, texto: string): Respuesta {
  return {
    patch: { rango_ingreso_hogar: texto, ingreso_hogar_mensual: monto },
    acuse: `Gracias por la confianza 🙏 Entonces hago las cuentas con $${monto.toLocaleString("es-CO")} al mes — si me equivoqué, dime el número y lo corrijo.`,
  };
}

/**
 * Y cuando NO se entiende, no se califica con una suposición: se pregunta otra
 * vez. El texto crudo se guarda igual, así el asesor lo ve tal cual.
 */
function ingresoIlegible(texto: string): {
  patch: Partial<Lead["respuestas"]>;
  acuse: string;
  acuseSiInsiste: string;
} {
  return {
    patch: { rango_ingreso_hogar: texto },
    acuse:
      "Perdona, ese número no logré leerlo bien 😅 ¿Me lo dices como lo que entra al mes? " +
      "Por ejemplo: 4.500.000, «2 millones y medio» o «3 salarios mínimos».",
    acuseSiInsiste:
      "Sin problema 🙏 Lo dejo anotado tal cual me lo dijiste y el asesor lo confirma contigo.",
  };
}

/**
 * La zona es la única donde el acuse depende de POR QUÉ se reconoció lo que se
 * reconoció, no del dato. El acuse era uno fijo —"esa zona la tengo bien
 * mapeada"— y quedaba absurdo cuando nadie había nombrado una zona: a "espero
 * que tenga excelentes zonas comunes" le contestaba que la tenía bien mapeada.
 *
 * Se responde a lo que DIJO, con datos que ya tenemos, y en los cinco casos se
 * pule con el LLM: es la respuesta más impredecible del set, así que ahí sí
 * vale la latencia.
 */
function respuestaZona(z: Zona): Respuesta {
  const patch = { zona_interes: z.zona };

  switch (z.tipo) {
    case "ciudad_con_proyectos":
      return {
        patch,
        acuse:
          z.cuantos > 1
            ? `¡${z.zona}! 📍 Ahí tengo ${z.cuantos} proyectos, así que puedo ser concreta contigo.`
            : `¡${z.zona}! 📍 Ahí tengo un proyecto, y te lo miro con lupa.`,
        pulir: true,
      };

    case "barrio":
      return {
        patch,
        acuse: `${z.zona} 📍 Justo por ahí tenemos algo, déjame mirarlo con calma.`,
        pulir: true,
      };

    case "ciudad_sin_proyectos": {
      const donde = CIUDADES_CON_PROYECTOS.map((c) => c.ciudad).join(", ");
      return {
        patch,
        // Preferible a un "anotado" que insinúa que sí tenemos algo allá.
        acuse: `Te soy honesta: en ${z.ciudad} hoy no tenemos proyectos. Donde sí tenemos es en ${donde}. Te dejo anotado que te interesa ${z.ciudad}, por si abrimos.`,
        pulir: true,
      };
    }

    case "deseo":
      return {
        patch,
        acuse:
          "Eso me sirve muchísimo y lo dejo anotado para el asesor 🙌 Como no me diste una ciudad, te busco en todas las que tenemos y él afina contigo.",
        pulir: true,
      };

    case "sin_reconocer":
      return {
        patch,
        acuse: "Anotado 📍 Lo tengo en cuenta para escoger qué mostrarte.",
        pulir: true,
      };
  }
}

/**
 * Qué contesta el agente ante cada valor del menú.
 *
 * Es la tabla que hace que el chip, el texto libre y —cuando la rama 4 la
 * cablee— la interpretación del modelo acusen exactamente igual. Un valor del
 * menú entra, una respuesta escrita por una persona sale.
 */
const RESPUESTA_DE: { [C in CampoPregunta]: (valor: ValorDe<C>, textoCrudo: string) => Respuesta } =
  {
    tiene_vivienda: (v) => (v ? OPCION_YA_TIENE_VIVIENDA : OPCION_PRIMERA_VIVIENDA),

    composicion_familiar: (v) =>
      ({
        solo: OPCION_SOLO,
        pareja: OPCION_PAREJA,
        familia_con_hijos: OPCION_FAMILIA_HIJOS,
        monoparental: OPCION_MONOPARENTAL,
      })[v],

    rango_edad: (v) =>
      ({
        "20_35": OPCION_EDAD_20_35,
        "36_45": OPCION_EDAD_36_45,
        "46_mas": OPCION_EDAD_46_MAS,
      })[v],

    situacion_crediticia: (v) =>
      ({
        buena: CREDITO_AL_DIA,
        regular: CREDITO_SALIENDO,
        mala: CREDITO_EN_MORA,
        sin_info: CREDITO_SIN_HISTORIAL,
      })[v],

    // La lista vacía es una respuesta ("ninguno todavía"), no un vacío.
    subsidios: (v) =>
      v.length === 0
        ? SIN_SUBSIDIO
        : v[0] === POR_CONFIRMAR
          ? SUBSIDIO_POR_CONFIRMAR
          : { patch: { subsidios: v }, acuse: ACUSE_SUBSIDIO },

    rango_ingreso_hogar: (monto, texto) => respuestaIngreso(monto, texto),

    // Se reclasifica desde el texto porque el acuse depende de por qué se
    // reconoció, no del valor. La zona nunca llega por el camino de la IA.
    zona_interes: (_zona, texto) => respuestaZona(clasificarZona(texto)),
  };

/**
 * ⚠️ COMPORTAMIENTO CONGELADO — lo que el chat contesta HOY cuando no entendió.
 *
 * Es el hueco 2 del plan de arquitectura: un acuse amable y el dato perdido en
 * silencio. Se conserva **al pie de la letra** para que esta rama no cambie nada
 * en pantalla; quien decide qué se hace de verdad con un `no_entendido` es la
 * rama 5 (punto 7 de la lista de consulta).
 *
 * Dos cosas que se ven mejor aquí que en el código de antes:
 *   · `situacion_crediticia` guarda `"sin_info"` sin que nadie lo dijera, así que
 *     el motor no distingue "no entendí" de "nunca he pedido crédito";
 *   · `subsidios` acusa "¡eso suma!" con la lista vacía, que solo pasa si el
 *     texto era pura puntuación — absurdo, pero es lo que hace hoy.
 *
 * El ingreso y la zona no están porque nunca llegan aquí: el ingreso ilegible
 * emite `confirmar_dato` y la zona siempre reconoce algo.
 */
const MUDO_HOY: Partial<Record<CampoPregunta, Respuesta>> = {
  tiene_vivienda: { patch: {}, acuse: "Listo, lo tengo en cuenta." },
  composicion_familiar: {
    patch: {},
    acuse: "Listo, lo tengo presente para buscarte lo que mejor te quede.",
  },
  rango_edad: { patch: {}, acuse: "Listo, gracias 🙏" },
  situacion_crediticia: {
    patch: { situacion_crediticia: "sin_info" },
    acuse: "Perfecto, gracias por decírmelo.",
  },
  subsidios: { patch: { subsidios: [] }, acuse: ACUSE_SUBSIDIO },
};

/** Lo que el lead teclea contestando la pregunta que se le hizo. */
export type AccionDePaso = Extract<
  AccionTurno,
  { tipo: "responder_paso" | "no_entendido" | "confirmar_dato" }
>;

/**
 * TS no puede casar el valor con su respondedor cuando `campo` es la unión de
 * los 7. Lo que garantiza que casan es el `satisfies` de `INTERPRETES` contra
 * `INTERPRETACION_POR_CAMPO`: los dos lados salen del mismo menú.
 */
function respuestaDeValor(campo: CampoPregunta, valor: unknown, textoCrudo: string): Respuesta {
  const responder = RESPUESTA_DE[campo] as (v: unknown, t: string) => Respuesta;
  return responder(valor, textoCrudo);
}

function responderPaso(campo: CampoPregunta, r: Respuesta): AccionDePaso {
  return { tipo: "responder_paso", campo, patch: r.patch, acuse: r.acuse, pulir: r.pulir };
}

/**
 * Qué pasó en este turno con lo que el lead escribió.
 *
 * Es la función que la rama 5 va a conducir. Hoy `interpretarTexto` la envuelve
 * y traduce el resultado al `Respuesta` de siempre, así que **nada cambia en
 * pantalla**: lo único nuevo es que ahora hay un nombre para lo que antes se
 * perdía en silencio.
 */
export function accionDeTexto(campo: CampoPregunta, texto: string): AccionDePaso {
  if (campo === "zona_interes") {
    return responderPaso(campo, respuestaZona(clasificarZona(texto)));
  }

  const valor = INTERPRETES[campo](texto);

  if (valor === undefined) {
    // El ingreso no se deja pasar a medias: es el insumo del único gate legal.
    return campo === "rango_ingreso_hogar"
      ? { tipo: "confirmar_dato", campo, ...ingresoIlegible(texto) }
      : { tipo: "no_entendido", campo, textoCrudo: texto };
  }

  return responderPaso(campo, respuestaDeValor(campo, valor, texto));
}

/**
 * Lo mismo, pero cuando el valor ya viene interpretado por otro (el chip, o el
 * modelo de la rama 4 después de validar contra `INTERPRETACION_POR_CAMPO`).
 *
 * Existe para que el acuse sea el mismo por los tres caminos. Un dato entendido
 * por la IA que acuse distinto se nota, y delata que hubo dos autores.
 */
export function accionDeValor<C extends CampoPregunta>(
  campo: C,
  valor: ValorDe<C>,
  textoCrudo: string,
): AccionDePaso {
  return responderPaso(campo, respuestaDeValor(campo, valor, textoCrudo));
}

/** Lo que Sara dice al corregir. No repite el dato: lo hace `repreguntar()`. */
const ACUSE_CORRECCION = "Listo, lo corrijo 🙏 Me quedo con lo último que me dijiste.";

/**
 * El lead está cambiando algo que ya había dicho.
 *
 * Pide las dos cosas a la vez —marca explícita de corrección **y** un campo ya
 * respondido que reconozca el texto— porque cada una suelta se equivoca:
 * "me equivoqué" solo puede ser una corrección, pero de qué, no se sabe; y
 * "son 3 millones" a mitad de otra pregunta es casi siempre la respuesta a esa
 * otra pregunta. `null` significa "esto no es una corrección" y el turno sigue
 * su camino normal.
 *
 * Se busca del último campo respondido hacia atrás: lo que uno corrige es casi
 * siempre lo último que dijo. `zona_interes` queda por fuera porque su
 * intérprete acepta cualquier cosa y se quedaría con todas las correcciones.
 */
export function accionDeCorreccion(
  texto: string,
  yaRespondidos: CampoPregunta[],
): Extract<AccionTurno, { tipo: "corregir_dato" }> | null {
  if (!pareceCorreccion(texto)) return null;

  for (const campo of [...yaRespondidos].reverse()) {
    if (campo === "zona_interes") continue;
    const valor = INTERPRETES[campo](texto);
    if (valor === undefined) continue;

    const r = respuestaDeValor(campo, valor, texto);
    // El ingreso se corrige leyendo el número en voz alta: su acuse ya está
    // escrito para que la persona lo verifique, y de ese número depende el
    // veredicto del gate del 40% (ticket 024).
    const acuse =
      campo === "rango_ingreso_hogar" ? (r.acuse ?? ACUSE_CORRECCION) : ACUSE_CORRECCION;
    return { tipo: "corregir_dato", campo, patch: r.patch, acuse };
  }

  return null;
}

/**
 * El puente con el chat de hoy: una `AccionDePaso` traducida al `Respuesta` que
 * `ChatWhatsApp` y `guion-demo` ya saben consumir.
 *
 * Desaparece cuando la rama 5 cablee la máquina de conversación. Mientras exista,
 * el comportamiento en pantalla es idéntico al de antes de esta rama.
 */
export function respuestaDeAccion(accion: AccionDePaso): Respuesta {
  switch (accion.tipo) {
    case "responder_paso":
      return { patch: accion.patch, acuse: accion.acuse, pulir: accion.pulir };

    case "confirmar_dato":
      return {
        patch: accion.patch,
        acuse: accion.acuse,
        repreguntar: true,
        acuseSiInsiste: accion.acuseSiInsiste,
      };

    case "no_entendido":
      return MUDO_HOY[accion.campo] ?? { patch: {} };
  }
}

/** El `interpretarTexto` de un paso: acción adentro, `Respuesta` afuera. */
function interpretarTextoDe(campo: CampoPregunta): (texto: string) => Respuesta {
  return (texto) => respuestaDeAccion(accionDeTexto(campo, texto));
}

/**
 * Dado un PerfilConocido, decide qué se pregunta y en qué orden.
 * El único guion fijo es la ausencia de guion: quien ya trajo el dato del
 * enriquecimiento, no lo repite en la conversación.
 *
 * El orden no es casual: primero lo que ilusiona (la casa, la primera vez),
 * después lo incómodo (ingreso, crédito). El ingreso va de segundo y no de
 * primero justo por eso.
 */
export function construirPreguntas(perfil: PerfilConocido): PasoPregunta[] {
  const pasos: PasoPregunta[] = [];

  pasos.push({
    campo: "tiene_vivienda",
    pregunta:
      "Cuéntame una cosa primero, que cambia todo lo demás: ¿esta sería tu primera vivienda, o ya tienes una?",
    placeholder: "Escríbeme cómo es tu caso...",
    opciones: [
      { etiqueta: "Sería la primera 🎉", ...OPCION_PRIMERA_VIVIENDA },
      { etiqueta: "Ya tengo vivienda", ...OPCION_YA_TIENE_VIVIENDA },
    ],
    interpretarTexto: interpretarTextoDe("tiene_vivienda"),
  });

  // Sigue en la parte que ilusiona: se pregunta por la casa compartida, no por
  // el estado civil. El dato alimenta la similitud con compradores reales.
  pasos.push({
    campo: "composicion_familiar",
    pregunta:
      "Y cuéntame, para imaginarla contigo: ¿con quién la compartirías? Con eso te busco proyectos donde ya viven hogares como el tuyo.",
    placeholder: "Ej: con mi pareja y los niños...",
    opciones: [
      { etiqueta: "Solo yo", ...OPCION_SOLO },
      { etiqueta: "Con mi pareja", ...OPCION_PAREJA },
      { etiqueta: "Con mi familia e hijos", ...OPCION_FAMILIA_HIJOS },
      { etiqueta: "Yo con mis hijos", ...OPCION_MONOPARENTAL },
    ],
    interpretarTexto: interpretarTextoDe("composicion_familiar"),
  });

  if (!perfil.rango_ingreso) {
    pasos.push({
      campo: "rango_ingreso_hogar",
      // Sin chips a propósito (D4): la lista sesga y deja gente por fuera.
      pregunta:
        "Ahora la pregunta incómoda, y te digo para qué es: solo la uso para no mostrarte casas que después te aprieten el bolsillo. ¿Cuánto entra al mes en tu hogar, sumando todo lo que llega (tu sueldo, el de tu pareja, lo que sea)? Un aproximado me sirve.",
      placeholder: "Ej: 4.500.000 · 2 millones y medio · entre 3 y 4",
      interpretarTexto: interpretarTextoDe("rango_ingreso_hogar"),
    });
  }

  pasos.push({
    campo: "subsidios",
    pregunta:
      "Hablemos de plata a tu favor: el subsidio es lo que más gente deja sobre la mesa por no preguntar. ¿Tienes alguno, o todavía ninguno?",
    placeholder: "Cuéntame cuál, o escribe \"ninguno\"",
    opciones: [
      { etiqueta: "Mi Casa Ya", patch: { subsidios: ["Mi Casa Ya"] }, acuse: ACUSE_SUBSIDIO },
      {
        etiqueta: "El de mi caja de compensación",
        patch: { subsidios: ["Subsidio caja de compensación"] },
        acuse: ACUSE_SUBSIDIO,
      },
      { etiqueta: "Ninguno todavía", ...SIN_SUBSIDIO },
      { etiqueta: "No sé si aplico", ...SUBSIDIO_POR_CONFIRMAR },
    ],
    interpretarTexto: interpretarTextoDe("subsidios"),
  });

  // Antes de la crediticia, para que "última de las incómodas" siga siendo
  // verdad. Rango de edad, nunca fecha exacta: alimenta la similitud con
  // compradores reales (las etapas de vida separan mucho los proyectos).
  //
  // ⚠️ Solo si NO la sabemos ya. La base de identidades trae el rango de edad
  // de las 303 personas, así que a quien reconocimos por su cédula no se le
  // pregunta — es el mismo criterio 1 que ya aplica al ingreso y a la ciudad.
  if (!perfil.rango_edad) {
    pasos.push({
      campo: "rango_edad",
      pregunta:
        "Otra cortica que me ayuda mucho: ¿en qué etapa vas? Con eso te muestro proyectos donde compra gente en tu mismo momento de vida.",
      placeholder: "Ej: tengo 29",
      opciones: [
        { etiqueta: "Entre 20 y 35", ...OPCION_EDAD_20_35 },
        { etiqueta: "Entre 36 y 45", ...OPCION_EDAD_36_45 },
        { etiqueta: "Más de 45", ...OPCION_EDAD_46_MAS },
      ],
      interpretarTexto: interpretarTextoDe("rango_edad"),
    });
  }

  pasos.push({
    campo: "situacion_crediticia",
    pregunta:
      "Última de las incómodas y te dejo en paz 🙏 ¿Cómo va tu vida crediticia hoy? Pregunto sin juzgar: si hay algo pendiente, es mil veces mejor saberlo ahora que el día que pidas el crédito.",
    placeholder: "Escríbeme cómo estás...",
    opciones: [
      { etiqueta: "Al día con todo", ...CREDITO_AL_DIA },
      { etiqueta: "Saliendo de un reporte", ...CREDITO_SALIENDO },
      { etiqueta: "Tengo algo en mora", ...CREDITO_EN_MORA },
      { etiqueta: "Nunca he pedido crédito", ...CREDITO_SIN_HISTORIAL },
    ],
    interpretarTexto: interpretarTextoDe("situacion_crediticia"),
  });

  if (!perfil.ciudad) {
    pasos.push({
      campo: "zona_interes",
      // Sin chips a propósito (D4): la zona es de las que se escriben.
      //
      // ⚠️ PIDE LA CIUDAD, explícitamente. La versión anterior preguntaba
      // "¿dónde te imaginas viviendo?" e invitaba a pensar en el día a día
      // ("cerca del colegio, del trabajo, de tu mamá"), así que mucha gente
      // contestaba justo eso — un deseo, no un lugar. Y el filtro de zona del
      // matcher es por CIUDAD: un "cerca al colegio de los niños" entra crudo a
      // `zona_interes`, no casa con ninguna, y el lead termina viendo
      // "alternativa fuera de tu zona" sin haber nombrado una. Le cuesta una
      // recomendación, medido: "Bogotá" → 3 proyectos; un deseo → 2 y marcados.
      //
      // El barrio se sigue pidiendo, pero DESPUÉS y como opcional: alimenta el
      // bono de barrio exacto sin ser lo que se responde de primeras.
      pregunta:
        "Y lo más rico: ¿en qué ciudad o municipio te imaginas viviendo? Te lo pregunto así de concreto porque solo te voy a mostrar proyectos que queden ahí. Si ya tienes un barrio o un sector en mente, dímelo también.",
      placeholder: "Ej: Bogotá, por el norte",
      interpretarTexto: interpretarTextoDe("zona_interes"),
    });
  }

  return pasos;
}

// ── Las filas `sistema` del hilo (ADR 0003) ──────────────
// No son mensajes de nadie: son los eventos que hacen auditable la conversación
// en la tabla `conversaciones`. Viven aquí para que el hilo que guarda el chat
// real y el que siembra el demo sean el mismo texto.

/** Cómo se lee la fuente del lead dentro del hilo guardado. */
const ETIQUETA_FUENTE: Record<string, string> = {
  meta: "Meta Lead Ads",
  google: "Google Ads",
  web: "la web de Colsubsidio",
};

/** Primera fila del hilo: de dónde vino el lead y qué se supo antes de hablarle. */
export function mensajeIngesta(evento: LeadEvento, perfil: PerfilConocido): string {
  return (
    `Lead recibido de ${ETIQUETA_FUENTE[evento.fuente] ?? evento.fuente}` +
    `${evento.proyecto_interes ? `, interesado en ${evento.proyecto_interes}` : ""}. ` +
    `Enriquecimiento por cédula: ${
      perfil.match
        ? "match encontrado, no se repregunta lo conocido"
        : "sin match, se pregunta todo"
    }.`
  );
}

/** Evidencia auditable de habeas data, con su hora (Ley 1581 de 2012). */
export function mensajeConsentimiento(otorgado: boolean, timestamp: string): string {
  return otorgado
    ? `Consentimiento habeas data otorgado (Ley 1581 de 2012) — ${timestamp}`
    : `Consentimiento habeas data NO otorgado — ${timestamp}. La conversación termina y no se persiste el lead.`;
}

/** Lo que el lead toca para autorizar. Es un acto jurídico: va por botón, no por texto. */
export const RESPUESTA_CONSENTIMIENTO = "Sí, la comparto";

// ── Los mensajes del agente que no son preguntas ─────────

/** Bubble 1: llega instantánea, con nombre propio y el proyecto por el que entró. */
export function mensajeSaludo(nombre: string, proyecto?: string): string {
  const primerNombre = nombre.split(" ")[0];
  if (proyecto) {
    return `¡Hola, ${primerNombre}! 👋 Soy ${NOMBRE_AGENTE}, del equipo de Vivienda de Colsubsidio. Vi que te llamó la atención ${proyecto} 🏡`;
  }
  return `¡Hola, ${primerNombre}! 👋 Soy ${NOMBRE_AGENTE}, del equipo de Vivienda de Colsubsidio.`;
}

/**
 * La autorización de datos es el primer punto de fuga medido de la operación
 * real (charla-mentor.md #puntos-de-fuga). Por eso va con el "para qué" por
 * delante y en las palabras que el mentor dijo que están adoptando:
 * "compártenos la autorización" en vez de "¿autorizas?".
 */
export function mensajeAutorizacion(): string {
  return "Antes de mostrarte nada tengo que pedirte una formalidad, y te cuento para qué: para poder guardar lo que hablemos aquí y que un asesor te acompañe después sin que repitas tu historia. ¿Me compartes la autorización para tratar tus datos? (Ley 1581 de 2012)";
}

export function mensajeSinAutorizacion(nombre: string): string {
  const primerNombre = nombre.split(" ")[0];
  return `Todo bien, ${primerNombre} 🙏 Sin esa autorización no puedo guardar nada de lo que hablemos, así que lo dejamos hasta aquí. Cuando quieras retomarlo me escribes y seguimos — la casa te va a estar esperando.`;
}

/**
 * El mensaje que hace explícito lo que ya sabemos (criterio de aceptación 1):
 * se dice ANTES de preguntar nada más.
 *
 * ⚠️ NO se le recitan al lead sus propios datos, y esto no es un descuido:
 * leerle de vuelta su afiliación, su ciudad y su rango de ingresos suena a
 * expediente y asusta justo en el mensaje donde hay que generar confianza.
 * Lo que el criterio 1 exige es que el lead **sepa que no le vamos a hacer
 * repetir nada**, no que le enumeremos su ficha. Así que:
 *
 *   - se dice que sus datos ya están y que no se los vamos a repreguntar;
 *   - la ciudad se **usa** ("busco opciones en Bogotá") en vez de recitarse:
 *     demuestra que la conocemos sin sonar a base de datos hablando;
 *   - el ingreso NO se menciona nunca. Es el dato más sensible de todos y el
 *     que más incomoda oír de vuelta. Sigue usándose para calificar, y el
 *     asesor lo ve completo en su ficha.
 *
 * El criterio se sigue verificando igual: la intersección entre lo preguntado
 * y lo enriquecido es vacía (`construirPreguntas`), y hay un test que impide
 * que el rango de ingreso vuelva a colarse en este mensaje.
 */
export function mensajeYaSabemos(perfil: PerfilConocido, nombre: string): string {
  const primerNombre = nombre.split(" ")[0];

  if (!perfil.match) {
    return `Perfecto, ${primerNombre}, gracias 🙌 Todavía no te tengo en nuestra base, así que arrancamos de cero: son unas preguntas cortas, nada de formulario eterno. Te prometo que valen la pena.`;
  }

  const sabemosAlgo =
    perfil.afiliado !== undefined || Boolean(perfil.ciudad) || Boolean(perfil.rango_ingreso);

  if (!sabemosAlgo) {
    return `Gracias, ${primerNombre} 🙌 Te tengo registrado pero sin más datos, así que te pregunto lo que falta — es corto, prometido.`;
  }

  if (perfil.ciudad) {
    return `Gracias, ${primerNombre} 🙌 Lo que ya nos habías dado está acá conmigo, así que no te voy a hacer repetir nada. Empiezo por buscarte opciones en ${perfil.ciudad} y solo te pregunto lo que me falte.`;
  }

  return `Gracias, ${primerNombre} 🙌 Lo que ya nos habías dado está acá conmigo, así que no te voy a hacer repetir nada. Solo te pregunto lo que me falte.`;
}

// ── Re-enganche desde nutrición (spec 05 D4) ─────────────

/**
 * El primer mensaje cuando el trigger se dispara y la persona vuelve.
 *
 * Tres reglas del contrato, y las tres se ven en el texto: **nombra la razón
 * original** (no la hace repetir su historia), **no repregunta nada** de lo que
 * ya contó, y solo pregunta **lo que pudo cambiar**. El consentimiento tampoco
 * se vuelve a pedir: ya lo dio, y por eso podemos escribirle — nunca contacto
 * frío ([mentor](../../docs/reto/charla-mentor.md#remarketing)).
 */
export function mensajeReenganche(nombre: string, reglaFallida?: string): string {
  const primerNombre = nombre.split(" ")[0];
  const contexto = reglaFallida
    ? "Cuando hablamos, la cuota del proyecto se te iba por encima del tope legal del 40% de tus ingresos, así que quedamos en que te escribía apenas eso pudiera cambiar."
    : "Quedamos en que te escribía apenas algo pudiera cambiar a tu favor.";

  return `¡Hola de nuevo, ${primerNombre}! 👋 Soy ${NOMBRE_AGENTE}. ${contexto} No te voy a hacer repetir nada: tengo todo lo que me contaste.`;
}

/**
 * Lo único que se pregunta al volver: lo que pudo cambiar.
 *
 * El resto ya está en su ficha, y volver a preguntarlo rompería el criterio de
 * aceptación 1 justo en el momento en que la persona nos está dando una segunda
 * oportunidad.
 */
export function preguntasDeReenganche(): PasoPregunta[] {
  return [
    {
      campo: "rango_ingreso_hogar",
      pregunta:
        "Solo necesito confirmar una cosa para volver a hacer las cuentas: ¿cuánto está entrando al mes en tu hogar hoy? Si cambió aunque sea un poco, puede alcanzar para que ya te sirva.",
      placeholder: "Ej: 2.400.000 · sigue igual",
      interpretarTexto: interpretarTextoDe("rango_ingreso_hogar"),
    },
  ];
}

// ── Afiliarse: la salida más útil para el no afiliado ────
//
// Cierra la propuesta que el spec 04 D3 dejó abierta ("ofrecerle la afiliación
// como camino… nadie ha escrito ese mensaje todavía"), y ahora tiene fundamento:
//
//   · **Mi Casa Ya no tiene presupuesto en 2026**, así que el subsidio de
//     vivienda vigente es el de las CAJAS DE COMPENSACIÓN — y ese es solo para
//     afiliados. Para un no afiliado, afiliarse dejó de ser un trámite: hoy es
//     la palanca financiera más grande que tiene.
//   · Afiliarse además lo saca de la fila del **10%** que la regla 90/10 le
//     reserva a los no afiliados, que en los 18 proyectos ya está copada.
//   · Y puede hacerlo **él mismo**: Colsubsidio tiene modalidad para trabajador
//     independiente, no solo la de empresa.
//
// Fuentes y el detalle: docs/credito-y-subsidios.md
//
// ⚠️ SIN CIFRAS A PROPÓSITO. Las fuentes se contradicen en el monto del
// subsidio de la caja (30 SMMLV ≈ $52,5M en una, "hasta $30 millones" en otra) y
// depende de la convocatoria y del ingreso. Prometerle un número a alguien que
// está decidiendo la compra de su vida, con fuentes que no coinciden, es
// exactamente lo que este proyecto no hace. Quien verifique el monto oficial
// puede agregarlo aquí, citando de dónde salió.
const URL_AFILIACION = "https://www.colsubsidio.com/afiliaciones";

/**
 * La invitación a afiliarse. Solo se le muestra a quien NO es afiliado.
 *
 * **Corta a propósito.** La primera versión explicaba el cupo del 10% de la
 * regla 90/10 y por qué afiliarse lo sacaba de esa fila: es cierto, es
 * relevante para el negocio… y no le importa a quien está buscando casa. El
 * 90/10 es vocabulario interno — al lead se le dice qué gana, no cómo funciona
 * nuestro inventario. Esa explicación sigue viva donde sí sirve: en la ficha
 * del asesor y en la advertencia de cada proyecto recomendado.
 *
 * Una sola frase, un solo beneficio, un enlace.
 */
export function mensajeAfiliacion(): string {
  return `Una cosa más que te puede servir 💡 Si te afilias a Colsubsidio puedes acceder a los subsidios de vivienda de la caja. Aquí te dice cómo: ${URL_AFILIACION}`;
}

export function mensajeCierre(nombre: string): string {
  const primerNombre = nombre.split(" ")[0];
  return `Eso era todo, ${primerNombre} 🙌 Con lo que me contaste ya puedo armarte algo que tenga sentido para ti, y no una lista genérica. Le paso tu historia completa a un asesor para que no tengas que repetirla — te escribe muy pronto.`;
}
