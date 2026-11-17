import { doc, getDoc, serverTimestamp, updateDoc, writeBatch } from "firebase/firestore";
import { BACKEND_ACTIF } from "./actif";
import { db } from "./firebase";
import { type Pro, versPro } from "./modele";
import type { NouveauProfilPro } from "./types";

/**
 * Crée le profil d'un professionnel.
 * pros/{id} : public (visible une fois vérifié) · pros/{id}/prive/contact : numéros (propriétaire seul)
 */
export async function creerProfilPro(id: string, p: NouveauProfilPro): Promise<void> {
  const base = db();
  const lot = writeBatch(base);
  lot.set(doc(base, "pros", id), {
    type: p.type,
    nom: p.nom,
    ville: p.ville,
    quartier: p.quartier,
    adresse: p.adresse || null,
    metier: p.type === "artisan" ? (p.metier ?? null) : null,
    zones: p.type === "artisan" ? (p.zones ?? []) : [],
    description: "",
    image: null,
    numeroPublic: p.numeroPublic,
    telephonePublic: p.numeroPublic ? p.telephone : null,
    statut: "en_verification",
    creeLe: serverTimestamp(),
  });
  lot.set(doc(base, "pros", id, "prive", "contact"), {
    telephone: p.telephone,
    telephones: p.telephones,
    responsable: p.responsable,
    alerteWhatsapp: true,
    alerteSms: true,
  });
  await lot.commit();
}

/** Profil pro du compte connecté, ou null (pas de compte pro). */
export async function monProfilPro(id: string): Promise<Pro | null> {
  if (!BACKEND_ACTIF) return null;
  const snap = await getDoc(doc(db(), "pros", id));
  return snap.exists() ? versPro(snap.id, snap.data()) : null;
}

/** Profil d'un pro vérifié (lecture publique), ou null. */
export async function proPublic(id: string): Promise<Pro | null> {
  try {
    const snap = await getDoc(doc(db(), "pros", id));
    return snap.exists() ? versPro(snap.id, snap.data()) : null;
  } catch {
    return null; // inexistant ou pas encore vérifié : refusé par les règles
  }
}

/** Numéro principal du pro connecté (coordonnées privées). */
export async function telephonePrivePro(id: string): Promise<string | null> {
  const snap = await getDoc(doc(db(), "pros", id, "prive", "contact"));
  return (snap.data()?.telephone as string | undefined) ?? null;
}

/** Met à jour la fiche publique du pro connecté. */
export async function majProfilPro(
  id: string,
  champs: Partial<Pick<Pro, "description" | "zones" | "numeroPublic" | "telephonePublic" | "nom" | "image">>,
): Promise<void> {
  await updateDoc(doc(db(), "pros", id), champs);
}
