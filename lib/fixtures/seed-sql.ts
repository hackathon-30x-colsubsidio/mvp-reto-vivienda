import type { LeadCurado, MensajeConversacion } from "@/lib/types";
import * as leads from "./leads";
import * as curados from "./leads-curados";

// =====================================================================
// `db/seed.sql` GENERADO desde las fixtures.
//
// POR QUÉ: el seed se declaraba a sí mismo "un espejo de lib/fixtures, no la
// fuente", y ese espejo se rompió DOS veces sin que nadie lo notara — primero le
// faltó `ingreso_hogar_mensual` (el motor recibía un lead sin ingreso y lo
// mandaba a nutrición), después le faltó `puntaje` (la ficha mostraba 0/100).
// Un espejo que se copia a mano no es un espejo: es una segunda fuente.
//
// Ahora el SQL se emite desde las mismas fixtures que usa la app, y
// `seed-espejo.test.ts` falla si el archivo en disco no es idéntico a lo que
// esta función produce. Regenerar: `npx tsx scripts/generar-seed.ts`.
// =====================================================================

const PERSONAJES: { comentario: string; curado: LeadCurado; hilo: MensajeConversacion[] }[] = [
  {
    comentario: [
      "-- lead-001 — Diana Marcela Ríos · AFILIADA · pasa el corte -> LISTO",
      "-- ---------------------------------------------------------------------",
      "-- El caso feliz. El enriquecimiento ya la conocía, así que el conversador",
      "-- no le repreguntó ni el ingreso ni la ciudad (criterio de aceptación 1).",
    ].join("\n"),
    curado: curados.afiliadoListo,
    hilo: leads.conversaciones.afiliadoListo.hilo,
  },
  {
    comentario: [
      "-- lead-002 — Carlos Andrés Muñoz · NO AFILIADO · pasa el corte",
      "--             -> LISTO CON RESTRICCIÓN DE CUPO (regla 90/10)",
      "-- ---------------------------------------------------------------------",
      "-- El sub-caso crítico del spec §3: puede comprar, pero compite por el 10%.",
      "-- No se le miente ni se le descarta: recibe sus proyectos con la advertencia",
      "-- de cupo encima. Munición del pitch: el 27,1% de los compradores históricos",
      "-- NO son afiliados, casi 3x el 10% que permite la regla.",
    ].join("\n"),
    curado: curados.noAfiliadoListo,
    hilo: leads.conversaciones.noAfiliadoListo.hilo,
  },
  {
    comentario: [
      "-- lead-003 — Yuliana Andrea Pérez · NO pasa el corte -> NUTRICIÓN",
      "-- ---------------------------------------------------------------------",
      "-- El corazón del criterio de aceptación 3: NADIE SE DESCARTA. Falla el tope",
      "-- del 40% del Decreto 583 de 2025 y por eso queda con la regla exacta que no",
      "-- pasó y el trigger que la revierte, con el monto que le falta.",
      "-- El botón \"simular trigger\" de la ficha la re-engancha (ticket 007).",
    ].join("\n"),
    curado: curados.nutricion,
    hilo: leads.conversaciones.nutricion.hilo,
  },
];

/** Literal SQL de un texto. `null` cuando no hay valor. */
function txt(valor: string | null | undefined): string {
  return valor === null || valor === undefined
    ? "null"
    : `'${valor.replaceAll("'", "''")}'`;
}

/** Literal SQL de un objeto, como jsonb. */
function json(valor: unknown): string {
  return `${txt(JSON.stringify(valor))}::jsonb`;
}

function filaLead({ comentario, curado }: (typeof PERSONAJES)[number]): string {
  const { lead, score, proyectos, explicacion } = curado;
  const { evento, perfil, respuestas } = lead;

  return `-- =====================================================================
${comentario}
-- =====================================================================
insert into leads (
  lead_id, nombre, celular, cedula, proyecto_interes, fuente,
  perfil, respuestas,
  consentimiento_otorgado, consentimiento_ts,
  estado, puntaje, factores, regla_fallida, trigger_nutricion,
  proyectos, explicacion
) values (
  ${txt(evento.lead_id)},
  ${txt(evento.nombre)},
  ${txt(evento.celular)},
  ${txt(evento.cedula)},
  ${txt(evento.proyecto_interes ?? null)},
  ${txt(evento.fuente)},
  ${json(perfil)},
  ${json(respuestas)},
  ${respuestas.consentimiento.otorgado}, ${txt(respuestas.consentimiento.timestamp)},
  ${txt(score.salida)},
  ${score.puntaje},
  -- Los ${score.factores.length} factores tal como los emitió el motor. El criterio de
  -- aceptación 2 se verifica contando esto contra lo que la ficha renderiza.
  ${json(score.factores)},
  ${txt(score.regla_fallida ?? null)},
  ${txt(score.trigger_nutricion ?? null)},
  ${json(proyectos)},
  ${txt(explicacion)}
);`;
}

function filasConversacion(leadId: string, hilo: MensajeConversacion[]): string {
  const filas = hilo
    .map((m, i) => `  (${txt(leadId)}, ${txt(m.rol)}, ${txt(m.mensaje)}, ${i + 1})`)
    .join(",\n");

  return `insert into conversaciones (lead_id, rol, mensaje, orden) values\n${filas};`;
}

function filasCitas(): string {
  const conCita = PERSONAJES.filter((p) => p.curado.cita);
  const filas = conCita
    .map(
      ({ curado }) =>
        `  (${txt(curado.lead.evento.lead_id)}, ${txt(curado.cita!.fecha)}, ${txt(curado.cita!.sala_ventas)})`,
    )
    .join(",\n");

  return `insert into citas (lead_id, fecha, sala_ventas) values\n${filas};`;
}

export function generarSeedSql(): string {
  const bloques = PERSONAJES.map(
    (p) => `${filaLead(p)}\n\n${filasConversacion(p.curado.lead.evento.lead_id, p.hilo)}`,
  );

  return `-- =====================================================================
-- mvp-reto-vivienda — Seed de los 3 personajes del demo
-- Hackathon Colsubsidio x 30X
--
-- ⚠️  ARCHIVO GENERADO — NO EDITAR A MANO.
--     Se regenera con:  npx tsx scripts/generar-seed.ts
--     La fuente son las fixtures (lib/fixtures/), y el score y los proyectos
--     de ahí los produce el MOTOR REAL. Antes este archivo se copiaba a mano y
--     se desincronizó dos veces: la ficha sembrada mostraba números que el
--     motor nunca calculó. \`lib/fixtures/seed-espejo.test.ts\` falla si este
--     archivo deja de ser idéntico a lo que genera el script.
--
-- CÓMO USARLO: correr DESPUÉS de db/schema.sql en el SQL Editor de Supabase.
--     Es idempotente: BORRA y vuelve a sembrar (se lleva por delante las
--     conversaciones de prueba). Es el reset canónico antes de grabar el video.
--
-- ⚠️  DATA SINTÉTICA. Cédulas, nombres y celulares inventados. Ninguna data
--     real de Colsubsidio entra al repo (AGENTS.md). Los proyectos, sus precios
--     y sus cupos 90/10 sí son derivados del Excel real, vía data/sintetica/.
--
-- Los 3 personajes del spec §4 ("Cómo entra el jurado"):
${PERSONAJES.map(
  ({ curado }) =>
    `--   ${curado.lead.evento.lead_id} ${curado.lead.evento.nombre.padEnd(22)}-> ${curado.score.salida} (${curado.score.puntaje}/100)`,
).join("\n")}
-- =====================================================================

delete from citas;
delete from conversaciones;
delete from leads;


${bloques.join("\n\n\n")}


-- =====================================================================
-- CITAS — solo la franja ELEGIDA (ticket 005)
-- ---------------------------------------------------------------------
-- El catálogo de franjas vive en data/sintetica/slots.json, no aquí.
-- Quien está en nutrición NO tiene cita: no supera el corte.
-- =====================================================================
${filasCitas()}


-- =====================================================================
-- Verificación rápida: correr esto después del seed.
-- Debe devolver 3 filas, en el orden listo > restricción > nutrición,
-- todas con 7 factores y con su puntaje.
-- =====================================================================
-- select lead_id, nombre, estado, puntaje, orden_prioridad, total_factores,
--        cita_fecha, regla_fallida is not null as tiene_regla
--   from cola_asesor;
`;
}
