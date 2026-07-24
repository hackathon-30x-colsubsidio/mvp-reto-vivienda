import Link from "next/link";
import { PRIORIDAD, ETIQUETA_ESTADO, type EstadoLead } from "@/lib/types-asesor";
import type { LeadEnCola } from "@/lib/types-asesor";
import { CampoBusqueda } from "@/components/ui/CampoBusqueda";
import { SelectorEstado } from "@/components/ui/SelectorEstado";
import { FilaLead } from "./FilaLead";

// =====================================================================
// LA BANDEJA — el panel izquierdo de la consola.
//
// La renderizan las DOS rutas: /asesor (con el panel derecho en vacío) y
// /asesor/[leadId] (con la ficha al lado). Por eso recibe `seleccionado`
// en vez de leerlo: un layout no puede ver los params de sus hijos.
//
// El agrupado en tres secciones se mantiene tal como estaba. Es lo que
// hace legible "nadie se descarta": el grupo de nutrición se ve, con su
// conteo, aunque el asesor nunca lo abra. La spec 06 lo tiene como
// [PROPUESTA] abierta, así que aquí no se cambia el vocabulario.
//
// Los subtítulos largos de cada grupo se mudaron al panel derecho de
// /asesor (ver PanelVacio): en una columna de 380px se comían la lista
// entera, y ahí es justo donde el jurado aterriza primero.
// =====================================================================

export const TITULO_GRUPO: Record<EstadoLead, string> = {
  listo: "Listos para llamar",
  listo_restriccion_cupo: "Listos, con restricción de cupo 90/10",
  nutricion: "En nutrición — todavía no pueden comprar",
};

export const SUBTITULO_GRUPO: Record<EstadoLead, string> = {
  listo: "Pasaron el corte y son afiliados. Cita agendada y proyectos recomendados.",
  listo_restriccion_cupo:
    "Pasaron el corte pero no son afiliados: compiten por el 10% de cupo del proyecto. Validar cupo antes de prometer.",
  nutricion:
    "Nadie se descarta. Cada uno tiene la regla exacta que no pasó y el trigger que lo volvería viable.",
};

const TODOS = "todos";

function normalizar(texto: string) {
  // Sin tildes: quien busca "maria" tiene que encontrar a "María".
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

export function ListaLeads({
  leads,
  seleccionado,
  busqueda = "",
  estado = TODOS,
  className = "",
}: {
  leads: LeadEnCola[];
  seleccionado?: string;
  busqueda?: string;
  estado?: string;
  className?: string;
}) {
  const aguja = normalizar(busqueda.trim());
  const visibles = leads.filter((l) => {
    const coincideEstado = estado === TODOS || l.curado.score.salida === estado;
    const coincideNombre =
      aguja === "" || normalizar(l.curado.lead.evento.nombre).includes(aguja);
    return coincideEstado && coincideNombre;
  });

  const grupos = (Object.keys(PRIORIDAD) as EstadoLead[])
    // Si el asesor filtró por un estado, las otras dos secciones no
    // aportan: serían tres cabeceras con "nadie aquí" debajo.
    .filter((e) => estado === TODOS || e === estado)
    .map((e) => ({ estado: e, items: visibles.filter((l) => l.curado.score.salida === e) }));

  const hayFiltro = aguja !== "" || estado !== TODOS;

  return (
    <div
      className={`border-borde bg-surface-card flex min-h-0 w-full shrink-0 flex-col lg:w-[380px] lg:border-r ${className}`}
    >
      <form
        method="get"
        className="border-borde bg-surface-card sticky top-0 z-10 flex shrink-0 flex-col gap-2 border-b p-4"
      >
        <div className="flex gap-2">
          <CampoBusqueda
            nombre="q"
            valor={busqueda}
            etiqueta="Buscar lead por nombre"
            placeholder="Buscar por nombre"
          />
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <SelectorEstado
              nombre="estado"
              valor={estado}
              etiqueta="Filtrar por estado"
              opciones={[
                { valor: TODOS, texto: "Todos los estados" },
                ...(Object.keys(PRIORIDAD) as EstadoLead[]).map((e) => ({
                  valor: e,
                  texto: ETIQUETA_ESTADO[e],
                })),
              ]}
            />
          </div>
          {/* Sin JS de cliente no hay auto-submit: el botón es la
              única forma honesta de aplicar el filtro. */}
          <button
            type="submit"
            className="bg-brand-azul text-sobre-campo hover:bg-campo-hover shrink-0 cursor-pointer rounded-sm px-4 text-[13px] font-semibold transition-colors duration-[120ms]"
          >
            Filtrar
          </button>
        </div>
        {hayFiltro && (
          <p className="text-texto-tenue text-[13px]">
            <span className="cifra">{visibles.length}</span> de{" "}
            <span className="cifra">{leads.length}</span> leads ·{" "}
            <Link href="/asesor" className="text-enlace hover:underline">
              quitar filtros
            </Link>
          </p>
        )}
      </form>

      <div className="min-h-0 flex-1 lg:overflow-y-auto">
        {grupos.map(({ estado: e, items }) => (
          <section key={e}>
            <h2 className="border-borde bg-surface-sunken text-texto-suave sticky top-0 border-b px-4 py-2 text-[13px] font-bold">
              {TITULO_GRUPO[e]}{" "}
              <span className="cifra text-texto-tenue font-normal">
                ({items.length})
              </span>
            </h2>

            {items.length === 0 ? (
              <p className="text-texto-tenue px-4 py-6 text-center text-[13px]">
                Nadie en este grupo por ahora.
              </p>
            ) : (
              <div className="divide-borde divide-y">
                {items.map((item) => (
                  <FilaLead
                    key={item.curado.lead.evento.lead_id}
                    item={item}
                    activo={item.curado.lead.evento.lead_id === seleccionado}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
