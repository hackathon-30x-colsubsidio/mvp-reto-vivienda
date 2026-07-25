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
// ⚠️ SON DOS SECCIONES, NO TRES, y es una decisión cerrada
//    ([spec 06](docs/specs/06-dashboard-asesor.md), Mani 2026-07-24).
//    `listo` y `listo_restriccion_cupo` comparten sección porque
//    separarlas ponía al no afiliado SIEMPRE debajo del afiliado: uno
//    con 71 puntos aparecía bajo uno con 42, o sea que la afiliación
//    decidía a quién llamar primero. El mentor lo puso al revés
//    —*"siempre va a ser la prioridad de los ingresos"*— así que dentro
//    del grupo manda el puntaje y la afiliación solo desempata (0,05 en
//    lib/scoring/config.ts). La píldora de cada fila sigue diciendo
//    quién trae restricción de cupo: se distingue sin re-ordenar.
//
//    Nutrición sigue aparte, y eso NO es por afiliación: es que todavía
//    no puede comprar. Se ve con su conteo aunque el asesor nunca la
//    abra, que es lo que hace legible "nadie se descarta".
//
// Los subtítulos largos de cada grupo se mudaron al panel derecho de
// /asesor: en una columna de 380px se comían la lista entera, y ahí es
// justo donde el jurado aterriza primero.
// =====================================================================

/** Las secciones de la bandeja. El orden es el orden en que se pintan. */
const SECCIONES = [
  { clave: "puede_comprar", salidas: ["listo", "listo_restriccion_cupo"] },
  { clave: "nutricion", salidas: ["nutricion"] },
] as const satisfies ReadonlyArray<{
  clave: string;
  salidas: ReadonlyArray<EstadoLead>;
}>;

type ClaveSeccion = (typeof SECCIONES)[number]["clave"];

export const TITULO_GRUPO: Record<ClaveSeccion, string> = {
  puede_comprar: "Puede comprar ahora",
  nutricion: "En nutrición — todavía no pueden comprar",
};

export const SUBTITULO_GRUPO: Record<ClaveSeccion, string> = {
  puede_comprar:
    "Pasaron el corte, ordenados por puntaje. Los que traen restricción de cupo 90/10 van marcados: hay que validar cupo antes de prometer, pero no por eso se llaman después.",
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

  const grupos = SECCIONES
    // Si el asesor filtró por una salida, la otra sección no aporta:
    // sería una cabecera con "nadie aquí" debajo.
    .filter((s) => estado === TODOS || (s.salidas as readonly string[]).includes(estado))
    .map((s) => ({
      clave: s.clave,
      // `ordenarCola` ya dejó el arreglo en el orden que manda el spec
      // (puntaje dentro del grupo); aquí solo se reparte, no se re-ordena.
      items: visibles.filter((l) =>
        (s.salidas as readonly string[]).includes(l.curado.score.salida),
      ),
    }));

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
        {grupos.map(({ clave, items }) => (
          <section key={clave}>
            <h2 className="border-borde bg-surface-sunken text-texto-suave sticky top-0 border-b px-4 py-2 text-[13px] font-bold">
              {TITULO_GRUPO[clave]}{" "}
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
