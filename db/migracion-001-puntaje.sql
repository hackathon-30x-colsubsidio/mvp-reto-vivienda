-- =====================================================================
-- Migración 001 — la columna `puntaje` (y el lead con un solo proyecto)
--
-- POR QUÉ EXISTE: la DB de producción se creó con una versión de
-- `schema.sql` ANTERIOR al puntaje 0–100 (el tablero lo agregó después).
-- La columna quedó en el archivo pero nunca en la base, así que TODA
-- escritura desde la app rebotaba con:
--
--     Could not find the 'puntaje' column of 'leads' in the schema cache
--
-- Efecto: ninguna conversación se guardó jamás. No era el chat ni el
-- motor — era esta columna. Diagnosticado el 2026-07-24 corriendo
-- /api/curar contra la base real.
--
-- CÓMO CORRERLA: pegar completo en el SQL Editor de Supabase y ejecutar.
-- Es idempotente: se puede correr varias veces sin romper nada, y NO
-- borra datos (a diferencia de `schema.sql`, que es drop + create).
-- =====================================================================

-- 1. La columna que falta. Los leads que ya existen quedan en 0 hasta que
--    se vuelvan a curar; el orden de la cola por estado no se afecta.
alter table leads add column if not exists puntaje integer not null default 0;

comment on column leads.puntaje is
  'Score.puntaje (0-100). Prioridad dentro de cada estado en la cola del asesor.';


-- 2. Criterio 4, relajado a "hasta 3": un lead con UN solo proyecto
--    también se guarda.
--
--    El CHECK original aceptaba 0 o 2-3 y rechazaba exactamente 1. Con el
--    catálogo real eso es alcanzable: a un lead cuyo tope del 40% solo le
--    alcanza para el proyecto más económico le queda 1 candidato, y la DB
--    le rechazaba la fila entera — o sea, el lead se PERDÍA. Eso choca de
--    frente con "nadie se descarta" (restricción no-negociable), que pesa
--    más que la redacción "entre 2 y 3" del criterio 4.
--
--    ⚠️ Es un cambio a un criterio de aceptación: queda para ratificar por
--    el TEAM. Revertirlo es volver a poner `between 2 and 3`.
alter table leads drop constraint if exists listo_tiene_2_o_3_proyectos;
alter table leads drop constraint if exists listo_tiene_hasta_3_proyectos;
alter table leads add constraint listo_tiene_hasta_3_proyectos
  check (
    estado not in ('listo', 'listo_restriccion_cupo')
    or jsonb_array_length(proyectos) <= 3
  );


-- 3. Recrear la vista: `select l.*` se expande CUANDO SE CREA la vista, así
--    que sin esto `cola_asesor` seguiría sin exponer `puntaje` y la cola del
--    asesor ordenaría con ceros. No basta `create or replace`: la columna
--    nueva cambia la lista, y eso exige drop + create.
drop view if exists cola_asesor;

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


-- 4. Verificación: las dos consultas deben responder sin error.
--    La primera lista la columna nueva; la segunda, que la vista la expone.
select column_name, data_type
  from information_schema.columns
 where table_name = 'leads' and column_name = 'puntaje';

select lead_id, estado, puntaje from cola_asesor limit 5;
