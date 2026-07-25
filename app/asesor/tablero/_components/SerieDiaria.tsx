import { serieDiaria } from "@/lib/tablero/serie-diaria";
import type { DatosTablero } from "@/lib/tablero/tipos";

const DIA_LEGIBLE = new Intl.DateTimeFormat("es-CO", {
  weekday: "short",
  day: "numeric",
  month: "short",
  timeZone: "America/Bogota",
});

const DIA_CORTO = new Intl.DateTimeFormat("es-CO", {
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

/** "24 jul" — la que cabe debajo de una columna de 14. */
function etiquetaCorta(dia: string): string {
  return DIA_CORTO.format(new Date(`${dia}T12:00:00Z`));
}

/**
 * Entrada de leads por día.
 *
 * Sin librería de gráficas y sin JS de cliente: una barra es una región
 * teñida con el azul de marca. Pasó de 14 renglones apilados a 14
 * COLUMNAS (2026-07-25) por una razón concreta: apilada obligaba a
 * scrollear, y este tablero tiene que caber de un vistazo. En columnas
 * la forma de la serie se lee de inmediato, que es lo que una serie
 * temporal tiene que comunicar.
 *
 * Lo que NO cambió: sigue siendo una `<table>` de verdad. Un lector de
 * pantalla la recorre como lo que es —una serie de números por fecha—,
 * y cada columna lleva su cifra encima, así que el color nunca es el
 * único portador del dato. La partición afiliado / no afiliado vive en
 * la barra misma: el tono sólido abajo son los afiliados.
 */
export function SerieDiaria({ datos, dias = 14 }: { datos: DatosTablero; dias?: number }) {
  const serie = serieDiaria(datos.leads, dias, datos.hoy);
  const techo = Math.max(1, ...serie.map((d) => d.total));
  const total = serie.reduce((s, d) => s + d.total, 0);
  const afiliados = serie.reduce((s, d) => s + d.afiliados, 0);

  return (
    // `h-full` con un piso: la gráfica necesita alto para decir algo,
    // pero si el contenedor da menos que el piso, prefiere que el panel
    // scrollee a aplastarse hasta volverse ilegible.
    <div className="vidrio flex h-full min-h-[260px] flex-col p-4">
      {/* La tabla accesible, invisible pero completa: es la que lee un
          lector de pantalla, con las tres cifras de cada día. */}
      <table className="sr-only">
        <caption>
          Leads que entraron cada día en los últimos {dias} días, partidos por
          afiliación.
        </caption>
        <thead>
          <tr>
            <th scope="col">Día</th>
            <th scope="col">Total</th>
            <th scope="col">Afiliados</th>
            <th scope="col">No afiliados</th>
          </tr>
        </thead>
        <tbody>
          {serie.map((dia) => (
            <tr key={dia.dia} data-testid="dia-serie">
              <th scope="row">{etiquetaDia(dia.dia)}</th>
              <td>{dia.total}</td>
              <td>{dia.afiliados}</td>
              <td>{dia.noAfiliados}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* La gráfica. `aria-hidden` porque la tabla de arriba ya dice
          exactamente lo mismo y en mejor orden para quien no la ve. */}
      <div aria-hidden="true" className="flex min-h-0 flex-1 items-end gap-1.5">
        {serie.map((dia) => {
          const alto = dia.total === 0 ? 0 : Math.max(3, (dia.total / techo) * 100);
          const porcionAfiliados =
            dia.total === 0 ? 0 : (dia.afiliados / dia.total) * 100;

          return (
            <div
              key={dia.dia}
              className="flex h-full min-w-0 flex-1 flex-col justify-end gap-1.5"
            >
              <span className="cifra text-texto-tenue text-center text-[12px] leading-none">
                {dia.total || ""}
              </span>

              {/* El riel completo da la altura; la barra crece dentro.
                  Sin riel, un día en cero colapsaría la columna. */}
              <div className="relative min-h-0 flex-1">
                <div
                  className="bg-brand-azul/25 absolute inset-x-0 bottom-0 overflow-hidden rounded-t-[5px]"
                  style={{ height: `${alto}%` }}
                >
                  {/* Los afiliados, en sólido, desde abajo. */}
                  <div
                    className="bg-brand-azul absolute inset-x-0 bottom-0"
                    style={{ height: `${porcionAfiliados}%` }}
                  />
                </div>
              </div>

              <span className="text-texto-tenue truncate text-center text-[12px] leading-none">
                {etiquetaCorta(dia.dia)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Leyenda y totales. La leyenda existe porque la barra tiene dos
          tonos y hay que decir cuál es cuál con palabras. */}
      <div className="border-filo-borde mt-3 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-t pt-3 text-[12px]">
        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-texto-suave flex items-center gap-1.5">
            <span className="bg-brand-azul size-2.5 rounded-[3px]" />
            Afiliados <span className="cifra text-texto">{afiliados}</span>
          </span>
          <span className="text-texto-suave flex items-center gap-1.5">
            <span className="bg-brand-azul/25 size-2.5 rounded-[3px]" />
            No afiliados{" "}
            <span className="cifra text-texto">{total - afiliados}</span>
          </span>
        </span>
        <span className="text-texto-suave">
          Total de la ventana{" "}
          <span className="cifra text-texto text-[15px] font-bold">{total}</span>
        </span>
      </div>
    </div>
  );
}
