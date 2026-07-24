import type { Metadata } from "next";
import Link from "next/link";
import { cargarTablero } from "@/lib/tablero/datos";
import { AGRUPADOR_ACTIVO } from "@/lib/tablero/agrupadores";
import { AvisoOrigen } from "../_components/AvisoOrigen";
import { AvisoSintetico } from "./_components/AvisoSintetico";
import { FranjaMetricas } from "./_components/FranjaMetricas";
import { SerieDiaria } from "./_components/SerieDiaria";
import { GruposDeLeads } from "./_components/GruposDeLeads";

export const metadata: Metadata = {
  title: "Tablero del especialista · Colsubsidio Vivienda",
};

// Las métricas cambian con cada lead que entra: no se cachea.
export const dynamic = "force-dynamic";

// =====================================================================
// EL TABLERO DEL ESPECIALISTA
//
// `/asesor` responde "a quién llamo ahora". Esta pantalla responde las
// otras tres preguntas del especialista: cuánto está entrando, cómo se
// reparte entre afiliados y no afiliados, y quién es el mejor de cada
// lado.
//
// ➕ CÓMO SE LE AGREGAN COSAS (está pensado para eso):
//    · una cifra nueva  → un objeto en `lib/tablero/metricas.ts`
//    · otro eje de corte → un `Agrupador` en `lib/tablero/agrupadores.ts`,
//      y cambiar `AGRUPADOR_ACTIVO`
//    · un bloque nuevo   → un componente en `_components/` y una línea aquí
//    Ninguna de las tres obliga a reescribir lo que ya existe.
// =====================================================================

export default async function TableroPage() {
  const datos = await cargarTablero();

  const noAfiliados = AGRUPADOR_ACTIVO.grupos(datos).find(
    (g) => g.clave === "no-afiliado",
  );
  const pctNoAfiliados =
    datos.leads.length === 0
      ? 0
      : Math.round(((noAfiliados?.leads.length ?? 0) / datos.leads.length) * 100);

  return (
    <div className="min-h-screen bg-fondo">
      {/* El riel del formato, igual que en la cola: es el encabezado
          impreso de la hoja, no una barra de navegación. */}
      <div className="bg-campo">
        <div className="mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 py-4">
          <span className="text-sm font-bold tracking-[0.08em] text-sobre-campo uppercase">
            Colsubsidio · Vivienda
          </span>
          <Link
            href="/asesor"
            className="text-sm font-bold text-sobre-campo hover:underline"
          >
            Ir a la cola de leads →
          </Link>
        </div>
      </div>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <header className="mb-8">
          <h1 className="text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em] text-tinta">
            Tablero del especialista
          </h1>
          <p className="mt-4 max-w-[68ch] text-lg leading-relaxed text-tinta-suave">
            <span className="cifra text-tinta">{datos.leads.length}</span> leads
            perfilados en los últimos 14 días.{" "}
            {/* El ÚNICO trazo de resaltador de esta pantalla, sobre el
                hecho que la decide: el reparto de afiliación contra el
                límite que fija la regla 90/10. */}
            <span className="resaltado font-bold">
              {`El ${pctNoAfiliados}% no son afiliados, y la regla 90/10 solo permite el 10%`}
            </span>
            . Cada lead trae su puntaje con las cuentas que lo sostienen.
          </p>
        </header>

        <AvisoOrigen origen={datos.origen} />
        <AvisoSintetico datos={datos} />

        <div className="space-y-12">
          <section>
            <h2 className="mb-4 text-xl font-bold tracking-tight text-tinta">
              La operación en cifras
            </h2>
            <FranjaMetricas datos={datos} />
          </section>

          <section>
            <h2 className="text-xl font-bold tracking-tight text-tinta">
              Leads que entran por día
            </h2>
            <p className="mt-1 mb-4 max-w-[68ch] text-base text-tinta-suave">
              Últimos 14 días, hora de Bogotá. Los días en cero se muestran: un
              hueco en la serie también es información.
            </p>
            <SerieDiaria datos={datos} />
          </section>

          <section>
            {/* El título sale del agrupador tal cual: bajarlo a
                minúsculas rompía "Colsubsidio". */}
            <h2 className="text-xl font-bold tracking-tight text-tinta">
              Leads por {AGRUPADOR_ACTIVO.titulo}
            </h2>
            <p className="mt-1 mb-6 max-w-[68ch] text-base text-tinta-suave">
              Dentro de cada grupo, ordenados por puntaje: el más cerca de comprar,
              arriba. Abre uno para ver el desglose completo del puntaje y todos
              los factores que evaluó el motor.
            </p>
            <GruposDeLeads agrupador={AGRUPADOR_ACTIVO} datos={datos} />
          </section>
        </div>
      </main>
    </div>
  );
}
