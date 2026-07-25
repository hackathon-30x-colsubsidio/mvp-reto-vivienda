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
    <main className="flex min-h-0 flex-1 flex-col px-5 py-3.5 lg:overflow-hidden lg:px-7">
      {/* CABECERA — compacta y fija. Todo en UNA línea de altura: el
          título, el hecho que decide la pantalla y el selector.
          La compacidad no es estética: el alto útil de una ventana de
          1440×900 es ~530px, no 900. Medido, no estimado. */}
      <header className="mb-2 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-texto text-[24px] leading-none font-extrabold tracking-[-0.02em]">
            Métricas
          </h1>
          <p className="text-texto-suave text-[13px] leading-snug">
            <span className="cifra text-texto">{datos.leads.length}</span> leads en
            14 días ·{" "}
            {/* El ÚNICO trazo de resaltador de esta pantalla, sobre el
                hecho que la decide: el reparto de afiliación contra el
                límite que fija la regla 90/10. */}
            <span className="resaltado font-bold">
              {`el ${pctNoAfiliados}% no son afiliados, y la regla 90/10 solo permite el 10%`}
            </span>
          </p>
        </div>
        <SelectorVista activa={activa} />
      </header>

      {/* EL CORTE ACTIVO — ocupa todo el alto restante.
          `overflow-y-auto` es la RED DE SEGURIDAD: en una pantalla con
          alto suficiente no se activa nunca y la vista cabe entera; en
          una pantalla baja el panel se recorre por dentro. Lo que NO
          hace es comprimir las tarjetas por debajo de su contenido —
          eso derramaba el texto de una encima de otra. */}
      <section className="flex min-h-0 flex-1 flex-col">
        {/* El título del corte va en `sr-only`: el selector de arriba ya
            lo nombra, y repetirlo en pantalla costaba 58px de los ~230
            que quedan para los datos. Para un lector de pantalla sí
            importa —anuncia qué sección empieza—, así que no se borra:
            se deja de pintar. La descripción viaja en `aria-describedby`
            por la misma razón. */}
        <h2 id="titulo-corte" className="sr-only">
          {vista.titulo}
        </h2>
        <p id="desc-corte" className="sr-only">
          {vista.descripcion}
        </p>

        <div
          aria-labelledby="titulo-corte"
          aria-describedby="desc-corte"
          className="min-h-0 flex-1 lg:overflow-y-auto"
        >
          {activa === "resumen" && <FranjaMetricas datos={datos} />}
          {activa === "entrada" && <SerieDiaria datos={datos} />}
          {activa === "reparto" && (
            <GruposDeLeads agrupador={AGRUPADOR_ACTIVO} datos={datos} />
          )}
        </div>
      </section>

      {/* Los avisos van al PIE: son verdad que el jurado debe poder ver,
          pero no son el titular de la pantalla. */}
      <footer className="mt-1.5 shrink-0 space-y-1.5">
        <AvisoOrigen origen={datos.origen} />
        <AvisoSintetico datos={datos} />
      </footer>
    </main>
  );
}
