-- =====================================================================
-- mvp-reto-vivienda — Esquema de la DB central de leads
-- Hackathon Colsubsidio x 30X — Track D
--
-- Decisiones y porqué: docs/adr/0003-esquema-db-leads.md
-- Insumo:              docs/plan.md §2 (modelo propuesto; este ADR lo cierra)
-- Contratos:           lib/types.ts (Lead / Score / LeadCurado)
--
-- CÓMO USARLO: pegar completo en el SQL Editor de Supabase y ejecutar.
-- Es idempotente (drop + create): se puede volver a correr sin miedo.
-- Después correr db/seed.sql para los 3 personajes del demo.
-- =====================================================================

-- Orden inverso a las dependencias.
drop view  if exists cola_asesor;
drop table if exists citas          cascade;
drop table if exists conversaciones cascade;
drop table if exists leads          cascade;


-- =====================================================================
-- 1. leads
-- ---------------------------------------------------------------------
-- Una fila por lead. Se CREA en la ingesta (spec §4 paso 1: "llega a la
-- ingesta y queda registrado con su fuente") y se ACTUALIZA cuando el
-- motor de scoring y el matcher terminan.
--
-- estado NULL = todavía en conversación, aún sin calificar.
-- La cola del asesor filtra WHERE estado IS NOT NULL.
-- =====================================================================
create table leads (
  id                      uuid        primary key default gen_random_uuid(),

  -- ── LeadEvento (lo que trae la ingesta) ──────────────────────────
  -- lead_id es TEXT, no uuid: el contrato lo produce como string
  -- ("lead-001" en las fixtures canónicas), no como uuid.
  lead_id                 text        not null unique,
  nombre                  text        not null,
  celular                 text        not null,
  cedula                  text        not null,
  proyecto_interes        text,
  -- La fuente sostiene la narrativa multi-canal del spec §4 paso 1:
  -- se registra aquí y se MUESTRA en la ficha del asesor.
  fuente                  text        not null,

  -- ── PerfilConocido (lo que devuelve el enriquecimiento) ──────────
  -- jsonb completo: { match, afiliado, ciudad, segmento, rango_ingreso }
  perfil                  jsonb       not null default '{"match": false}'::jsonb,

  -- ── Lead.respuestas (lo que contestó en la conversación) ─────────
  respuestas              jsonb       not null default '{}'::jsonb,

  -- ── Consentimiento: habeas data, Ley 1581 de 2012 (spec §6) ──────
  -- Sube a columna propia porque es EVIDENCIA AUDITABLE, no una
  -- respuesta más. Enterrado en el jsonb no se puede consultar.
  consentimiento_otorgado boolean     not null default false,
  consentimiento_ts       timestamptz,

  -- ── Score (el veredicto del motor) ───────────────────────────────
  -- estado = Score.salida. Las 3 salidas del spec y ninguna más:
  -- NO existe "descartado" (spec §2).
  estado                  text,
  -- factores = Score.factores (FactorScore[]).
  -- CERO CAJA NEGRA: se guarda el array COMPLETO, tal cual lo evaluó
  -- el motor. El criterio de aceptación 2 se verifica contando esto
  -- (ticket 012).
  factores                jsonb       not null default '[]'::jsonb,
  regla_fallida           text,
  trigger_nutricion       text,

  -- ── LeadCurado (lo que ve el asesor) ─────────────────────────────
  proyectos               jsonb       not null default '[]'::jsonb,
  explicacion             text,

  -- ── Nutrición: marca del botón "simular trigger" (ticket 007) ────
  -- NO es un cuarto estado: el lead sigue siendo de nutrición.
  -- NULL = todavía no se le disparó el trigger.
  re_enganchado_en        timestamptz,

  creado_en               timestamptz not null default now(),
  actualizado_en          timestamptz not null default now(),

  -- ── Reglas del dominio ───────────────────────────────────────────
  constraint fuente_valida
    check (fuente in ('meta', 'google', 'web')),

  -- Las 3 salidas del corte (spec §4). NULL = aún en conversación.
  constraint estado_valido
    check (estado is null
           or estado in ('listo', 'listo_restriccion_cupo', 'nutricion')),

  -- CRITERIO DE ACEPTACIÓN 2 — cero caja negra.
  -- Ningún lead calificado puede existir sin factores visibles.
  constraint calificado_tiene_factores
    check (estado is null or jsonb_array_length(factores) > 0),

  -- CRITERIO DE ACEPTACIÓN 3 — nadie se descarta.
  -- "Todo lead en nutrición tiene razón y trigger no vacíos."
  constraint nutricion_tiene_razon_y_trigger
    check (
      estado is distinct from 'nutricion'
      or (coalesce(trim(regla_fallida), '')     <> ''
      and coalesce(trim(trigger_nutricion), '') <> '')
    ),

  -- CRITERIO DE ACEPTACIÓN 4 — el lead listo llega cerrable.
  -- "entre 2 y 3 proyectos del catálogo".
  -- Se permite 0 a propósito: deja escribir el lead calificado ANTES
  -- de que el matcher corra (el orquestador del ticket 006 escribe en
  -- dos pasos), sin que la DB rechace el insert a mitad del demo.
  constraint listo_tiene_2_o_3_proyectos
    check (
      estado not in ('listo', 'listo_restriccion_cupo')
      or jsonb_array_length(proyectos) = 0
      or jsonb_array_length(proyectos) between 2 and 3
    ),

  -- Coherencia: si hay consentimiento, hay marca de tiempo.
  constraint consentimiento_con_timestamp
    check (not consentimiento_otorgado or consentimiento_ts is not null),

  -- factores y proyectos son ARRAYS de objetos, no objetos sueltos.
  constraint factores_es_array
    check (jsonb_typeof(factores) = 'array'),
  constraint proyectos_es_array
    check (jsonb_typeof(proyectos) = 'array')
);

comment on table  leads is
  'Lead de pauta, de la ingesta al curado. Esquema: docs/adr/0003-esquema-db-leads.md';
comment on column leads.estado is
  'Las 3 salidas del corte (spec §4). NULL = aún en conversación, sin calificar.';
comment on column leads.factores is
  'Score.factores completo (FactorScore[]). Cero caja negra: no se filtra ninguno.';
comment on column leads.re_enganchado_en is
  'Marca del botón "simular trigger" (ticket 007). NO es un cuarto estado.';

-- La cola del asesor se ordena por estado; el índice la sirve directo.
create index leads_cola_idx on leads (estado, creado_en desc)
  where estado is not null;
create index leads_cedula_idx on leads (cedula);


-- =====================================================================
-- 2. conversaciones
-- ---------------------------------------------------------------------
-- Una fila POR MENSAJE (no un JSON por hilo): permite append durante el
-- streaming del conversador, y deja el re-enganche auditable en el
-- mismo hilo con rol = 'sistema'.
--
-- Los roles 'lead' y 'asistente' salen del modelo propuesto en
-- docs/plan.md §2; 'sistema' se agrega para los eventos (consentimiento
-- y el trigger del ticket 007), que no son mensajes de nadie.
-- =====================================================================
create table conversaciones (
  id          bigint      generated always as identity primary key,
  lead_id     text        not null references leads (lead_id) on delete cascade,
  rol         text        not null,
  mensaje     text        not null,
  orden       int         not null,   -- posición en el hilo, 1-based
  creado_en   timestamptz not null default now(),

  constraint rol_valido check (rol in ('lead', 'asistente', 'sistema')),
  constraint orden_unico_por_lead unique (lead_id, orden)
);

comment on table conversaciones is
  'Historial de la conversación, una fila por mensaje. rol=sistema marca los eventos.';

create index conversaciones_lead_idx on conversaciones (lead_id, orden);


-- =====================================================================
-- 3. citas
-- ---------------------------------------------------------------------
-- SOLO la franja ELEGIDA. El catálogo de franjas NO vive aquí: es
-- data/sintetica/slots.json (ticket 005).
--
-- Es la regla del ADR 0002 aplicada al pie de la letra: a Supabase va
-- únicamente lo que MUTA. Un catálogo de horarios simulados no muta.
--
-- Fuera de alcance por el ticket 005: disponibilidad real, conflictos y
-- cancelación. "Un slot elegido no se bloquea para otros" — por eso
-- aquí no hay columna `disponible` ni función de reserva.
-- =====================================================================
create table citas (
  id           uuid        primary key default gen_random_uuid(),
  lead_id      text        not null references leads (lead_id) on delete cascade,
  fecha        timestamptz not null,
  sala_ventas  text        not null,
  creado_en    timestamptz not null default now(),

  -- Un lead, una cita. Reagendar = pisar la fila (upsert).
  constraint una_cita_por_lead unique (lead_id)
);

comment on table citas is
  'La franja ELEGIDA por el lead. El catálogo es data/sintetica/slots.json (ticket 005).';


-- =====================================================================
-- 4. cola_asesor — la cola priorizada
-- ---------------------------------------------------------------------
-- El orden del demo: listos arriba, luego los que tienen restricción de
-- cupo 90/10, y al final nutrición. Nadie se queda por fuera.
--
-- security_invoker = on es OBLIGATORIO: por defecto una vista corre con
-- los privilegios de su DUEÑO y se SALTARÍA el RLS de abajo — la clave
-- publicable podría leer por la vista lo que no puede leer en la tabla.
-- =====================================================================
create view cola_asesor with (security_invoker = on) as
select
  l.*,
  case l.estado
    when 'listo'                  then 1
    when 'listo_restriccion_cupo' then 2
    when 'nutricion'              then 3
  end                                          as orden_prioridad,
  jsonb_array_length(l.factores)               as total_factores,
  (l.re_enganchado_en is not null)             as fue_re_enganchado,
  c.fecha                                      as cita_fecha,
  c.sala_ventas                                as cita_sala_ventas
from leads l
left join citas c on c.lead_id = l.lead_id
where l.estado is not null
order by orden_prioridad, l.creado_en desc;

comment on view cola_asesor is
  'Cola priorizada del asesor: listo > listo_restriccion_cupo > nutricion.';


-- =====================================================================
-- 5. SEGURIDAD — RLS activado, CERO policies
-- ---------------------------------------------------------------------
-- /asesor no tiene login (ADR 0002) y el repo es PÚBLICO.
-- Sin policies, la clave publicable no puede leer ni escribir NADA.
-- Solo la clave SECRETA (sb_secret_..., server-side en las API routes)
-- pasa RLS. El navegador nunca habla con Supabase directamente.
--
-- Esto es lo que hace que "sin login" sea decisión de producto y no un
-- hueco de seguridad: la pantalla es pública, la base de datos no.
-- =====================================================================
alter table leads          enable row level security;
alter table conversaciones enable row level security;
alter table citas          enable row level security;

-- (Deliberadamente NO se crea ninguna policy. No es un olvido.)
