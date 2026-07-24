import type { Lead, Score } from "@/lib/types";
import type { ProyectoElegido } from "./tipos";

// El "experto en vivienda Colsubsidio". Redacta el porqué de decisiones que YA
// se tomaron: el corte lo dictó el motor de B, los proyectos los eligió el
// matcher. El modelo no decide nada, solo explica con lo que recibe.
//
// El estándar que tiene que alcanzar está escrito a mano en
// docs/explicaciones-referencia.md. Si el output no llega ahí, se ajusta este
// archivo, no el estándar.

export const SYSTEM_PROMPT = `Eres un asesor experto en vivienda de Colsubsidio que le explica a la gente, en español claro, por qué puede o no puede comprar hoy y qué proyectos le sirven.

REGLA ABSOLUTA: solo puedes usar los datos que vienen en el mensaje. Está prohibido inventar precios, cuotas, plazos, tasas, subsidios, fechas o características de un proyecto que no estén ahí. Si un dato no viene, no lo menciones. Es preferible una explicación más corta que una con un número inventado.

Cómo escribes:
- Citas TODOS los factores del score con su valor. Ninguno se queda por fuera: si el asesor ve seis factores en la ficha, tu explicación menciona los seis.
- Cuando hables del tope del 40% de la cuota sobre el ingreso, citas la norma textualmente: "Decreto 583 de 2025". No es criterio de Colsubsidio, es ley, y eso cambia cómo suena.
- Cero jerga bancaria. Nada de "capacidad de endeudamiento", "relación cuota-ingreso" ni "scoring". Dices "lo que pagarías al mes" y "lo que entra al hogar".
- Lo autorreportado se marca como autorreportado: no consultamos centrales de riesgo.
- Si la persona no es afiliada, lo dices de frente y explicas que su compra cuenta contra el cupo del 10% que la regla 90/10 le deja al proyecto. No es un rechazo y no debe sonar a rechazo.
- Si no pasa el corte, nadie queda descartado: dices la regla exacta que falló y qué la destrabaría.
- Cada proyecto recomendado dice por qué es ese y no otro. "Es una excelente opción" no explica nada.
- Sin viñetas ni encabezados: párrafo corrido, como se lo dirías a la persona.

Responde únicamente con el texto pedido. No expliques tu razonamiento, no anuncies lo que vas a hacer, no agregues comentarios sobre el formato.`;

function factoresLegibles(score: Score): string {
  return score.factores
    .map((f) => `- ${f.nombre}: ${f.valor} (${f.cumple ? "cumple" : "no cumple"}, fuente: ${f.fuente})`)
    .join("\n");
}

function proyectosLegibles(elegidos: ProyectoElegido[]): string {
  if (elegidos.length === 0) return "(ninguno: el lead no supera el corte)";
  return elegidos
    .map(
      (e) =>
        `- ${e.ficha.nombre} (${e.ficha.proyecto_id}), en ${e.ficha.ciudad}. Entró porque: ${e.razones.join("; ")}.`,
    )
    .join("\n");
}

function contexto(lead: Lead, score: Score, elegidos: ProyectoElegido[]): string {
  return `DATOS DEL LEAD
Nombre: ${lead.evento.nombre}
Afiliación: ${lead.perfil.afiliado === undefined ? "sin match en la base de identidades" : lead.perfil.afiliado ? "afiliado" : "no afiliado"}
Ciudad conocida: ${lead.perfil.ciudad ?? "no se conoce"}
Zona de interés declarada: ${lead.respuestas.zona_interes ?? "no la declaró"}
Proyecto por el que preguntó: ${lead.evento.proyecto_interes ?? "ninguno"}

VEREDICTO DEL MOTOR (no lo discutas, explícalo)
Salida: ${score.salida}
Factores evaluados:
${factoresLegibles(score)}${
    score.regla_fallida
      ? `\nRegla que falló: ${score.regla_fallida}\nTrigger de recontacto: ${score.trigger_nutricion ?? "sin definir"}`
      : ""
  }

PROYECTOS QUE ELIGIÓ EL MATCHER (por reglas, no por ti)
${proyectosLegibles(elegidos)}`;
}

/** El porqué global que ve el asesor en su ficha: `LeadCurado.explicacion`. */
export function promptExplicacionGlobal(
  lead: Lead,
  score: Score,
  elegidos: ProyectoElegido[],
): string {
  return `${contexto(lead, score, elegidos)}

TAREA
Escribe la explicación que verá el ASESOR COMERCIAL en la ficha de este lead. Habla de la persona en tercera persona y por su nombre. Un solo párrafo de 90 a 150 palabras que cite los ${score.factores.length} factores de arriba con su valor y deje claro qué hacer con este lead.`;
}

/** El porqué de un proyecto puntual: `ProyectoRecomendado.porque`. */
export function promptPorqueProyecto(
  lead: Lead,
  score: Score,
  elegidos: ProyectoElegido[],
  proyecto_id: string,
): string {
  const elegido = elegidos.find((e) => e.ficha.proyecto_id === proyecto_id);
  if (!elegido) throw new Error(`El proyecto ${proyecto_id} no está entre los elegidos`);

  return `${contexto(lead, score, elegidos)}

TAREA
Escribe el porqué de UN solo proyecto: ${elegido.ficha.nombre} (${elegido.ficha.proyecto_id}). Se lo lees al LEAD en el chat, así que háblale de tú ("tu cuota", "tu ciudad"). Entre 30 y 60 palabras, apoyadas en las razones por las que ese proyecto entró. No menciones los otros proyectos.`;
}
