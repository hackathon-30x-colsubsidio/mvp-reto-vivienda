import { listarCola } from "@/lib/leads-repo";
import { colaHistoricaSintetica } from "@/lib/fixtures/cola-historica";
import type { DatosTablero } from "./tipos";

/**
 * Carga todo lo que el tablero necesita.
 *
 * Los leads REALES salen de `listarCola()`, que ya trae el fallback
 * Supabase → fixtures y dice cuál de los dos fue. Encima se le suma el
 * telón sintético, que existe solo para que las métricas por día tengan
 * serie (`lib/fixtures/cola-historica.ts` explica el porqué completo).
 *
 * Los reales van primero: en un empate de puntaje, el lead de verdad
 * queda arriba del sintético.
 *
 * @param hoy Ancla temporal. Se inyecta para que los tests la fijen; en
 *   la página es el reloj del servidor, que nunca hidrata en cliente
 *   (la ruta es `force-dynamic`, Server Component puro).
 */
export async function cargarTablero(hoy: Date = new Date()): Promise<DatosTablero> {
  const { leads, origen } = await listarCola();

  return {
    leads: [...leads, ...colaHistoricaSintetica(hoy)],
    origen,
    hoy,
  };
}
