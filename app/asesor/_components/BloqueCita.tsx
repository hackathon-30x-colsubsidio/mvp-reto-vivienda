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
      className="border-azul-40 bg-salida-suave flex flex-wrap items-center justify-between gap-x-6 gap-y-2 rounded-md border px-5 py-4"
    >
      <div>
        <h2 className="rotulo text-azul">Visita agendada</h2>
        <p className="text-texto mt-1 text-[17px] font-bold first-letter:uppercase">
          {fechaLarga(cita.fecha)}
        </p>
      </div>
      <p className="text-texto-suave text-[13px]">{cita.sala_ventas}</p>
    </section>
  );
}
