-- =====================================================================
-- mvp-reto-vivienda — Seed de los 3 personajes del demo
-- Hackathon Colsubsidio x 30X
--
-- ⚠️  ARCHIVO GENERADO — NO EDITAR A MANO.
--     Se regenera con:  npx tsx scripts/generar-seed.ts
--     La fuente son las fixtures (lib/fixtures/), y el score y los proyectos
--     de ahí los produce el MOTOR REAL. Antes este archivo se copiaba a mano y
--     se desincronizó dos veces: la ficha sembrada mostraba números que el
--     motor nunca calculó. `lib/fixtures/seed-espejo.test.ts` falla si este
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
--   lead-001 Diana Marcela Ríos    -> listo (73/100)
--   lead-002 Carlos Andrés Muñoz   -> listo_restriccion_cupo (24/100)
--   lead-003 Yuliana Andrea Pérez  -> nutricion (0/100)
-- =====================================================================

delete from citas;
delete from conversaciones;
delete from leads;


-- =====================================================================
-- lead-001 — Diana Marcela Ríos · AFILIADA · pasa el corte -> LISTO
-- ---------------------------------------------------------------------
-- El caso feliz. El enriquecimiento ya la conocía, así que el conversador
-- no le repreguntó ni el ingreso ni la ciudad (criterio de aceptación 1).
-- =====================================================================
insert into leads (
  lead_id, nombre, celular, cedula, proyecto_interes, fuente,
  perfil, respuestas,
  consentimiento_otorgado, consentimiento_ts,
  estado, puntaje, factores, regla_fallida, trigger_nutricion,
  proyectos, explicacion
) values (
  'lead-001',
  'Diana Marcela Ríos',
  '3001234567',
  '1010123456',
  'LA ARBOLEDA',
  'meta',
  '{"match":true,"afiliado":true,"ciudad":"Bogotá","segmento":"Beta","rango_ingreso":"3-5 SMMLV","rango_edad":"20_35"}'::jsonb,
  '{"consentimiento":{"otorgado":true,"timestamp":"2026-07-23T14:32:10-05:00"},"tiene_vivienda":false,"composicion_familiar":"pareja","subsidios":["Mi Casa Ya"],"situacion_crediticia":"buena","ingreso_hogar_mensual":7003620,"rango_edad":"20_35"}'::jsonb,
  true, '2026-07-23T14:32:10-05:00',
  'listo',
  73,
  -- Los 7 factores tal como los emitió el motor. El criterio de
  -- aceptación 2 se verifica contando esto contra lo que la ficha renderiza.
  '[{"nombre":"afiliacion","valor":"Afiliado a Colsubsidio","cumple":true,"informativo":true,"fuente":"enriquecimiento"},{"nombre":"cuota_ingreso_40","valor":"Cuota estimada de LA ARBOLEDA $1.739.943 = 24.8% del ingreso ($7.003.620). Tope legal: 40% (Decreto 583 de 2025)","cumple":true,"fuente":"conversacion","peso":0.45,"valor_norm":1,"aporte":45},{"nombre":"subsidio_aplicable","valor":"Declarado: Mi Casa Ya — sin monto verificado todavía, así que NO baja la cuota estimada ni suma puntos. El asesor lo valida y postula.","cumple":true,"fuente":"conversacion","peso":0.15,"valor_norm":0,"aporte":0},{"nombre":"ya_tiene_vivienda","valor":"No tiene vivienda propia","cumple":true,"fuente":"conversacion","peso":0.1,"valor_norm":1,"aporte":10},{"nombre":"situacion_crediticia","valor":"Autorreportada: buena (señal, no verificación — DataCrédito fuera de alcance)","cumple":true,"fuente":"conversacion","peso":0.05,"valor_norm":1,"aporte":5},{"nombre":"similitud_compradores_reales","valor":"Fit 42% con los compradores históricos de LA ARBOLEDA: el 64% de los compradores de este proyecto es afiliado a Colsubsidio; el 10% gana más de 2 salarios mínimos; el 53% tiene entre 20 y 35 años","cumple":true,"informativo":true,"fuente":"historico","peso":0.2,"valor_norm":0.42333333333333334,"aporte":8.466666666666667},{"nombre":"cupo_90_10","valor":"No aplica: el lead es afiliado","cumple":true,"informativo":true,"fuente":"catalogo","peso":0.05,"valor_norm":1,"aporte":5}]'::jsonb,
  null,
  null,
  '[{"proyecto_id":"la-arboleda","nombre":"LA ARBOLEDA","porque":"Precio desde $194.023.050, dentro del máximo de $312.392.645 que le permite el tope del 40% del ingreso (Decreto 583 de 2025); es el proyecto por el que preguntó al dejar sus datos; queda en Bogotá, la zona que le interesa; el histórico de compradores del proyecto coincide con su perfil: el 64% de los compradores de este proyecto es afiliado a Colsubsidio; el 10% gana más de 2 salarios mínimos; el 53% tiene entre 20 y 35 años; es VIS, así que el subsidio que declaró (Mi Casa Ya) aplica aquí"},{"proyecto_id":"karakali","nombre":"KARAKALI","porque":"Precio desde $245.126.700, dentro del máximo de $312.392.645 que le permite el tope del 40% del ingreso (Decreto 583 de 2025); queda en Bogotá, la zona que le interesa; es VIS, así que el subsidio que declaró (Mi Casa Ya) aplica aquí"},{"proyecto_id":"vibo-once","nombre":"VIBO ONCE","porque":"Precio desde $281.300.000, dentro del máximo de $357.020.166 que le permite el tope del 40% del ingreso (Decreto 583 de 2025); queda en Bogotá, la zona que le interesa"}]'::jsonb,
  'Diana es afiliada a Colsubsidio y puede comprar hoy: la primera cuota estimada de LA ARBOLEDA ($1.164.138) es el 20,4% del ingreso de su hogar ($5.694.000), muy por debajo del tope del 40% que fija el Decreto 583 de 2025 — le sobra la mitad del margen que permite la norma, y eso es lo que la pone arriba en la cola. No tiene vivienda propia, está al día en sus créditos y declaró Mi Casa Ya, todavía sin monto verificado: el asesor lo valida y la postula, y cuando entre bajará aún más la cuota. Le caben tres proyectos en Bogotá, empezando por el que preguntó.'
);

insert into conversaciones (lead_id, rol, mensaje, orden) values
  ('lead-001', 'sistema', 'Lead recibido de Meta Lead Ads, interesado en LA ARBOLEDA. Enriquecimiento por cédula: match encontrado, no se repregunta lo conocido.', 1),
  ('lead-001', 'asistente', '¡Hola, Diana! 👋 Soy Sara, del equipo de Vivienda de Colsubsidio. Vi que te llamó la atención LA ARBOLEDA 🏡', 2),
  ('lead-001', 'asistente', 'Antes de mostrarte nada tengo que pedirte una formalidad, y te cuento para qué: para poder guardar lo que hablemos aquí y que un asesor te acompañe después sin que repitas tu historia. ¿Me compartes la autorización para tratar tus datos? (Ley 1581 de 2012)', 3),
  ('lead-001', 'lead', 'Sí, la comparto', 4),
  ('lead-001', 'sistema', 'Consentimiento habeas data otorgado (Ley 1581 de 2012) — 2026-07-23T14:32:10-05:00', 5),
  ('lead-001', 'asistente', 'Gracias, Diana 🙌 Lo que ya nos habías dado está acá conmigo, así que no te voy a hacer repetir nada. Empiezo por buscarte opciones en Bogotá y solo te pregunto lo que me falte.', 6),
  ('lead-001', 'asistente', 'Cuéntame una cosa primero, que cambia todo lo demás: ¿esta sería tu primera vivienda, o ya tienes una?', 7),
  ('lead-001', 'lead', 'Sería la primera', 8),
  ('lead-001', 'asistente', '¡La primera! 🎉 Eso es enorme, y además te deja el camino despejado para los subsidios que solo aplican a primera vivienda.', 9),
  ('lead-001', 'asistente', 'Y cuéntame, para imaginarla contigo: ¿con quién la compartirías? Con eso te busco proyectos donde ya viven hogares como el tuyo.', 10),
  ('lead-001', 'lead', 'Con mi pareja', 11),
  ('lead-001', 'asistente', 'Qué bonito arrancar eso de a dos 💛 Lo tengo en cuenta para el espacio que necesitan.', 12),
  ('lead-001', 'asistente', 'Hablemos de plata a tu favor: el subsidio es lo que más gente deja sobre la mesa por no preguntar. ¿Tienes alguno, o todavía ninguno?', 13),
  ('lead-001', 'lead', 'Mi Casa Ya', 14),
  ('lead-001', 'asistente', '¡Eso suma! 🙌 Un subsidio baja la cuota mensual de verdad, no es letra chiquita. Lo meto en la cuenta.', 15),
  ('lead-001', 'asistente', 'Última de las incómodas y te dejo en paz 🙏 ¿Cómo va tu vida crediticia hoy? Pregunto sin juzgar: si hay algo pendiente, es mil veces mejor saberlo ahora que el día que pidas el crédito.', 16),
  ('lead-001', 'lead', 'Estoy al día con todo', 17),
  ('lead-001', 'asistente', 'Eso vale oro con el banco 💪 Te abre puertas que mucha gente no tiene.', 18),
  ('lead-001', 'asistente', 'Eso era todo, Diana 🙌 Con lo que me contaste ya puedo armarte algo que tenga sentido para ti, y no una lista genérica. Le paso tu historia completa a un asesor para que no tengas que repetirla — te escribe muy pronto.', 19);


-- =====================================================================
-- lead-002 — Carlos Andrés Muñoz · NO AFILIADO · pasa el corte
--             -> LISTO CON RESTRICCIÓN DE CUPO (regla 90/10)
-- ---------------------------------------------------------------------
-- El sub-caso crítico del spec §3: puede comprar, pero compite por el 10%.
-- No se le miente ni se le descarta: recibe sus proyectos con la advertencia
-- de cupo encima. Munición del pitch: el 27,1% de los compradores históricos
-- NO son afiliados, casi 3x el 10% que permite la regla.
-- =====================================================================
insert into leads (
  lead_id, nombre, celular, cedula, proyecto_interes, fuente,
  perfil, respuestas,
  consentimiento_otorgado, consentimiento_ts,
  estado, puntaje, factores, regla_fallida, trigger_nutricion,
  proyectos, explicacion
) values (
  'lead-002',
  'Carlos Andrés Muñoz',
  '3109876543',
  '1020987654',
  'PAYANDÉ',
  'google',
  '{"match":true,"afiliado":false,"ciudad":"Ricaurte","segmento":"No afiliado / sin segmentar"}'::jsonb,
  '{"consentimiento":{"otorgado":true,"timestamp":"2026-07-23T15:05:41-05:00"},"tiene_vivienda":false,"composicion_familiar":"familia_con_hijos","rango_ingreso_hogar":"4.000.000 entre mi esposa y yo","ingreso_hogar_mensual":4000000,"subsidios":[],"rango_edad":"36_45","situacion_crediticia":"buena"}'::jsonb,
  true, '2026-07-23T15:05:41-05:00',
  'listo_restriccion_cupo',
  24,
  -- Los 7 factores tal como los emitió el motor. El criterio de
  -- aceptación 2 se verifica contando esto contra lo que la ficha renderiza.
  '[{"nombre":"afiliacion","valor":"No afiliado a Colsubsidio","cumple":true,"informativo":true,"fuente":"enriquecimiento"},{"nombre":"cuota_ingreso_40","valor":"Cuota estimada de PAYANDÉ $1.573.834 = 39.3% del ingreso ($4.000.000). Tope legal: 40% (Decreto 583 de 2025)","cumple":true,"fuente":"conversacion","peso":0.45,"valor_norm":0.06541534459591766,"aporte":2.943690506816295},{"nombre":"subsidio_aplicable","valor":"Sin subsidio declarado","cumple":false,"fuente":"conversacion","peso":0.15,"valor_norm":0,"aporte":0},{"nombre":"ya_tiene_vivienda","valor":"No tiene vivienda propia","cumple":true,"fuente":"conversacion","peso":0.1,"valor_norm":1,"aporte":10},{"nombre":"situacion_crediticia","valor":"Autorreportada: buena (señal, no verificación — DataCrédito fuera de alcance)","cumple":true,"fuente":"conversacion","peso":0.05,"valor_norm":1,"aporte":5},{"nombre":"similitud_compradores_reales","valor":"Fit 28% con los compradores históricos de PAYANDÉ: el 36% de los compradores de este proyecto tampoco es afiliado a Colsubsidio; el 35% gana más de 2 salarios mínimos; el 31% tiene entre 36 y 45 años; el 9% compra con su familia","cumple":true,"informativo":true,"fuente":"historico","peso":0.2,"valor_norm":0.2775,"aporte":5.550000000000001},{"nombre":"cupo_90_10","valor":"Cupo de no afiliados superado en PAYANDÉ: 27 de 14 permitidos (regla: máx. 10%)","cumple":true,"informativo":true,"fuente":"catalogo","peso":0.05,"valor_norm":0.1,"aporte":0.5000000000000001}]'::jsonb,
  null,
  null,
  '[{"proyecto_id":"payande","nombre":"PAYANDÉ","porque":"Precio desde $175.500.000, dentro del máximo de $178.417.815 que le permite el tope del 40% del ingreso (Decreto 583 de 2025); es el proyecto por el que preguntó al dejar sus datos; queda en Ricaurte, la zona que le interesa; el histórico de compradores del proyecto coincide con su perfil: el 36% de los compradores de este proyecto tampoco es afiliado a Colsubsidio; el 35% gana más de 2 salarios mínimos; el 31% tiene entre 36 y 45 años; el 9% compra con su familia; ⚠️ el cupo de no afiliados de este proyecto ya está copado: lleva 27 de 14 permitidos (regla 90/10), así que el asesor tiene que validar cupo antes de separar; es VIS, así que admite los subsidios de vivienda de interés social"}]'::jsonb,
  'Carlos SÍ puede comprar: la cuota estimada de PAYANDÉ ($1.053.000) es el 36,9% del ingreso de su hogar ($2.850.000) y cabe bajo el tope del 40% del Decreto 583 de 2025 — justo, pero cabe, y por eso su puntaje de prioridad es bajo, no su salida. Lo que hay que saber antes de llamarlo es otra cosa: no es afiliado, así que compite por el 10% de cupo que permite la regla 90/10, y los tres proyectos que le sirven ya lo tienen copado (PAYANDÉ lleva 27 no afiliados de 14 permitidos). No se le esconde el límite ni se le promete la unidad: el asesor valida cupo antes de separar. No tiene vivienda propia y está al día en sus créditos.'
);

insert into conversaciones (lead_id, rol, mensaje, orden) values
  ('lead-002', 'sistema', 'Lead recibido de Google Ads, interesado en PAYANDÉ. Enriquecimiento por cédula: match encontrado, no se repregunta lo conocido.', 1),
  ('lead-002', 'asistente', '¡Hola, Carlos! 👋 Soy Sara, del equipo de Vivienda de Colsubsidio. Vi que te llamó la atención PAYANDÉ 🏡', 2),
  ('lead-002', 'asistente', 'Antes de mostrarte nada tengo que pedirte una formalidad, y te cuento para qué: para poder guardar lo que hablemos aquí y que un asesor te acompañe después sin que repitas tu historia. ¿Me compartes la autorización para tratar tus datos? (Ley 1581 de 2012)', 3),
  ('lead-002', 'lead', 'Sí, la comparto', 4),
  ('lead-002', 'sistema', 'Consentimiento habeas data otorgado (Ley 1581 de 2012) — 2026-07-23T15:05:41-05:00', 5),
  ('lead-002', 'asistente', 'Gracias, Carlos 🙌 Lo que ya nos habías dado está acá conmigo, así que no te voy a hacer repetir nada. Empiezo por buscarte opciones en Ricaurte y solo te pregunto lo que me falte.', 6),
  ('lead-002', 'asistente', 'Cuéntame una cosa primero, que cambia todo lo demás: ¿esta sería tu primera vivienda, o ya tienes una?', 7),
  ('lead-002', 'lead', 'No, sería la primera', 8),
  ('lead-002', 'asistente', '¡La primera! 🎉 Eso es enorme, y además te deja el camino despejado para los subsidios que solo aplican a primera vivienda.', 9),
  ('lead-002', 'asistente', 'Y cuéntame, para imaginarla contigo: ¿con quién la compartirías? Con eso te busco proyectos donde ya viven hogares como el tuyo.', 10),
  ('lead-002', 'lead', 'Con mi esposa y nuestros dos hijos', 11),
  ('lead-002', 'asistente', 'Con razón la estás buscando en serio: una casa para los hijos no es cualquier compra. Busco donde ya viven familias como la tuya.', 12),
  ('lead-002', 'asistente', 'Ahora la pregunta incómoda, y te digo para qué es: solo la uso para no mostrarte casas que después te aprieten el bolsillo. ¿Cuánto entra al mes en tu hogar, sumando todo lo que llega (tu sueldo, el de tu pareja, lo que sea)? Un aproximado me sirve.', 13),
  ('lead-002', 'lead', '4.000.000 entre mi esposa y yo', 14),
  ('lead-002', 'asistente', 'Gracias por la confianza 🙏 Entonces hago las cuentas con $4.000.000 al mes — si me equivoqué, dime el número y lo corrijo.', 15),
  ('lead-002', 'asistente', 'Hablemos de plata a tu favor: el subsidio es lo que más gente deja sobre la mesa por no preguntar. ¿Tienes alguno, o todavía ninguno?', 16),
  ('lead-002', 'lead', 'Ninguno todavía', 17),
  ('lead-002', 'asistente', 'No pasa nada, la mayoría llega así. Si aplicas a alguno, el asesor te lo dice y se postula contigo.', 18),
  ('lead-002', 'asistente', 'Otra cortica que me ayuda mucho: ¿en qué etapa vas? Con eso te muestro proyectos donde compra gente en tu mismo momento de vida.', 19),
  ('lead-002', 'lead', '38', 20),
  ('lead-002', 'asistente', 'Perfecto, lo anoto — es de las etapas donde más gente da el paso.', 21),
  ('lead-002', 'asistente', 'Última de las incómodas y te dejo en paz 🙏 ¿Cómo va tu vida crediticia hoy? Pregunto sin juzgar: si hay algo pendiente, es mil veces mejor saberlo ahora que el día que pidas el crédito.', 22),
  ('lead-002', 'lead', 'Al día, nunca me he atrasado', 23),
  ('lead-002', 'asistente', 'Eso vale oro con el banco 💪 Te abre puertas que mucha gente no tiene.', 24),
  ('lead-002', 'asistente', 'Eso era todo, Carlos 🙌 Con lo que me contaste ya puedo armarte algo que tenga sentido para ti, y no una lista genérica. Le paso tu historia completa a un asesor para que no tengas que repetirla — te escribe muy pronto.', 25);


-- =====================================================================
-- lead-003 — Yuliana Andrea Pérez · NO pasa el corte -> NUTRICIÓN
-- ---------------------------------------------------------------------
-- El corazón del criterio de aceptación 3: NADIE SE DESCARTA. Falla el tope
-- del 40% del Decreto 583 de 2025 y por eso queda con la regla exacta que no
-- pasó y el trigger que la revierte, con el monto que le falta.
-- El botón "simular trigger" de la ficha la re-engancha (ticket 007).
-- =====================================================================
insert into leads (
  lead_id, nombre, celular, cedula, proyecto_interes, fuente,
  perfil, respuestas,
  consentimiento_otorgado, consentimiento_ts,
  estado, puntaje, factores, regla_fallida, trigger_nutricion,
  proyectos, explicacion
) values (
  'lead-003',
  'Yuliana Andrea Pérez',
  '3157654321',
  '1030456789',
  'LA MACARENA',
  'web',
  '{"match":false}'::jsonb,
  '{"consentimiento":{"otorgado":true,"timestamp":"2026-07-23T16:20:03-05:00"},"tiene_vivienda":false,"composicion_familiar":"monoparental","rango_ingreso_hogar":"Entre 1 y 2 salarios mínimos","ingreso_hogar_mensual":2626358,"subsidios":[],"rango_edad":"20_35","situacion_crediticia":"mala","zona_interes":"Bogotá"}'::jsonb,
  true, '2026-07-23T16:20:03-05:00',
  'nutricion',
  0,
  -- Los 7 factores tal como los emitió el motor. El criterio de
  -- aceptación 2 se verifica contando esto contra lo que la ficha renderiza.
  '[{"nombre":"afiliacion","valor":"No afiliado (asumido: su cédula no está en la base y no se le preguntó)","cumple":true,"informativo":true,"fuente":"supuesto"},{"nombre":"cuota_ingreso_40","valor":"Cuota estimada de LA MACARENA $1.342.488 = 51.1% del ingreso ($2.626.358). Tope legal: 40% (Decreto 583 de 2025)","cumple":false,"fuente":"conversacion","peso":0.45,"valor_norm":0,"aporte":0},{"nombre":"subsidio_aplicable","valor":"Sin subsidio declarado","cumple":false,"fuente":"conversacion","peso":0.15,"valor_norm":0,"aporte":0},{"nombre":"ya_tiene_vivienda","valor":"No tiene vivienda propia","cumple":true,"fuente":"conversacion","peso":0.1,"valor_norm":1,"aporte":10},{"nombre":"situacion_crediticia","valor":"Autorreportada: mala (señal, no verificación — DataCrédito fuera de alcance)","cumple":false,"fuente":"conversacion","peso":0.05,"valor_norm":0,"aporte":0},{"nombre":"similitud_compradores_reales","valor":"Fit 49% con los compradores históricos de LA MACARENA: el 44% de los compradores de este proyecto tampoco es afiliado a Colsubsidio; el 91% gana hasta 2 salarios mínimos; el 54% tiene entre 20 y 35 años; el 7% es hogar monoparental","cumple":true,"informativo":true,"fuente":"historico","peso":0.2,"valor_norm":0.49000000000000005,"aporte":9.800000000000002},{"nombre":"cupo_90_10","valor":"Cupo de no afiliados superado en LA MACARENA: 82 de 37 permitidos (regla: máx. 10%)","cumple":true,"informativo":true,"fuente":"catalogo","peso":0.05,"valor_norm":0.1,"aporte":0.5000000000000001}]'::jsonb,
  'Tope del 40% (Decreto 583 de 2025) — Cuota estimada de LA MACARENA $1.342.488 = 51.1% del ingreso ($2.626.358). Tope legal: 40% (Decreto 583 de 2025)',
  'Con el ingreso declarado ($2.626.358) la cuota de LA MACARENA no cabe bajo el 40%. Se recontacta si pasa cualquiera de estas tres: (1) el ingreso del hogar llega a $3.356.221 —le faltan $729.863—, (2) aplica a un subsidio que baje la cuota mensual, o (3) entra al catálogo un proyecto que sí le quepa.',
  '[]'::jsonb,
  'Yuliana todavía no puede comprar, y la razón es una sola y es legal: la cuota estimada de LA MACARENA —el proyecto más económico del catálogo— es $898.214, o sea el 42,1% del ingreso de su hogar ($2.135.250), y el Decreto 583 de 2025 pone el techo en 40%. No es criterio nuestro: por encima de ese porcentaje el banco no puede prestarle. No se descarta, queda en nutrición, y le falta poquísimo: con $2.245.536 de ingreso del hogar —$110.286 más— pasa el corte. También la destraban un subsidio que baje la cuota o un proyecto más económico que entre al catálogo. Reporta una mora reciente y no tiene vivienda propia.'
);

insert into conversaciones (lead_id, rol, mensaje, orden) values
  ('lead-003', 'sistema', 'Lead recibido de la web de Colsubsidio, interesado en LA MACARENA. Enriquecimiento por cédula: sin match, se pregunta todo.', 1),
  ('lead-003', 'asistente', '¡Hola, Yuliana! 👋 Soy Sara, del equipo de Vivienda de Colsubsidio. Vi que te llamó la atención LA MACARENA 🏡', 2),
  ('lead-003', 'asistente', 'Antes de mostrarte nada tengo que pedirte una formalidad, y te cuento para qué: para poder guardar lo que hablemos aquí y que un asesor te acompañe después sin que repitas tu historia. ¿Me compartes la autorización para tratar tus datos? (Ley 1581 de 2012)', 3),
  ('lead-003', 'lead', 'Sí, la comparto', 4),
  ('lead-003', 'sistema', 'Consentimiento habeas data otorgado (Ley 1581 de 2012) — 2026-07-23T16:20:03-05:00', 5),
  ('lead-003', 'asistente', 'Perfecto, Yuliana, gracias 🙌 Todavía no te tengo en nuestra base, así que arrancamos de cero: son unas preguntas cortas, nada de formulario eterno. Te prometo que valen la pena.', 6),
  ('lead-003', 'asistente', 'Cuéntame una cosa primero, que cambia todo lo demás: ¿esta sería tu primera vivienda, o ya tienes una?', 7),
  ('lead-003', 'lead', 'No, vivo en arriendo', 8),
  ('lead-003', 'asistente', '¡La primera! 🎉 Eso es enorme, y además te deja el camino despejado para los subsidios que solo aplican a primera vivienda.', 9),
  ('lead-003', 'asistente', 'Y cuéntame, para imaginarla contigo: ¿con quién la compartirías? Con eso te busco proyectos donde ya viven hogares como el tuyo.', 10),
  ('lead-003', 'lead', 'Yo sola con mi hija', 11),
  ('lead-003', 'asistente', 'Sacar esto adelante así tiene doble mérito 💪 Y ojo: hay subsidios donde eso cuenta a favor, no en contra.', 12),
  ('lead-003', 'asistente', 'Ahora la pregunta incómoda, y te digo para qué es: solo la uso para no mostrarte casas que después te aprieten el bolsillo. ¿Cuánto entra al mes en tu hogar, sumando todo lo que llega (tu sueldo, el de tu pareja, lo que sea)? Un aproximado me sirve.', 13),
  ('lead-003', 'lead', 'Entre 1 y 2 salarios mínimos', 14),
  ('lead-003', 'asistente', 'Gracias por la confianza 🙏 Entonces hago las cuentas con $2.626.358 al mes — si me equivoqué, dime el número y lo corrijo.', 15),
  ('lead-003', 'asistente', 'Hablemos de plata a tu favor: el subsidio es lo que más gente deja sobre la mesa por no preguntar. ¿Tienes alguno, o todavía ninguno?', 16),
  ('lead-003', 'lead', 'Ninguno', 17),
  ('lead-003', 'asistente', 'No pasa nada, la mayoría llega así. Si aplicas a alguno, el asesor te lo dice y se postula contigo.', 18),
  ('lead-003', 'asistente', 'Otra cortica que me ayuda mucho: ¿en qué etapa vas? Con eso te muestro proyectos donde compra gente en tu mismo momento de vida.', 19),
  ('lead-003', 'lead', 'Tengo 24 años', 20),
  ('lead-003', 'asistente', 'Buena etapa para meterse en esto: el crédito largo juega a tu favor.', 21),
  ('lead-003', 'asistente', 'Última de las incómodas y te dejo en paz 🙏 ¿Cómo va tu vida crediticia hoy? Pregunto sin juzgar: si hay algo pendiente, es mil veces mejor saberlo ahora que el día que pidas el crédito.', 22),
  ('lead-003', 'lead', 'Tuve una mora hace poco', 23),
  ('lead-003', 'asistente', 'Te agradezco que me lo digas de frente 🙏 No es un no: es saber hoy qué hay que ordenar, en vez de enterarte el día que pidas el crédito.', 24),
  ('lead-003', 'asistente', 'Y lo más rico: ¿en qué ciudad o municipio te imaginas viviendo? Te lo pregunto así de concreto porque solo te voy a mostrar proyectos que queden ahí. Si ya tienes un barrio o un sector en mente, dímelo también.', 25),
  ('lead-003', 'lead', 'Bogotá, por el sur', 26),
  ('lead-003', 'asistente', '¡Bogotá! 📍 Ahí tengo 6 proyectos, así que puedo ser concreta contigo.', 27),
  ('lead-003', 'asistente', 'Eso era todo, Yuliana 🙌 Con lo que me contaste ya puedo armarte algo que tenga sentido para ti, y no una lista genérica. Le paso tu historia completa a un asesor para que no tengas que repetirla — te escribe muy pronto.', 28);


-- =====================================================================
-- CITAS — solo la franja ELEGIDA (ticket 005)
-- ---------------------------------------------------------------------
-- El catálogo de franjas vive en data/sintetica/slots.json, no aquí.
-- Quien está en nutrición NO tiene cita: no supera el corte.
-- =====================================================================
insert into citas (lead_id, fecha, sala_ventas) values
  ('lead-001', '2026-07-27T09:00:00-05:00', 'Sala de ventas LA ARBOLEDA'),
  ('lead-002', '2026-07-27T15:00:00-05:00', 'Sala de ventas PAYANDÉ');


-- =====================================================================
-- Verificación rápida: correr esto después del seed.
-- Debe devolver 3 filas, en el orden listo > restricción > nutrición,
-- todas con 7 factores y con su puntaje.
-- =====================================================================
-- select lead_id, nombre, estado, puntaje, orden_prioridad, total_factores,
--        cita_fecha, regla_fallida is not null as tiene_regla
--   from cola_asesor;
