"""Genera la data sintética que SÍ se versiona (data/sintetica/).

Lee los CSVs limpios de data/limpio/ (reales, derivados, gitignored) y
produce JSON sin ninguna cédula real (el Excel de compradores ni siquiera
trae cédulas: no hay riesgo de fuga, pero igual todo cédula aquí es
FICTICIA, generada por este script).

Salidas:
- identidades.json   — base sintética de "ya te conocemos" (cédula ficticia
                        -> afiliación, ciudad, segmento, rango de ingreso),
                        con distribuciones calcadas de la data real, más
                        las 3 cédulas fijas de los personajes del demo.
- proyectos.json      — ficha de los 18 proyectos del catálogo oficial.
- distribuciones.json — agregados para el factor "similitud con
                         compradores reales" (evidencia, no criterio de corte).
"""

import json
import random
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
LIMPIO = RAIZ / "data" / "limpio"
SINTETICA = RAIZ / "data" / "sintetica"
SINTETICA.mkdir(parents=True, exist_ok=True)

random.seed(42)  # reproducible: correr el script dos veces da el mismo output

N_IDENTIDADES_SINTETICAS = 300

# Cédulas ficticias fijas de los 3 personajes del demo (spec §4).
# Un lead que llegue con una de estas 3 cédulas simula "ya lo conocíamos".
CEDULA_AFILIADO_LISTO = "1000000001"
CEDULA_NO_AFILIADO_LISTO = "1000000002"
CEDULA_NUTRICION = "1000000003"


def slugify(nombre: str) -> str:
    return (
        nombre.strip()
        .lower()
        .replace(" ", "-")
        .replace("í", "i")
        .replace("á", "a")
        .replace("é", "e")
        .replace("ó", "o")
        .replace("ú", "u")
        .replace("ñ", "n")
    )


# Ubicaciones del Excel no distinguen ciudad de zona/sector. Estos 18 proyectos
# son pocos y conocidos, así que se resuelve a mano en vez de adivinar con reglas:
# - Municipios reales (Chía, Tocancipá, Girardot, Ricaurte, Ubaté, Bogotá) -> ciudad.
# - "CIUDADELA MAIPORÉ" / "CIUDADELA CALLE 80" -> son sectores de Ciudadela
#   Colsubsidio, un desarrollo real y conocido en Bogotá (Engativá). Es una
#   INFERENCIA razonable (no viene explícito en el Excel), marcada como tal.
CIUDAD_POR_UBICACION = {
    "CHÍA": ("Chía", None),
    "TOCANCIPÁ": ("Tocancipá", None),
    "GIRADOT": ("Girardot", None),  # el Excel trae el typo "Giradot"
    "RICAURTE": ("Ricaurte", None),
    "UBATE": ("Ubaté", None),
    "BOGOTÁ": ("Bogotá", None),
    "CIUDADELA MAIPORÉ": ("Bogotá", "Ciudadela Maiporé"),  # inferido
    "CIUDADELA CALLE 80": ("Bogotá", "Ciudadela Calle 80"),  # inferido
}


def resolver_ciudad_zona(ubicacion, incierta: bool) -> tuple[str, str | None, bool]:
    """-> (ciudad, zona, ciudad_inferida). Nunca inventa: si no hay match, dice que falta."""
    if incierta or pd.isna(ubicacion):
        return "Ricaurte o Bogotá (ubicación contradictoria entre hojas, sin confirmar)", None, True
    if ubicacion in CIUDAD_POR_UBICACION:
        ciudad, zona = CIUDAD_POR_UBICACION[ubicacion]
        return ciudad, zona, ciudad in ("Bogotá",) and ubicacion.startswith("CIUDADELA")
    return f"Sin confirmar (Excel dice: {ubicacion})", None, True


# VIS = Vivienda de Interés Social. El Excel real NO trae esta bandera; se
# aproxima con el tope legal (~150 SMMLV, Decreto vigente de vivienda) usando
# un SMMLV de referencia. ES UNA HEURÍSTICA, no un dato oficial del reto —
# a verificar/ratificar en el kickoff, igual que el resto de umbrales.
SMMLV_REFERENCIA = 1_423_500
TOPE_VIS_ESTIMADO = round(150 * SMMLV_REFERENCIA, -6)  # ~$213.5M, redondeado


def generar_proyectos() -> list[dict]:
    catalogo = pd.read_csv(LIMPIO / "catalogo_proyectos.csv")
    compradores = pd.read_csv(LIMPIO / "compradores_limpio.csv")
    compradores["afiliado"] = compradores["afiliado"].astype(bool)

    stats = (
        compradores.groupby("proyecto_normalizado")
        .agg(
            precio_tipico=("precio_real", "median"),
            n_compradores_historico=("precio_real", "count"),
            n_no_afiliados_historico=("afiliado", lambda s: int((~s).sum())),
        )
        .reset_index()
    )

    catalogo = catalogo.merge(stats, on="proyecto_normalizado", how="left")

    proyectos = []
    for _, row in catalogo.iterrows():
        ciudad, zona, ciudad_inferida = resolver_ciudad_zona(row["ubicacion"], bool(row["ubicacion_incierta"]))
        precio_desde = None if pd.isna(row["precio_tipico"]) else round(row["precio_tipico"])
        n_historico = 0 if pd.isna(row["n_compradores_historico"]) else int(row["n_compradores_historico"])
        n_no_afiliados = 0 if pd.isna(row["n_no_afiliados_historico"]) else int(row["n_no_afiliados_historico"])
        # Proxy: el cupo regulatorio (10%) se calcula sobre el volumen histórico
        # de ventas de este proyecto, a falta de un dato de "inventario total"
        # que el Excel no trae. Documentado como aproximación en scripts/README.md.
        cupo_total = round(n_historico * 0.10)

        proyectos.append(
            {
                "proyecto_id": slugify(row["nombre"]),
                "nombre": row["nombre"],
                "ciudad": ciudad,
                "ciudad_inferida": ciudad_inferida,  # extra informativo, no rompe el contrato de C
                "zona": zona,
                "precio_desde": precio_desde,
                "vis": None if precio_desde is None else precio_desde <= TOPE_VIS_ESTIMADO,
                "cupo_no_afiliados": {"usado": n_no_afiliados, "total": cupo_total},
                "brochure": None if pd.isna(row["link_brochure"]) else row["link_brochure"],
                "recorrido_360": None if pd.isna(row["link_360"]) else row["link_360"],
                "ubicacion_incierta": bool(row["ubicacion_incierta"]),
                "ubicacion_nota": (
                    "Ubicación contradictoria entre la hoja de brochures y la de 360: "
                    + str(row["ubicacion_candidatas"])
                    if row["ubicacion_incierta"] and pd.notna(row["ubicacion_candidatas"])
                    else None
                ),
            }
        )

    proyectos.sort(key=lambda p: p["nombre"])
    return proyectos


def generar_distribuciones() -> dict:
    compradores = pd.read_csv(LIMPIO / "compradores_limpio.csv")

    def conteos(col):
        return compradores[col].value_counts(dropna=False).to_dict()

    return {
        "nota": (
            "Agregados de los 4.142 compradores históricos reales. Sirven como evidencia "
            "de respaldo para el factor 'similitud con compradores reales' (spec §4) — "
            "NUNCA como criterio de corte."
        ),
        "n_compradores_historico_total": len(compradores),
        "pct_no_afiliado_global": round((~compradores["afiliado"]).mean() * 100, 1),
        "por_categoria_inferida": conteos("categoria_inferida"),
        "por_segmento_inferido": conteos("segmento_inferido"),
        "por_rango_edad": conteos("rango_edad_normalizado"),
        "por_medio_captacion": conteos("MEDIO"),
        "precio_real_percentiles": {
            "p25": round(compradores["precio_real"].quantile(0.25)),
            "p50_mediana": round(compradores["precio_real"].quantile(0.50)),
            "p75": round(compradores["precio_real"].quantile(0.75)),
        },
    }


def sample_categoria_afiliado(comp: pd.DataFrame) -> str:
    afiliados = comp[comp["afiliado"]]
    dist = afiliados["categoria_inferida"].value_counts(normalize=True)
    return random.choices(dist.index.tolist(), weights=dist.values.tolist())[0]


def sample_segmento_afiliado(comp: pd.DataFrame) -> str:
    afiliados = comp[comp["afiliado"]]
    dist = afiliados["segmento_inferido"].value_counts(normalize=True)
    return random.choices(dist.index.tolist(), weights=dist.values.tolist())[0]


def sample_rango_edad(comp: pd.DataFrame) -> str:
    dist = comp["rango_edad_normalizado"].dropna().value_counts(normalize=True)
    return random.choices(dist.index.tolist(), weights=dist.values.tolist())[0]


def categoria_a_rango_ingreso(categoria_inferida: str) -> str:
    if "Categoría A" in categoria_inferida:
        return "menos de 2 SMLV"
    if "Categoría B" in categoria_inferida:
        return "2 a 4 SMLV"
    if "Categoría C" in categoria_inferida:
        return "más de 4 SMLV"
    return "no disponible (no afiliado)"


def generar_identidades(proyectos: list[dict]) -> list[dict]:
    comp = pd.read_csv(LIMPIO / "compradores_limpio.csv")
    comp["afiliado"] = comp["afiliado"].astype(bool)
    pct_no_afiliado = (~comp["afiliado"]).mean()

    # Ciudades disponibles = ubicación de los proyectos del catálogo con ubicación conocida,
    # ponderadas por su volumen histórico de compradores (proxy razonable de dónde vive
    # o le interesa vivir un afiliado).
    ciudades_pool = [
        # cupo_total = round(n_historico * 0.10) -> *10 aproxima el volumen histórico real,
        # que es el peso que queremos (ciudades con más compradores, más probables).
        (p["ciudad"], p["cupo_no_afiliados"]["total"] * 10 + 1)
        for p in proyectos
        if not p["ubicacion_incierta"]
    ]
    ciudades, pesos = zip(*ciudades_pool)

    identidades = []

    # --- Los 3 personajes fijos del demo (spec §4) ---
    identidades.append(
        {
            "cedula": CEDULA_AFILIADO_LISTO,
            "nombre_demo": "María González",
            "personaje_demo": "afiliado_listo",
            "afiliado": True,
            "ciudad": "Chía",
            "segmento": "Adultos maduros / familias consolidadas [inferido]",
            "categoria": "Categoría B (ingresos medios, 2-4 SMLV) [inferido]",
            "rango_edad": "36 - 45 años",
            "rango_ingreso": "2 a 4 SMLV",
        }
    )
    identidades.append(
        {
            "cedula": CEDULA_NO_AFILIADO_LISTO,
            "nombre_demo": "Carlos Ramírez",
            "personaje_demo": "no_afiliado_listo_restriccion_cupo",
            "afiliado": False,
            "ciudad": "Tocancipá",
            "segmento": "No afiliado / sin segmentar",
            "categoria": "No afiliado / sin categoría",
            "rango_edad": "20 - 35 años",
            "rango_ingreso": "no disponible (no afiliado)",
        }
    )
    identidades.append(
        {
            "cedula": CEDULA_NUTRICION,
            "nombre_demo": "Laura Martínez",
            "personaje_demo": "nutricion",
            "afiliado": True,
            "ciudad": "Ricaurte",
            "segmento": "Jóvenes solteros, sin personas a cargo [inferido]",
            "categoria": "Categoría A (menores ingresos, <2 SMLV) [inferido]",
            "rango_edad": "20 - 35 años",
            "rango_ingreso": "menos de 2 SMLV",
        }
    )

    # --- El resto: sintéticas, sampleadas de las distribuciones reales ---
    siguiente_cedula = 2_000_000_001
    for _ in range(N_IDENTIDADES_SINTETICAS):
        afiliado = bool(random.random() > pct_no_afiliado)
        ciudad = random.choices(ciudades, weights=pesos)[0]
        if afiliado:
            categoria = sample_categoria_afiliado(comp)
            segmento = sample_segmento_afiliado(comp)
        else:
            categoria = "No afiliado / sin categoría"
            segmento = "No afiliado / sin segmentar"
        rango_edad = sample_rango_edad(comp)

        identidades.append(
            {
                "cedula": str(siguiente_cedula),
                "nombre_demo": None,
                "personaje_demo": None,
                "afiliado": afiliado,
                "ciudad": ciudad,
                "segmento": segmento,
                "categoria": categoria,
                "rango_edad": rango_edad,
                "rango_ingreso": categoria_a_rango_ingreso(categoria),
            }
        )
        siguiente_cedula += 1

    return identidades


if __name__ == "__main__":
    proyectos = generar_proyectos()
    (SINTETICA / "proyectos.json").write_text(json.dumps(proyectos, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[generar_sintetica] proyectos.json: {len(proyectos)} proyectos")

    distribuciones = generar_distribuciones()
    (SINTETICA / "distribuciones.json").write_text(
        json.dumps(distribuciones, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print("[generar_sintetica] distribuciones.json listo")

    identidades = generar_identidades(proyectos)
    (SINTETICA / "identidades.json").write_text(
        json.dumps(identidades, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"[generar_sintetica] identidades.json: {len(identidades)} identidades (3 fijas + {len(identidades) - 3} sintéticas)")
