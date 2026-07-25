// =====================================================================
// Lo que Sara puede decir sobre subsidios y crédito, con su fuente.
//
// Es GROUNDING DE CONVERSACIÓN, no insumo del motor. La distinción
// importa y es la que evita que este archivo compita con el ticket 017:
// aquí no hay montos para calcular una cuota — hay lo que se le puede
// afirmar a una persona sin mentirle. El día que 017 entre con una
// fuente citable por tramo, esa tabla vivirá en `lib/scoring/` y hará
// otra cosa.
//
// Fuente única: docs/credito-y-subsidios.md (investigación del
// 2026-07-25, con URLs). La regla del repo manda aquí más que en
// ningún lado: CERO cifras sin fuente citable. Donde las fuentes se
// contradicen —el monto del subsidio de caja— `monto` es null y se dice
// por qué, en vez de escoger la cifra que más nos conviene.
//
// Por qué importa que esté aquí y no dentro de un prompt: los textos
// que el agente usa como verdad son datos, no redacción. Se editan sin
// tocar código y sin re-leer un prompt de 40 líneas (spec 02 D5, nivel
// 2: "grounding actualizable").
// =====================================================================

export interface FuenteCitada {
  titulo: string;
  url: string;
}

export interface SubsidioGrounding {
  id: string;
  nombre: string;
  estado: "vigente" | "sin_presupuesto_2026";
  /** Quién puede recibirlo, en una línea. */
  para_quien: string;
  /** Qué hace por la persona, en su lenguaje. */
  efecto: string;
  /**
   * El monto, SOLO si hay una fuente que no se contradiga con otra.
   *
   * `null` no es "no sabemos": es "las fuentes no coinciden y no vamos a
   * escoger". Quien lea esto en el prompt tiene prohibido rellenarlo.
   */
  monto: { texto: string; fuente: FuenteCitada } | null;
  /** La verdad operable cuando no hay monto: qué sí se puede decir. */
  nota: string;
  fuentes: FuenteCitada[];
}

const CRONOGRAMA_COLSUBSIDIO: FuenteCitada = {
  titulo: "Colsubsidio — cronograma de asignación de subsidios 2026",
  url: "https://cms.colsubsidio.com/sites/default/files/Documentos/colsubsidio/2026/cronograma-asignacion-subsidios-colsubsidio-2026.pdf",
};

const PORTAFOLIO: FuenteCitada = {
  titulo: "Portafolio — subsidios vigentes en 2026 tras Mi Casa Ya",
  url: "https://www.portafolio.co/mis-finanzas/vivienda/subsidios-de-vivienda-vigentes-en-2026-cajas-de-compensacion-y-programas-locales-tras-mi-casa-ya-485814",
};

const EL_COLOMBIANO: FuenteCitada = {
  titulo: "El Colombiano — subsidios de vivienda 2026",
  url: "https://www.elcolombiano.com/negocios/subsidios-de-vivienda-2026-colombia-montos-requisitos-acceder-casa-propia-DO32696533",
};

const DECRETO_583: FuenteCitada = {
  titulo: "Decreto 583 de 2025",
  url: "https://www.alcaldiabogota.gov.co/sisjur/normas/Norma1.jsp?i=179478",
};

export const SUBSIDIOS_GROUNDING: SubsidioGrounding[] = [
  {
    id: "caja-compensacion",
    nombre: "Subsidio de vivienda de las cajas de compensación (el de Colsubsidio)",
    estado: "vigente",
    para_quien:
      "personas afiliadas a una caja de compensación, que no sean propietarias de vivienda en el país y compren un proyecto VIS o VIP",
    efecto:
      "es plata que no se devuelve y baja lo que se termina pagando por la vivienda",
    // Sin cifra a propósito: las fuentes públicas se contradicen (una habla de
    // hasta 30 SMMLV, otras de topes distintos) y el cronograma oficial de
    // Colsubsidio no se ha abierto. Prometerle un monto a alguien que está
    // decidiendo la compra de su vida, con fuentes que no coinciden, es
    // exactamente lo que este proyecto no hace.
    monto: null,
    nota: "el monto depende de la convocatoria y del ingreso del hogar; lo confirma el asesor con el cronograma vigente",
    fuentes: [PORTAFOLIO, CRONOGRAMA_COLSUBSIDIO],
  },
  {
    id: "mi-casa-ya",
    nombre: "Mi Casa Ya",
    estado: "sin_presupuesto_2026",
    para_quien: "nadie en 2026: el programa del Gobierno no tiene asignaciones este año",
    efecto:
      "no está operando, así que hoy no es un camino; el de la caja de compensación sí lo es",
    monto: null,
    nota: "si la persona lo menciona, no se le promete: se le dice que este año no está asignando y se le cuenta del subsidio de la caja",
    fuentes: [EL_COLOMBIANO, PORTAFOLIO],
  },
];

/**
 * El marco legal del crédito. No es un subsidio, pero es la duda que más
 * aparece ("¿cuánto me prestan?", "¿cuánto tengo que ganar?") y es lo único de
 * esta zona con fuente única e inequívoca: una norma.
 */
export const MARCO_CREDITO = {
  tope_cuota:
    "la primera cuota del crédito no puede pasar del 40% de los ingresos del hogar",
  financiacion:
    "se puede financiar hasta el 70% del valor de la vivienda (80% si es VIS)",
  fuente: DECRETO_583,
} as const;

/**
 * La tabla como texto plano para inyectarla al prompt.
 *
 * Se genera en vez de escribirse a mano por la misma razón de siempre: un
 * espejo que se copia a mano es una segunda fuente, y termina desactualizado.
 */
export function tablaSubsidiosParaPrompt(): string {
  const lineas = SUBSIDIOS_GROUNDING.map((s) => {
    const estado = s.estado === "vigente" ? "VIGENTE" : "NO ESTÁ OPERANDO EN 2026";
    const monto = s.monto
      ? `Monto: ${s.monto.texto} (fuente: ${s.monto.fuente.titulo}).`
      : "Monto: NO tenemos una cifra confirmada, y por lo tanto NO se menciona ninguna.";

    return [
      `- ${s.nombre} [${estado}]`,
      `  Para quién: ${s.para_quien}.`,
      `  Qué hace: ${s.efecto}.`,
      `  ${monto}`,
      `  Qué sí se puede decir: ${s.nota}.`,
    ].join("\n");
  });

  return [
    ...lineas,
    `- Reglas del crédito (${MARCO_CREDITO.fuente.titulo}): ${MARCO_CREDITO.tope_cuota}; ${MARCO_CREDITO.financiacion}. Esta norma sí se puede citar con su nombre.`,
  ].join("\n");
}
