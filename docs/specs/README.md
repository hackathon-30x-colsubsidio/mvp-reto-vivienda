# Specs por componente — borrador v1 para el TEAM

> **Estado: BORRADOR. Nada de aquí está decidido por quien lo escribió.**
> Existe para que el equipo tenga algo concreto encima de lo cual decidir, no para decidir por el equipo. Escrito el 2026-07-24 tras la [charla con el mentor](../reto/charla-mentor.md).

## Por qué existe

Tenemos el overview del MVP ([`spec.md`](../spec.md), [`mvp-layout.md`](../mvp-layout.md)) y tenemos código funcionando. Lo que no teníamos es el detalle de **cada componente por dentro**: qué pasos tiene el workflow de WhatsApp, qué contexto recibe el agente, qué ramas hay, qué se mide, de dónde sale cada número del tablero. Sin eso, si nos preguntan cómo sirve la idea, los cuatro contestamos distinto.

## Las dos capas de cada spec (leer esto antes que nada)

Cada spec separa dos cosas que **no** pesan igual:

| Capa | Qué es | Se puede dar por firme? |
|---|---|---|
| **El QUÉ** — contrato de comportamiento | Qué entra, qué sale, qué debe lograr el componente, y las restricciones externas que no negociamos (habeas data, tope del 40% del Decreto 583, regla 90/10, cero caja negra) | **Sí**, y siempre con la fuente citada |
| **El CÓMO** — diseño propuesto | Nodos del workflow, contexto del agente, orden de las preguntas, escalas de puntaje, rankings, taxonomías, redacciones | **No.** Es idea inicial. Los mermaids dibujan esta capa justamente para que el equipo decida encima de ellos |

Si un spec te suena a que ya está decidido algo que tú querías discutir, es un error del spec: revísalo contra las marcas de abajo y recláma­lo en la reunión.

## Marcas de decisión

| Marca | Significa | Quién la puede poner |
|---|---|---|
| **[CERRADA — fuente]** | Ya estaba ratificado antes de este paquete: brief oficial, `spec.md` con su checkbox marcado, un ADR aceptado, o palabras textuales del mentor | Nadie nuevo. Solo se transcribe con su fuente |
| **[HOY — así está construido]** | Describe el código que ya existe. **No implica que esté bien**: es el punto de partida y se puede tumbar | Se verifica leyendo el código |
| **[PROPUESTA — TEAM decide]** | Idea inicial de esta sesión. Sin valor hasta que el equipo la ratifique | Cualquiera, y muere si el equipo dice que no |

Y cada spec cierra con **`## Preguntas al TEAM`**: lo que hay que consultar sí o sí. **Nada se resuelve por omisión** — si una pregunta no se responde, sigue abierta, no se convierte en decisión.

## Los documentos

| Spec | Componente | Diagrama |
|---|---|---|
| [00 — MVP unificado](00-mvp-unificado.md) | El flujo completo de punta a punta | `flowchart TD`, todos los subgrafos |
| [01 — Ingesta y enriquecimiento](01-ingesta-enriquecimiento.md) | Cómo entra un lead y qué se sabe de él antes de hablarle | `flowchart LR` |
| [02 — Conversador](02-conversador.md) | El workflow de WhatsApp y el agente | `stateDiagram-v2` |
| [03 — Scoring y corte](03-scoring.md) | El motor que califica y decide la salida | `flowchart TD` |
| [04 — Match y agenda](04-match-agenda.md) | Qué proyectos se recomiendan y cómo se agenda | `flowchart LR` |
| [05 — Nutrición y re-enganche](05-nutricion-reenganche.md) | Qué pasa con quien todavía no puede comprar | `stateDiagram-v2` |
| [06 — Dashboard del asesor](06-dashboard-asesor.md) | Bandeja, métricas y ficha del lead | `flowchart LR` (linaje de datos) |

Orden sugerido de lectura para la reunión: **00** (para tener el mapa) → **02** (donde está el grueso de lo que hay que definir) → el resto según a quién le toque.

### Los diagramas sueltos

Cada diagrama tiene además **su propio archivo narrado** en [`diagramas/`](diagramas/README.md): el mermaid más el recorrido explicado en prosa, para entenderlo leyéndolo sin abrir el spec completo. Sirven para explicarle la solución a alguien en voz alta. Ahí mismo están los PNG, para proyectar o anotar encima.

Los specs **deciden**; los narrados **explican**. Si los dos no dicen lo mismo, gana el spec.

```bash
python3 scripts/check_diagramas.py   # avisa si un diagrama se desincronizó
```

## Precedencia frente a los otros docs

- Estos specs **detallan** [`docs/spec.md`](../spec.md); no lo contradicen. Si encuentras una contradicción, gana `spec.md` y el spec de componente está mal.
- **Superseden** el workflow strawman de [`mvp-layout.md §3`](../mvp-layout.md), que siempre estuvo marcado como borrador a curar. El diagrama viejo se queda ahí como registro histórico.
- **No superseden** ningún ADR. Si el equipo ratifica algo que cambia una decisión de arquitectura, eso se escribe como ADR nuevo, no aquí.
- **No son órdenes de trabajo.** Los tickets viven en [`docs/tasks/`](../tasks/README.md) y el estado real del build en [`docs/agents/handoff.md`](../agents/handoff.md).

## Qué hacer después de la reunión

1. Cada `[PROPUESTA]` que el equipo apruebe pasa a `[CERRADA — kickoff 2026-07-2X]`, con una línea de por qué.
2. La que se rechace se borra o se reescribe con lo que el equipo decidió; **no se deja ambigua**.
3. Lo que cambie una decisión de arquitectura o de datos → ADR nuevo en [`docs/adr/`](../adr/).
4. Lo que implique trabajo → ticket en [`docs/tasks/`](../tasks/README.md).
5. Actualizar [`handoff.md`](../agents/handoff.md) con lo ratificado.
