# Los diagramas, uno por archivo

Cada diagrama del [paquete de specs](../README.md) vive aquí en su propio archivo, **narrado para que se entienda leyéndolo** — sin tener que interpretar la imagen ni leer el spec completo. Sirven para explicarle la solución a alguien en voz alta.

| Archivo | Responde a |
|---|---|
| [00 — El MVP completo](00-mvp-unificado.md) | ¿Cómo funciona todo, de punta a punta? |
| [01 — Ingesta](01-ingesta-enriquecimiento.md) | ¿Cómo entra un lead y qué sabemos de él antes de hablarle? |
| [02 — Conversador](02-conversador.md) | ¿Qué pasos tiene la conversación y cuándo entra un humano? |
| [03 — Scoring](03-scoring.md) | ¿Cómo se decide si alguien puede comprar? |
| [04 — Match y agenda](04-match-agenda.md) | ¿Cómo se eligen los proyectos y se agenda la cita? |
| [05 — Nutrición](05-nutricion-reenganche.md) | ¿Qué pasa con quien todavía no puede comprar? |
| [06 — Dashboard](06-dashboard-asesor.md) | ¿De dónde sale cada número que ve el asesor? |

## Qué hay en cada archivo

1. **Qué responde** el diagrama, en una línea.
2. **El diagrama** en mermaid (GitHub lo renderiza al abrir el archivo).
3. **Cómo se lee**, paso por paso en prosa.
4. **Las decisiones**: cada rombo explicado, con qué pasa en cada rama.
5. **Qué no está conectado todavía**, cuando aplica.
6. **Link al spec** que lo contrata.

## Tres cosas que conviene saber antes de leerlos

- **Estos archivos narran; no deciden.** Las decisiones, con sus marcas `[CERRADA]` / `[HOY]` / `[PROPUESTA]`, viven en los [specs](../README.md). Si algo aquí te suena a decidido, revísalo allá antes de construir sobre eso.
- **Cada mermaid está a propósito en dos archivos:** aquí y en su spec. Es lo que permite leer la narración suelta, y también lo que hace que se desincronicen si alguien edita solo uno. **Si tocas un diagrama, tócalo en los dos.**
- **Si el diagrama y su narración no coinciden, gana el spec.** Este archivo es el que está mal.

Comprobar que ninguno se desincronizó:

```bash
python3 scripts/check_diagramas.py
```

Regenerar los PNG (el comando además valida la sintaxis del mermaid):

```bash
npx -y @mermaid-js/mermaid-cli -i docs/specs/diagramas/00-mvp-unificado.md -o /tmp/x.md
```
