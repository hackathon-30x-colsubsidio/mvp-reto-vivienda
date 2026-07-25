import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { obtenerLead, listarCola, obtenerConversacion } from "@/lib/leads-repo";
import { FichaLead } from "../_components/FichaLead";
import { HiloConversacion } from "../_components/HiloConversacion";
import { AvisoOrigen } from "../_components/AvisoOrigen";
import { ListaLeads } from "../_components/ListaLeads";

// El re-enganche cambia la ficha: no se cachea.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ leadId: string }>;
  searchParams: Promise<{ q?: string; estado?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { leadId } = await params;
  const { lead } = await obtenerLead(leadId);

  return {
    title: lead
      ? `${lead.curado.lead.evento.nombre} · Colsubsidio Vivienda`
      : "Lead no encontrado",
  };
}

export default async function FichaLeadPage({ params, searchParams }: Props) {
  const { leadId } = await params;
  const { q, estado } = await searchParams;

  // Dos consultas contra la misma tabla: `obtenerLead` conserva el
  // notFound() exacto de antes (un lead puede existir sin estar en la
  // cola ordenada) y `listarCola` alimenta la lista de al lado. A escala
  // de demo no vale la pena fusionarlas.
  const [{ lead, origen }, { leads }, { mensajes }] = await Promise.all([
    obtenerLead(leadId),
    listarCola(),
    obtenerConversacion(leadId),
  ]);

  if (!lead) notFound();

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* En móvil la lista desaparece: la ficha necesita el ancho
          completo, y volver a la bandeja es el enlace de abajo. */}
      <ListaLeads
        leads={leads}
        seleccionado={leadId}
        busqueda={q}
        estado={estado}
        className="hidden lg:flex"
      />

      <main className="min-h-0 flex-1 px-5 py-6 lg:overflow-y-auto lg:px-8 lg:py-8">
        <Link
          href="/asesor"
          className="text-enlace mb-4 inline-flex items-center gap-1.5 text-[13px] font-semibold hover:underline lg:hidden"
        >
          <ArrowLeft className="size-4" aria-hidden="true" strokeWidth={2} />
          Volver a la bandeja
        </Link>
        <AvisoOrigen origen={origen} />
        <FichaLead item={lead} />
        <HiloConversacion mensajes={mensajes} />
      </main>
    </div>
  );
}
