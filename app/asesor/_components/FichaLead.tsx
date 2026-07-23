import Link from "next/link";
import type { LeadEnCola } from "@/lib/types-asesor";
import { BadgeEstado, BadgeReEnganchado } from "./BadgeEstado";
import { TablaFactores } from "./TablaFactores";
import { BloqueProyectos } from "./BloqueProyectos";
import { BloqueCita } from "./BloqueCita";
import { BloqueNutricion } from "./BloqueNutricion";
import { fechaLarga, NOMBRE_FUENTE } from "@/lib/formato";

/**
 * La ficha del lead: el clímax del demo.
 *
 * Orden deliberado — es el orden en que el asesor necesita la
 * información: quién es → el veredicto en una frase → por qué (todos
 * los factores) → qué hacer (proyectos, cita, o el trigger).
 */
export function FichaLead({ item }: { item: LeadEnCola }) {
  const { curado } = item;
  const { evento, perfil, respuestas } = curado.lead;
  const esNutricion = curado.score.salida === "nutricion";

  return (
    <article className="space-y-8">
      <header>
        <Link
          href="/asesor"
          className="text-base font-semibold text-blue-700 hover:underline"
        >
          ← Volver a la cola
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-gray-900">
              {evento.nombre}
            </h1>
            <p className="mt-1 text-lg text-gray-600">
              {evento.celular} · CC {evento.cedula}
            </p>
            {/* La FUENTE del lead, visible.
                Es lo que sostiene la narrativa multi-canal del spec §4
                paso 1 ("cualquier canal futuro emite el mismo evento"):
                se registraba desde la ingesta y no se veía en ninguna
                pantalla. Aquí el asesor —y el jurado— ven que el lead
                entró por pauta y por cuál. */}
            <p className="mt-2 flex flex-wrap items-center gap-2 text-base">
              <span
                data-testid="fuente-lead"
                className="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 font-bold text-gray-800 ring-1 ring-gray-300"
              >
                Entró por {NOMBRE_FUENTE[evento.fuente] ?? evento.fuente}
              </span>
              {evento.proyecto_interes && (
                <span className="text-gray-600">
                  preguntó por <strong>{evento.proyecto_interes}</strong>
                </span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {item.re_enganchado_en && <BadgeReEnganchado />}
            <BadgeEstado estado={curado.score.salida} />
          </div>
        </div>
      </header>

      {/* El veredicto en lenguaje natural. Cita los factores: es la
          otra mitad del "cero caja negra" — la tabla dice qué se
          evaluó, esto dice qué significa. */}
      <section className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
        <h2 className="text-xl font-bold text-blue-900">Por qué está aquí</h2>
        <p
          data-testid="explicacion"
          className="mt-2 text-lg leading-relaxed text-blue-950"
        >
          {curado.explicacion}
        </p>
      </section>

      {/* CRITERIO 2: todos los factores, ninguno escondido. */}
      <section>
        <h2 className="mb-1 text-xl font-bold text-gray-900">
          Cómo se calificó{" "}
          <span className="font-normal text-gray-500">
            ({curado.score.factores.length} factores)
          </span>
        </h2>
        <p className="mb-3 text-base text-gray-600">
          Todos los factores que evaluó el motor, con lo que se midió y si
          cumple. Ninguno se oculta.
        </p>
        <TablaFactores factores={curado.score.factores} />
      </section>

      {esNutricion ? (
        <BloqueNutricion
          score={curado.score}
          leadId={evento.lead_id}
          reEnganchadoEn={item.re_enganchado_en}
        />
      ) : (
        <>
          <BloqueProyectos proyectos={curado.proyectos} />
          {curado.cita && <BloqueCita cita={curado.cita} />}
        </>
      )}

      {/* Lo que ya sabíamos vs. lo que preguntamos. Hace visible el
          criterio 1 (no repreguntar lo conocido) desde la ficha. */}
      <section className="rounded-xl border-2 border-gray-200 bg-gray-50 p-5">
        <h2 className="text-xl font-bold text-gray-900">Datos del perfil</h2>

        <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2">
          <Dato
            termino="Enriquecimiento"
            valor={
              perfil.match
                ? "La cédula estaba en la base de identidades"
                : "Sin match: se perfiló desde cero en la conversación"
            }
          />
          {perfil.afiliado !== undefined && (
            <Dato termino="Afiliación" valor={perfil.afiliado ? "Afiliado" : "No afiliado"} />
          )}
          {perfil.ciudad && <Dato termino="Ciudad" valor={perfil.ciudad} />}
          {perfil.segmento && <Dato termino="Segmento" valor={perfil.segmento} />}
          {(perfil.rango_ingreso ?? respuestas.rango_ingreso_hogar) && (
            <Dato
              termino="Ingreso del hogar"
              valor={perfil.rango_ingreso ?? respuestas.rango_ingreso_hogar!}
            />
          )}
          {respuestas.zona_interes && (
            <Dato termino="Zona de interés" valor={respuestas.zona_interes} />
          )}
          {respuestas.tiene_vivienda !== undefined && (
            <Dato
              termino="Vivienda propia"
              valor={respuestas.tiene_vivienda ? "Sí tiene" : "No tiene"}
            />
          )}
          {respuestas.situacion_crediticia && (
            <Dato termino="Situación crediticia" valor={respuestas.situacion_crediticia} />
          )}
          {respuestas.subsidios && (
            <Dato
              termino="Subsidios"
              valor={
                respuestas.subsidios.length > 0
                  ? respuestas.subsidios.join(", ")
                  : "Ninguno declarado"
              }
            />
          )}
        </dl>

        {/* Habeas data (spec §6): evidencia auditable, con su hora. */}
        <p className="mt-4 border-t border-gray-200 pt-3 text-base text-gray-600">
          {respuestas.consentimiento?.otorgado ? (
            <>
              <strong>Autorización de tratamiento de datos otorgada</strong>{" "}
              (Ley 1581 de 2012)
              {respuestas.consentimiento.timestamp && (
                <> el {fechaLarga(respuestas.consentimiento.timestamp)}</>
              )}
              .
            </>
          ) : (
            <strong className="text-red-700">
              Sin autorización de tratamiento de datos registrada.
            </strong>
          )}
        </p>
      </section>
    </article>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="text-sm font-bold tracking-wide text-gray-500 uppercase">
        {termino}
      </dt>
      <dd className="text-base text-gray-900">{valor}</dd>
    </div>
  );
}
