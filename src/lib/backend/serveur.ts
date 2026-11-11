import { cacheLife, cacheTag } from "next/cache";
import { getMetier, metiers, type Artisan } from "../data";
import type { LignePro } from "./pros";
import { versRealisation, type LigneRealisation } from "./realisations-db";
import { SUPABASE_ACTIF, sbPublic } from "./supabase";

/**
 * Lectures publiques côté serveur (pros vérifiés et leurs réalisations), mises en cache
 * quelques minutes. Sans Supabase configuré, elles renvoient des listes vides : le site
 * n'affiche alors que les artisans de démonstration.
 * Invalidation immédiate possible avec revalidateTag("pros").
 */

/** Un pro vérifié de la base, présenté comme les artisans de la vitrine. */
function versArtisan(p: LignePro, realisations: LigneRealisation[] = []): Artisan {
  return {
    id: p.id,
    nom: p.nom,
    metier: p.metier && getMetier(p.metier) ? p.metier : metiers[0].id,
    ville: p.ville,
    quartier: p.quartier,
    zones: p.zones.length ? p.zones : [p.quartier],
    note: 0,
    nbAvis: 0,
    reponse: "Nouveau sur Artopif",
    disponible: "semaine",
    image: p.image ?? undefined,
    badges: ["Téléphone vérifié", "Identité vérifiée"],
    description: p.description,
    telephone: p.telephone_public ?? "",
    numeroPublic: p.numero_public,
    realisations: realisations.map(versRealisation),
    avis: [],
  };
}

/** Artisans vérifiés inscrits sur la plateforme (sans leurs réalisations). */
export async function artisansInscrits(): Promise<Artisan[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pros");
  if (!SUPABASE_ACTIF) return [];
  const { data, error } = await sbPublic()
    .from("pros")
    .select("*")
    .eq("type", "artisan")
    .eq("statut", "verifie")
    .order("cree_le", { ascending: false })
    .limit(500);
  if (error) {
    console.error("artisansInscrits", error.message);
    return [];
  }
  return (data as LignePro[]).map((p) => versArtisan(p));
}

/** Fiche complète d'un artisan inscrit (avec ses réalisations), ou null. */
export async function artisanInscrit(id: string): Promise<Artisan | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pros", `pro-${id}`);
  if (!SUPABASE_ACTIF) return null;
  const { data, error } = await sbPublic()
    .from("pros")
    .select("*, realisations(id, titre, type, quartier, description, materiaux, duree, date, photos, verifiee, cree_le)")
    .eq("id", id)
    .eq("type", "artisan")
    .eq("statut", "verifie")
    .maybeSingle();
  if (error || !data) return null;
  const { realisations, ...pro } = data as LignePro & { realisations: (LigneRealisation & { cree_le: string })[] };
  return versArtisan(
    pro,
    [...realisations].sort((a, b) => b.cree_le.localeCompare(a.cree_le)),
  );
}
