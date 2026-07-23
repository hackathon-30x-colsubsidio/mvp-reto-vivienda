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
      className="rounded-xl border-2 border-green-300 bg-green-50 p-5"
    >
      <h2 className="text-xl font-bold text-green-900">Visita agendada</h2>
      <p className="mt-2 text-lg font-semibold text-green-900 first-letter:uppercase">
        {fechaLarga(cita.fecha)}
      </p>
      <p className="text-base text-green-800">{cita.sala_ventas}</p>
    </section>
  );
}
