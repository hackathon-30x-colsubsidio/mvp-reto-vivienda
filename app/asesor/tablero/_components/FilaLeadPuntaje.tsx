import Link from "next/link";
import type { LeadEnCola } from "@/lib/types-asesor";
import { BadgeEstado, BadgeReEnganchado } from "@/app/asesor/_components/BadgeEstado";
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
      className="flex flex-wrap items-baseline gap-x-4 gap-y-2 bg-papel px-5 py-4 transition-colors hover:bg-salida-suave"
    >
      {/* El puntaje primero: es el orden de la lista, y leerlo en la
          primera columna es lo que hace la lista escaneable. */}
      <span
        data-testid="puntaje"
        className="cifra w-16 shrink-0 text-2xl font-bold text-tinta"
      >
        {puntaje}
        <span className="text-base font-normal text-tinta-suave">/100</span>
      </span>

      <span className="min-w-0 grow">
        <span className="block text-lg font-bold tracking-tight text-tinta">
          {evento.nombre}
        </span>
        <span className="mt-0.5 block text-base text-tinta-suave">
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
          {item.sintetico && <> · histórico sintético</>}
        </span>
      </span>

      <span className="flex flex-wrap items-center gap-2">
        {item.re_enganchado_en && <BadgeReEnganchado />}
        <BadgeEstado estado={curado.score.salida} />
      </span>
    </Link>
  );
}
