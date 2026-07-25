---
id: 016
serves: "spec §4 — factor 'similitud con compradores reales' (evidencia por proyecto) + decisión de grilling 2026-07-24 (buyer personas al workflow)"
status: done
---

# 016 — Distribuciones por proyecto + buyer_personas.json

**Dueño:** Rol 2 (Datos & Motor, ex-Track B) · nace del grilling de scope 2026-07-24

## Objetivo
Hacer calculable el factor "similitud con compradores reales": hoy `data/sintetica/distribuciones.json` es **global**, así que la línea "el X% de compradores de este proyecto está en tu rango" no se puede construir. Y el PPT de buyer personas no alimenta nada del workflow.

## Alcance
- Dentro: extender `scripts/generar_sintetica.py` para emitir distribuciones **por proyecto** desde el Excel limpio (afiliación, rango de ingreso/categoría, edad, y género donde exista).
- Dentro: la transcripción del PPT **ya existe** — un compañero la subió en [`data/buyer-personas-vivienda.md`](../../data/buyer-personas-vivienda.md) (commit `d07dbe3`). Úsala como fuente de las variables que el Excel no trae — género del titular, estrato, conformación familiar DANE, entidad financiera, segmento real por proyecto → `data/sintetica/buyer_personas.json`, todo marcado como derivado. **Respeta sus advertencias de extracción** (§ "Nota sobre la extracción" del md: género no confiable, rangos salariales cruzados en Araucaria/Los Nogales/Abeto/Karakali).
- ⚠️ **No copies los nombres de empresas** de las tablas "Top empresas" del md al JSON derivado: son data real de Colsubsidio y salen del repo público (ver [ticket 022](022-sanear-buyer-personas-md.md)). El JSON derivado se queda con agregados anónimos.
- Fuera: cambiar la forma de `proyectos.json` (ya está estable para el matcher de C).

## Done cuando
- [x] Un agregado por `proyecto_id` existe (en `distribuciones.json` o un archivo nuevo) con lo que consume la similitud. → `data/sintetica/buyer_personas.json`, generado por `scripts/generar-buyer-personas.ts` (2026-07-25).
- [x] `buyer_personas.json` existe con las variables extra del PPT, marcadas `[derivado]`. Género excluido y slides rotos marcados `confiable: false`, como pedía la nota de extracción.
- [x] Rol 3 puede citar "el X% de compradores de este proyecto…" sin inventar el número. → `lib/scoring/similitud.ts` (`similitudCon`) es el ÚNICO punto que redacta los %; los consume el factor del motor y el ranking del matcher.

## Notas
Decisión de grilling: griegos = clusters anónimos con etiqueta `[inferido]`, nunca oficial. Cero data real al repo público (restricción no-negociable de `AGENTS.md`).
