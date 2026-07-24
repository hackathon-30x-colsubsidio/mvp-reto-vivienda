---
id: 018
serves: "spec §4 (similitud como evidencia) + criterio de aceptación 2 (cero caja negra)"
status: todo
---

# 018 — Similitud-distribución en el matcher y la explicación

**Dueño:** Rol 3 (Calidad IA & Demo, ex-Track C) · depende de **016** · nace del grilling 2026-07-24

## Objetivo
Que el demo use la data histórica real **en vivo** en el punto que más lo diferencia ("usamos SUS datos"): mostrar al lead y al asesor qué tan parecido es a los compradores reales de cada proyecto.

## Alcance
- Dentro: cuando 016 publique las distribuciones por proyecto, el prompt del experto y la explicación citan la línea de similitud ("el X% de compradores de este proyecto está en tu rango de ingreso / es afiliado / tu edad").
- Dentro: la explicación sigue citando los 6 factores y el Decreto 583 textual (criterio 2 se cuenta, no se estima).
- Fuera: score numérico de similitud (k-NN). Es evidencia de respaldo, **nunca** criterio de corte (spec §4).

## Done cuando
- [ ] La explicación de un lead listo incluye la línea de similitud con un número real de `distribuciones` por proyecto.
- [ ] El experto no inventa el porcentaje: si el dato no está, no lo dice.

## Notas
Decisión de grilling: "versión distribución (recommended)". Depende de que 016 exista.
