Soy el integrante del Track D (Vista asesor, DB & nutrición) del equipo. Vamos a construir
el MVP del reto Vivienda de la hackathon Colsubsidio × 30X. Tu trabajo hoy es mi arranque
completo según el reparto ya documentado en este repo. Mi pantalla es EL CLÍMAX del demo de
2 minutos: donde el jurado ve al lead curado llegar al asesor.

ANTES DE ESCRIBIR CÓDIGO, lee en este orden:
1. AGENTS.md (el contrato del repo)
2. docs/spec.md (especialmente §4 paso 5 y las 3 salidas del corte, §5 criterios de
   aceptación 2, 3 y 4, y §6 consentimiento habeas data)
3. docs/adr/0002-stack-mvp.md (el stack: Supabase solo para lo que muta)
4. docs/reparto-inicial.md (mi track es el D; ahí están mis tareas y los contratos de lib/types.ts)
5. docs/plan.md — el plan del build. §2 tiene un modelo de datos propuesto (derivado del spec,
   NO decidido: mi ADR 0003 es el que lo cierra) y §3 tiene costuras mías. Tickets en
   docs/tasks/ (índice en docs/tasks/README.md).

MIS TICKETS (además de lo del reparto):
- 005 agendador: A ofrece las franjas en el chat, YO las persisto en la tabla citas y las
  muestro en la ficha. El reparto decía "la cita la agrega D o A" — o sea nadie.
- 007 re-enganche de nutrición: yo disparo (botón + cambio de estado + navegación al chat con
  el lead_id) y A escribe el mensaje de reentrada. El criterio de aceptación 3 solo se verifica
  de punta a punta, así que esto lo coordino con A, no lo doy por hecho.
- 012 test del criterio 2 (con B): tantos factores renderizados en la ficha como evaluó el
  motor. Agregar un factor sin tocar la ficha debe ROMPER el test.
- Mis fixtures de LeadCurado salen del ticket 001 (lib/fixtures/personajes.ts), no de
  personajes que invente yo.
- Muestra la `fuente` del lead (meta/google/web) en la ficha: es lo que sostiene la narrativa
  multi-canal del spec §4 paso 1, y hoy se registra pero no se ve en ninguna pantalla.

FASE 1 — SUPABASE Y ADR 0003 (arranca YA, sin scaffold):
1. Diseña el esquema de la DB central: tablas leads (con estado: listo /
   listo_restriccion_cupo / nutricion, score desglosado, regla_fallida, trigger_nutricion,
   consentimiento con timestamp — spec §6), conversaciones (historial por lead) y citas
   (franjas simuladas de sala de ventas). Los campos salen de los contratos LeadCurado/
   Score/Lead de reparto-inicial.md — no inventes campos que los contratos no producen.
2. Escríbelo como docs/adr/0003-esquema-db-leads.md (contexto, decisión con el SQL de las
   tablas, alternativas, consecuencias). El spec §7 lo tiene como supuesto abierto — este
   ADR lo cierra, y el kickoff lo ratifica.
3. Yo creo el proyecto de Supabase a mano en el dashboard (eso no lo puedes hacer tú):
   dame el SQL listo para pegar en el SQL Editor, y qué env vars copiar a .env
   (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_KEY). Las credenciales se comparten por el canal
   del equipo, jamás al repo — es público.

FASE 2 — VISTA DEL ASESOR (rama feature/asesor; requiere el scaffold de A en main —
mientras tanto puedes dejar los componentes escritos contra fixtures):
1. Página /asesor con dos niveles:
   - COLA priorizada: listos arriba, luego listos-con-restricción (con badge del cupo 90/10
     del proyecto), luego nutrición. Sin login (decisión del ADR 0002).
   - FICHA al abrir un lead: score desglosado FACTOR POR FACTOR con su valor y si cumple
     (criterio de aceptación 2: tantos factores visibles como el motor evaluó), la
     explicación en lenguaje natural, los 2-3 proyectos con su porqué, la cita, y en
     nutrición: la regla que falló + su trigger.
2. Botón "simular trigger" en los leads de nutrición: dispara el re-enganche del lead
   (criterio de aceptación 3 — en el demo, un clic y el lead vuelve a la conversación).
3. Construye TODO contra las fixtures de LeadCurado de lib/fixtures/ (los 3 personajes).
   No esperes a que A, B o C terminen: en la integración del sábado se conecta lo real.
4. /api/leads: guardar y leer contra Supabase (insert del lead curado, lista para la cola,
   detalle por id, update de estado al simular trigger).

REGLAS QUE NO SE NEGOCIAN:
- Trabajo en la rama feature/asesor (ya existe). Commits frecuentes y pequeños.
- El repo es público: ninguna credencial en ningún commit.
- No construyas nada de los otros tracks (chat, scoring, matching) — mi input LeadCurado
  viene de fixture. No toques lib/types.ts sin avisarme para yo avisar al grupo.
- Idioma del producto: español. "Feo pero funciona" > "bonito pero falso" — la ficha del
  asesor debe ser LEGIBLE en el video de 2 min, no una obra de arte.
- Al terminar la sesión, actualiza docs/agents/handoff.md con lo hecho y lo que sigue.

Empieza por la Fase 1 (el ADR y el SQL) y sigue con la Fase 2 apenas el scaffold esté en main.