import type { Lead, PerfilConocido } from "@/lib/types";

// Set de preguntas del spec §6: los 4 que el brief lista como capacidad de
// compra + la zona de interés para el matcher. NUNCA se pregunta lo que el
// enriquecimiento ya trajo (criterio de aceptación 1, spec §5).

export type CampoPregunta = Exclude<keyof Lead["respuestas"], "consentimiento">;

export interface PasoPregunta {
  campo: CampoPregunta;
  pregunta: string;
  tipo: "texto" | "si_no";
}

/**
 * Dado un PerfilConocido, decide qué se pregunta y en qué orden.
 * El único guion fijo es la ausencia de guion: quien ya trajo el dato del
 * enriquecimiento, no lo repite en la conversación.
 */
export function construirPreguntas(perfil: PerfilConocido): PasoPregunta[] {
  const pasos: PasoPregunta[] = [];

  if (!perfil.rango_ingreso) {
    pasos.push({
      campo: "rango_ingreso_hogar",
      pregunta:
        "¿Cuál es el rango de ingresos mensuales de tu hogar? (por ejemplo: 1-2, 2-3 o 3-5 salarios mínimos)",
      tipo: "texto",
    });
  }

  pasos.push({
    campo: "tiene_vivienda",
    pregunta: "¿Tienes vivienda propia actualmente?",
    tipo: "si_no",
  });

  pasos.push({
    campo: "subsidios",
    pregunta:
      "¿Has recibido o aplicas a algún subsidio de vivienda (Mi Casa Ya, subsidio concertado, caja de compensación)? Cuéntame cuáles o dime \"ninguno\".",
    tipo: "texto",
  });

  pasos.push({
    campo: "situacion_crediticia",
    pregunta:
      "¿Cómo describirías tu situación crediticia hoy? (al día, con alguna mora, sin historial...)",
    tipo: "texto",
  });

  if (!perfil.ciudad) {
    pasos.push({
      campo: "zona_interes",
      pregunta: "¿En qué ciudad o zona te gustaría comprar vivienda?",
      tipo: "texto",
    });
  }

  return pasos;
}

/**
 * El mensaje que hace explícito lo que ya sabemos (criterio de aceptación 1):
 * se dice ANTES de preguntar nada más, con los datos que trajo el enriquecimiento.
 */
export function mensajeYaSabemos(perfil: PerfilConocido, nombre: string): string {
  const primerNombre = nombre.split(" ")[0];

  if (!perfil.match) {
    return `${primerNombre}, no encontramos datos previos tuyos en nuestra base, así que te voy a preguntar todo lo necesario para orientarte bien.`;
  }

  const partes: string[] = [];
  if (perfil.afiliado !== undefined) {
    partes.push(
      perfil.afiliado
        ? "que eres afiliado a Colsubsidio"
        : "que no eres afiliado a Colsubsidio",
    );
  }
  if (perfil.ciudad) partes.push(`que vives en ${perfil.ciudad}`);
  if (perfil.rango_ingreso) {
    partes.push(`un rango de ingreso de tu hogar de ${perfil.rango_ingreso}`);
  }

  if (partes.length === 0) {
    return `${primerNombre}, tenemos un registro tuyo pero sin datos adicionales. Te voy a preguntar lo que falta.`;
  }

  return `${primerNombre}, ya sabemos ${partes.join(", ")}. No te lo voy a volver a preguntar — solo me faltan un par de cosas.`;
}
