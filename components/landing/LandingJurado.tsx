"use client";

import { useState } from "react";
import type { LeadEvento, PerfilConocido } from "@/lib/types";
import { leadsEvento, perfilesConocidos } from "@/lib/fixtures";
import { enriquecerSimulado } from "@/lib/conversacion/enriquecimiento-simulado";
import { TarjetaPersonaje } from "./TarjetaPersonaje";
import { FormularioSoyYo } from "./FormularioSoyYo";

const personajes = [
  {
    emoji: "🏠",
    etiqueta: "Afiliado, listo",
    titulo: "Diana Marcela Ríos",
    descripcion:
      "Afiliada a Colsubsidio, con ingreso suficiente para la cuota del proyecto. El camino directo a cita.",
    evento: leadsEvento.afiliadoListo,
    perfil: perfilesConocidos.afiliadoListo,
  },
  {
    emoji: "🔑",
    etiqueta: "No afiliado, listo",
    titulo: "Carlos Andrés Muñoz",
    descripcion:
      "No es afiliado, pero sí puede comprar: queda marcado contra el cupo 90/10 del proyecto, no se le descarta.",
    evento: leadsEvento.noAfiliadoListo,
    perfil: perfilesConocidos.noAfiliadoListo,
  },
  {
    emoji: "🌱",
    etiqueta: "Nutrición",
    titulo: "Yuliana Andrea Pérez",
    descripcion:
      "Hoy no le alcanza la cuota bajo el tope legal del 40%. No se descarta: cae a nutrición con su trigger de recontacto.",
    evento: leadsEvento.nutricion,
    perfil: perfilesConocidos.nutricion,
  },
];

export function LandingJurado({
  onIniciar,
}: {
  onIniciar: (evento: LeadEvento, perfil: PerfilConocido) => void;
}) {
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  return (
    <div className="min-h-[100dvh] bg-fondo">
      {/* El riel: el encabezado del formato, teñido de campo completo. */}
      <div className="bg-campo">
        <div className="mx-auto flex max-w-4xl flex-wrap items-baseline justify-between gap-x-6 gap-y-1 px-6 py-4">
          <span className="text-sm font-bold tracking-[0.08em] text-sobre-campo uppercase">
            Colsubsidio · Vivienda
          </span>
          <span className="cifra text-xs text-sobre-campo-suave">
            Curado de leads · MVP
          </span>
        </div>
      </div>

      <main className="mx-auto flex max-w-4xl flex-col px-6 py-10">
        <header className="max-w-[36ch]">
          <h1 className="text-[clamp(2rem,5vw,3rem)] leading-[1.05] font-bold tracking-[-0.03em] text-tinta">
            Un lead de pauta, calificado antes de que suene el teléfono.
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-tinta-suave">
            Tres caminos, tres salidas.{" "}
            <span className="resaltado font-bold">
              Ninguno termina en descartado.
            </span>
          </p>
        </header>

        <p className="mt-8 text-base text-tinta-suave">
          Abre un personaje y recorre su conversación completa, o entra con tus
          propios datos.
        </p>

        {/* El bloque reglado: tres paneles del mismo formato, divididos
            por regla. No son tres tarjetas flotando. */}
        <div className="mt-4 grid overflow-hidden rounded-md border-2 border-borde sm:grid-cols-3 sm:divide-x-2 divide-y-2 sm:divide-y-0 divide-borde">
          {personajes.map((p) => (
            <TarjetaPersonaje
              key={p.evento.lead_id}
              emoji={p.emoji}
              etiqueta={p.etiqueta}
              titulo={p.titulo}
              descripcion={p.descripcion}
              onSeleccionar={() => onIniciar(p.evento, p.perfil)}
            />
          ))}
        </div>

        <div className="mt-6 max-w-md">
          {mostrarFormulario ? (
            <FormularioSoyYo
              onCancelar={() => setMostrarFormulario(false)}
              onEnviar={(evento) =>
                onIniciar(evento, enriquecerSimulado(evento.cedula))
              }
            />
          ) : (
            <button
              onClick={() => setMostrarFormulario(true)}
              className="w-full rounded-sm border-2 border-azul bg-papel px-4 py-3 text-sm font-bold text-azul transition-colors hover:bg-salida-suave"
            >
              Soy yo — quiero perfilarme con mis datos
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
