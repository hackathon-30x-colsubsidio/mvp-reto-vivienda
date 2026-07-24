import type { LeadCurado } from "@/lib/types";
import { fechaLarga } from "@/lib/formato";

/**
 * La cita agendada (criterio de aceptación 4).
 *
 * Las franjas son slots simulados en la DB — no hay integración de
 * calendario y el spec §2 lo dice explícitamente.
 */
export function BloqueCita({ cita }: { cita: NonNullable<LeadCurado["cita"]> }) {
  return (
    <section
      data-testid="cita"
      className="rounded-md border-2 border-azul-40 bg-salida-suave px-6 py-6"
    >
      <h2 className="text-xs font-bold tracking-[0.08em] text-azul-profundo uppercase">
        Visita agendada
      </h2>
      <p className="mt-2 text-lg font-bold text-tinta first-letter:uppercase">
        {fechaLarga(cita.fecha)}
      </p>
      <p className="mt-0.5 text-base text-tinta-suave">{cita.sala_ventas}</p>
    </section>
  );
}
