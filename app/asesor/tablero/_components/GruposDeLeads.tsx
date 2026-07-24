import type { Agrupador, DatosTablero } from "@/lib/tablero/tipos";
import { FilaLeadPuntaje } from "./FilaLeadPuntaje";

/** Cuántos leads se listan por grupo antes de mandar a la cola completa. */
const TOPE_VISIBLE = 12;

/**
 * Rinde el eje de agrupación que le pasen.
 *
 * No sabe qué es "afiliado": recibe un `Agrupador` del registry. Cambiar
 * el tablero a agrupar por canal o por salida es cambiar la prop, no
 * este archivo.
 *
 * Único sitio del tablero donde SÍ se corta la lista, y solo por
 * volumen: el conteo real va en el título y el enlace lleva a la cola
 * completa. Nunca se corta la tabla de factores de un lead — eso sería
 * esconder cómo se decidió (DESIGN.md).
 */
export function GruposDeLeads({
  agrupador,
  datos,
}: {
  agrupador: Agrupador;
  datos: DatosTablero;
}) {
  return (
    <div className="space-y-10">
      {agrupador.grupos(datos).map((grupo) => (
        <section key={grupo.clave} data-testid="grupo">
          <h3 className="text-xl font-bold tracking-tight text-tinta">
            {grupo.titulo}{" "}
            <span className="cifra font-normal text-tinta-suave">
              ({grupo.leads.length})
            </span>
          </h3>
          <p className="mt-1 mb-4 max-w-[68ch] text-base text-tinta-suave">
            {grupo.subtitulo}
          </p>

          {grupo.leads.length === 0 ? (
            <p className="rounded-md border-2 border-dashed border-borde px-4 py-8 text-center text-base text-tinta-suave">
              Nadie en este grupo por ahora.
            </p>
          ) : (
            <>
              <div className="divide-y divide-borde overflow-hidden rounded-md border-2 border-borde">
                {grupo.leads.slice(0, TOPE_VISIBLE).map((item) => (
                  <FilaLeadPuntaje key={item.curado.lead.evento.lead_id} item={item} />
                ))}
              </div>

              {grupo.leads.length > TOPE_VISIBLE && (
                <p className="mt-3 text-base text-tinta-suave">
                  Se listan los{" "}
                  <span className="cifra">{TOPE_VISIBLE}</span> de mayor puntaje.
                  Los otros <span className="cifra">{grupo.leads.length - TOPE_VISIBLE}</span>{" "}
                  están en la cola completa.
                </p>
              )}
            </>
          )}
        </section>
      ))}
    </div>
  );
}
