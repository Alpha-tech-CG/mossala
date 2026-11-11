import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { artisans, boutiques } from "../data";

/**
 * Base de données Supabase (production). Schéma : supabase/migrations/.
 *
 * Interrupteur : tant que NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY ne sont pas
 * renseignés (.env.local en local, variables d'environnement de l'hébergeur en ligne),
 * l'application reste en MAQUETTE : tout est gardé dans le navigateur, comme avant.
 *
 * Identité : le code SMS passe par Firebase ; son jeton est transmis à Supabase
 * (Third-party auth → Firebase), qui applique les règles RLS avec l'uid Firebase.
 */
const URL_SUPABASE = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const CLE_PUBLIQUE = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SUPABASE_ACTIF = Boolean(URL_SUPABASE && CLE_PUBLIQUE);

/**
 * Les artisans et boutiques de démonstration (src/lib/data.ts) n'existent pas dans la base :
 * les échanges avec eux restent dans le navigateur, même quand Supabase est actif.
 */
const IDS_DEMO = new Set([...artisans.map((a) => a.id), ...boutiques.map((b) => b.id)]);
export const estDemo = (id: string) => !SUPABASE_ACTIF || IDS_DEMO.has(id);

let client: SupabaseClient | null = null;

/** Client navigateur : chaque requête porte le jeton du compte connecté (ou aucun). */
export function sb(): SupabaseClient {
  if (!SUPABASE_ACTIF) throw new Error("Supabase n'est pas configuré (NEXT_PUBLIC_SUPABASE_URL / ANON_KEY).");
  client ??= createClient(URL_SUPABASE, CLE_PUBLIQUE, {
    accessToken: async () => {
      const { jetonIdentite } = await import("./firebase");
      return jetonIdentite();
    },
  });
  return client;
}

/** Client serveur, sans compte : lectures publiques (pros vérifiés, réalisations). */
export function sbPublic(): SupabaseClient {
  return createClient(URL_SUPABASE, CLE_PUBLIQUE, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Erreur Supabase/PostgREST → message lisible. */
export function erreurSupabase(e: unknown): string {
  const m = (e as { message?: string; code?: string }) ?? {};
  if (m.code === "42501" || /row-level security/i.test(m.message ?? ""))
    return "Action refusée : reconnectez-vous puis réessayez.";
  if (/fetch|network/i.test(m.message ?? "")) return "Pas de connexion internet. Réessayez.";
  return m.message ? `Erreur : ${m.message}` : "Une erreur est survenue. Réessayez.";
}

/** Lève l'erreur d'une réponse Supabase, sinon renvoie ses données. */
export function verifier<T>(r: { data: T; error: unknown }): T {
  if (r.error) throw r.error;
  return r.data;
}
