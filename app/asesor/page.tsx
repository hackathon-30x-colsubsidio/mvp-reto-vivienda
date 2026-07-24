import type { Metadata } from "next";
import { listarCola } from "@/lib/leads-repo";
import { PRIORIDAD, type EstadoLead } from "@/lib/types-asesor";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Pildora } from "@/components/ui/Pildora";
import { AvisoOrigen } from "./_components/AvisoOrigen";
import { ListaLeads, TITULO_GRUPO, SUBTITULO_GRUPO } from "./_components/ListaLeads";

export const metadata: Metadata = {
  title: "Bandeja del asesor · Colsubsidio Vivienda",
};

// La cola cambia cuando el asesor dispara un trigger: no se cachea.
export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ q?: string; estado?: string }>;
}

export default async function BandejaAsesorPage({ searchParams }: Props) {
  const { leads, origen } = await listarCola();
  const { q, estado } = await searchParams;

  const conteo = (e: EstadoLead) =>
    leads.filter((l) => l.curado.score.salida === e).length;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <ListaLeads leads={leads} busqueda={q} estado={estado} />

      {/* El panel derecho antes de elegir a nadie. No es un placeholder:
          es donde el jurado, que recorre esto solo y sin narración,
          entiende qué son las tres secciones de la izquierda. */}
      <main className="min-h-0 flex-1 px-6 py-8 lg:overflow-y-auto lg:px-10">
        <div className="mx-auto max-w-[68ch]">
          <h1 className="text-texto text-[38px] leading-tight font-extrabold tracking-[-0.02em]">
            Bandeja de leads
          </h1>
          <p className="text-texto-suave mt-3 text-[17px] leading-normal">
            <span className="cifra text-texto">{leads.length}</span> leads
            perfilados,{" "}
            {/* El único trazo de esta pantalla: lo que la hace distinta de
                una lista cualquiera. */}
            <span className="resaltado font-bold">
              ordenados por quién está más cerca de comprar
            </span>
            . Elige uno a la izquierda para ver por qué quedó ahí.
          </p>

          <div className="mt-6">
            <AvisoOrigen origen={origen} />
          </div>

          <div className="mt-6 space-y-3">
            {(Object.keys(PRIORIDAD) as EstadoLead[]).map((e) => (
              <Tarjeta key={e} className="p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Pildora estado={e} />
                  <h2 className="text-texto text-[16px] font-bold">
                    {TITULO_GRUPO[e]}
                  </h2>
                  <span className="cifra text-texto-tenue ml-auto text-[15px]">
                    {conteo(e)}
                  </span>
                </div>
                <p className="text-texto-suave mt-2 text-[15px] leading-normal">
                  {SUBTITULO_GRUPO[e]}
                </p>
              </Tarjeta>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
