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
    <p className="border-filo-borde text-texto-suave rounded-[10px] border border-dashed px-3.5 py-2 text-[12px] leading-normal">
      <strong className="text-texto">Modo demo sin base de datos.</strong> Estos
      3 leads salen de fixtures locales, no de Supabase. Configura{" "}
      <code className="cifra">.env</code> para conectar la DB real.
    </p>
  );
}
