import type { LeadEnCola } from "@/lib/types-asesor";
import { conteoFactores } from "@/lib/types-asesor";
import { Pildora, PildoraReEnganchado } from "@/components/ui/Pildora";
import { EtiquetaSimulado } from "@/components/ui/EtiquetaSimulado";
import { Tarjeta, TarjetaConTitulo } from "@/components/ui/Tarjeta";
import { TablaFactores } from "./TablaFactores";
import { BloqueProyectos } from "./BloqueProyectos";
import { BloqueCita } from "./BloqueCita";
import { BloqueNutricion } from "./BloqueNutricion";
import { BloqueRecursos } from "./BloqueRecursos";
import { TablaPuntaje } from "./TablaPuntaje";
import {
  etiquetaCrediticia,
  fechaCorta,
  fechaLarga,
  NOMBRE_FUENTE,
  pesos,
} from "@/lib/formato";

/**
 * La ficha del lead: el clímax del demo.
 *
 * Orden deliberado — es el orden en que el asesor necesita la
 * información: quién es → el veredicto en una frase → por qué (todos
 * los factores) → qué hacer (proyectos, cita, o el trigger).
 *
 * Es el puerto del panel derecho de `ui_kits/advisor-panel/`: cada
 * bloque es una tarjeta con su título, y el puntaje abre con el
 * tratamiento `ScoreSummary` —cifra grande, divisor, etiqueta de
 * salida— que el design system reserva para él.
 *
 * El riel azul que traía esta ficha desapareció: ahora la marca y la
 * navegación viven en el shell (app/asesor/layout.tsx), y el folio se
 * mudó al resumen del puntaje.
 */
export function FichaLead({ item }: { item: LeadEnCola }) {
  const { curado } = item;
  const { evento, perfil, respuestas } = curado.lead;
  const esNutricion = curado.score.salida === "nutricion";
  const puntaje = curado.score.puntaje;
  // Se cuentan solo los factores que de verdad cumplen o no: la afiliación, el
  // cupo 90/10 y la similitud son informativos, y meterlos en el conteo inflaba
  // el "cumplen" con filas que nunca podían no cumplir. El criterio vive en
  // `conteoFactores` porque el renglón de la bandeja tiene que decir lo mismo.
  const { cumplen, total } = conteoFactores(curado.score.factores);

  return (
    <article className="mx-auto max-w-3xl space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-texto text-[30px] leading-tight font-extrabold tracking-[-0.02em]">
            {evento.nombre}
          </h1>
          <p className="cifra text-texto-suave mt-1.5 text-[13px]">
            {evento.celular} · CC {evento.cedula}
          </p>
          {/* La FUENTE del lead, visible. Es lo que sostiene la
              narrativa multi-canal del spec §4 paso 1 ("cualquier canal
              futuro emite el mismo evento"): se registraba desde la
              ingesta y no se veía en ninguna pantalla. */}
          <p className="mt-3 flex flex-wrap items-center gap-2 text-[15px]">
            <span
              data-testid="fuente-lead"
              className="border-borde bg-surface-sunken text-texto inline-flex items-center rounded-sm border px-2.5 py-1 text-[13px] font-semibold"
            >
              Entró por {NOMBRE_FUENTE[evento.fuente] ?? evento.fuente}
            </span>
            {evento.proyecto_interes && (
              <span className="text-texto-suave">
                preguntó por{" "}
                <strong className="text-texto">{evento.proyecto_interes}</strong>
              </span>
            )}
            {item.sintetico && <EtiquetaSimulado />}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.re_enganchado_en && <PildoraReEnganchado />}
          <Pildora estado={curado.score.salida} />
        </div>
      </header>

      {/* Tratamiento `ScoreSummary` del design system. El puntaje nunca
          aparece solo: la tabla de más abajo trae las cuentas completas,
          y esa es la mitad que no se negocia. */}
      <Tarjeta className="flex flex-wrap items-center gap-x-6 gap-y-4 p-5">
        <p className="flex shrink-0 flex-col leading-none">
          <span
            data-testid="puntaje-ficha"
            className="cifra text-texto text-[38px] font-bold"
          >
            {puntaje}
          </span>
          <span className="text-texto-tenue mt-1 text-[12px]">de 100</span>
        </p>
        <div className="bg-borde hidden w-px self-stretch sm:block" />
        <div className="min-w-0">
          <p className="cifra text-texto-tenue text-[12px]">
            Folio {evento.lead_id} · recibido {fechaCorta(item.creado_en)}
          </p>
          {/* Aquí NO va la etiqueta de la salida: ya está en la píldora
              del encabezado, cuatro centímetros más arriba. Repetirla no
              agregaba información y rompía el test que vigila que el
              cupo 90/10 aparezca exactamente donde debe. En su lugar, el
              dato que el puntaje solo no dice: de cuántos factores
              salió. */}
          <p className="font-display text-texto mt-1 text-[20px] font-bold">
            <span className="cifra">
              {cumplen} de {total}
            </span>{" "}
            factores cumplen
          </p>
        </div>
      </Tarjeta>

      {/* El veredicto en lenguaje natural, sobre superficie invertida: es
          el renglón de dictamen del formato. Cita los factores — es la
          otra mitad del "cero caja negra": la tabla dice qué se evaluó,
          esto dice qué significa. */}
      <section className="bg-surface-inverse rounded-md px-5 py-5">
        <h2 className="rotulo text-sobre-campo-suave">Por qué está aquí</h2>
        <p
          data-testid="explicacion"
          className="text-sobre-campo mt-2 text-[17px] leading-normal"
        >
          {curado.explicacion}
        </p>
      </section>

      {/* CRITERIO 2: todos los factores, ninguno escondido. */}
      <Tarjeta>
        <div className="border-borde border-b px-5 py-4">
          <h2 className="font-display text-texto text-[16px] font-bold">
            Cómo se calificó{" "}
            <span className="cifra text-texto-tenue font-normal">
              ({curado.score.factores.length} factores)
            </span>
          </h2>
          <p className="text-texto-suave mt-1 text-[13px] leading-normal">
            Todos los factores que evaluó el motor, con lo que se midió y si
            cumple.{" "}
            {/* El único trazo de la pantalla, sobre la frase que
                sostiene la restricción no-negociable del proyecto. */}
            <span className="resaltado font-bold">Ninguno se oculta.</span>
          </p>
        </div>
        <div className="px-5 py-4">
          <TablaFactores factores={curado.score.factores} />
        </div>
      </Tarjeta>

      {/* De dónde sale el número que ordena el tablero. Va después de
          los factores a propósito: primero qué se evaluó, después
          cuánto pesó cada cosa. */}
      <Tarjeta>
        <div className="border-borde border-b px-5 py-4">
          <h2 className="font-display text-texto text-[16px] font-bold">
            Cómo se arma el puntaje{" "}
            <span className="cifra text-texto-tenue font-normal">
              ({puntaje}/100)
            </span>
          </h2>
          <p className="text-texto-suave mt-1 text-[13px] leading-normal">
            El puntaje no decide nada —quien decide es el corte del 40%— pero es
            el que ordena la lista del tablero. Estas son sus cuentas: cada
            factor con su peso, la señal que midió el motor y lo que aportó.
          </p>
        </div>
        <div className="px-5 py-4">
          <TablaPuntaje factores={curado.score.factores} puntaje={puntaje} />
        </div>
      </Tarjeta>

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

      {/* Capa ORTOGONAL: va en ambas ramas. Un `listo` con cita puede recibir
          recurso igual (Carlos); se auto-oculta si el lead no tiene ninguno
          (Diana). No es el premio de consolación de la nutrición. */}
      <BloqueRecursos recursos={curado.recursos} />

      {/* Lo que ya sabíamos vs. lo que preguntamos. Hace visible el
          criterio 1 (no repreguntar lo conocido) desde la ficha. */}
      <TarjetaConTitulo titulo="Datos del perfil">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
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
          {/* El monto exacto, no solo el rango: es el número que entra al gate
              del 40%, y hasta hoy solo se veía incrustado en el texto de un
              factor. Si salió del punto medio de un rango conocido (criterio 1,
              no se repregunta) se dice, porque no es lo mismo que un dato que
              la persona tecleó. */}
          {respuestas.ingreso_hogar_mensual !== undefined && (
            <Dato
              termino="Ingreso mensual (insumo del corte del 40%)"
              valor={
                !respuestas.rango_ingreso_hogar && perfil.rango_ingreso
                  ? `${pesos(respuestas.ingreso_hogar_mensual)} (punto medio del rango conocido)`
                  : pesos(respuestas.ingreso_hogar_mensual)
              }
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
            // El enum crudo ("sin_info") no se muestra: se lee como error del
            // sistema, y el sello del lead ya usa estas mismas etiquetas.
            <Dato
              termino="Situación crediticia"
              valor={`${etiquetaCrediticia(respuestas.situacion_crediticia)} (autorreportada)`}
            />
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
        <p className="border-borde text-texto-suave mt-5 border-t pt-4 text-[13px] leading-normal">
          {respuestas.consentimiento?.otorgado ? (
            <>
              <strong className="text-texto">
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
      </TarjetaConTitulo>
    </article>
  );
}

function Dato({ termino, valor }: { termino: string; valor: string }) {
  return (
    <div>
      <dt className="rotulo">{termino}</dt>
      <dd className="text-texto mt-0.5 text-[15px]">{valor}</dd>
    </div>
  );
}
