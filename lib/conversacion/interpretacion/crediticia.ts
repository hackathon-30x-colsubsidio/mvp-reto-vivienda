import type { ValorDe } from "../acciones";
import { sinTildes } from "./texto";

/**
 * Cómo va su vida crediticia, normalizado al enum que espera el motor.
 *
 * ⚠️ Ojo con la diferencia entre `"sin_info"` y `undefined`, que hoy terminan en
 * el mismo patch y NO son lo mismo:
 *
 *   · `"sin_info"` es una respuesta: "nunca he pedido crédito". Es un dato.
 *   · `undefined` es que no se entendió lo que escribió.
 *
 * Hasta hoy los dos caían en `situacion_crediticia: "sin_info"` (la línea 272 de
 * `preguntas.ts` antes de esta rama), así que el motor no podía distinguir a
 * quien no tiene historial de quien contestó algo ilegible. El comportamiento se
 * conserva por ahora — quién lo cambia es la rama 5.
 */
export function interpretarCrediticia(
  texto: string,
): ValorDe<"situacion_crediticia"> | undefined {
  // ⚠️ `sinTildes`, no `toLowerCase`, y no es cosmético: con `toLowerCase` el
  // regex `/sali|.../` no atrapaba "salí", así que **"ya salí de un reporte"
  // caía a `mala`** (por el "report" de "reporte") mientras que "ya sali de un
  // reporte" daba `regular`. Quien escribe bien su español quedaba calificado
  // peor. La zona ya normalizaba así; ahora los dos intérpretes son consistentes.
  const t = sinTildes(texto);
  if (/al d[íi]a|bien|excelente|buena|sin deudas|limpio|impecable/.test(t)) return "buena";
  if (/nunca|no he tenido|no tengo historial|sin historial|primera vez|no he pedido/.test(t)) {
    return "sin_info";
  }
  if (/sali|salir|me report|estuve|arregl|pagu[ée]|ya me quit|reciente/.test(t)) return "regular";
  if (/mora|report|datacr|deb[oa]|atras|deuda|embarg|mal/.test(t)) return "mala";
  return undefined;
}
