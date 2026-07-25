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
// ⚠️ SON DOS GRUPOS, NO TRES (spec 06 D7, CERRADA — Mani 2026-07-24).
//    `listo` y `listo_restriccion_cupo` comparten sección y adentro manda
//    el PUNTAJE. Antes eran dos secciones con el no afiliado siempre
//    debajo, así que uno con 71 puntos aparecía bajo un afiliado con 42:
//    la afiliación decidía a quién llamar primero. El mentor lo puso al
//    revés —*"siempre va a ser la prioridad de los ingresos"*—, y la
//    afiliación quedó como desempate (0,05 en lib/scoring/config.ts).
//    La distinción del cupo 90/10 no se pierde: viaja en la píldora de
//    cada fila, que es donde el asesor la necesita.
//
//    `ordenarCola` (lib/types-asesor.ts) ya ordena así; esta pantalla lo
//    deshacía al re-partir por estado.
//
//    Nutrición va aparte, y eso NO es por afiliación: es que todavía no
//    puede comprar. Se ve con su conteo aunque el asesor nunca la abra,
//    que es lo que hace legible "nadie se descarta".
//
// Los subtítulos largos viven aquí pero los pinta el panel derecho de
// /asesor: en una columna de 380px se comían la lista entera, y ahí es
// justo donde el jurado aterriza primero.
// =====================================================================

/**
 * Los grupos de la bandeja. Fuente única: la lista los usa para repartir
 * y el panel derecho de `/asesor` para explicarlos.
 */
export const GRUPOS: {
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
      "Pasaron el corte del 40% (Decreto 583 de 2025), ordenados por puntaje: arriba quien está más cerca de cerrar. A los que no son afiliados la píldora les marca el cupo 90/10, que el asesor valida antes de separar.",
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

  const grupos = GRUPOS
    // Si el asesor filtró por una salida, el otro grupo no aporta: sería
    // una cabecera con "nadie aquí" debajo.
    .filter((g) => estado === TODOS || g.estados.includes(estado as EstadoLead))
    .map((g) => ({
      ...g,
      // `ordenarCola` ya dejó el arreglo en el orden que manda el spec
      // (puntaje dentro del grupo); aquí solo se reparte, no se re-ordena.
      items: visibles.filter((l) => g.estados.includes(l.curado.score.salida)),
    }));

  const hayFiltro = aguja !== "" || estado !== TODOS;

  return (
    <div
      className={`border-filo-borde flex min-h-0 w-full shrink-0 flex-col lg:w-[380px] lg:border-r ${className}`}
      style={{ backgroundImage: "var(--vidrio-hueco)" }}
    >
      <form
        method="get"
        className="vidrio-solido sticky top-0 z-20 flex shrink-0 flex-col gap-2 border-b p-4"
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
            className="bg-brand-azul text-sobre-campo hover:bg-campo-hover shrink-0 cursor-pointer rounded-[10px] px-4 text-[13px] font-semibold transition-colors duration-200"
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
        {grupos.map(({ clave, titulo, vacio, items }) => (
          <section key={clave}>
            {/* NO es sticky, y es a propósito. Cuando lo era, la última
                línea del lead anterior quedaba cortada a media altura
                pegada al título y se leía como texto roto — un artefacto
                permanente a cambio de muy poco, porque el grupo ya se
                sabe sin él: cada fila lleva su píldora de estado. La
                barra de filtros de arriba sí se queda fija: buscar y
                filtrar tienen que estar siempre a mano. */}
            <h2 className="vidrio-solido text-texto-suave border-b px-4 py-2 text-[13px] font-bold">
              {titulo}{" "}
              <span className="cifra text-texto-tenue font-normal">
                ({items.length})
              </span>
            </h2>

            {items.length === 0 ? (
              <p className="text-texto-tenue px-4 py-6 text-center text-[13px]">
                {vacio}
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
