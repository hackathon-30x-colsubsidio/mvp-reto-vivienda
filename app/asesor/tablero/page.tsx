import type { Metadata } from "next";
import { cargarTablero } from "@/lib/tablero/datos";
import { AGRUPADOR_ACTIVO } from "@/lib/tablero/agrupadores";
import { AvisoOrigen } from "../_components/AvisoOrigen";
import { AvisoSintetico } from "./_components/AvisoSintetico";
import { FranjaMetricas } from "./_components/FranjaMetricas";
import { SerieDiaria } from "./_components/SerieDiaria";
import { GruposDeLeads } from "./_components/GruposDeLeads";
import { SelectorVista, VISTAS, vistaActiva } from "./_components/SelectorVista";

export const metadata: Metadata = {
  title: "Métricas · Colsubsidio Vivienda",
};

// Las métricas cambian con cada lead que entra: no se cachea.
export const dynamic = "force-dynamic";

// =====================================================================
// MÉTRICAS — la vista analítica de la consola.
//
// Responde tres preguntas del especialista, y cada una es un CORTE del
// mismo dato, no una sección distinta: cuánto entra, cómo entra en el
// tiempo, y cómo se reparte. Se eligen con el selector de arriba, igual
// que el "diario / mensual" de una gráfica.
//
// ⚠️ La razón de que sean cortes y no una página larga es que el
//    tablero TIENE QUE CABER SIN SCROLL en 1440×900: un tablero que
//    hay que desplazar deja de responder de un vistazo. Nada se oculta
//    —los tres cortes están a un clic y el conteo real siempre se ve—,
//    pero no se apilan.
//
// ➕ CÓMO SE LE AGREGAN COSAS (sigue pensado para eso):
//    · una cifra nueva  → un objeto en `lib/tablero/metricas.ts`
//    · otro eje de corte → un `Agrupador` en `lib/tablero/agrupadores.ts`
//    · una vista nueva   → una entrada en `VISTAS` y su caso aquí
// =====================================================================

interface Props {
  searchParams: Promise<{ v?: string }>;
}

export default async function MetricasPage({ searchParams }: Props) {
  const [datos, { v }] = await Promise.all([cargarTablero(), searchParams]);
  const activa = vistaActiva(v);
  const vista = VISTAS.find((x) => x.clave === activa)!;

  const noAfiliados = AGRUPADOR_ACTIVO.grupos(datos).find(
    (g) => g.clave === "no-afiliado",
  );
  const pctNoAfiliados =
    datos.leads.length === 0
      ? 0
      : Math.round(((noAfiliados?.leads.length ?? 0) / datos.leads.length) * 100);

  return (
    <main className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-5 lg:overflow-hidden lg:px-7 lg:py-6">
      {/* CABECERA — fija. Lo único que se repite entre los tres cortes,
          porque es el hecho que decide la pantalla. */}
      <header className="shrink-0">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-texto text-[30px] leading-tight font-extrabold tracking-[-0.02em]">
              Métricas
            </h1>
            <p className="text-texto-suave mt-1.5 max-w-[72ch] text-[15px] leading-normal">
              <span className="cifra text-texto">{datos.leads.length}</span> leads
              perfilados en los últimos 14 días.{" "}
              {/* El ÚNICO trazo de resaltador de esta pantalla, sobre el
                  hecho que la decide: el reparto de afiliación contra el
                  límite que fija la regla 90/10. */}
              <span className="resaltado font-bold">
                {`El ${pctNoAfiliados}% no son afiliados, y la regla 90/10 solo permite el 10%`}
              </span>
              .
            </p>
          </div>
          <SelectorVista activa={activa} />
        </div>
      </header>

      {/* EL CORTE ACTIVO — es lo único que ocupa el alto restante. */}
      <section className="flex min-h-0 flex-1 flex-col">
        <div className="mb-3 shrink-0">
          <h2 className="text-texto text-[17px] font-bold">{vista.titulo}</h2>
          <p className="text-texto-suave mt-0.5 max-w-[72ch] text-[13px] leading-normal">
            {vista.descripcion}
          </p>
        </div>

        {activa === "resumen" && (
          <div className="min-h-0 flex-1">
            <FranjaMetricas datos={datos} />
          </div>
        )}

        {activa === "entrada" && (
          <div className="min-h-0 flex-1">
            <SerieDiaria datos={datos} />
          </div>
        )}

        {activa === "reparto" && (
          <div className="min-h-0 flex-1 lg:overflow-hidden">
            <GruposDeLeads agrupador={AGRUPADOR_ACTIVO} datos={datos} />
          </div>
        )}
      </section>

      {/* Los avisos van al PIE y en una línea: son verdad que el jurado
          debe poder ver, pero no son el titular de la pantalla. */}
      <footer className="shrink-0 space-y-2">
        <AvisoOrigen origen={datos.origen} />
        <AvisoSintetico datos={datos} />
      </footer>
    </main>
  );
}
