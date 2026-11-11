import { SUPABASE_ACTIF, sb, verifier } from "./supabase";
import type { NouveauProfilPro } from "./types";

/** Ligne de la table `pros` (profil public d'un artisan ou d'une boutique). */
export type LignePro = {
  id: string;
  type: "artisan" | "boutique";
  nom: string;
  metier: string | null;
  ville: string;
  quartier: string;
  zones: string[];
  adresse: string | null;
  description: string;
  numero_public: boolean;
  telephone_public: string | null;
  image: string | null;
  statut: "en_verification" | "verifie" | "suspendu";
  cree_le: string;
};

/** Crée le profil pro du compte connecté (numéro vérifié par SMS) : public + coordonnées privées. */
export async function creerProfilProSupabase(id: string, p: NouveauProfilPro): Promise<void> {
  verifier(
    await sb()
      .from("pros")
      .insert({
        id,
        type: p.type,
        nom: p.nom,
        metier: p.type === "artisan" ? (p.metier ?? null) : null,
        ville: p.ville,
        quartier: p.quartier,
        zones: p.type === "artisan" ? (p.zones ?? []) : [],
        adresse: p.adresse || null,
        numero_public: p.numeroPublic,
        telephone_public: p.numeroPublic ? p.telephone : null,
      }),
  );
  verifier(
    await sb().from("pros_prive").insert({
      id,
      telephone: p.telephone,
      telephones: p.telephones,
      responsable: p.responsable,
    }),
  );
}

/** Profil pro du compte connecté, ou null (pas de compte pro). */
export async function monProfilPro(id: string): Promise<LignePro | null> {
  if (!SUPABASE_ACTIF) return null;
  return verifier(await sb().from("pros").select("*").eq("id", id).maybeSingle()) as LignePro | null;
}

/** Met à jour la fiche publique du pro connecté. */
export async function majProfilPro(
  id: string,
  champs: Partial<Pick<LignePro, "description" | "zones" | "numero_public" | "telephone_public" | "nom" | "image">>,
): Promise<void> {
  verifier(await sb().from("pros").update(champs).eq("id", id));
}
