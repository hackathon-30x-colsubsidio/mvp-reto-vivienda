import { serieDiaria } from "@/lib/tablero/serie-diaria";
import type { DatosTablero } from "@/lib/tablero/tipos";

const DIA_LEGIBLE = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "America/Bogota",
});

/** "2026-07-24" → "vie, 24 jul". La fecha llega en día calendario de Bogotá. */
function etiquetaDia(dia: string): string {
  // Mediodía UTC: cae en el mismo día calendario en Bogotá sin importar
  // el horario, así que la etiqueta no se corre un día.
  return DIA_LEGIBLE.format(new Date(`${dia}T12:00:00Z`));
}

/**
 * Entrada de leads por día, como renglones de un formato.
 *
 * Sin librería de gráficas y sin JS de cliente: una barra es una región
 * teñida de campo azul, que es literalmente la Regla del Campo de
 * DESIGN.md (el azul tiñe regiones, no decora bordes). Cada renglón
 * lleva su cifra en monoespaciada tabular, así que la gráfica se puede
 * *leer* además de mirar — el color no es el único portador del dato.
 *
 * Es una `<table>` de verdad: un lector de pantalla la recorre como lo
 * que es, una serie de números por fecha.
 */
export function SerieDiaria({ datos, dias = 14 }: { datos: DatosTablero; dias?: number }) {
  const serie = serieDiaria(datos.leads, dias, datos.hoy);
  const techo = Math.max(1, ...serie.map((d) => d.total));
  const total = serie.reduce((s, d) => s + d.total, 0);

  return (
    <div className="overflow-x-auto rounded-md border-2 border-borde bg-papel">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Leads que entraron cada día en los últimos {dias} días, partidos por afiliación.
        </caption>
        <thead>
          <tr className="border-b-2 border-borde bg-papel-hueco">
            <th
              scope="col"
              className="px-4 py-3 text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
            >
              Día
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
            >
              Leads que entraron
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
            >
              Total
            </th>
            <th
              scope="col"
              className="px-4 py-3 text-right text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase"
            >
              Afil. / No afil.
            </th>
          </tr>
        </thead>
        <tbody>
          {serie.map((dia) => (
            <tr key={dia.dia} data-testid="dia-serie" className="border-t border-borde">
              <th
                scope="row"
                className="cifra px-4 py-2 text-sm font-normal whitespace-nowrap text-tinta-suave"
              >
                {etiquetaDia(dia.dia)}
              </th>

              <td className="w-full px-4 py-2">
                {/* La barra: región teñida, altura de renglón. El ancho
                    mínimo deja ver el día en cero sin fingir volumen. */}
                <span
                  aria-hidden="true"
                  className="block h-4 rounded-sm bg-campo"
                  style={{ width: `${dia.total === 0 ? 0 : Math.max(4, (dia.total / techo) * 100)}%` }}
                />
              </td>

              <td className="cifra px-4 py-2 text-right text-base font-bold text-tinta">
                {dia.total}
              </td>

              <td className="cifra px-4 py-2 text-right text-sm whitespace-nowrap text-tinta-suave">
                {dia.afiliados} / {dia.noAfiliados}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-borde bg-papel-hueco">
            <th scope="row" className="px-4 py-3 text-base font-bold text-tinta">
              Total de la ventana
            </th>
            <td />
            <td className="cifra px-4 py-3 text-right text-base font-bold text-tinta">
              {total}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
