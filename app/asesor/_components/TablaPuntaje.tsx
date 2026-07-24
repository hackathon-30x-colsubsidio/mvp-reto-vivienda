import type { Puntaje } from "@/lib/scoring/puntaje";
import { ETIQUETA_FACTOR } from "./TablaFactores";

// =====================================================================
// EL DESGLOSE DEL PUNTAJE — la mitad que hace legal al número.
//
// DESIGN.md rechaza "el score reducido a un número grande con una barra
// de progreso". Este componente es la razón por la que el puntaje del
// tablero no es eso: cada punto que suma aparece con su factor y con lo
// que el motor midió, y el renglón de total cierra la cuenta.
//
// ⚠️  Igual que TablaFactores: .map() sobre TODOS los aportes. Nunca
//     filtrar los que sumaron 0 — un factor que no aportó es justo el
//     que explica por qué el puntaje no es más alto.
// =====================================================================

function legible(nombre: string): string {
  return ETIQUETA_FACTOR[nombre] ?? nombre.replaceAll("_", " ");
}

export function TablaPuntaje({ puntaje }: { puntaje: Puntaje }) {
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
              Resultado
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
          {puntaje.aportes.map((aporte) => (
            <tr
              key={aporte.nombre}
              data-testid="aporte-puntaje"
              className="border-t border-borde align-top"
            >
              <th
                scope="row"
                className="px-4 py-4 text-base font-bold text-tinta"
              >
                {legible(aporte.nombre)}
              </th>
              {/* Solo el resultado, no lo que midió el motor: eso ya está
                  completo en la tabla de factores, justo encima. Un
                  formato no imprime el mismo campo dos veces. */}
              <td className="px-4 py-4 text-base text-tinta-suave">
                {aporte.maximo === 0
                  ? "No puntúa: es evidencia de respaldo, nunca criterio de corte"
                  : aporte.obtenido === aporte.maximo
                    ? "Cumple"
                    : "No cumple"}
              </td>
              <td className="cifra px-4 py-4 text-right whitespace-nowrap">
                <span
                  className={
                    aporte.obtenido === aporte.maximo && aporte.maximo > 0
                      ? "font-bold text-azul"
                      : aporte.maximo === 0
                        ? "text-tinta-suave"
                        : "font-bold text-rojo"
                  }
                >
                  +{aporte.obtenido}
                </span>{" "}
                <span className="text-tinta-suave">de {aporte.maximo}</span>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-borde bg-papel-hueco">
            <th scope="row" className="px-4 py-3 text-base font-bold text-tinta">
              Total
            </th>
            {/* La regla de tres, escrita. Si no, la cabecera dice 100/100
                y este renglón dice 90 de 90, y parecen dos números que
                no cuadran. */}
            <td className="px-4 py-3 text-base text-tinta-suave">
              <span className="cifra">{puntaje.obtenido}</span> de{" "}
              <span className="cifra">{puntaje.posible}</span> puntos posibles,
              llevado a base 100
            </td>
            <td className="cifra px-4 py-3 text-right text-base font-bold whitespace-nowrap text-tinta">
              {puntaje.total}/100
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
