import { serieDiaria } from "@/lib/tablero/serie-diaria";
import type { DatosTablero } from "@/lib/tablero/tipos";
import { Tarjeta } from "@/components/ui/Tarjeta";

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
    <Tarjeta className="overflow-x-auto p-4">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Leads que entraron cada día en los últimos {dias} días, partidos por afiliación.
        </caption>
        <thead>
          <tr className="border-borde border-b">
            <th scope="col" className="rotulo pb-2">
              Día
            </th>
            <th scope="col" className="rotulo px-3 pb-2">
              Leads que entraron
            </th>
            <th scope="col" className="rotulo pb-2 text-right">
              Total
            </th>
            <th scope="col" className="rotulo pl-3 pb-2 text-right">
              Afil. / No afil.
            </th>
          </tr>
        </thead>
        <tbody>
          {serie.map((dia) => (
            <tr key={dia.dia} data-testid="dia-serie" className="border-borde border-b">
              <th
                scope="row"
                className="cifra text-texto-suave py-1.5 text-[13px] font-normal whitespace-nowrap"
              >
                {etiquetaDia(dia.dia)}
              </th>

              <td className="w-full px-3 py-1.5">
                {/* La barra: región teñida, altura de renglón. El ancho
                    mínimo deja ver el día en cero sin fingir volumen. */}
                <span
                  aria-hidden="true"
                  className="bg-brand-azul block h-3 rounded-sm"
                  style={{ width: `${dia.total === 0 ? 0 : Math.max(4, (dia.total / techo) * 100)}%` }}
                />
              </td>

              <td className="cifra text-texto py-1.5 text-right text-[15px] font-bold">
                {dia.total}
              </td>

              <td className="cifra text-texto-tenue py-1.5 pl-3 text-right text-[13px] whitespace-nowrap">
                {dia.afiliados} / {dia.noAfiliados}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-regla border-t-2">
            <th scope="row" className="text-texto pt-2.5 text-[15px] font-bold">
              Total de la ventana
            </th>
            <td />
            <td className="cifra text-texto pt-2.5 text-right text-[16px] font-bold">
              {total}
            </td>
            <td />
          </tr>
        </tfoot>
      </table>
    </Tarjeta>
  );
}
