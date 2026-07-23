import type { Metadata } from "next";
import { listarCola } from "@/lib/leads-repo";
import { PRIORIDAD, type EstadoLead } from "@/lib/types-asesor";
import { FilaLead } from "./_components/FilaLead";
import { AvisoOrigen } from "./_components/AvisoOrigen";

export const metadata: Metadata = {
  title: "Cola del asesor · Colsubsidio Vivienda",
};

// La cola cambia cuando el asesor dispara un trigger: no se cachea.
export const dynamic = "force-dynamic";

const TITULO_GRUPO: Record<EstadoLead, string> = {
  listo: "Listos para llamar",
  listo_restriccion_cupo: "Listos, con restricción de cupo 90/10",
  nutricion: "En nutrición — todavía no pueden comprar",
};

const SUBTITULO_GRUPO: Record<EstadoLead, string> = {
  listo: "Pasaron el corte y son afiliados. Cita agendada y proyectos recomendados.",
  listo_restriccion_cupo:
    "Pasaron el corte pero no son afiliados: compiten por el 10% de cupo del proyecto. Validar cupo antes de prometer.",
  nutricion:
    "Nadie se descarta. Cada uno tiene la regla exacta que no pasó y el trigger que lo volvería viable.",
};

export default async function ColaAsesorPage() {
  const { leads, origen } = await listarCola();

  const grupos = (Object.keys(PRIORIDAD) as EstadoLead[]).map((estado) => ({
    estado,
    items: leads.filter((l) => l.curado.score.salida === estado),
  }));

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">
          Cola de leads
        </h1>
        <p className="mt-2 text-lg text-gray-600">
          {leads.length} leads perfilados, ordenados por quién está más cerca de
          comprar. Abre uno para ver por qué quedó ahí.
        </p>
      </header>

      <AvisoOrigen origen={origen} />

      <div className="space-y-10">
        {grupos.map(({ estado, items }) => (
          <section key={estado}>
            <h2 className="text-xl font-bold text-gray-900">
              {TITULO_GRUPO[estado]}{" "}
              <span className="font-normal text-gray-500">({items.length})</span>
            </h2>
            <p className="mt-1 mb-4 text-base text-gray-600">
              {SUBTITULO_GRUPO[estado]}
            </p>

            {items.length === 0 ? (
              <p className="rounded-lg bg-gray-50 px-4 py-6 text-center text-base text-gray-500">
                Nadie en este grupo por ahora.
              </p>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <FilaLead key={item.curado.lead.evento.lead_id} item={item} />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}
