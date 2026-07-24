#!/usr/bin/env python3
"""Verifica que cada diagrama esté igual en su spec y en su versión narrada.

Cada mermaid vive en dos archivos a propósito: `docs/specs/NN-*.md` (el
contrato) y `docs/specs/diagramas/NN-*.md` (la narración, que se entiende
leyéndola sola). Duplicar es lo que hace que la narración sirva suelta, y
también lo que hace que se desincronicen si alguien edita solo una.

    python3 scripts/check_diagramas.py

Sale con código 1 si alguno difiere. No toca nada.
"""

import re
import sys
from pathlib import Path

SPECS = Path(__file__).resolve().parent.parent / "docs" / "specs"


def bloques(archivo: Path) -> list[str]:
    texto = archivo.read_text(encoding="utf-8")
    return [b.strip() for b in re.findall(r"```mermaid\n(.*?)```", texto, re.S)]


def main() -> int:
    problemas = 0

    for spec in sorted(SPECS.glob("[0-9]*.md")):
        narrado = SPECS / "diagramas" / spec.name
        if not narrado.exists():
            print(f"FALTA    {spec.name} no tiene versión narrada")
            problemas += 1
            continue

        en_spec, en_narrado = bloques(spec), bloques(narrado)
        if en_spec and en_spec == en_narrado:
            print(f"ok       {spec.name}")
        else:
            print(f"DIFIERE  {spec.name} — el mermaid del spec y el del narrado no coinciden")
            problemas += 1

    if problemas:
        print(f"\n{problemas} diagrama(s) desalineado(s). Copia el bloque bueno al otro archivo.")
    return 1 if problemas else 0


if __name__ == "__main__":
    sys.exit(main())
