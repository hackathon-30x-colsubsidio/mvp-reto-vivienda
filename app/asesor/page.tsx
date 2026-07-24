import type { Metadata } from "next";
import Link from "next/link";
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
    // Los colores salen de los tokens de globals.css, que ya traen su
    // versión clara y su versión oscura: el jurado ve la cola legible
    // tenga el sistema en el tema que lo tenga.
    <div className="min-h-screen bg-fondo">
      {/* El riel del formato. */}
      <div className="bg-campo">
        <div className="mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 py-4">
          <span className="text-sm font-bold tracking-[0.08em] text-sobre-campo uppercase">
            Colsubsidio · Vivienda
          </span>
          <Link
            href="/asesor/tablero"
            className="text-sm font-bold text-sobre-campo hover:underline"
          >
            Ver el tablero del especialista →
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em] text-tinta">
            Cola de leads
          </h1>
          <p className="mt-4 max-w-[68ch] text-lg leading-relaxed text-tinta-suave">
            <span className="cifra text-tinta">{leads.length}</span> leads
            perfilados,{" "}
            {/* El único trazo de esta pantalla: lo que hace distinta a
                esta cola de una lista cualquiera. */}
            <span className="resaltado font-bold">
              ordenados por quién está más cerca de comprar
            </span>
            . Abre uno para ver por qué quedó ahí.
          </p>
        </header>

        <AvisoOrigen origen={origen} />

        <div className="space-y-10">
          {grupos.map(({ estado, items }) => (
            <section key={estado}>
              <h2 className="text-xl font-bold tracking-tight text-tinta">
                {TITULO_GRUPO[estado]}{" "}
                <span className="cifra font-normal text-tinta-suave">
                  ({items.length})
                </span>
              </h2>
              <p className="mt-1 mb-4 max-w-[68ch] text-base text-tinta-suave">
                {SUBTITULO_GRUPO[estado]}
              </p>

              {items.length === 0 ? (
                <p className="rounded-md border-2 border-dashed border-borde px-4 py-8 text-center text-base text-tinta-suave">
                  Nadie en este grupo por ahora.
                </p>
              ) : (
                <div className="divide-y-2 divide-borde overflow-hidden rounded-md border-2 border-borde">
                  {items.map((item) => (
                    <FilaLead key={item.curado.lead.evento.lead_id} item={item} />
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
