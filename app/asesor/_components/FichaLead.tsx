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
 *
 * Visualmente es un formato oficial (DESIGN.md, "El formato sellado"):
 * riel de campo azul con el folio, sello de salida arriba a la derecha,
 * el veredicto en campo completo y los factores en tabla reglada.
 */
export function FichaLead({ item }: { item: LeadEnCola }) {
  const { curado } = item;
  const { evento, perfil, respuestas } = curado.lead;
  const esNutricion = curado.score.salida === "nutricion";

  return (
    <article className="overflow-hidden rounded-md border-2 border-borde bg-papel">
      {/* El riel del formato: vuelta atrás a la izquierda, folio a la
          derecha. Es el encabezado impreso de la hoja. */}
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 bg-campo px-6 py-3">
        <Link
          href="/asesor"
          className="text-sm font-bold text-sobre-campo hover:underline"
        >
          ← Volver a la cola
        </Link>
        <span className="cifra text-xs text-sobre-campo-suave">
          Folio {evento.lead_id}
        </span>
      </div>

      <div className="space-y-10 px-6 py-8 sm:px-8">
        <header>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-[clamp(1.75rem,4vw,2.75rem)] leading-[1.05] font-bold tracking-[-0.03em] text-tinta">
                {evento.nombre}
              </h1>
              <p className="cifra mt-2 text-base text-tinta-suave">
                {evento.celular} · CC {evento.cedula}
              </p>
              {/* La FUENTE del lead, visible.
                  Es lo que sostiene la narrativa multi-canal del spec §4
                  paso 1 ("cualquier canal futuro emite el mismo evento"):
                  se registraba desde la ingesta y no se veía en ninguna
                  pantalla. Aquí el asesor —y el jurado— ven que el lead
                  entró por pauta y por cuál. */}
              <p className="mt-3 flex flex-wrap items-center gap-2 text-base">
                <span
                  data-testid="fuente-lead"
                  className="inline-flex items-center rounded-sm border-2 border-borde bg-papel-hueco px-2.5 py-1 text-sm font-bold text-tinta"
                >
                  Entró por {NOMBRE_FUENTE[evento.fuente] ?? evento.fuente}
                </span>
                {evento.proyecto_interes && (
                  <span className="text-tinta-suave">
                    preguntó por <strong className="text-tinta">{evento.proyecto_interes}</strong>
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

        {/* El veredicto en lenguaje natural, en campo azul completo: es
            el renglón de dictamen del formato. Cita los factores — es la
            otra mitad del "cero caja negra": la tabla dice qué se evaluó,
            esto dice qué significa. */}
        <section className="rounded-md bg-campo px-6 py-6">
          <h2 className="text-xs font-bold tracking-[0.08em] text-sobre-campo-suave uppercase">
            Por qué está aquí
          </h2>
          <p
            data-testid="explicacion"
            className="mt-3 max-w-[68ch] text-lg leading-relaxed text-sobre-campo"
          >
            {curado.explicacion}
          </p>
        </section>

        {/* CRITERIO 2: todos los factores, ninguno escondido. */}
        <section>
          <h2 className="text-xl font-bold tracking-tight text-tinta">
            Cómo se calificó{" "}
            <span className="cifra font-normal text-tinta-suave">
              ({curado.score.factores.length} factores)
            </span>
          </h2>
          <p className="mt-1 mb-4 max-w-[68ch] text-base text-tinta-suave">
            Todos los factores que evaluó el motor, con lo que se midió y si
            cumple.{" "}
            {/* El único trazo de la pantalla, sobre la frase que
                sostiene la restricción no-negociable del proyecto. */}
            <span className="resaltado font-bold">Ninguno se oculta.</span>
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
        <section className="rounded-md border-2 border-borde bg-papel-hueco px-6 py-6">
          <h2 className="text-xl font-bold tracking-tight text-tinta">
            Datos del perfil
          </h2>

          <dl className="mt-4 grid gap-x-10 gap-y-4 sm:grid-cols-2">
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

          {/* Habeas data (spec §6): evidencia auditable, con su hora.
              Va al pie y con regla encima, como la nota legal de un
              formato oficial. */}
          <p className="mt-6 border-t-2 border-borde pt-4 text-base text-tinta-suave">
            {respuestas.consentimiento?.otorgado ? (
              <>
                <strong className="text-tinta">
                  Autorización de tratamiento de datos otorgada
                </strong>{" "}
                (Ley 1581 de 2012)
                {respuestas.consentimiento.timestamp && (
                  <> el {fechaLarga(respuestas.consentimiento.timestamp)}</>
                )}
                .
              </>
            ) : (
              <strong className="text-rojo">
                Sin autorización de tratamiento de datos registrada.
              </strong>
            )}
          </p>
        </section>
      </div>
    </article>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs font-bold tracking-[0.08em] text-tinta-suave uppercase">
        {termino}
      </dt>
      <dd className="mt-0.5 text-base text-tinta">{valor}</dd>
    </div>
  );
}
