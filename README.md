# mvp-reto-vivienda

MVP del reto **Vivienda** de la hackathon **Colsubsidio × 30X** (2026): un perfilador inteligente de leads que hace que los leads de pauta lleguen al asesor tan calificados como los orgánicos.

**▶️ Demo:** https://mvp-reto-vivienda.vercel.app — se recorre solo, sin narración y sin instalar nada.

## El problema

Colsubsidio vende vivienda con un mandato regulatorio: **90% de las ventas deben ser a afiliados** (regla 90/10). Invierte en pauta digital y llegan muchos leads, pero al fondo del embudo pocos tienen capacidad real de compra y buena parte son no afiliados. El costo es doble: el CPL pagado + las horas del equipo comercial persiguiendo leads que no van a cerrar. Los leads orgánicos, en cambio, convierten bien porque llegan mejor calificados.

## La apuesta

Un workflow que hace que los leads pagos se parezcan a los orgánicos: entran por pauta, conversan con un perfilador estilo WhatsApp que **pregunta solo lo que falta** —y lo pregunta conversando, no encuestando: explica para qué sirve cada dato y deja escribir en vez de encerrar al lead en botones—, un motor **transparente** los califica y los matchea con hasta 3 proyectos del catálogo real, y al asesor le llega un **lead curado con cita agendada y el porqué en lenguaje natural**, listo para cerrar. Quien aún no puede comprar no se descarta: entra a **nutrición** con el trigger exacto que lo volvería listo.

Cero caja negra: cada decisión —el puntaje, el corte, el match, el trigger— se explica con sus factores a la vista.

## Qué ver en el demo

| Pantalla | Qué muestra |
|---|---|
| **Portada** (`/`) | Tres personajes pre-sembrados (una afiliada lista, un no afiliado con restricción de cupo, una lead que aún no puede comprar) y un botón **"soy yo"** para conversar desde cero. |
| **La conversación** | El perfilador pide autorización de datos, dice que no va a repreguntar lo que ya sabe, pregunta lo que falta y cierra **agendando una cita** en la sala de ventas del proyecto recomendado. |
| **La consola del asesor** (`/asesor`) | La bandeja en dos grupos ("pueden comprar hoy" / "todavía no") y, al abrir un lead, **la ficha**: el puntaje con su aritmética factor por factor, el porqué, los proyectos con su razón, la cita. Es el clímax. |
| **Métricas** (`/asesor/tablero`) | Cuántos leads entran, cuántos pasan el corte, y el **% de no afiliados contra el 10% que permite la regla 90/10** — la munición del reto hecha operación. |

**Un hallazgo que sale de la data real:** el **27,1%** de los compradores históricos de Colsubsidio no son afiliados, casi el triple del 10% que permite la regla, y **los 18 proyectos del catálogo ya venden por encima de ese límite**. El sistema no esconde eso: recomienda igual y le avisa al asesor que tiene que validar cupo antes de separar.

## Cómo correr

Stack: **Next.js** (App Router, TypeScript) + **Vercel** + **Supabase** + **Google Gemini** en streaming ([ADR 0002](docs/adr/0002-stack-mvp.md)).

```bash
npm install
cp .env.example .env.local   # llenar credenciales (ver notas dentro del archivo)
npm run dev
```

Sin `.env.local` la app **igual arranca**: cae a fixtures, muestra los 3 personajes desde el código y lo avisa en pantalla. Lo que no funciona en ese modo es la cadena completa (sin base de datos no se guarda el lead ni se ofrece la cita).

Los tres feedback loops, los mismos que corre cualquier agente antes de commitear:

```bash
npm test && npx tsc --noEmit && npm run lint
```

⚠️ **Nunca correr `npm run build` con `npm run dev` encendido**: ambos escriben en `.next` y el dev server queda colgado reteniendo el puerto.

## Los datos: qué es real y qué es derivado

**La data real de Colsubsidio no está en este repo y nunca va a estarlo** (es una restricción no-negociable del proyecto, no un descuido). Los insumos originales viven solo en local, fuera de git.

| Qué se versiona | Qué es |
|---|---|
| `data/sintetica/identidades.json` | **303 identidades sintéticas**, generadas a partir de las distribuciones reales de 4.142 compradores. Sirven para simular el "ya te conocemos" por cédula: la data real es anónima y no trae cédulas. |
| `data/sintetica/proyectos.json` | Los **18 proyectos reales** del catálogo, con precio y cupo 90/10 **derivados** del insumo (sin nombres de personas ni de empresas). |
| `data/sintetica/distribuciones.json` | Agregados estadísticos del histórico. De aquí sale el 27,1%. |
| `db/seed.sql`, `data/sintetica/slots.json` | **Generados**, no escritos a mano (`scripts/generar-seed.ts`, `scripts/generar-slots.ts`). Hay un test que falla si quedan desactualizados. |

## Estructura del repo

| Ruta | Qué es |
|---|---|
| [`AGENTS.md`](AGENTS.md) | **Empieza aquí si vas a trabajar en el repo.** El contrato de ingeniería: orden de lectura, restricciones no-negociables, convenciones y feedback loops. Tool-neutral. `CLAUDE.md` es solo un puntero que lo importa. |
| [`docs/spec.md`](docs/spec.md) | **El contrato de producto**: qué hace y qué NO hace el MVP, con 4 criterios de aceptación. |
| [`docs/specs/`](docs/specs/README.md) | El detalle **por componente** (ingesta · conversador · scoring · match+agenda · nutrición · consola), cada uno con su diagrama. Antes de tocar una parte, se lee su spec. |
| [`docs/agents/plan-sabado-25.md`](docs/agents/plan-sabado-25.md) | El plan operativo vigente: reparto, decisiones y checkpoints del último día. |
| [`docs/agents/handoff.md`](docs/agents/handoff.md) | Memoria del build: qué se hizo, cuándo y qué se aprendió rompiéndolo. |
| [`docs/URGENTE-Y-NOTICIAS.md`](docs/URGENTE-Y-NOTICIAS.md) | Lo que cambia el rumbo del equipo. |
| [`docs/adr/`](docs/adr/) | Las decisiones de arquitectura y su porqué. |
| [`docs/agents/context.md`](docs/agents/context.md) | Glosario del dominio (afiliado, 90/10, curado, nutrición…). |
| [`PRODUCT.md`](PRODUCT.md) + [`DESIGN.md`](DESIGN.md) | La verdad de producto y el sistema visual. **Antes de tocar UI se lee `DESIGN.md`.** |
| [`docs/tasks/`](docs/tasks/README.md) | Los tickets del build, cada uno citando el criterio de aceptación que sirve. |
| [`docs/reto/`](docs/reto/) | El brief oficial y el digest de la charla con el mentor. |
| `lib/` · `app/` · `db/` · `scripts/` | El motor y el matcher (TypeScript puro, sin LLM) · las pantallas y las API routes · el esquema de Postgres · los generadores. |

Los documentos superados llevan un banner `🔁 HISTÓRICO` que dice cuál es el vigente: si un doc no lo tiene, está vivo.

## Entregables de la hackathon

1. **Link a demo funcional** — recorrible por el jurado, sin el equipo: https://mvp-reto-vivienda.vercel.app
2. **Video pitch + demo de 2 min** (problema → solución → demo → impacto).
3. **Este repo público.** Cierre: **domingo 26 jul 2026, 11:30 a.m. hora Colombia.**
