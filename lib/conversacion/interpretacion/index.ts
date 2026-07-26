import type { CampoPregunta, ValorDe } from "../acciones";
import { interpretarComposicion } from "./composicion";
import { interpretarCrediticia } from "./crediticia";
import { interpretarEdad } from "./edad";
import { parsearIngresoMensual } from "./ingreso";
import { interpretarSubsidios } from "./subsidios";
import { interpretarVivienda } from "./vivienda";

// Los intérpretes: funciones puras, síncronas, un archivo por campo. Cada una
// entiende cómo escribe la gente de verdad y devuelve un valor del menú cerrado
// de `acciones.ts` — o `undefined`, que es la señal que hoy se perdía en
// silencio (hueco 2 del plan de arquitectura).
//
// ⚠️ SÍNCRONAS Y PURAS, no por elegancia: `lib/fixtures/guion-demo.ts:89` las
// llama de forma síncrona y de ahí salen `db/seed.sql` y las fixtures. Volver
// una `async` revienta el seed. La capa de IA (rama 4) vive AFUERA y la cablea
// la rama 5.

/** Los campos que pueden quedarse sin entender. */
export type CampoInterpretable = Exclude<CampoPregunta, "zona_interes">;

/**
 * El intérprete de cada campo, para quien necesite probarlos todos (la búsqueda
 * de correcciones) o pedir uno por su nombre (la rama 4).
 *
 * La zona no está: su intérprete devuelve **por qué** reconoció lo que reconoció
 * (`clasificarZona`) porque de eso depende qué se le contesta, y nunca falla —
 * la última rama guarda el texto crudo.
 */
export const INTERPRETES = {
  tiene_vivienda: interpretarVivienda,
  composicion_familiar: interpretarComposicion,
  rango_edad: interpretarEdad,
  situacion_crediticia: interpretarCrediticia,
  subsidios: interpretarSubsidios,
  rango_ingreso_hogar: parsearIngresoMensual,
} as const satisfies { [C in CampoInterpretable]: (texto: string) => ValorDe<C> | undefined };
