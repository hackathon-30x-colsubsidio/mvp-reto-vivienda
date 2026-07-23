import type { OrigenDatos } from "@/lib/leads-repo";

/**
 * Avisa cuando la pantalla está corriendo con fixtures en vez de la DB.
 *
 * Existe por honestidad con el jurado: si Supabase no responde, el demo
 * sigue en pie pero NO fingimos que los datos vienen de una base real.
 * En modo "supabase" no pinta nada.
 */
export function AvisoOrigen({ origen }: { origen: OrigenDatos }) {
  if (origen === "supabase") return null;

  return (
    <p className="mb-6 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-base text-gray-600">
      <strong>Modo demo sin base de datos.</strong> Estos 3 leads salen de
      fixtures locales, no de Supabase. Configura <code>.env</code> para
      conectar la DB real.
    </p>
  );
}
