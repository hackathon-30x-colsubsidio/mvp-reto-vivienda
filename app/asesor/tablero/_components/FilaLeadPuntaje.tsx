import Link from "next/link";
import type { LeadEnCola } from "@/lib/types-asesor";
import { Pildora, PildoraReEnganchado } from "@/components/ui/Pildora";
import { EtiquetaSimulado } from "@/components/ui/EtiquetaSimulado";
import { fechaCorta, NOMBRE_FUENTE } from "@/lib/formato";

/**
 * Un renglón del tablero: el lead con su puntaje.
 *
 * El puntaje va acompañado SIEMPRE de los dos números que lo sostienen
 * ("N de M factores"), y el desglose completo está a un clic en la
 * ficha. Un puntaje solo, sin nada que lo explique, es justo el patrón
 * que DESIGN.md rechaza.
 */
export function FilaLeadPuntaje({ item }: { item: LeadEnCola }) {
  const { curado } = item;
  const { evento } = curado.lead;
  const puntaje = curado.score.puntaje;

  const cumplen = curado.score.factores.filter((f) => f.cumple).length;
  const total = curado.score.factores.length;

  return (
    <Link
      href={`/asesor/${evento.lead_id}`}
      data-testid="fila-lead"
      className="hover:bg-surface-sunken flex flex-wrap items-baseline gap-x-4 gap-y-2 px-4 py-3 transition-colors duration-[120ms]"
    >
      {/* El puntaje primero: es el orden de la lista, y leerlo en la
          primera columna es lo que hace la lista escaneable. */}
      <span
        data-testid="puntaje"
        className="cifra text-texto w-14 shrink-0 text-[20px] font-bold"
      >
        {puntaje}
        <span className="text-texto-tenue text-[12px] font-normal">/100</span>
      </span>

      <span className="min-w-0 grow">
        <span className="text-texto block text-[15px] font-bold">
          {evento.nombre}
        </span>
        <span className="text-texto-suave mt-0.5 block text-[13px]">
          <span className="cifra">
            {cumplen} de {total}
          </span>{" "}
          factores cumplen · {NOMBRE_FUENTE[evento.fuente] ?? evento.fuente}
          {curado.cita && (
            <>
              {" "}
              · cita <span className="cifra">{fechaCorta(curado.cita.fecha)}</span>
            </>
          )}
        </span>
      </span>

      <span className="flex flex-wrap items-center gap-1.5">
        {item.sintetico && <EtiquetaSimulado texto="histórico" />}
        {item.re_enganchado_en && <PildoraReEnganchado />}
        <Pildora estado={curado.score.salida} />
      </span>
    </Link>
  );
}
