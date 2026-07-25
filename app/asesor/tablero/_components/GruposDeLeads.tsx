import type { Agrupador, DatosTablero } from "@/lib/tablero/tipos";
import { Tarjeta } from "@/components/ui/Tarjeta";
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
    <div className="space-y-4">
      {agrupador.grupos(datos).map((grupo) => (
        <section key={grupo.clave} data-testid="grupo">
          <Tarjeta>
            <div className="border-borde border-b px-4 py-3">
              <h3 className="font-display text-texto text-[16px] font-bold">
                {grupo.titulo}{" "}
                <span className="cifra text-texto-tenue font-normal">
                  ({grupo.leads.length})
                </span>
              </h3>
              <p className="text-texto-suave mt-1 text-[13px] leading-normal">
                {grupo.subtitulo}
              </p>
            </div>

            {grupo.leads.length === 0 ? (
              <p className="text-texto-tenue px-4 py-8 text-center text-[13px]">
                Nadie en este grupo por ahora.
              </p>
            ) : (
              <>
                <div className="divide-borde divide-y">
                  {grupo.leads.slice(0, TOPE_VISIBLE).map((item) => (
                    <FilaLeadPuntaje key={item.curado.lead.evento.lead_id} item={item} />
                  ))}
                </div>

                {grupo.leads.length > TOPE_VISIBLE && (
                  <p className="border-borde text-texto-tenue border-t px-4 py-2.5 text-[13px]">
                    Se listan los <span className="cifra">{TOPE_VISIBLE}</span> de
                    mayor puntaje. Los otros{" "}
                    <span className="cifra">{grupo.leads.length - TOPE_VISIBLE}</span>{" "}
                    están en la bandeja completa.
                  </p>
                )}
              </>
            )}
          </Tarjeta>
        </section>
      ))}
    </div>
  );
}
