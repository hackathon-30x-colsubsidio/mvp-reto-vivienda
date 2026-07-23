# mvp-reto-vivienda — Guía para agentes

Repo de **código** del MVP del reto **Vivienda** (perfilamiento inteligente de leads) para la hackathon Colsubsidio × 30X. Este repo es el entregable público en GitHub. El **cerebro** (investigación, decisiones de reto, glosario maestro, datos crudos) vive en el repo hermano **`plan-research`**.

Si algo no está resuelto, NO lo inventes: márcalo como supuesto por validar. Toda decisión dura es fundamentada.

## Orden de lectura (arranca aquí)

1. **`docs/agents/handoff.md`** — memoria viva + roadmap del build. Léelo al inicio de cada sesión, actualízalo al final. El siguiente agente (o tu yo futuro) no arranca de cero.
2. **`docs/mvp-layout.md`** — el layout macro de la solución (8 decisiones cerradas + abiertas). Es la semilla del `spec`.
3. **`docs/agents/context.md`** — glosario del dominio (afiliado, 90/10, CPL, nutrición…). Léelo antes de nombrar cosas.
4. **`docs/reto/`** — el brief oficial del reto y el doc de los insumos. La fuente de verdad de qué pide Colsubsidio.
5. **`docs/adr/`** — decisiones y su porqué. La elección del reto es el [ADR 0001](docs/adr/0001-eleccion-reto-vivienda.md); no se re-litiga.

`docs/URGENTE-Y-NOTICIAS.md` y `docs/plan-hackathon.md` son la semilla del brainstorm inicial (día a día del evento). El tracking hackathon-level canónico vive en `plan-research`; en este repo el doc vivo es el **handoff**.

## La apuesta (borrador — cerrar en kickoff)

Un workflow que hace que los leads pagos se parezcan a los orgánicos: el lead entra por pauta, conversa con un perfilador estilo WhatsApp que pregunta solo lo que falta, un motor transparente lo califica y matchea con 2-3 proyectos, y al asesor le llega un lead curado con cita agendada y el porqué. Los que aún no pueden comprar no se botan: quedan en nutrición con el trigger que los volvería listos. Detalle en `docs/mvp-layout.md`.

## Flujo de trabajo (spec → plan → build)

El stack **aún no está decidido** (se define en el kickoff, al repartir roles). No comprometas framework todavía. La secuencia:

1. `/spec` — baja `docs/mvp-layout.md` a `docs/spec.md` (7 bloques). Requiere kickoff (frase de apuesta + curar el mermaid + resolver abiertas).
2. `/plan` — descompone el spec en `docs/plan.md` + tickets en `docs/tasks/`.
3. `/tdd` — construir por slices verticales, test-first.
4. `/handoff` — cerrar cada sesión actualizando la memoria.

Skills útiles: `/grill-with-docs` (alinear + afinar glosario antes de construir), `/diagnose`, `/improve-codebase`.

## Datos del reto (crítico)

Los insumos reales viven local en `docs/recursos-reto/` (ignorados por git — **no subir data de Colsubsidio al repo público**) y en `plan-research/docs/recursos-reto/`. Realidades ya halladas (ver handoff):

- **`VLR_VIVIENDA` trae 4 ceros de más** → ÷10.000 para el precio real.
- **No hay columna "afiliado"**: se infiere de `PERIODO_AFILIADO` vacío/lleno.
- `SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA` vienen anonimizados con **letras griegas**, no las categorías del brief.
- Munición de impacto validada: **27,1% de los compradores históricos NO son afiliados** (vs. 10% de la regla 90/10); los 16 proyectos con ubicación conocida incumplen el límite.

## Convenciones

- **Idioma:** español (dominio, pitch y jurado son en español).
- **Cero caja negra:** todo explicable ("por qué esto y no lo otro"); la explicación pesa tanto como la recomendación. El jurado recorre el demo **solo**, sin narración.
- **"Feo pero funciona" > "bonito pero falso".** Un MVP terminado gana sobre una obra maestra a medias.
- Toda decisión dura (stack, esquema de DB, alcance) se registra como ADR en `docs/adr/`.
- **Commits frecuentes** (los modelos pueden borrar cosas por accidente).
- Mantén `docs/agents/handoff.md` **siempre** al día. Si algo cambia el rumbo del equipo, va también a `docs/URGENTE-Y-NOTICIAS.md`.

## Feedback loops

`N/A` hasta elegir stack. Cuando se defina, documentar aquí los comandos de **test / typecheck / run** para que los agentes verifiquen su trabajo.
