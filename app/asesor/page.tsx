import type { Metadata } from "next";
import { listarCola } from "@/lib/leads-repo";
import { Tarjeta } from "@/components/ui/Tarjeta";
import { Pildora } from "@/components/ui/Pildora";
import { AvisoOrigen } from "./_components/AvisoOrigen";
import { ListaLeads, GRUPOS } from "./_components/ListaLeads";

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

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <ListaLeads leads={leads} busqueda={q} estado={estado} />

      {/* El panel derecho antes de elegir a nadie. No es un placeholder:
          es donde el jurado, que recorre esto solo y sin narración,
          entiende qué son las secciones de la izquierda. Los grupos
          salen de GRUPOS, la misma fuente que pinta la lista. */}
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
            {GRUPOS.map((grupo) => {
              const n = leads.filter((l) =>
                grupo.estados.includes(l.curado.score.salida),
              ).length;

              return (
                <Tarjeta key={grupo.clave} className="p-5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    {/* Las dos píldoras juntas en "pueden comprar hoy":
                        ahí conviven las dos salidas, y verlas lado a lado
                        es lo que explica que compartan sección. */}
                    {grupo.estados.map((e) => (
                      <Pildora key={e} estado={e} />
                    ))}
                    <h2 className="text-texto text-[16px] font-bold">
                      {grupo.titulo}
                    </h2>
                    <span className="cifra text-texto-tenue ml-auto text-[15px]">
                      {n}
                    </span>
                  </div>
                  <p className="text-texto-suave mt-2 text-[15px] leading-normal">
                    {grupo.subtitulo}
                  </p>
                </Tarjeta>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
