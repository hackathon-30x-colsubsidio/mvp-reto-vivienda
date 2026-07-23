import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// =====================================================================
// Cliente de Supabase — SOLO SERVIDOR.
//
// El import de "server-only" hace que el build FALLE si alguien
// importa este archivo desde un componente de cliente. No es paranoia:
// SUPABASE_KEY es la clave SECRETA y el repo es público.
//
// Las 3 tablas tienen RLS activado sin policies (ADR 0003): solo esta
// clave pasa. El navegador nunca habla con Supabase — todo va por las
// API routes de /api/leads y /api/citas.
// =====================================================================

let cliente: SupabaseClient | null = null;

/**
 * Devuelve el cliente de Supabase, o `null` si no hay credenciales.
 *
 * Devolver `null` en vez de reventar es deliberado: sin `.env` el
 * equipo puede correr `npm run dev` y ver /asesor con las fixtures.
 * Quien no tenga las credenciales igual puede trabajar.
 */
export function getSupabase(): SupabaseClient | null {
  if (cliente) return cliente;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_KEY;

  if (!url || !key) return null;

  cliente = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

/** ¿Hay credenciales configuradas? Para avisarlo en la UI. */
export function hayCredenciales(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_KEY);
}
