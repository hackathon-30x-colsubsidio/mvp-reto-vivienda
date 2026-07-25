import Link from "next/link";
import type { LeadEnCola } from "@/lib/types-asesor";
import { conteoFactores } from "@/lib/types-asesor";
import { Pildora, PildoraReEnganchado } from "@/components/ui/Pildora";
import { EtiquetaSimulado } from "@/components/ui/EtiquetaSimulado";
import { fechaCorta, NOMBRE_FUENTE } from "@/lib/formato";

/**
 * Un renglón de la bandeja. Lo mínimo para decidir a quién se llama
 * primero sin abrir la ficha: quién es, en qué salida cayó, y el
 * titular de por qué.
 *
 * Es denso a propósito: en la consola lista/detalle este renglón compite
 * por 380px de ancho contra la ficha completa, así que lo que antes eran
 * cuatro líneas holgadas aquí son tres apretadas. El detalle largo vive
 * al lado, a un clic.
 */
export function FilaLead({
  item,
  activo = false,
}: {
  item: LeadEnCola;
  activo?: boolean;
}) {
  const { curado } = item;
  const { evento } = curado.lead;
  const esNutricion = curado.score.salida === "nutricion";

  // Mismo criterio que la ficha: los informativos no cuentan. Contarlos aquí y
  // no allá hacía que el mismo lead dijera "7/7" en la lista y "4 de 4" al
  // abrirlo, que se lee como que uno de los dos números miente.
  const { cumplen, total } = conteoFactores(curado.score.factores);

  return (
    <Link
      href={`/asesor/${evento.lead_id}`}
      aria-current={activo ? "page" : undefined}
      className={`block px-4 py-3 transition-colors duration-[120ms] ${
        activo
          ? "bg-salida-suave border-brand-azul border-l-[3px] pl-[13px]"
          : "hover:bg-surface-sunken"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-texto truncate text-[15px] font-bold">
          {evento.nombre}
        </h3>
        <div className="flex shrink-0 items-center gap-1.5">
          {item.re_enganchado_en && <PildoraReEnganchado />}
          <Pildora estado={curado.score.salida} />
        </div>
      </div>

      <p className="text-texto-tenue mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px]">
        <span>{NOMBRE_FUENTE[evento.fuente] ?? evento.fuente}</span>
        <span aria-hidden="true">·</span>
        <span>
          <span className="cifra">
            {cumplen}/{total}
          </span>{" "}
          factores
        </span>
        {curado.cita && (
          <>
            <span aria-hidden="true">·</span>
            <span className="cifra">{fechaCorta(curado.cita.fecha)}</span>
          </>
        )}
        {item.sintetico && <EtiquetaSimulado texto="simulado" />}
      </p>

      {/* El titular del porqué. En nutrición, la regla que falló; en los
          listos, la primera línea de la explicación. */}
      <p className="text-texto-suave mt-1.5 line-clamp-2 text-[13px] leading-normal">
        {esNutricion ? curado.score.regla_fallida : curado.explicacion}
      </p>
    </Link>
  );
}
