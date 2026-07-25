import type { Metadata } from "next";
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
    // El riel azul y la marca los pone ahora el shell de la consola
    // (app/asesor/layout.tsx). Esta página solo aporta su contenido.
    <main className="min-h-0 flex-1 px-5 py-6 lg:overflow-y-auto lg:px-8 lg:py-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6">
          <h1 className="text-texto text-[38px] leading-tight font-extrabold tracking-[-0.02em]">
            Tablero del especialista
          </h1>
          <p className="text-texto-suave mt-3 max-w-[68ch] text-[17px] leading-normal">
            <span className="cifra text-texto">{datos.leads.length}</span> leads
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

        <div className="space-y-8">
          <section>
            <h2 className="text-texto mb-3 text-[20px] font-bold">
              La operación en cifras
            </h2>
            <FranjaMetricas datos={datos} />
          </section>

          <section>
            <h2 className="text-texto text-[20px] font-bold">
              Leads que entran por día
            </h2>
            <p className="text-texto-suave mt-1 mb-3 max-w-[68ch] text-[15px] leading-normal">
              Últimos 14 días, hora de Bogotá. Los días en cero se muestran: un
              hueco en la serie también es información.
            </p>
            <SerieDiaria datos={datos} />
          </section>

          <section>
            {/* El título sale del agrupador tal cual: bajarlo a
                minúsculas rompía "Colsubsidio". */}
            <h2 className="text-texto text-[20px] font-bold">
              Leads por {AGRUPADOR_ACTIVO.titulo}
            </h2>
            <p className="text-texto-suave mt-1 mb-3 max-w-[68ch] text-[15px] leading-normal">
              Dentro de cada grupo, ordenados por puntaje: el más cerca de comprar,
              arriba. Abre uno para ver el desglose completo del puntaje y todos
              los factores que evaluó el motor.
            </p>
            <GruposDeLeads agrupador={AGRUPADOR_ACTIVO} datos={datos} />
          </section>
        </div>
      </div>
    </main>
  );
}
