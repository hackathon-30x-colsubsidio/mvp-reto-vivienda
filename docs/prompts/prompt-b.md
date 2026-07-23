Soy el integrante del Track B (Scoring & datos) del equipo. Vamos a construir el MVP del reto
Vivienda de la hackathon Colsubsidio × 30X. Tu trabajo hoy es mi arranque completo según el
reparto ya documentado en este repo. Mi track es el que menos depende de los demás: la Fase 1
no necesita ni el scaffold de Next.js.

ANTES DE ESCRIBIR CÓDIGO, lee en este orden:
1. AGENTS.md (el contrato del repo — en especial la sección "Datos del reto (crítico)": son
   las trampas del Excel que me tocan a mí)
2. docs/spec.md (el contrato de producto — especialmente §4 "Factores del scoring", las
   3 salidas del corte, y §6 datos)
3. docs/adr/0002-stack-mvp.md (el stack: mi motor va en TS puro, mi limpieza en Python offline)
4. docs/reparto-inicial.md (mi track es el B; ahí están mis tareas y los contratos de lib/types.ts)

CONTEXTO CLAVE DE MIS DATOS:
- La data real está en docs/recursos-reto/ (hackathon_VIVIENDAv2.xlsx con 4.142 compradores,
  Buyer Person.pptx, Links brochures .xlsx). Está GITIGNORED y jamás puede entrar a un commit:
  el repo es público y es data de Colsubsidio. Lo que yo publico es SIEMPRE derivado/sintético.
- Hay avance del equipo sobre los códigos griegos en el repo hermano plan-research
  (docs/agents/context.md, commit "letras griegas") — si tengo ese repo local, léelo antes
  de decidir cómo tratar SEGMENTO_POBLACIONAL/CATEGORIA/PIRAMIDE_NUEVA.

FASE 1 — LIMPIEZA Y DATA SINTÉTICA (Python en scripts/, corre offline, arranca YA):
1. Script de limpieza del Excel real con TODAS las trampas documentadas en AGENTS.md:
   - VLR_VIVIENDA ÷ 10.000 para el precio real (valida: mediana ≈ $195M, rango $75M–$236M).
   - Afiliado se INFIERE: PERIODO_AFILIADO vacío = no afiliado (debe dar ~27,1% global).
   - Normalizar RANGO_EDAD y ETAPA (dos formatos para el mismo valor).
   - Códigos griegos: v1 trátalos como clusters anónimos (honesto y seguro); deja el mapeo
     inferido como mejora opcional documentada, no como hecho.
   - Resolver la ubicación contradictoria de VIBO ONCE y KARAKALI entre las 2 hojas del
     xlsx de brochures (spec §6: catálogo = 18 proyectos, unión de ambas hojas).
2. Generar los JSON de data/sintetica/ (estos SÍ se versionan):
   - identidades.json: base sintética de cédulas FICTICIAS con distribuciones derivadas de
     la data real (afiliación, ciudad, segmento, rango de ingreso). Debe incluir las cédulas
     de los 3 personajes del demo (spec §4). Ninguna cédula real — la data real ni siquiera
     trae cédulas, se generan.
   - proyectos.json: ficha de los 18 proyectos (nombre, ubicación, precio típico derivado,
     % no afiliado histórico para el cupo 90/10, links de brochure y 360).
   - distribuciones.json: lo necesario para el factor "similitud con compradores reales".
3. Un README corto en scripts/ que diga cómo regenerar todo (comando único).

FASE 2 — MOTOR DE SCORING (TypeScript puro en lib/scoring/, requiere el scaffold de A;
si aún no está en main, prepara los archivos y los tests igual — no dependen de Next):
1. Implementa los factores del spec §4, TODOS visibles en el output (contrato FactorScore):
   afiliación/90-10 (determina salida y marca de cupo), primera cuota estimada ≤ 40% del
   ingreso del hogar (tope duro — Decreto 583 de 2025, cítalo en el output), subsidio
   aplicable, ya-tiene-vivienda, situación crediticia autorreportada, y similitud con
   compradores reales (evidencia de respaldo, NO criterio de corte).
2. Salida = contrato Score con una de las 3 salidas: "listo" | "listo_restriccion_cupo" |
   "nutricion". Si es nutrición: regla_fallida + trigger_nutricion (la inversa exacta de la
   regla que falló). Ningún lead queda sin salida (criterio de aceptación 3).
3. UMBRALES Y PESOS PARAMETRIZADOS en un solo archivo de config con valores propuestos y un
   comentario del fundamento de cada uno — el kickoff los ratifica, no los inventes como
   definitivos.
4. Tests con vitest: un caso por cada salida (usa los 3 personajes), el tope del 40% en el
   borde (39% pasa / 41% no pasa), y el subsidio metiendo la cuota bajo el 40%.
5. /api/score (cuando el scaffold exista): recibe Lead, devuelve Score. Sin LLM — el motor
   es determinista y auditable, esa es la regla "cero caja negra".

REGLAS QUE NO SE NEGOCIAN (de AGENTS.md y el ADR 0002):
- Python NUNCA en producción: solo en scripts/, generando JSON.
- Antes de cada commit verifica con git status que nada de docs/recursos-reto/ ni ningún
  .xlsx/.pptx/.csv esté staged. El repo es público.
- Trabajo en la rama feature/scoring (ya existe). Commits frecuentes y pequeños.
- No construyas nada de los otros tracks (chat, matching, vista asesor) — mi input Lead
  viene de fixture. No toques lib/types.ts sin avisarme para yo avisar al grupo.
- Publicar data/sintetica/ HOY es mi punto de sincronización: desbloquea al Track C.
  Apenas los JSON estén listos, merge de esa parte y avísame para anunciar al grupo.
- Al terminar la sesión, actualiza docs/agents/handoff.md con lo hecho y lo que sigue.

Empieza por la Fase 1. Cuando data/sintetica/ esté publicada, sigue con la Fase 2 sin parar.