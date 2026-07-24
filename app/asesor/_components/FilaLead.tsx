import Link from "next/link";
import type { LeadEnCola } from "@/lib/types-asesor";
import { BadgeEstado, BadgeReEnganchado } from "./BadgeEstado";
import { fechaCorta, NOMBRE_FUENTE } from "@/lib/formato";

/**
 * Una fila de la cola. Lo que el asesor necesita para decidir a quién
 * llama primero, sin abrir la ficha: quién es, en qué salida cayó, y
 * el titular de por qué.
 */
export function FilaLead({ item }: { item: LeadEnCola }) {
  const { curado } = item;
  const { evento } = curado.lead;
  const esNutricion = curado.score.salida === "nutricion";

  const cumplen = curado.score.factores.filter((f) => f.cumple).length;
  const total = curado.score.factores.length;

  return (
    <Link
      href={`/asesor/${evento.lead_id}`}
      className="block rounded-xl border-2 border-gray-200 bg-white p-5 transition hover:border-blue-500 hover:bg-blue-50/40"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{evento.nombre}</h3>
          <p className="mt-1 text-base text-gray-600">
            {NOMBRE_FUENTE[evento.fuente] ?? evento.fuente}
            {evento.proyecto_interes && <> · preguntó por {evento.proyecto_interes}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.re_enganchado_en && <BadgeReEnganchado />}
          <BadgeEstado estado={curado.score.salida} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-base">
        <span className="font-semibold text-gray-700">
          {cumplen} de {total} factores cumplen
        </span>

        {curado.cita && (
          <span className="text-gray-700">
            Cita: <strong>{fechaCorta(curado.cita.fecha)}</strong>
          </span>
        )}

        {curado.proyectos.length > 0 && (
          <span className="text-gray-700">
            {curado.proyectos.length} proyectos recomendados
          </span>
        )}
      </div>

      {/* El titular del porqué. En nutrición, la regla que falló;
          en los listos, la primera línea de la explicación. */}
      <p className="mt-3 line-clamp-2 text-base text-gray-600">
        {esNutricion ? curado.score.regla_fallida : curado.explicacion}
      </p>
    </Link>
  );
}
