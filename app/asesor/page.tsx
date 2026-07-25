import type { Metadata } from "next";
import Link from "next/link";
import { listarCola } from "@/lib/leads-repo";
import type { EstadoLead } from "@/lib/types-asesor";
import { FilaLead } from "./_components/FilaLead";
import { AvisoOrigen } from "./_components/AvisoOrigen";

export const metadata: Metadata = {
  title: "Cola del asesor · Colsubsidio Vivienda",
};

// La cola cambia cuando el asesor dispara un trigger: no se cachea.
export const dynamic = "force-dynamic";

// =====================================================================
// DOS grupos, no tres (spec 06 D7, CERRADA — Mani 2026-07-24).
//
// `listo` y `listo_restriccion_cupo` comparten sección y adentro manda el
// PUNTAJE. Antes eran dos secciones con el no afiliado siempre debajo, así que
// un no afiliado con 71 puntos aparecía bajo un afiliado con 42: la afiliación
// decidía a quién llamar primero. El mentor lo puso al revés — *"siempre va a
// ser la prioridad de los ingresos"*. La distinción del cupo 90/10 no se pierde:
// viaja en el badge de cada fila, que es donde el asesor la necesita.
//
// `ordenarCola` (lib/types-asesor.ts) ya ordenaba así; esta pantalla lo estaba
// deshaciendo al re-partir por estado.
// =====================================================================
const GRUPOS: {
  clave: string;
  estados: EstadoLead[];
  titulo: string;
  subtitulo: string;
  vacio: string;
}[] = [
  {
    clave: "puede-comprar",
    estados: ["listo", "listo_restriccion_cupo"],
    titulo: "Pueden comprar hoy",
    subtitulo:
      "Pasaron el corte del 40% (Decreto 583 de 2025), ordenados por puntaje: arriba quien está más cerca de cerrar. A los que no son afiliados el badge les marca el cupo 90/10, que el asesor valida antes de separar.",
    vacio: "Nadie pasó el corte por ahora.",
  },
  {
    clave: "nutricion",
    estados: ["nutricion"],
    titulo: "Todavía no pueden comprar",
    subtitulo:
      "Nadie se descarta. Cada uno tiene la regla exacta que no pasó y el trigger que lo volvería viable. Van de últimos porque llamarlos hoy no cierra nada — no por su afiliación.",
    vacio: "Nadie en nutrición por ahora.",
  },
];

export default async function ColaAsesorPage() {
  const { leads, origen } = await listarCola();

  const grupos = GRUPOS.map((grupo) => ({
    ...grupo,
    items: leads.filter((l) => grupo.estados.includes(l.curado.score.salida)),
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
          {grupos.map(({ clave, titulo, subtitulo, vacio, items }) => (
            <section key={clave}>
              <h2 className="text-xl font-bold tracking-tight text-tinta">
                {titulo}{" "}
                <span className="cifra font-normal text-tinta-suave">
                  ({items.length})
                </span>
              </h2>
              <p className="mt-1 mb-4 max-w-[68ch] text-base text-tinta-suave">
                {subtitulo}
              </p>

              {items.length === 0 ? (
                <p className="rounded-md border-2 border-dashed border-borde px-4 py-8 text-center text-base text-tinta-suave">
                  {vacio}
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
