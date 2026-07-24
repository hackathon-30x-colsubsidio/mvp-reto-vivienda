---
id: 017
serves: "spec §4 — factor 'subsidio aplicable' (baja la cuota bajo el 40%) + spec §7 (cierra el supuesto de reglas de subsidio)"
status: todo
---

# 017 — Tabla de subsidios fundamentada

**Dueño:** Rol 2 (Datos & Motor) · nace del grilling de scope 2026-07-24

## Objetivo
Que el factor "subsidio aplicable" **calcule**, no solo exista: es la palanca que puede meter la primera cuota bajo el tope del 40% (Decreto 583 de 2025) y cambiar un veredicto.

## Alcance
- Dentro: tabla de 2-3 subsidios reales de Colsubsidio (p. ej. subsidio de vivienda por rango de ingreso + concurrencia con Mi Casa Ya donde aplique), con **montos y fuente citada**. Cero datos inventados.
- Dentro: el motor de `lib/scoring/` resta el subsidio estimado de la cuota **antes** del corte del 40%, y el factor queda visible en la ficha con su monto y fuente.
- Fuera: motor de elegibilidad completo (ahorro previo, no-propietario verificado, etc.). Es señal fundamentada, no trámite.

## Done cuando
- [ ] La tabla vive en un archivo derivado con su fuente, no hardcodeada sin origen.
- [ ] Un lead que sin subsidio superaba el 40% y con subsidio no, cambia de salida, y la explicación lo dice citando el subsidio.
- [ ] `npm test` cubre el caso con y sin subsidio.

## Notas
Decisión de grilling 2026-07-24: "tabla simple con fuente, no pueden ser datos inventados sino fundamentados de Colsubsidio". Cierra el supuesto de subsidios del [spec §7](../spec.md).
