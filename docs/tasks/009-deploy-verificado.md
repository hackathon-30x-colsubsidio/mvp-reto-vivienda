---
id: 009
serves: "restricción no-negociable 'demo autogestionado' (AGENTS.md) + ADR 0002 (main siempre desplegable, es el link del demo)"
status: todo
---

# 009 — El demo corre en la URL pública, no en localhost

**Dueño:** A · **Costura S8** de [`plan.md §3`](../plan.md) · **Se repite al cierre de cada día**

## Objetivo
Que lo entregable sea el link, y que el link funcione con las llaves puestas en Vercel.

## Alcance
- Dentro: repo conectado a Vercel con auto-deploy de `main`; `ANTHROPIC_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL` y `SUPABASE_KEY` cargadas **en Vercel** (no sólo en `.env` local).
- Dentro: checklist de cierre de día — abrir la URL pública y recorrer lo que haya construido hasta ahí.
- Fuera: dominio propio, analytics, preview environments por rama.

## Done cuando
- [ ] La URL pública carga y `/api/chat` responde **desde Vercel**.
- [ ] `.env.example` está sin valores y ninguna key aparece en el historial de git (el repo es **público**).
- [ ] El recorrido diario queda anotado en [`handoff.md`](../agents/handoff.md).

## Notas
Conectar Vercel y cargar las env vars es manual en el dashboard: lo hace una persona, no un agente.
Un demo que sólo corre en la máquina de alguien no existe para el jurado.
