"""Limpieza del Excel real del reto Vivienda.

Lee los insumos de Colsubsidio desde el repo hermano `plan-research`
(../plan-research/docs/recursos-reto/) y escribe CSVs limpios en
data/limpio/ (real, derivado, pero NUNCA se versiona: *.csv está en
.gitignore por regla global del repo).

Trampas resueltas aquí (ver AGENTS.md → "Datos del reto"):
- VLR_VIVIENDA trae 4 ceros de más -> ÷10.000 para el precio real.
- No hay columna "afiliado": se infiere de PERIODO_AFILIADO vacío/lleno.
- RANGO_EDAD y ETAPA traen dos formatos para el mismo valor -> se normalizan.
- SEGMENTO_POBLACIONAL / CATEGORIA / PIRAMIDE_NUEVA vienen con letras griegas:
  v1 las trata como clusters anónimos, pero adjunta el mapeo inferido
  (docs/agents/context.md de plan-research) como columna aparte, marcado
  explícitamente como INFERENCIA, no como hecho oficial.
- Catálogo de 18 proyectos = unión de las 2 hojas de "Links brochures .xlsx".
  VIBO ONCE y KARAKALI traen ubicación contradictoria entre hojas
  (RICAURTE vs BOGOTÁ) -> se deja marcado como incierto, no se inventa.
"""

import re
import unicodedata
from pathlib import Path

import pandas as pd

RAIZ = Path(__file__).resolve().parent.parent
RECURSOS = RAIZ.parent / "plan-research" / "docs" / "recursos-reto"
SALIDA = RAIZ / "data" / "limpio"
SALIDA.mkdir(parents=True, exist_ok=True)

# Mapeo inferido de letras griegas -> etiqueta legible.
# Fuente: plan-research/docs/agents/context.md ("Descifrado" de letras griegas).
# ADVERTENCIA: es una INFERENCIA por patrones de datos, no una tabla oficial
# de Colsubsidio. Se guarda aparte del cluster anónimo original.
MAPA_CATEGORIA = {
    "OMEGA": "Categoría A (menores ingresos, <2 SMLV) [inferido]",
    "ETA": "Categoría B (ingresos medios, 2-4 SMLV) [inferido]",
    "TAU": "Categoría C (mayores ingresos, >4 SMLV) [inferido]",
    "CHI": "No afiliado / sin categoría",
}
MAPA_SEGMENTO = {
    "NU": "Jóvenes solteros, sin personas a cargo [inferido]",
    "KAPPA": "Familias con personas a cargo [inferido]",
    "SIGMA": "Adultos maduros / familias consolidadas [inferido]",
    "PI": "No afiliado / sin segmentar",
    "IOTA": "Registro atípico [inferido]",
}


def normaliza_texto(s: str) -> str:
    """Mayúsculas, sin tildes, espacios colapsados. Para hacer match de nombres."""
    if pd.isna(s):
        return ""
    s = unicodedata.normalize("NFKD", str(s)).encode("ascii", "ignore").decode("ascii")
    s = re.sub(r"\s+", " ", s).strip().upper()
    return s


# Alias: nombre normalizado en compradores -> nombre normalizado en catálogo (brochures).
# Necesario porque el Excel de compradores no usa el mismo nombre oficial de proyecto.
ALIAS_PROYECTO = {
    "AGRUPACION DE VIVIENDA BOSQUE DE ARRAYAN": "BOSQUE DE ARRAYAN",
    "AGRUPACION DE VIVIENDA RESERVA DE GUAYACAN": "RESERVA DE AGUAYACA",  # sic, ver nota abajo
    "AGRUPACION DE VIVIENDA LA MACARENA": "LA MACARENA",
    "AGRUPACION DE VIVIENDA MONGUI": "MONGUI",
    "AGRUPACION DE VIVIENDA PAMPLONA I": "PAMPLONA",
    "AGRUPACION DE VIVIENDA PAYANDE": "PAYANDE",
    "AGRUPACION DE VIVIENDA SAMAN": "SAMAN",
    "CONJUNTO RESIDENCIAL VIBO ONCE": "VIBO ONCE",
    "PROYECTO KARAKALI": "KARAKALI",
    "AGRUPACION DE VIVIENDA BOSQUE DE TURPIAL": "BOSQUE DE TURPIAL",
    "VERDE ESPERANZA EL DORADO": "VERDE ESPERANZA",
}


def normaliza_proyecto(nombre_crudo: str) -> str:
    n = normaliza_texto(nombre_crudo)
    n = ALIAS_PROYECTO.get(n, n)
    return n


def limpiar_compradores() -> pd.DataFrame:
    df = pd.read_excel(RECURSOS / "hackathon_VIVIENDAv2.xlsx")

    # VLR_VIVIENDA trae 4 ceros de más.
    df["precio_real"] = df["VLR_VIVIENDA"] / 10_000

    # Afiliado se infiere de PERIODO_AFILIADO vacío/lleno.
    df["afiliado"] = df["PERIODO_AFILIADO"].notna()

    # RANGO_EDAD: colapsar "20 a 35 años" y "20 - 35 años" al mismo valor.
    df["rango_edad_normalizado"] = (
        df["RANGO_EDAD"]
        .str.replace(r"\s+a\s+", " - ", regex=True)
        .str.strip()
        if df["RANGO_EDAD"].dtype == object
        else df["RANGO_EDAD"]
    )

    # ETAPA: colapsar "ETAPA 1" y "1" al mismo valor; UNICA queda aparte.
    def normaliza_etapa(v):
        if pd.isna(v):
            return None
        v = str(v).strip().upper()
        if v == "UNICA":
            return "UNICA"
        m = re.search(r"(\d+)", v)
        return f"ETAPA {m.group(1)}" if m else v

    df["etapa_normalizada"] = df["ETAPA"].apply(normaliza_etapa)

    # Letras griegas: cluster anónimo original + mapeo inferido aparte (nunca como hecho).
    df["categoria_cluster"] = df["CATEGORIA"]
    df["categoria_inferida"] = df["CATEGORIA"].map(MAPA_CATEGORIA).fillna("Sin mapeo [cluster minoritario]")
    df["segmento_cluster"] = df["SEGMENTO_POBLACIONAL"]
    df["segmento_inferido"] = df["SEGMENTO_POBLACIONAL"].map(MAPA_SEGMENTO).fillna("Sin mapeo [cluster minoritario]")

    # Nombre de proyecto normalizado para poder cruzar contra el catálogo de 18.
    df["proyecto_normalizado"] = df["NOMBRE_PROYECTO"].apply(normaliza_proyecto)

    columnas = [
        "proyecto_normalizado",
        "NOMBRE_PROYECTO",
        "etapa_normalizada",
        "FEC_OPCION",
        "FECHA_DESISTIMIENTO",
        "MEDIO",
        "precio_real",
        "PERIODO",
        "afiliado",
        "rango_edad_normalizado",
        "categoria_cluster",
        "categoria_inferida",
        "segmento_cluster",
        "segmento_inferido",
        "PIRAMIDE_NUEVA",
        "NO_GRUPO_FAMILAR",
        "NO_BENEFICIARIOS_CUOTA_MONETARIA",
    ]
    limpio = df[columnas].rename(columns={"NOMBRE_PROYECTO": "proyecto_crudo"})
    limpio.to_csv(SALIDA / "compradores_limpio.csv", index=False)

    # Validaciones contra la munición de impacto ya documentada.
    pct_no_afiliado = (~df["afiliado"]).mean() * 100
    mediana_precio = df["precio_real"].median()
    print(f"[clean_excel] {len(df)} compradores. % no afiliado: {pct_no_afiliado:.1f}% (esperado ~27.1%)")
    print(f"[clean_excel] mediana precio_real: ${mediana_precio:,.0f} (esperado ~$195M)")
    return limpio


def resolver_ubicaciones(hoja: pd.DataFrame) -> pd.DataFrame:
    """Forward-fill de UBICACIÓN dentro de una hoja (celdas fusionadas en el Excel original)."""
    hoja = hoja.copy()
    hoja["UBICACIÓN"] = hoja["UBICACIÓN"].ffill()
    hoja["proyecto_normalizado"] = hoja["PROYECTO"].apply(normaliza_proyecto)
    return hoja


def limpiar_catalogo() -> pd.DataFrame:
    xl = pd.ExcelFile(RECURSOS / "Links brochures .xlsx")
    brochure = resolver_ubicaciones(xl.parse("Links brochure"))
    recorrido = resolver_ubicaciones(xl.parse("360"))

    # Excluir placeholders que no son proyectos reales.
    brochure = brochure[~brochure["PROYECTO"].isin(["MULTIPROYECTO", "REVISTA"])]
    recorrido = recorrido[~recorrido["PROYECTO"].isin(["MULTIPROYECTO"])]

    brochure_map = brochure.set_index("proyecto_normalizado")[["PROYECTO", "UBICACIÓN", "LINKS BROCHURES"]]
    recorrido_map = recorrido.set_index("proyecto_normalizado")[["PROYECTO", "UBICACIÓN", "LINK 360"]]

    todos = sorted(set(brochure_map.index) | set(recorrido_map.index))
    filas = []
    for p in todos:
        nombre = None
        ubic_brochure = brochure_map["UBICACIÓN"].get(p)
        ubic_360 = recorrido_map["UBICACIÓN"].get(p)
        nombre = brochure_map["PROYECTO"].get(p) or recorrido_map["PROYECTO"].get(p)

        if pd.notna(ubic_brochure) and pd.notna(ubic_360):
            if str(ubic_brochure).strip() == str(ubic_360).strip():
                ubicacion, incierta = ubic_brochure, False
            else:
                ubicacion, incierta = None, True  # contradicción real (p.ej. VIBO ONCE / KARAKALI)
        else:
            ubicacion = ubic_brochure if pd.notna(ubic_brochure) else ubic_360
            incierta = pd.isna(ubicacion)

        filas.append(
            {
                "proyecto_normalizado": p,
                "nombre": nombre,
                "ubicacion": ubicacion,
                "ubicacion_incierta": incierta,
                "ubicacion_candidatas": (
                    f"brochure={ubic_brochure} | 360={ubic_360}" if incierta and pd.notna(ubic_brochure) and pd.notna(ubic_360) else None
                ),
                "link_brochure": brochure_map["LINKS BROCHURES"].get(p),
                "link_360": recorrido_map["LINK 360"].get(p),
                "tiene_brochure": p in brochure_map.index,
                "tiene_360": p in recorrido_map.index,
            }
        )

    catalogo = pd.DataFrame(filas)
    catalogo.to_csv(SALIDA / "catalogo_proyectos.csv", index=False)
    print(f"[clean_excel] catálogo: {len(catalogo)} proyectos (esperado 18)")
    inciertos = catalogo[catalogo["ubicacion_incierta"] & catalogo["ubicacion_candidatas"].notna()]
    if len(inciertos):
        print(f"[clean_excel] ubicación contradictoria entre hojas en: {list(inciertos['nombre'])}")
    return catalogo


if __name__ == "__main__":
    limpiar_compradores()
    limpiar_catalogo()
    print(f"[clean_excel] listo. CSVs en {SALIDA} (gitignored, no se versionan)")
