---
id: 016
serves: "spec §4 — factor 'similitud con compradores reales' (evidencia por proyecto) + decisión de grilling 2026-07-24 (buyer personas al workflow)"
status: todo
---

# 016 — Distribuciones por proyecto + buyer_personas.json

**Dueño:** Rol 2 (Datos & Motor, ex-Track B) · nace del grilling de scope 2026-07-24

## Objetivo
Hacer calculable el factor "similitud con compradores reales": hoy `data/sintetica/distribuciones.json` es **global**, así que la línea "el X% de compradores de este proyecto está en tu rango" no se puede construir. Y el PPT de buyer personas no alimenta nada del workflow.

## Alcance
- Dentro: extender `scripts/generar_sintetica.py` para emitir distribuciones **por proyecto** desde el Excel limpio (afiliación, rango de ingreso/categoría, edad, y género donde exista).
- Dentro: transcribir del PPT `Buyer Person.pptx` (local en `docs/recursos-reto/`, **nunca** el archivo original al repo) solo las variables que el Excel no trae — género del titular, estrato, conformación familiar DANE, entidad financiera, segmento real por proyecto → `data/sintetica/buyer_personas.json`, todo marcado como derivado.
- Fuera: cambiar la forma de `proyectos.json` (ya está estable para el matcher de C).

## Done cuando
- [ ] Un agregado por `proyecto_id` existe (en `distribuciones.json` o un archivo nuevo) con lo que consume la similitud.
- [ ] `buyer_personas.json` existe con las variables extra del PPT, marcadas `[derivado]`.
- [ ] Rol 3 puede citar "el X% de compradores de este proyecto…" sin inventar el número.

## Notas
Decisión de grilling: griegos = clusters anónimos con etiqueta `[inferido]`, nunca oficial. Cero data real al repo público (restricción no-negociable de `AGENTS.md`).
