---
id: 024
serves: "spec §6 (el ingreso como insumo del gate del 40%) + obligación 4 del spec 02 (no sonar a robot)"
status: done (2026-07-25 noche — `NO_ES_MONTO` + rango plausible declarado en `preguntas.ts`, acuse que devuelve el número entendido, y repregunta UNA vez reutilizando el mecanismo del desvío. Tests de los 4 casos de la tabla + 2 de chat contra el bucle)
---

# 024 — 🟠 El ingreso se confirma antes de calificar con él

**Dueño:** Calidad IA & Demo (P3) · rama **`feat/024-confirmacion-ingreso`** · **~40 min** · nace de la [discusión de workflow 2026-07-25](../agents/discusion-workflow-2026-07-25.md) §2.2

> Arranca en paralelo con el [023](023-puente-capacidad-antes-del-proyecto.md): no comparten ni un archivo. Entra a `main` **después** de él. ⚠️ Si un acuse nuevo rompe un guion de `lib/fixtures/`, **avisa a P2 y él regenera** — las fixtures no se editan a mano ([reglas de merge](../agents/plan-sabado-25.md)).

## El defecto

El ingreso es el insumo del **único gate legal** del sistema, y hoy nadie lo valida ni lo confirma. Corrido contra [`parsearIngresoMensual`](../../lib/conversacion/preguntas.ts) el 2026-07-25:

| Lo que teclea el lead | Lo que el sistema entiende |
|---|---|
| `2+2` | $2.000.000 |
| `-3` | $3.000.000 |
| `999999999999` | $999.999.999.999 |
| `no sé` / `depende del mes` | nada, y **no se repregunta** |

Encima, el acuse contesta *"con eso ya puedo calcular con números reales"*. Un número mal entendido cambia el veredicto y nadie se entera.

⚠️ **Esto no lo arregla el system prompt**, que existe y es estricto ([`app/api/chat/route.ts`](../../app/api/chat/route.ts)): el parseo es TypeScript puro y el LLM no está en ese camino. La sala lo atribuyó al prompt; no es ahí.

## Alcance

- Dentro: el acuse **dice el número entendido** y ofrece corregirlo ("entonces trabajo con $2.000.000 al mes; si me equivoqué, corrígeme"). Es lo que en cámara se lee como cuidado, no como validación.
- Dentro: un monto fuera de un rango sensato (propuesta: menos de $500.000 o más de $100.000.000 al mes) **repregunta una vez** en vez de aceptarlo.
- Dentro: cuando el texto no se pudo parsear (`no sé`, `depende del mes`), repreguntar una vez con un ejemplo antes de rendirse. Si insiste, se guarda el texto crudo como hoy: **no se adivina**.
- Fuera: cambiar la redacción de la pregunta (ya la ratificó el mentor), meter chips al ingreso (la lista sesga, [spec 02 D4](../specs/02-conversador.md)), y validar los demás campos.

## Done cuando

- [ ] `2+2`, `-3` y `999999999999` no pasan como ingreso válido.
- [ ] El lead ve el monto entendido antes de que se use para calificar.
- [ ] `no sé` recibe una segunda oportunidad, no un silencio.
- [ ] Tests en [`preguntas.test.ts`](../../lib/conversacion/preguntas.test.ts) para los cuatro casos de la tabla.

## Notas

El límite superior y el inferior son **supuestos nuestros**: se declaran en el código como tal, con la razón escrita. Ninguna cifra inventada se presenta como dato de Colsubsidio.
