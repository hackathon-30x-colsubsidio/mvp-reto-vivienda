Soy el integrante del Track A (Conversación & entrada) del equipo. Vamos a construir el MVP
del reto Vivienda de la hackathon Colsubsidio × 30X. Tu trabajo hoy es hacer mi arranque
completo según el reparto ya documentado en este repo.

ANTES DE ESCRIBIR CÓDIGO, lee en este orden:
1. AGENTS.md (el contrato del repo: restricciones no-negociables, feedback loops, convenciones)
2. docs/spec.md (el contrato de producto — especialmente §4 flujo, §5 criterios de aceptación y §6 datos)
3. docs/adr/0002-stack-mvp.md (el stack y sus reglas duras)
4. docs/reparto-inicial.md (mi track es el A; ahí están mis tareas y los contratos de lib/types.ts)

FASE 1 — PASO 0: SCAFFOLD (va a la rama main, es el desbloqueador de todo el equipo):
- create-next-app en la raíz del repo (TypeScript, App Router), cuidando NO pisar los archivos
  existentes (AGENTS.md, CLAUDE.md, docs/, .gitignore — merge, no overwrite).
- lib/types.ts con los contratos exactos del reparto (LeadEvento, PerfilConocido, Lead,
  FactorScore, Score, ProyectoRecomendado, LeadCurado) y lib/fixtures/ con un ejemplo realista
  de cada uno (usa los 3 personajes del spec §4: afiliado listo, no afiliado listo, nutrición).
- .env.example sin valores: ANTHROPIC_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_KEY.
- Verifica que los 3 feedback loops de AGENTS.md corren (npm test / tsc --noEmit + lint /
  npm run dev). Si algún comando difiere de lo que dice AGENTS.md, actualiza AGENTS.md.
- Commit y push a main. Dime cuando esté para yo conectar Vercel a mano (dashboard) y avisar
  "scaffold listo" al grupo — eso no lo puedes hacer tú.

FASE 2 — MI TRACK (rama feature/conversacion, ya existe — trabaja ahí):
1. UI del chat en la página / con estética WhatsApp (burbujas, header verde, hora) + disclaimer
   visible "en producción corre sobre WhatsApp Business API". Por ahora responde con mensajes
   mock — sin LLM todavía.
2. Landing del jurado: 3 tarjetas de personajes pre-sembrados que con un clic arrancan su
   conversación, + botón "soy yo" con formulario libre (nombre, celular, cédula, proyecto,
   fuente). Es el criterio de entrada del demo (spec §4).
3. Lógica adaptativa de la conversación: dado un PerfilConocido (fixture), decidir qué se
   pregunta y qué no. Reglas del spec: el PRIMER mensaje siempre pide el consentimiento de
   habeas data; jamás preguntar un dato que el enriquecimiento ya trajo, y decirle al lead
   qué ya sabemos (criterio de aceptación 1); el set de preguntas del spec §6.
4. Solo cuando 1-3 funcionen: /api/chat conectado a Claude (claude-opus-4-8, streaming
   obligatorio, key solo server-side). El output final de la conversación es un objeto Lead
   válido contra lib/types.ts.

REGLAS QUE NO SE NEGOCIAN (de AGENTS.md y el ADR 0002):
- El repo es PÚBLICO: ninguna key en ningún commit, ni siquiera de prueba.
- Commits frecuentes y pequeños. main siempre desplegable.
- No construyas nada de los otros tracks (scoring, matching, vista asesor) — consume sus
  contratos por fixture. No toques lib/types.ts sin avisarme para yo avisar al grupo.
- Idioma del producto y del código visible: español.
- Al terminar la sesión, actualiza docs/agents/handoff.md con lo que quedó hecho y lo que sigue.

Empieza por la Fase 1 y no pares entre fases si todo va en verde.