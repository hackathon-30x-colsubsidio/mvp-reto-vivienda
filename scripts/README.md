# scripts/ — limpieza y data sintética (Track B)

Python **offline**, nunca en producción (regla de [`AGENTS.md`](../AGENTS.md)). Corre una vez (o cada vez que cambie el Excel real) y deja los JSON de `data/sintetica/` listos para que Next.js los importe directo.

## Regenerar todo (un solo comando)

```bash
python3 -m venv .venv && source .venv/bin/activate && pip install -r scripts/requirements.txt
python3 scripts/clean_excel.py && python3 scripts/generar_sintetica.py
```

Requiere tener el repo hermano `plan-research` clonado al lado de este (`../plan-research/docs/recursos-reto/`) — ahí vive la data real de Colsubsidio, nunca aquí.

## Qué hace cada script

1. **`clean_excel.py`** — lee `hackathon_VIVIENDAv2.xlsx` (4.142 compradores) y `Links brochures .xlsx` (catálogo), aplica las trampas documentadas en `AGENTS.md` → "Datos del reto", y escribe CSVs **limpios pero reales** en `data/limpio/` (gitignored por `*.csv`, nunca se versionan). Imprime validaciones: % no afiliado (~27,1%), mediana de precio (~$195M), tamaño del catálogo (18).
2. **`generar_sintetica.py`** — lee esos CSVs y produce los 3 JSON de `data/sintetica/` (estos **sí se versionan**, son derivados/sintéticos):
   - `identidades.json` — 300 cédulas ficticias sampleadas de las distribuciones reales + las 3 cédulas fijas de los personajes del demo (`1000000001` afiliado listo, `1000000002` no afiliado con restricción de cupo, `1000000003` nutrición).
   - `proyectos.json` — ficha de los 18 proyectos oficiales (precio típico, ubicación, % no afiliado histórico, cupo 90/10, links).
   - `distribuciones.json` — agregados para el factor "similitud con compradores reales" (evidencia, nunca criterio de corte).

## Cómo probar que funcionó

```bash
python3 -c "import json; print(len(json.load(open('data/sintetica/identidades.json'))))"   # 303
python3 -c "import json; print(len(json.load(open('data/sintetica/proyectos.json'))))"      # 18
```

O simplemente correr los scripts: ambos imprimen sus propias validaciones (%, mediana, conteos) contra los números ya documentados en `AGENTS.md`.

## Decisiones tomadas (documentadas, no inventadas)

- **Letras griegas → v1 clusters anónimos con mapeo inferido aparte.** `categoria_cluster`/`segmento_cluster` conservan el código original (OMEGA, TAU...); `categoria_inferida`/`segmento_inferida` traen la etiqueta legible marcada `[inferido]`, tomada de `plan-research/docs/agents/context.md`. Nunca se presenta el mapeo como oficial.
- **VIBO ONCE y KARAKALI: ubicación contradictoria entre hojas** (RICAURTE en "Links brochure" vs. BOGOTÁ en "360"). No se inventa: `ubicacion` queda `null` y `ubicacion_incierta: true` con ambos candidatos en `ubicacion_nota`.
- **Rango de ingreso sintético** se deriva de `CATEGORIA` (proxy de ingresos, ver mapeo inferido), no existe una columna de ingreso real en el Excel.
- **Ciudad sintética** se samplea de la ubicación de los proyectos del catálogo, ponderada por su volumen histórico de compradores — el Excel de compradores no trae ciudad de residencia, así que es la mejor proxy disponible.
- **`random.seed(42)`** en `generar_sintetica.py`: correr el script las veces que sea da exactamente el mismo `data/sintetica/`, para que un diff en un PR sea real y no ruido de aleatoriedad.
