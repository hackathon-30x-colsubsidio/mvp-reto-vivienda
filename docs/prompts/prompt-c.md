Soy el integrante del Track C (Matching & explicación) del equipo. Vamos a construir el MVP
del reto Vivienda de la hackathon Colsubsidio × 30X. Tu trabajo hoy es mi arranque completo
según el reparto ya documentado en este repo.

ANTES DE ESCRIBIR CÓDIGO, lee en este orden:
1. AGENTS.md (el contrato del repo — la regla "cero caja negra" es la que más me aplica)
2. docs/spec.md (especialmente §4 factores del scoring, §5 criterio de aceptación 2 y §6
   catálogo de proyectos)
3. docs/adr/0002-stack-mvp.md (el stack: mis endpoints con Claude en streaming)
4. docs/reparto-inicial.md (mi track es el C; ahí están mis tareas y los contratos de lib/types.ts)
5. docs/plan.md — el plan del build. §3 "las costuras" y §8 (dos cambios a los contratos que me
   afectan directamente). Los tickets están en docs/tasks/ (índice en docs/tasks/README.md).

LO QUE ME TOCA DE LOS TICKETS:
- 004 (dueño B): NO reimplemento el tope del 40%. Importo cuotaEstimada/precioMaximo de
  lib/scoring/capacidad.ts. Dos versiones de la misma norma en el repo se desvían.
- 002 (dueño A): Score gana precio_maximo: number y /api/match recibe { lead, score }, no solo
  Score — necesito la zona de interés y el ingreso, que viven en Lead. Se ratifica en el
  kickoff; hasta entonces construyo contra la fixture con esa forma.
- Mis explicaciones de referencia (docs/explicaciones-referencia.md) se escriben sobre los
  números del ticket 001 (lib/fixtures/personajes.ts), no sobre personajes inventados por mí.
  Además son el fallback del ticket 010: si el experto no responde en vivo, la ficha muestra
  la explicación de referencia de ese personaje.
- Ojo con la rama: la convención del reparto es feature/matching. Si estás trabajando en
  mani-TrackC, consolida antes del primer merge.

MI PAPEL EN UNA FRASE: dado un Score que el motor de B ya calculó, recomiendo 2-3 proyectos
del catálogo con su porqué en lenguaje natural, y redacto la explicación global que ve el
asesor. El LLM JUSTIFICA con los factores ya calculados — jamás decide el corte ni inventa
factores. La explicación pesa tanto como la recomendación: es el diferenciador del reto.

FASE 1 — LAS 3 EXPLICACIONES DE REFERENCIA (a mano, sin código, arranca YA):
1. Redacta las explicaciones "perfectas" para los 3 personajes del demo (spec §4):
   afiliado listo, no afiliado listo (con restricción de cupo 90/10), y lead de nutrición.
2. Cada una debe: citar TODOS los factores del score con su valor (criterio de aceptación 2),
   citar el tope del 40% con su norma ("Decreto 583 de 2025") cuando aplique, explicar el
   porqué de cada proyecto recomendado, y en nutrición: la regla exacta que falló + qué la
   destrabaría. Tono: cercano y claro, sin jerga bancaria — el lead promedio compra VIS.
3. Guárdalas en docs/explicaciones-referencia.md. Son el estándar contra el que se evalúan
   mis prompts después — si el LLM no llega a este nivel, el prompt está mal, no el estándar.

FASE 2 — MATCHER (lógica determinista donde se pueda):
1. lib/matching/: dado un Score + el catálogo de proyectos, elegir 2-3 candidatos por reglas
   explícitas: precio del proyecto vs capacidad (cuota ≤ 40%), zona de interés del lead, y
   cupo 90/10 disponible del proyecto si el lead es no afiliado. Rankear es determinista;
   el LLM solo redacta el porqué de los ya elegidos.
2. Mientras B no publique data/sintetica/proyectos.json, usa una fixture propia con 4-5
   proyectos inventados con la MISMA forma. Punto de sincronización: cuando B avise que
   data/sintetica/ está en main, reemplaza la fixture por el JSON real (hoy en la noche).
3. Tests: un caso por personaje — el no afiliado solo recibe proyectos con cupo, nadie
   recibe un proyecto cuya cuota supere el 40% de su ingreso.

FASE 3 — EL EXPERTO (requiere el scaffold de A en main; los prompts se pueden escribir antes):
1. Prompt del "experto en vivienda Colsubsidio": grounded SOLO en las fichas de proyectos y
   los factores del Score que recibe — prohibido inventar datos, montos o subsidios que no
   vengan en el input. Formato de salida: los contratos ProyectoRecomendado.porque y
   LeadCurado.explicacion.
2. /api/match y /api/explicacion: reciben Score (+ catálogo), devuelven LeadCurado sin cita
   (la cita la agrega el agendador de A/D). claude-opus-4-8, streaming obligatorio, key solo
   server-side.
3. Evalúa el output contra docs/explicaciones-referencia.md con los 3 personajes y ajusta el
   prompt hasta que esté a la altura.

REGLAS QUE NO SE NEGOCIAN:
- Trabajo en la rama feature/matching (ya existe). Commits frecuentes y pequeños.
- El repo es público: ninguna key en ningún commit.
- No construyas nada de los otros tracks (chat, scoring, vista asesor) — mi input Score viene
  de fixture. No toques lib/types.ts sin avisarme para yo avisar al grupo.
- Idioma del producto: español.
- Al terminar la sesión, actualiza docs/agents/handoff.md con lo hecho y lo que sigue.

Empieza por la Fase 1 y sigue de corrido si todo va en verde.