import type { Agrupador, DatosTablero } from "@/lib/tablero/tipos";
import { FilaLeadPuntaje } from "./FilaLeadPuntaje";

/**
 * Rinde el eje de agrupación que le pasen.
 *
 * No sabe qué es "afiliado": recibe un `Agrupador` del registry. Cambiar
 * el tablero a agrupar por canal o por salida es cambiar la prop, no
 * este archivo.
 *
 * Los grupos van LADO A LADO y cada uno se desplaza por dentro
 * (2026-07-25). Antes iban apilados y con un tope de 12 leads: la página
 * entera scrolleaba y aun así el conteo real solo se veía en el título.
 * Ahora no hay tope —se listan todos— y lo que se mueve es el panel, no
 * la pantalla. Es la forma de cumplir "nada se oculta" en un tablero que
 * tiene que caber de un vistazo.
 */
export function GruposDeLeads({
  agrupador,
  datos,
}: {
  agrupador: Agrupador;
  datos: DatosTablero;
}) {
  const grupos = agrupador.grupos(datos);

  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-cols-2">
      {grupos.map((grupo) => (
        <section
          key={grupo.clave}
          data-testid="grupo"
          className="vidrio flex min-h-0 flex-col overflow-hidden"
        >
          <div className="border-filo-borde shrink-0 border-b px-4 py-3">
            <h3 className="text-texto flex items-baseline gap-2 text-[15px] font-bold">
              {grupo.titulo}
              <span className="cifra text-texto-tenue text-[13px] font-normal">
                {grupo.leads.length}
              </span>
            </h3>
            <p className="text-texto-suave mt-0.5 line-clamp-2 text-[12px] leading-snug">
              {grupo.subtitulo}
            </p>
          </div>

          {grupo.leads.length === 0 ? (
            <p className="text-texto-tenue px-4 py-8 text-center text-[13px]">
              Nadie en este grupo por ahora.
            </p>
          ) : (
            // El scroll vive AQUÍ, no en la página: el tablero se queda
            // quieto y cada columna se recorre sola.
            <div className="divide-filo-borde min-h-0 flex-1 divide-y overflow-y-auto">
              {grupo.leads.map((item) => (
                <FilaLeadPuntaje key={item.curado.lead.evento.lead_id} item={item} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
