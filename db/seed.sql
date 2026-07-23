-- =====================================================================
-- mvp-reto-vivienda — Seed de los 3 personajes del demo
-- Hackathon Colsubsidio x 30X — Track D
--
-- CÓMO USARLO: correr DESPUÉS de db/schema.sql en el SQL Editor.
-- Es idempotente: borra y vuelve a sembrar.
--
-- ⚠️  ESTE ARCHIVO ES UN ESPEJO DE lib/fixtures/ — no la fuente.
--     Los personajes canónicos viven en el código (ticket 001 / costura
--     S6 del plan): lib/fixtures/leads-evento.ts, perfiles-conocidos.ts,
--     leads.ts, scores.ts, proyectos-recomendados.ts, leads-curados.ts.
--     Si un número cambia allá, cambia aquí. Nunca al revés: si los dos
--     se contradicen, el demo se contradice a sí mismo en pantalla.
--
-- ⚠️  DATA SINTÉTICA. Cédulas, nombres y celulares inventados.
--     Ninguna data real de Colsubsidio entra al repo (AGENTS.md).
--
-- Los 3 personajes del spec §4 ("Cómo entra el jurado"):
--   lead-001 Diana Marcela Ríos    · afiliada     -> listo
--   lead-002 Carlos Andrés Muñoz   · NO afiliado  -> listo_restriccion_cupo
--   lead-003 Yuliana Andrea Pérez  · falla el 40% -> nutricion
-- =====================================================================

delete from citas;
delete from conversaciones;
delete from leads;


-- =====================================================================
-- lead-001 — Diana Marcela Ríos · AFILIADA · pasa el corte -> LISTO
-- ---------------------------------------------------------------------
-- El caso feliz. El enriquecimiento ya la conocía, así que el
-- conversador no le repreguntó ni ingreso ni ciudad (criterio 1).
-- =====================================================================
insert into leads (
  lead_id, nombre, celular, cedula, proyecto_interes, fuente,
  perfil, respuestas,
  consentimiento_otorgado, consentimiento_ts,
  estado, factores, proyectos, explicacion
) values (
  'lead-001',
  'Diana Marcela Ríos',
  '3001234567',
  '1010123456',
  'Torres de Bellavista',
  'meta',
  jsonb_build_object(
    'match', true,
    'afiliado', true,
    'ciudad', 'Bogotá',
    'segmento', 'Beta',
    'rango_ingreso', '3-5 SMMLV'
  ),
  jsonb_build_object(
    'consentimiento', jsonb_build_object(
      'otorgado', true, 'timestamp', '2026-07-23T14:32:10-05:00'),
    'tiene_vivienda', false,
    'subsidios', jsonb_build_array('Mi Casa Ya'),
    'situacion_crediticia', 'buena, sin mora reportada'
  ),
  true, '2026-07-23T14:32:10-05:00',
  'listo',
  -- 6 factores. El criterio de aceptación 2 se verifica contando esto
  -- contra lo que la ficha renderiza (ticket 012): tienen que ser 6.
  jsonb_build_array(
    jsonb_build_object('nombre', 'afiliacion',
      'valor', 'afiliado',
      'cumple', true,  'fuente', 'enriquecimiento'),
    jsonb_build_object('nombre', 'cuota_ingreso_40',
      'valor', 'cuota estimada 32% del ingreso del hogar (tope 40%, Decreto 583 de 2025)',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'subsidio_aplicable',
      'valor', 'Mi Casa Ya aplica y baja la cuota estimada',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'ya_tiene_vivienda',
      'valor', 'no tiene vivienda propia',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'situacion_crediticia',
      'valor', 'autorreportada buena, sin mora',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'similitud_compradores',
      'valor', '84% similar a compradores históricos del proyecto',
      'cumple', true,  'fuente', 'historico')
  ),
  jsonb_build_array(
    jsonb_build_object('proyecto_id', 'p-07', 'nombre', 'Torres de Bellavista',
      'porque', 'Tu cuota estimada es 32% de tu ingreso del hogar, dentro del tope legal del 40%; está en Bogotá, tu ciudad, y el subsidio Mi Casa Ya que aplicas la baja todavía más.'),
    jsonb_build_object('proyecto_id', 'p-12', 'nombre', 'Reserva de los Cerros',
      'porque', 'Mismo rango de precio que Torres de Bellavista y en tu ciudad; el 84% de similitud con compradores históricos de este proyecto respalda que perfiles como el tuyo sí compran aquí.')
  ),
  'Diana es afiliada a Colsubsidio y su cuota estimada (32% del ingreso del hogar) queda holgada bajo el tope legal del 40% que fija el Decreto 583 de 2025, incluso antes de sumar el subsidio Mi Casa Ya al que aplica. No tiene vivienda propia y no reporta mora, y el 84% de similitud con compradores históricos de Torres de Bellavista respalda la recomendación.'
);

insert into conversaciones (lead_id, rol, mensaje, orden) values
  ('lead-001', 'sistema',   'Lead recibido de Meta Lead Ads. Enriquecimiento: cédula encontrada en la base de identidades.', 1),
  ('lead-001', 'asistente', 'Hola Diana Marcela 👋 Soy el asistente de vivienda de Colsubsidio. Antes de empezar necesito tu autorización para tratar tus datos personales (Ley 1581 de 2012). ¿Me la das?', 2),
  ('lead-001', 'lead',      'Sí, claro', 3),
  ('lead-001', 'sistema',   'Consentimiento habeas data otorgado y registrado.', 4),
  ('lead-001', 'asistente', 'Gracias. Como ya eres afiliada, tengo tu ciudad (Bogotá) y tu rango de ingreso, así que no te los vuelvo a preguntar. ¿Ya tienes vivienda propia?', 5),
  ('lead-001', 'lead',      'No, sería la primera', 6),
  ('lead-001', 'asistente', '¡Perfecto, eso te mantiene los subsidios! ¿Has recibido o podrías aplicar a alguno?', 7),
  ('lead-001', 'lead',      'Creo que a Mi Casa Ya', 8),
  ('lead-001', 'asistente', 'Muy bien. Última: ¿cómo va tu situación crediticia hoy?', 9),
  ('lead-001', 'lead',      'Al día, no tengo moras', 10),
  ('lead-001', 'asistente', 'Listo Diana. Con eso ya sé que puedes comprar: te encontré 2 proyectos y te agendé una visita. ✅', 11);


-- =====================================================================
-- lead-002 — Carlos Andrés Muñoz · NO AFILIADO · pasa el corte
--             -> LISTO CON RESTRICCIÓN DE CUPO (regla 90/10)
-- ---------------------------------------------------------------------
-- El sub-caso crítico del spec §3: puede comprar, pero compite por el
-- 10%. No se le miente ni se le descarta: se le marca contra el cupo.
-- Munición del pitch: el 27,1% de los compradores históricos NO son
-- afiliados, casi 3x el 10% que permite la regla.
-- =====================================================================
insert into leads (
  lead_id, nombre, celular, cedula, proyecto_interes, fuente,
  perfil, respuestas,
  consentimiento_otorgado, consentimiento_ts,
  estado, factores, proyectos, explicacion
) values (
  'lead-002',
  'Carlos Andrés Muñoz',
  '3109876543',
  '1020987654',
  'Reserva del Poblado',
  'google',
  jsonb_build_object(
    'match', true,
    'afiliado', false,
    'ciudad', 'Medellín',
    'segmento', 'Gamma',
    'rango_ingreso', '1-3 SMMLV'
  ),
  jsonb_build_object(
    'consentimiento', jsonb_build_object(
      'otorgado', true, 'timestamp', '2026-07-23T15:05:41-05:00'),
    'tiene_vivienda', false,
    'subsidios', jsonb_build_array(),
    'situacion_crediticia', 'buena, sin mora reportada'
  ),
  true, '2026-07-23T15:05:41-05:00',
  'listo_restriccion_cupo',
  -- 6 factores otra vez, pero DOS no cumplen. El asesor los ve igual:
  -- cero caja negra significa mostrar también lo que salió mal.
  jsonb_build_array(
    jsonb_build_object('nombre', 'afiliacion',
      'valor', 'no afiliado (marca contra el cupo 90/10 del proyecto)',
      'cumple', false, 'fuente', 'enriquecimiento'),
    jsonb_build_object('nombre', 'cuota_ingreso_40',
      'valor', 'cuota estimada 35% del ingreso del hogar (tope 40%)',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'subsidio_aplicable',
      'valor', 'sin subsidios aplicables (no afiliado)',
      'cumple', false, 'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'ya_tiene_vivienda',
      'valor', 'no tiene vivienda propia',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'situacion_crediticia',
      'valor', 'autorreportada buena, sin mora',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'similitud_compradores',
      'valor', '61% similar a compradores históricos no afiliados de este proyecto',
      'cumple', true,  'fuente', 'historico')
  ),
  jsonb_build_array(
    jsonb_build_object('proyecto_id', 'p-03', 'nombre', 'Reserva del Poblado',
      'porque', 'Tu cuota estimada es 35% de tu ingreso del hogar, dentro del tope legal del 40%, y está en Medellín, tu ciudad. Como no eres afiliado quedas marcado contra el 10% de cupo del proyecto.'),
    jsonb_build_object('proyecto_id', 'p-09', 'nombre', 'Alto de las Palmas',
      'porque', 'Precio similar a Reserva del Poblado y en tu misma zona; el 61% de similitud con compradores históricos no afiliados muestra que este proyecto sí tiene espacio para tu perfil.')
  ),
  'Carlos no es afiliado a Colsubsidio, así que su lead queda marcado contra el cupo del 10% de no afiliados de Reserva del Poblado (regla 90/10) — no se le descarta por eso. Su cuota estimada (35% del ingreso del hogar) está dentro del tope legal del 40% del Decreto 583 de 2025 incluso sin subsidio, no tiene vivienda propia y no reporta mora.'
);

insert into conversaciones (lead_id, rol, mensaje, orden) values
  ('lead-002', 'sistema',   'Lead recibido de Google Ads. Enriquecimiento: cédula encontrada, no afiliado.', 1),
  ('lead-002', 'asistente', 'Hola Carlos Andrés 👋 Soy el asistente de vivienda de Colsubsidio. Antes de nada necesito tu autorización para tratar tus datos personales (Ley 1581 de 2012). ¿Me la das?', 2),
  ('lead-002', 'lead',      'Listo, dale', 3),
  ('lead-002', 'sistema',   'Consentimiento habeas data otorgado y registrado.', 4),
  ('lead-002', 'asistente', 'Gracias. Veo que no estás afiliado a Colsubsidio — tranquilo, igual te podemos vender: hay un cupo para no afiliados. ¿Ya tienes vivienda propia?', 5),
  ('lead-002', 'lead',      'No', 6),
  ('lead-002', 'asistente', '¿Has recibido algún subsidio de vivienda?', 7),
  ('lead-002', 'lead',      'No, ninguno', 8),
  ('lead-002', 'asistente', '¿Y cómo va tu situación crediticia?', 9),
  ('lead-002', 'lead',      'Bien, estoy al día', 10),
  ('lead-002', 'asistente', 'Gracias Carlos. Te encontré 2 proyectos que te sirven y te agendé una visita. ✅', 11);


-- =====================================================================
-- lead-003 — Yuliana Andrea Pérez · NO pasa el corte -> NUTRICIÓN
-- ---------------------------------------------------------------------
-- El corazón del criterio de aceptación 3: NADIE SE DESCARTA.
-- Falla el tope del 40% del Decreto 583 de 2025, y por eso queda con la
-- regla exacta que no pasó y el trigger que la revierte.
-- El botón "simular trigger" de la ficha la re-engancha (ticket 007).
-- =====================================================================
insert into leads (
  lead_id, nombre, celular, cedula, proyecto_interes, fuente,
  perfil, respuestas,
  consentimiento_otorgado, consentimiento_ts,
  estado, factores, regla_fallida, trigger_nutricion, proyectos, explicacion
) values (
  'lead-003',
  'Yuliana Andrea Pérez',
  '3157654321',
  '1030456789',
  'Alameda del Río',
  'web',
  -- Sin match: no está en la base de identidades. Se perfila desde cero,
  -- que es el caso que hace visible la conversación adaptativa.
  jsonb_build_object('match', false),
  jsonb_build_object(
    'consentimiento', jsonb_build_object(
      'otorgado', true, 'timestamp', '2026-07-23T16:20:03-05:00'),
    'rango_ingreso_hogar', '1-2 SMMLV',
    'tiene_vivienda', false,
    'subsidios', jsonb_build_array(),
    'situacion_crediticia', 'con mora reciente autorreportada',
    'zona_interes', 'Bogotá'
  ),
  true, '2026-07-23T16:20:03-05:00',
  'nutricion',
  jsonb_build_array(
    jsonb_build_object('nombre', 'afiliacion',
      'valor', 'sin match en la base de identidades: se asume no afiliado (supuesto por validar, spec §7)',
      'cumple', false, 'fuente', 'enriquecimiento'),
    jsonb_build_object('nombre', 'cuota_ingreso_40',
      'valor', 'cuota estimada 52% del ingreso del hogar (tope 40%, Decreto 583 de 2025)',
      'cumple', false, 'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'subsidio_aplicable',
      'valor', 'sin subsidios aplicables declarados',
      'cumple', false, 'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'ya_tiene_vivienda',
      'valor', 'no tiene vivienda propia',
      'cumple', true,  'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'situacion_crediticia',
      'valor', 'autorreportada con mora reciente',
      'cumple', false, 'fuente', 'conversacion'),
    jsonb_build_object('nombre', 'similitud_compradores',
      'valor', '38% similar a compradores históricos del proyecto',
      'cumple', false, 'fuente', 'historico')
  ),
  -- CRITERIO 3: la regla EXACTA que falló, no un "no califica" genérico.
  'cuota_ingreso_40: la primera cuota estimada (52% del ingreso del hogar) supera el tope legal del 40% (Decreto 583 de 2025)',
  -- CRITERIO 3: el trigger es la INVERSA de la regla que falló.
  'recontactar si el ingreso del hogar reportado sube lo suficiente para bajar la cuota estimada del 40%, o si aplica a un subsidio que la reduzca',
  '[]'::jsonb,
  'La cuota estimada de Yuliana (52% del ingreso del hogar) supera el tope legal del 40% que fija el Decreto 583 de 2025 para Alameda del Río, así que el banco no podría prestarle hoy: no es una heurística nuestra, es la norma. No es afiliada, no tiene subsidios aplicables declarados y reporta mora reciente. Queda en nutrición con esta razón exacta; el trigger de recontacto es un aumento del ingreso del hogar o la aplicación a un subsidio que baje la cuota bajo el 40%.'
);

insert into conversaciones (lead_id, rol, mensaje, orden) values
  ('lead-003', 'sistema',   'Lead recibido del formulario web. Enriquecimiento: cédula SIN match. Se perfila desde cero.', 1),
  ('lead-003', 'asistente', 'Hola Yuliana Andrea 👋 Soy el asistente de vivienda de Colsubsidio. Antes de empezar necesito tu autorización para tratar tus datos personales (Ley 1581 de 2012). ¿Me la das?', 2),
  ('lead-003', 'lead',      'sí', 3),
  ('lead-003', 'sistema',   'Consentimiento habeas data otorgado y registrado.', 4),
  ('lead-003', 'asistente', 'Gracias. Como es la primera vez que hablamos, te hago unas preguntas cortas. ¿En qué rango está el ingreso de tu hogar al mes?', 5),
  ('lead-003', 'lead',      'Entre 1 y 2 salarios mínimos', 6),
  ('lead-003', 'asistente', '¿Ya tienes vivienda propia?', 7),
  ('lead-003', 'lead',      'No, vivo en arriendo', 8),
  ('lead-003', 'asistente', '¿Has recibido algún subsidio de vivienda antes?', 9),
  ('lead-003', 'lead',      'No, ninguno', 10),
  ('lead-003', 'asistente', '¿Y cómo va tu situación crediticia?', 11),
  ('lead-003', 'lead',      'Tuve una mora hace poco', 12),
  ('lead-003', 'asistente', 'Gracias Yuliana. Hoy la cuota se te iría al 52% de tu ingreso y la norma pone el techo en 40%, así que todavía no. Pero no te pierdo: te escribo apenas suba tu ingreso o apliques a un subsidio que baje la cuota. 🌱', 13);


-- =====================================================================
-- CITAS — solo la franja ELEGIDA (ticket 005)
-- ---------------------------------------------------------------------
-- El catálogo de franjas vive en data/sintetica/slots.json, no aquí.
-- Yuliana NO tiene cita: no supera el corte.
-- =====================================================================
insert into citas (lead_id, fecha, sala_ventas) values
  ('lead-001', '2026-07-25T10:00:00-05:00', 'Sala Bogotá Centro'),
  ('lead-002', '2026-07-25T16:00:00-05:00', 'Sala Medellín Poblado');


-- =====================================================================
-- Verificación rápida: correr esto después del seed.
-- Debe devolver 3 filas en el orden listo > restricción > nutrición,
-- todas con 6 factores.
-- =====================================================================
-- select lead_id, nombre, estado, orden_prioridad, total_factores,
--        cita_fecha, regla_fallida is not null as tiene_regla
--   from cola_asesor;
