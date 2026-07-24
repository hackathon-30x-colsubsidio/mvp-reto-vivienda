import type { FactorScore } from "@/lib/types";
import { ETIQUETA_FACTOR } from "./TablaFactores";

// =====================================================================
// EL DESGLOSE DEL PUNTAJE — la mitad que hace legal al número.
//
// DESIGN.md rechaza "el score reducido a un número grande con una barra
// de progreso". Este componente es la razón por la que el puntaje del
// tablero no es eso: cada punto que suma aparece con su factor, su
// peso y la señal que midió el motor, y el renglón de total cierra la
// cuenta.
//
// Lee directo `FactorScore.peso/valor_norm/aporte` — los mismos campos
// que emite `calcularScore()` (lib/scoring/index.ts). Antes existía un
// `lib/scoring/puntaje.ts` que RECALCULABA su propio puntaje (pesos
// distintos, binario sobre `cumple`) a partir del mismo `Score`; el
// asesor veía un número que el motor nunca produjo. Se borró: una sola
// aritmética, la que ya trae cada factor.
//
// ⚠️  Igual que TablaFactores: .map() sobre TODOS los factores. Nunca
//     filtrar los que aportaron 0 — un factor que no aportó es justo el
//     que explica por qué el puntaje no es más alto.
// =====================================================================

function legible(nombre: string): string {
  return ETIQUETA_FACTOR[nombre] ?? nombre.replaceAll("_", " ");
}

export function TablaPuntaje({
  factores,
  puntaje,
}: {
  factores: FactorScore[];
  puntaje: number;
}) {
  return (
    <div className="-mx-1 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-borde border-b">
            <th scope="col" className="rotulo px-1 pb-2">
              Factor
            </th>
            <th scope="col" className="rotulo px-1 pb-2">
              Peso
            </th>
            <th scope="col" className="rotulo px-1 pb-2 text-right">
              Aporta
            </th>
          </tr>
        </thead>
        <tbody>
          {factores.map((factor) => {
            const sinPeso = factor.peso === undefined;
            const maximo = sinPeso ? 0 : factor.peso! * 100;
            const aporte = factor.aporte ?? 0;

            return (
              <tr
                key={factor.nombre}
                data-testid="aporte-puntaje"
                className="border-borde border-b align-top"
              >
                <th
                  scope="row"
                  className="text-texto px-1 py-2.5 text-[15px] font-semibold"
                >
                  {legible(factor.nombre)}
                </th>
                {/* Peso y señal, no lo que midió el motor: eso ya está
                    completo en la tabla de factores, justo encima. */}
                <td className="cifra text-texto-suave px-1 py-2.5 text-[13px]">
                  {sinPeso
                    ? "No puntúa: es evidencia de respaldo, nunca criterio de corte"
                    : `${(factor.peso! * 100).toFixed(0)}% × ${((factor.valor_norm ?? 0) * 100).toFixed(0)}%`}
                </td>
                <td className="cifra px-1 py-2.5 text-right text-[13px] whitespace-nowrap">
                  <span
                    className={
                      sinPeso
                        ? "text-texto-tenue"
                        : aporte >= maximo * 0.75
                          ? "text-estado-listo font-bold"
                          : aporte > 0
                            ? "text-texto font-bold"
                            : "text-rojo font-bold"
                    }
                  >
                    +{aporte.toFixed(1)}
                  </span>{" "}
                  <span className="text-texto-tenue">de {maximo.toFixed(0)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-regla border-t-2">
            <th scope="row" className="text-texto px-1 pt-2.5 text-[15px] font-bold">
              Total
            </th>
            <td className="text-texto-suave px-1 pt-2.5 text-[13px]">
              Suma de los aportes, redondeada
            </td>
            <td className="cifra text-texto px-1 pt-2.5 text-right text-[16px] font-bold whitespace-nowrap">
              {puntaje}/100
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
