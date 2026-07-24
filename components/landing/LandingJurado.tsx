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
    <div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="flex flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Vivienda — curado de leads
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Elige un personaje y recorre su conversación completa, o entra con
          tus propios datos.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
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

      <div className="mx-auto w-full max-w-sm">
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
            className="w-full rounded-full border border-zinc-400 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Soy yo — quiero perfilarme con mis datos
          </button>
        )}
      </div>
    </div>
  );
}
