# 0002 — Stack del MVP: Next.js + Vercel + Supabase + LLM en streaming

**Estado:** Aceptada · **Fecha:** 2026-07-23

> **Actualización 2026-07-23 — proveedor de IA: Claude → Google Gemini.** A la hora de deployar, el equipo solo tenía disponible una **key de Gemini**, no de Anthropic. Como el criterio que gobierna es "que funcione el domingo", se cambió el proveedor de IA a **Google Gemini** (`gemini-2.5-flash`) vía el SDK `@google/genai`. Todo lo demás del stack queda igual. Reglas que **no** cambian: la IA vive solo en `/api/chat` y `/api/explicacion` en **streaming** (primer token < 2s), la key es **solo server-side** (`GEMINI_API_KEY`, `.env.example` sin valores), y el scoring/corte siguen siendo TS puro sin LLM. El proveedor está aislado en un solo archivo, [`lib/gemini.ts`](../../lib/gemini.ts), así que volver a Claude (o cambiar de modelo) es un cambio de un archivo. Donde abajo diga "Anthropic / `claude-opus-4-8`", léase "Gemini / `gemini-2.5-flash`".

## Contexto

Quedan ~3 días de desarrollo (cierre: domingo 26, 11:30 a.m.). El entregable es un **link público evaluable con un clic**, recorrible por el jurado sin el equipo. El [spec](../spec.md) define un workflow determinista con IA en dos puntos acotados (conversador + experto que explica/matchea), una DB central de leads y una vista de asesor. 4 personas trabajando en paralelo en ramas independientes. El criterio que gobierna: **que funcione el domingo**, no elegancia de infraestructura.

## Decisión

**Una sola app Next.js deployada en Vercel, con Supabase como DB y la API de Anthropic para la IA.**

| Pieza | Elección | Regla |
|---|---|---|
| App | **Next.js (App Router, TypeScript)** — monolito | Frontend (chat, vista asesor) y backend (API routes) en un solo repo y un solo deploy |
| Deploy | **Vercel**, conectado al repo de GitHub | Cada push a `main` redeploya solo. El link público existe desde el día 1 |
| DB mutable | **Supabase** (Postgres, free tier) | Solo para lo que muta: `leads`, `conversaciones`, `citas`. 2-3 tablas, sin sobre-modelar |
| Datos estáticos | **JSON versionados en `data/sintetica/`** | Base sintética de identidades, fichas de proyectos, distribuciones derivadas. Sin DB — se importan directo. Los genera un script Python **offline** (ver abajo) |
| IA | **API de Anthropic** desde API routes, `claude-opus-4-8`, adaptive thinking, **streaming** | Solo en `/api/chat` (conversador) y `/api/explicacion` (experto). El scoring y el corte son TypeScript puro, sin LLM — cero caja negra |
| Secretos | **Env vars en Vercel** + `.env` local | El repo es **público**: ninguna key entra jamás al repo. Mantener `.env.example` sin valores |

### Dónde vive cada cosa

```
mvp-reto-vivienda/
├── app/                  # páginas: / (chat), /asesor (vista asesor), landing del jurado
├── app/api/              # chat, score, match, explicacion, leads
├── lib/types.ts          # contratos compartidos entre tracks: Lead, Score, LeadCurado
├── lib/scoring/          # motor de reglas (TS puro, determinista, auditable)
├── data/sintetica/       # JSON derivados — SÍ se versionan
├── scripts/              # limpieza del Excel real (Python, corre offline, nunca en prod)
└── docs/recursos-reto/   # data real de Colsubsidio — local, gitignored
```

### Mapeo a los 4 tracks del equipo

| Track | Superficie |
|---|---|
| A — Conversación & entrada | página `/` + `/api/chat` |
| B — Scoring & datos | `scripts/` → `data/sintetica/` + `lib/scoring/` + `/api/score` |
| C — Matching & explicación | `/api/match` + `/api/explicacion` |
| D — Vista asesor, DB & nutrición | página `/asesor` + tablas Supabase + `/api/leads` |

Los contratos entre tracks (`Lead`, `Score`, `LeadCurado`) viven en `lib/types.ts` — un solo archivo que los cuatro importan. Cada track construye contra fixtures de esos tipos, no contra el código de los demás.

## Reglas no-negociables derivadas

1. **Python nunca en producción.** Solo en `scripts/` para generar los JSON. El deploy es un solo runtime (Node).
2. **La API key de Anthropic solo vive server-side** (API routes). Nunca en el cliente, nunca en el repo.
3. **Streaming en toda llamada a Claude.** Evita el límite de tiempo de las funciones de Vercel (plan free) y hace que el chat se vea vivo en el video.
4. **El scoring no llama al LLM.** Reglas explícitas en `lib/scoring/`, testeables sin red. El LLM redacta el porqué *a partir de* factores ya calculados; jamás decide el corte.
5. **Commits frecuentes y push a `main` desplegable.** Si `main` se rompe, el link del demo se rompe. Feature branches por track; merge solo con typecheck en verde.

## Qué NO se monta (y por qué)

- **WhatsApp Business API real** — verificación de Meta toma días; ya decidido: simulador web + disclaimer ([spec §2](../spec.md)).
- **Auth/login** — el jurado entra directo; `/asesor` vive sin contraseña.
- **Docker, AWS, microservicios, colas** — nada que no se despliegue en minutos.
- **ORM pesado / migraciones formales** — el cliente de Supabase directo alcanza para 3 tablas.

## Alternativas consideradas

- **Todo en memoria / JSON sin DB:** más simple aún, pero la vista del asesor y la nutrición necesitan estado compartido entre el chat del jurado y la pantalla del asesor — y "Postgres" suma implementabilidad frente al jurado.
- **Backend Python (FastAPI) separado:** el equipo domina Python para datos, pero dos deploys y dos runtimes duplican los puntos de falla del demo. Python queda donde brilla: la limpieza offline.
- **Firebase:** equivalente a Supabase, pero Supabase es Postgres (más cercano a lo que Colsubsidio implementaría de verdad).

## Consecuencias

- Desbloquea los feedback loops de [`AGENTS.md`](../../AGENTS.md) (test / typecheck / run) y el ticket de scaffold.
- El límite de ejecución de funciones en Vercel free obliga al streaming (regla 3) — restricción asumida, no accidente.
- El esquema formal de la DB de leads sigue abierto ([spec §7](../spec.md)); se cierra en `/plan` y se registra como ADR 0003.
