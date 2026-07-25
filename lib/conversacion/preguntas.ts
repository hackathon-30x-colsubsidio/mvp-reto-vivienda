import type { Lead, LeadEvento, PerfilConocido } from "@/lib/types";
import { catalogo } from "@/lib/matching/catalogo";

// Set de preguntas del spec §6: los 4 que el brief lista como capacidad de
// compra + la zona de interés para el matcher. NUNCA se pregunta lo que el
// enriquecimiento ya trajo (criterio de aceptación 1, spec §5).
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

/** El agente tiene nombre: un chat sin nombre al otro lado se siente máquina. */
export const NOMBRE_AGENTE = "Sara";

/**
 * Salario mínimo mensual legal vigente. **$1.750.905 en 2026**, fijado por los
 * Decretos 1469 y 1470 del 29 de diciembre de 2025 (+23% sobre 2025). Ya NO es
 * un supuesto: tiene fuente — ver docs/credito-y-subsidios.md.
 *
 * Se duplica a propósito el valor de `lib/fixtures/cola-historica.ts`: este
 * módulo lo carga el cliente y no debe arrastrar las fixtures al bundle. Si
 * cambia el año, cambian los dos (y `scripts/generar_sintetica.py`).
 */
const SMMLV = 1_750_905;

export type CampoPregunta = Exclude<keyof Lead["respuestas"], "consentimiento">;

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

// ── Interpretación de texto libre ────────────────────────

const NIEGA =
  /\b(no|nop|nunca|jam[áa]s|ninguno|ninguna|negativo|todav[íi]a\s+no|a[úu]n\s+no|aun\s+no)\b/i;

/**
 * Saca los números de una frase escrita por una persona real: "4.500.000",
 * "4'500.000", "4,5", "entre 3 y 5". Los puntos son separadores de miles
 * cuando cierran en 3 dígitos y decimales cuando no ("4.5 millones").
 */
function numerosDe(texto: string): number[] {
  const crudos = texto.replace(/['`´]/g, ".").match(/\d+(?:[.,]\d+)*/g) ?? [];
  return crudos
    .map((crudo) => {
      const partes = crudo.replace(/,/g, ".").split(".");
      if (partes.length === 1) return Number(partes[0]);
      const ultima = partes[partes.length - 1];
      if (ultima.length === 3) return Number(partes.join(""));
      return Number(`${partes.slice(0, -1).join("")}.${ultima}`);
    })
    .filter((n) => Number.isFinite(n) && n > 0);
}

/**
 * Convierte a pesos mensuales lo que la persona escribió. Acepta las formas en
 * que la gente responde de verdad: un monto, "2 millones y medio", "3 salarios
 * mínimos", "entre 2 y 3" (se toma el punto medio).
 *
 * Devuelve `undefined` cuando el número queda ambiguo (p. ej. un "800" pelado:
 * ¿ochocientos mil, u ochocientos?). Eso NO rompe la conversación: el texto
 * crudo se guarda igual en `rango_ingreso_hogar` y el asesor lo ve tal cual.
 */
export function parsearIngresoMensual(texto: string): number | undefined {
  const limpio = texto.toLowerCase();
  if (NO_ES_MONTO.test(limpio)) return undefined;
  const numeros = numerosDe(limpio);
  if (numeros.length === 0) return undefined;

  // "entre 2 y 3", "2-3": punto medio del rango que la persona dio.
  const base = numeros.length >= 2 ? (numeros[0] + numeros[1]) / 2 : numeros[0];
  const conMedio = /\by\s+medio\b/.test(limpio) ? base + 0.5 : base;

  if (/mill|\bmm\b/.test(limpio)) return plausible(conMedio * 1_000_000);
  if (/m[íi]nimo|salario|smmlv|smlv/.test(limpio)) {
    return plausible(conMedio * SMMLV);
  }
  if (/\bmil\b/.test(limpio)) return plausible(conMedio * 1_000);

  // Sin unidad: un monto completo se escribe con sus ceros; un número pequeño
  // es la forma corta de "millones" ("gano 3" tras preguntar cuánto entra al mes).
  if (conMedio >= 100_000) return plausible(conMedio);
  if (conMedio <= 30) return plausible(conMedio * 1_000_000);
  return undefined;
}

/**
 * Lo escrito no es un monto sino una cuenta, un signo o un error de dedo.
 *
 * Sin esto, `2+2` entraba como $2.000.000 y `-3` como $3.000.000: el parser ve
 * los dígitos y no el operador. Ojo con el guion — `2-3` SÍ es un rango válido
 * ("entre 2 y 3"), así que solo se rechaza cuando ABRE el texto, que es la
 * forma de un negativo.
 */
const NO_ES_MONTO = /[+*/=%]|^\s*-/;

/**
 * Ingresos mensuales fuera de los cuales no se califica sin confirmar.
 *
 * ⚠️ Los dos números son **supuesto nuestro, no dato de Colsubsidio**: el piso
 * queda por debajo del salario mínimo (nadie compra vivienda con menos, y casi
 * siempre es un cero que faltó) y el techo, en cien millones al mes, es
 * absurdo para este catálogo. Existen porque el ingreso es el insumo del ÚNICO
 * gate legal del sistema: un número mal leído cambia el veredicto en silencio.
 */
export const INGRESO_MINIMO_PLAUSIBLE = 500_000;
export const INGRESO_MAXIMO_PLAUSIBLE = 100_000_000;

/** El monto solo cuenta si cae en un rango que una persona puede tener de verdad. */
function plausible(monto: number): number | undefined {
  const redondeado = Math.round(monto);
  return redondeado >= INGRESO_MINIMO_PLAUSIBLE && redondeado <= INGRESO_MAXIMO_PLAUSIBLE
    ? redondeado
    : undefined;
}

/** El rango del enriquecimiento ("3-5 SMMLV") llevado a un monto usable por el motor. */
export function ingresoDesdeRango(rango: string): number | undefined {
  return parsearIngresoMensual(rango);
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

/**
 * El ingreso es el único dato con el que el sistema puede equivocarse en serio:
 * de él sale el gate del 40% (Decreto 583 de 2025). Por eso, cuando se entiende,
 * **se devuelve el número entendido** para que la persona lo corrija si está
 * mal; y cuando no, se pregunta otra vez en vez de calificar con una suposición.
 */
function interpretarIngreso(texto: string): Respuesta {
  const monto = parsearIngresoMensual(texto);

  if (monto === undefined) {
    return {
      patch: { rango_ingreso_hogar: texto },
      acuse:
        "Perdona, ese número no logré leerlo bien 😅 ¿Me lo dices como lo que entra al mes? " +
        "Por ejemplo: 4.500.000, «2 millones y medio» o «3 salarios mínimos».",
      repreguntar: true,
      acuseSiInsiste:
        "Sin problema 🙏 Lo dejo anotado tal cual me lo dijiste y el asesor lo confirma contigo.",
    };
  }

  return {
    patch: { rango_ingreso_hogar: texto, ingreso_hogar_mensual: monto },
    acuse: `Gracias por la confianza 🙏 Entonces hago las cuentas con $${monto.toLocaleString("es-CO")} al mes — si me equivoqué, dime el número y lo corrijo.`,
  };
}

function interpretarVivienda(texto: string): Respuesta {
  const t = texto.toLowerCase();
  const primeraVez =
    /primera|no tengo|nunca|arriendo|arrendad|vivo con|de mis pap|alquil/.test(t) ||
    (NIEGA.test(t) && !/ya tengo|s[íi] tengo/.test(t));
  const yaTiene = /ya tengo|s[íi] tengo|tengo (una |mi )?(casa|apartamento|vivienda)|propia|es m[íi]a/.test(t);

  if (primeraVez && !yaTiene) return OPCION_PRIMERA_VIVIENDA;
  if (yaTiene) return OPCION_YA_TIENE_VIVIENDA;
  return { patch: {}, acuse: "Listo, lo tengo en cuenta." };
}

function interpretarSubsidios(texto: string): Respuesta {
  const t = texto.toLowerCase();
  if (/ninguno|ningun|no tengo|no he|nada|todav[íi]a no|a[úu]n no/.test(t) && !/mi casa ya/.test(t)) {
    return SIN_SUBSIDIO;
  }
  if (/no s[ée]|ni idea|no estoy segur|creo que|no entiendo/.test(t)) return SUBSIDIO_POR_CONFIRMAR;

  const subsidios = texto
    .split(/,| y /)
    .map((s) => s.trim())
    .filter(Boolean);
  return { patch: { subsidios }, acuse: ACUSE_SUBSIDIO };
}

function interpretarCrediticia(texto: string): Respuesta {
  const t = texto.toLowerCase();
  if (/al d[íi]a|bien|excelente|buena|sin deudas|limpio|impecable/.test(t)) return CREDITO_AL_DIA;
  if (/nunca|no he tenido|no tengo historial|sin historial|primera vez|no he pedido/.test(t)) {
    return CREDITO_SIN_HISTORIAL;
  }
  if (/sali|salir|me report|estuve|arregl|pagu[ée]|ya me quit|reciente/.test(t)) return CREDITO_SALIENDO;
  if (/mora|report|datacr|deb[oa]|atras|deuda|embarg|mal/.test(t)) return CREDITO_EN_MORA;
  return { patch: { situacion_crediticia: "sin_info" }, acuse: "Perfecto, gracias por decírmelo." };
}

function interpretarComposicion(texto: string): Respuesta {
  const t = texto.toLowerCase();
  // El orden importa: "yo sola con mi hija" es monoparental, no "familia con
  // hijos" ni "sola" — se descarta primero el caso más específico.
  if (/(sol[oa]s?\b.*\bhij|hij[oa]s?.*\bsol[oa]|yo con mis? hij|monoparental|madre soltera|padre soltero)/.test(t)) {
    return OPCION_MONOPARENTAL;
  }
  if (/hij|niñ|bebé|bebe|chiquit|pelad[oa]s/.test(t)) return OPCION_FAMILIA_HIJOS;
  if (/pareja|espos[oa]|novi[oa]|conyug|señora|marido|prometid/.test(t)) return OPCION_PAREJA;
  if (/sol[oa]\b|yo sol|nadie|independiente|por mi cuenta/.test(t)) return OPCION_SOLO;
  return { patch: {}, acuse: "Listo, lo tengo presente para buscarte lo que mejor te quede." };
}

function interpretarEdad(texto: string): Respuesta {
  const edad = numerosDe(texto).find((n) => n >= 14 && n <= 99);
  if (edad === undefined) {
    const t = texto.toLowerCase();
    if (/veinti|treinta y (uno|dos|tres|cuatro|cinco)\b|^treinta\b/.test(t)) return OPCION_EDAD_20_35;
    if (/treinta y (seis|siete|ocho|nueve)|cuarenta/.test(t)) return OPCION_EDAD_36_45;
    if (/cincuenta|sesenta|setenta/.test(t)) return OPCION_EDAD_46_MAS;
    return { patch: {}, acuse: "Listo, gracias 🙏" };
  }
  if (edad <= 35) return OPCION_EDAD_20_35;
  if (edad <= 45) return OPCION_EDAD_36_45;
  return OPCION_EDAD_46_MAS;
}

// ── La zona: la respuesta más impredecible de todas ──────
//
// A "¿dónde te imaginas viviendo?" la gente contesta cualquier cosa: una ciudad,
// un barrio, un deseo ("que tenga buenas zonas comunes"), o dónde queda el
// colegio de los niños. El acuse era uno fijo —"esa zona la tengo bien
// mapeada"— y quedaba absurdo cuando nadie había nombrado una zona.
//
// Se responde a lo que DIJO, con datos que ya tenemos:
//   · nombró una ciudad del catálogo  → se le dice cuántos proyectos hay ahí
//   · nombró una ciudad donde no hay  → se le dice de frente, y dónde sí hay
//   · dijo un deseo, no un lugar      → se le acusa el deseo y se dice qué se hará
// Y el `patch` guarda la CIUDAD limpia cuando se reconoce, no la frase entera:
// el matcher filtra por zona y "espero que tenga excelentes zonas comunes" no
// es una zona.

/** Ciudades del catálogo real, con cuántos proyectos tiene cada una. */
const CIUDADES_CON_PROYECTOS: { ciudad: string; cuantos: number }[] = Object.entries(
  catalogo.reduce<Record<string, number>>((cuenta, p) => {
    cuenta[p.ciudad] = (cuenta[p.ciudad] ?? 0) + 1;
    return cuenta;
  }, {}),
).map(([ciudad, cuantos]) => ({ ciudad, cuantos }));

/** Barrios y sectores que el catálogo conoce (los trae el brochure). */
const ZONAS_CONOCIDAS = catalogo
  .map((p) => p.zona)
  .filter((z): z is string => Boolean(z));

/**
 * Ciudades grandes de Colombia donde HOY no hay proyectos. No es data del reto:
 * es reconocer un nombre para poder decir la verdad en vez de un "anotado" que
 * suena a que sí tenemos algo allá.
 */
const CIUDADES_SIN_PROYECTOS = [
  "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga", "Pereira",
  "Santa Marta", "Cúcuta", "Ibagué", "Manizales", "Villavicencio", "Neiva",
  "Armenia", "Popayán", "Pasto", "Montería", "Valledupar", "Tunja",
];

/** Lo que la gente nombra cuando habla de cómo quiere vivir, no de dónde. */
const DESEOS = /zonas? comunes?|amenidad|piscina|gimnasio|parque|colegio|trabajo|mam[áa]|familia|tranquil|segur|verde|centro comercial|transporte|metro|cerca de todo/i;

const sinTildes = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function buscarEn(lista: string[], texto: string): string | undefined {
  const plano = sinTildes(texto);
  return lista.find((candidato) => plano.includes(sinTildes(candidato)));
}

function interpretarZona(texto: string): Respuesta {
  const conProyectos = CIUDADES_CON_PROYECTOS.find(({ ciudad }) =>
    sinTildes(texto).includes(sinTildes(ciudad)),
  );

  if (conProyectos) {
    const { ciudad, cuantos } = conProyectos;
    return {
      // Se guarda la ciudad, no la frase: es lo que el matcher sabe filtrar.
      patch: { zona_interes: ciudad },
      acuse:
        cuantos > 1
          ? `¡${ciudad}! 📍 Ahí tengo ${cuantos} proyectos, así que puedo ser concreta contigo.`
          : `¡${ciudad}! 📍 Ahí tengo un proyecto, y te lo miro con lupa.`,
      pulir: true,
    };
  }

  const barrio = buscarEn(ZONAS_CONOCIDAS, texto);
  if (barrio) {
    return {
      patch: { zona_interes: barrio },
      acuse: `${barrio} 📍 Justo por ahí tenemos algo, déjame mirarlo con calma.`,
      pulir: true,
    };
  }

  const lejos = buscarEn(CIUDADES_SIN_PROYECTOS, texto);
  if (lejos) {
    const donde = CIUDADES_CON_PROYECTOS.map((c) => c.ciudad).join(", ");
    return {
      patch: { zona_interes: texto },
      // Preferible a un "anotado" que insinúa que sí tenemos algo allá.
      acuse: `Te soy honesta: en ${lejos} hoy no tenemos proyectos. Donde sí tenemos es en ${donde}. Te dejo anotado que te interesa ${lejos}, por si abrimos.`,
      pulir: true,
    };
  }

  if (DESEOS.test(texto)) {
    return {
      patch: { zona_interes: texto },
      acuse:
        "Eso me sirve muchísimo y lo dejo anotado para el asesor 🙌 Como no me diste una ciudad, te busco en todas las que tenemos y él afina contigo.",
      pulir: true,
    };
  }

  return {
    patch: { zona_interes: texto },
    acuse: "Anotado 📍 Lo tengo en cuenta para escoger qué mostrarte.",
    pulir: true,
  };
}

// ── Las opciones, con su acuse ───────────────────────────
// Se declaran aparte porque los interpretadores de texto libre reusan las
// mismas respuestas: escribir "ya tengo casa" tiene que valer lo mismo que
// tocar el chip.

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
  patch: { subsidios: ["Por confirmar"] },
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
    interpretarTexto: interpretarVivienda,
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
    interpretarTexto: interpretarComposicion,
  });

  if (!perfil.rango_ingreso) {
    pasos.push({
      campo: "rango_ingreso_hogar",
      // Sin chips a propósito (D4): la lista sesga y deja gente por fuera.
      pregunta:
        "Ahora la pregunta incómoda, y te digo para qué es: solo la uso para no mostrarte casas que después te aprieten el bolsillo. ¿Cuánto entra al mes en tu hogar, sumando todo lo que llega (tu sueldo, el de tu pareja, lo que sea)? Un aproximado me sirve.",
      placeholder: "Ej: 4.500.000 · 2 millones y medio · entre 3 y 4",
      interpretarTexto: interpretarIngreso,
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
    interpretarTexto: interpretarSubsidios,
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
      interpretarTexto: interpretarEdad,
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
    interpretarTexto: interpretarCrediticia,
  });

  if (!perfil.ciudad) {
    pasos.push({
      campo: "zona_interes",
      // Sin chips a propósito (D4): la zona es de las que se escriben.
      pregunta:
        "Y lo más rico: ¿dónde te imaginas viviendo? Piensa en el día a día — cerca del colegio, del trabajo, de tu mamá. Eso termina pesando más que el precio.",
      placeholder: "Ej: Bogotá, por el norte",
      interpretarTexto: interpretarZona,
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
      interpretarTexto: interpretarIngreso,
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
