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
    <div className="overflow-x-auto rounded-md border-2 border-borde bg-papel">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b-2 border-borde bg-papel-hueco">
            <th
              scope="col"
              className="px-4 py-3 text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
            >
              Factor
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
            >
              Peso
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
            >
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
                className="border-t border-borde align-top"
              >
                <th scope="row" className="px-4 py-4 text-base font-bold text-tinta">
                  {legible(factor.nombre)}
                </th>
                {/* Peso y señal, no lo que midió el motor: eso ya está
                    completo en la tabla de factores, justo encima. */}
                <td className="cifra px-4 py-4 text-base text-tinta-suave">
                  {sinPeso
                    ? "No puntúa: es evidencia de respaldo, nunca criterio de corte"
                    : `${(factor.peso! * 100).toFixed(0)}% × ${((factor.valor_norm ?? 0) * 100).toFixed(0)}%`}
                </td>
                <td className="cifra px-4 py-4 text-right whitespace-nowrap">
                  <span
                    className={
                      sinPeso
                        ? "text-tinta-suave"
                        : aporte >= maximo * 0.75
                          ? "font-bold text-azul"
                          : aporte > 0
                            ? "font-bold text-tinta"
                            : "font-bold text-rojo"
                    }
                  >
                    +{aporte.toFixed(1)}
                  </span>{" "}
                  <span className="text-tinta-suave">de {maximo.toFixed(0)}</span>
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-borde bg-papel-hueco">
            <th scope="row" className="px-4 py-3 text-base font-bold text-tinta">
              Total
            </th>
            <td className="px-4 py-3 text-base text-tinta-suave">
              Suma de los aportes, redondeada
            </td>
            <td className="cifra px-4 py-3 text-right text-base font-bold whitespace-nowrap text-tinta">
              {puntaje}/100
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
