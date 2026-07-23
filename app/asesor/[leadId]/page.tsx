import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { obtenerLead } from "@/lib/leads-repo";
import { FichaLead } from "../_components/FichaLead";
import { AvisoOrigen } from "../_components/AvisoOrigen";

// El re-enganche cambia la ficha: no se cachea.
export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ leadId: string }>;
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

export default async function FichaLeadPage({ params }: Props) {
  const { leadId } = await params;
  const { lead, origen } = await obtenerLead(leadId);

  if (!lead) notFound();

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <AvisoOrigen origen={origen} />
      <FichaLead item={lead} />
    </main>
  );
}
