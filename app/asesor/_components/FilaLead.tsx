import Link from "next/link";
import type { LeadEnCola } from "@/lib/types-asesor";
import { BadgeEstado, BadgeReEnganchado } from "./BadgeEstado";
import { fechaCorta, NOMBRE_FUENTE } from "@/lib/formato";

/**
 * Una fila de la cola. Lo que el asesor necesita para decidir a quién
 * llama primero, sin abrir la ficha: quién es, en qué salida cayó, y
 * el titular de por qué.
 *
 * Es un renglón del formato, no una tarjeta: se separa de sus vecinos
 * por regla y por capa tonal, nunca por sombra.
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
      className="block bg-papel px-5 py-5 transition-colors hover:bg-salida-suave"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-bold tracking-tight text-tinta">
            {evento.nombre}
          </h3>
          <p className="mt-1 text-base text-tinta-suave">
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
        <span className="font-semibold text-tinta">
          <span className="cifra">
            {cumplen} de {total}
          </span>{" "}
          factores cumplen
        </span>

        {curado.cita && (
          <span className="text-tinta-suave">
            Cita:{" "}
            <strong className="cifra text-tinta">{fechaCorta(curado.cita.fecha)}</strong>
          </span>
        )}

        {curado.proyectos.length > 0 && (
          <span className="text-tinta-suave">
            <span className="cifra">{curado.proyectos.length}</span> proyectos
            recomendados
          </span>
        )}
      </div>

      {/* El titular del porqué. En nutrición, la regla que falló;
          en los listos, la primera línea de la explicación. */}
      <p className="mt-3 line-clamp-2 max-w-[68ch] text-base text-tinta-suave">
        {esNutricion ? curado.score.regla_fallida : curado.explicacion}
      </p>
    </Link>
  );
}
