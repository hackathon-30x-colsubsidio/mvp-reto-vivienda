# 🚨 Urgente y Noticias

> El documento más concreto y resumido del repo. Si solo vas a leer un archivo hoy, es este. Se actualiza cada vez que algo cambia el rumbo del equipo.

## ✅ Decisión tomada: vamos por VIVIENDA
El reto está **cerrado: Vivienda** (perfilamiento inteligente de leads). Registrado en `docs/adr/0001-eleccion-reto-vivienda.md`. **No se re-litiga.** El porqué corto: mejor balance de los 4 criterios, datos reales usables (Excel 4.142 compradores + buyer personas + brochure), demo autocontenido por WhatsApp, ROI clarísimo (CPL + horas comerciales) y gancho regulatorio 90/10.

## ✅ 2026-07-23 — Stack decidido: Next.js + Vercel + Supabase + Claude
Registrado en `docs/adr/0002-stack-mvp.md`. Lo que cada quien necesita saber **antes de escribir código**:
- **Un solo monolito Next.js (TypeScript, App Router)** deployado en Vercel — frontend y API routes juntos, auto-deploy al pushear a `main`. `main` siempre desplegable: es el link del demo.
- **Los datos estáticos NO van a base de datos**: son JSON en `data/sintetica/`, generados por un script Python que corre **solo offline** en `scripts/`. Python nunca en producción.
- **Supabase** solo para lo que muta: leads, conversaciones, citas (2-3 tablas).
- **La IA solo vive en 2 endpoints** (`/api/chat` y `/api/explicacion`), con `claude-opus-4-8` y **streaming obligatorio**. El scoring es TypeScript puro sin LLM — es la regla "cero caja negra".
- **El repo es público**: API keys solo en `.env` local (gitignored) y env vars de Vercel. Jamás en un commit.
- **Contratos entre tracks** (`Lead`, `Score`, `LeadCurado`) en `lib/types.ts` — cada quien construye contra fixtures, nadie espera al de al lado.
Feedback loops (`npm test` / `tsc --noEmit` / `npm run dev`) ya definidos en `AGENTS.md`. Siguiente paso: scaffold de Next.js + conectar Vercel y Supabase.

## ✅ 2026-07-24 — La DB existe y `/asesor` está en el link público
Track D mergeado a `main` (`db137f7`). El demo ya se recorre entero en **https://mvp-reto-vivienda.vercel.app** — landing y chat de A, `/asesor` de D. Esquema en [`docs/adr/0003-esquema-db-leads.md`](adr/0003-esquema-db-leads.md), SQL en `db/`.

- **🔴 Falta un paso para que producción persista:** las env vars de Supabase están en el `.env` de una sola máquina. Hay que cargarlas en **Vercel → Settings → Environment Variables** y **redesplegar**. Mientras tanto el demo funciona con fixtures y lo avisa en pantalla (no miente, pero no guarda nada).
- **Nadie escribe a Supabase directo.** A y C llaman a `POST /api/leads` (recibe un `LeadCurado`) y `POST /api/citas` (persiste la franja elegida). Un solo lugar valida y mapea.
- **Los criterios de aceptación los enforcea Postgres**, no la revisión de código: un lead de nutrición sin trigger, o uno calificado sin factores, **falla el insert**. Verificado contra la DB real. Si tu track recibe un 422, es el dato, no el servidor.
- **A tiene pendiente cerrar el criterio 3** ([ticket 007](tasks/007-reenganche-nutricion.md)): el botón "simular trigger" ya lleva al chat con `/?lead_id=X&reenganche=1`, pero `app/page.tsx` no lee la URL todavía, así que el clic aterriza en el landing.
- **Ojo con el modo oscuro:** `globals.css` vuelve el body casi negro con `prefers-color-scheme: dark`. `/asesor` ya se blinda sola; quien construya otra pantalla con colores claros debería hacer lo mismo, o el jurado con el sistema en oscuro no verá nada.

## Qué hacer ya
1. **Cada quien toma su track y arranca HOY** — el reparto en 4 con tareas concretas, contratos y fixtures está en **`docs/reparto-inicial.md`**. Nadie espera a nadie: A hace el scaffold (~1h) mientras B limpia el Excel, C redacta explicaciones de referencia y D monta Supabase.
2. **Todo el equipo lee antes de codear:** `docs/spec.md` (el contrato de producto), `docs/adr/0002-stack-mvp.md` (las reglas del stack) y `docs/reparto-inicial.md` (tu track).
3. **Kickoff** (puede ser corto ya): ratificar frase de apuesta, contratos de `lib/types.ts`, umbrales del corte y esquema de la DB (ADR 0003). El trabajo de los tracks no se bloquea esperándolo.

## 2026-07-23 — Scope macro del MVP definido: leer `docs/mvp-layout.md`
Grill de scope hecho (Mani + Claude). **8 decisiones cerradas** (demo = viaje completo con clímax en la vista del asesor, WhatsApp simulado + disclaimer, nutrición demostrada con triggers condicionales, scoring de reglas transparentes + similitud con compradores reales + LLM explica, conversación adaptativa, bot agenda visita a sala de ventas, el no-afiliado sigue el flujo hacia una DB central, workflow orquestado con IA en puntos específicos) y las **abiertas marcadas para el kickoff**: frase de apuesta, curar el mermaid (es strawman), esquema de la DB de leads, vista del asesor, entrada del demo, métricas de performance del scoring. El kickoff ya no arranca de cero: arranca de `docs/mvp-layout.md`.

## 2026-07-23 — Llegaron los datos reales de Vivienda: el reto se valida solo
Se agregaron los recursos oficiales en `docs/recursos-reto/` (Excel de 4.142 compradores, PPT de buyer personas, links de brochures/360). Análisis completo hecho hoy — esto es lo que cambia el juego:

- **27,1% de los compradores históricos NO son afiliados**, casi 3× el 10% que permite la regla 90/10. Y no es un promedio maquillado: **de los 16 proyectos con ubicación conocida, los 16 incumplen el límite** (desde 15,9% en Mongui hasta 63,1% en Araucaria). Esto es la cifra de impacto lista para el pitch — el problema no es hipotético, ya está pasando en el 100% de los proyectos analizados.
- **El Excel real NO coincide con lo que promete el brief.** No hay columna "afiliado" (se infiere de si `PERIODO_AFILIADO` está vacío), `VLR_VIVIENDA` trae 4 ceros de más (dividir entre 10.000 para el precio real, ej. 1.495.000.000.000 → $149,5M), y `SEGMENTO_POBLACIONAL`/`CATEGORIA`/`PIRAMIDE_NUEVA` vienen anonimizados con **letras griegas** (KAPPA, PI, OMEGA...) en vez de las categorías Básico/Medio/Alto/Joven o top/micro/estándar que promete el brief. Quien construya el motor de scoring tiene que limpiar esto primero — está detallado en la pestaña "Datos" del dashboard del equipo.
- El canal real medido en la data (columna `MEDIO`): 43,4% de las compras vienen de señalización física en punto de venta, solo 8,3% de canales digitales (WhatsApp+Redes+Web). Valida por qué la pauta digital hoy no convierte al mismo ritmo — exactamente el hueco que ataca el perfilador.

## Lo más importante que sigue abierto
- **Decisión pendiente:** qué hacer con los códigos griegos del Excel — ¿tratarlos como clusters anónimos (más honesto para el jurado) o intentar inferir el mapeo cruzando contra los % del PPT de buyer personas (más vistoso, más riesgo de estar mal)?
- Ver detalle completo en `docs/agents/handoff.md` (sección Memory) y en el dashboard del equipo (artifact con pestañas Solución/Datos/Hoy/Flujo/Equipo/Decisiones/Entrega).

## Preguntas abiertas de Vivienda (resolver por WhatsApp, no bloquean el arranque)
- ¿El cruce con **Ministerio de Vivienda / buró** se espera *demostrado* o basta con *inferirlo*? (Las integraciones reales están fuera de alcance según el brief.)
- **Convergencia multi-canal → WhatsApp:** ¿es válido que todas las fuentes de pauta converjan a una sola conversación de WhatsApp, o esperan tratamiento por canal? (También es decisión de producto del team.)
- **¿Qué info ya conoce Colsubsidio del lead que llega?** Supuesto de trabajo: si es afiliado lo conocen, si no, no. Averiguar cómo se sabría en real y qué campos trae un lead de pauta.
- **Premios:** persiste la discrepancia "1 ganador por reto + 3 globales" (apertura/`resumen-ceremonia.md`) vs "podio único de 3 monetario" (sitio oficial). Confirmar cuál rige. En cualquier caso: diseñar para *implementabilidad*, no solo para el demo.
