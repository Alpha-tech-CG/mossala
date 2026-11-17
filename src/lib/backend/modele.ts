import type { Realisation } from "../data";

/**
 * Forme des documents Firestore et conversions vers les types de l'application.
 * Sans dépendance au SDK : utilisable côté navigateur (firebase/firestore) comme côté
 * serveur (firebase/firestore/lite).
 *
 * Collections (règles : firestore.rules) :
 *   comptes/{uid}                        compte client (privé)
 *   pros/{uid}                           profil public d'un artisan ou d'une boutique
 *   pros/{uid}/prive/contact             numéros et préférences d'alerte (privé)
 *   pros/{uid}/realisations/{id}         réalisations (photos dans Storage realisations/{uid}/…)
 *   conversations/{clientUid_proUid}     une conversation par couple client / pro
 *   messages/{id}                        messages (conversationId, participants)
 *   demandes/{id}                        demandes de devis (+ le devis envoyé)
 *   brouillons/{demandeId}               devis en cours de rédaction (le pro seul)
 *   otpEmail/{hash}                      codes de connexion par email (Cloud Functions seules)
 *   avis/{type_cible_auteur}             avis clients (modérés par l'équipe, publics une fois publiés)
 *   contacts/{id}                        messages du formulaire « Nous contacter » (équipe seule)
 *   signalements/{id}                    profils et avis signalés (équipe seule)
 * L'équipe (jeton avec admin: true) gère tout depuis le backoffice /admin.
 */

/** Timestamp Firestore (des deux SDK) ou absent. */
type Horodatage = { toMillis(): number } | null | undefined;
export const millis = (t: Horodatage) => t?.toMillis() ?? 0;

export type StatutPro = "en_verification" | "verifie" | "suspendu";

/** Profil public d'un artisan ou d'une boutique. */
export type Pro = {
  id: string;
  type: "artisan" | "boutique";
  nom: string;
  metier: string | null;
  ville: string;
  quartier: string;
  zones: string[];
  adresse: string | null;
  description: string;
  numeroPublic: boolean;
  telephonePublic: string | null;
  image: string | null;
  statut: StatutPro;
  creeLe: number;
};

export function versPro(id: string, d: Record<string, unknown>): Pro {
  return {
    id,
    type: d.type === "boutique" ? "boutique" : "artisan",
    nom: String(d.nom ?? ""),
    metier: (d.metier as string | undefined) ?? null,
    ville: String(d.ville ?? ""),
    quartier: String(d.quartier ?? ""),
    zones: (d.zones as string[] | undefined) ?? [],
    adresse: (d.adresse as string | undefined) || null,
    description: String(d.description ?? ""),
    numeroPublic: Boolean(d.numeroPublic),
    telephonePublic: (d.telephonePublic as string | undefined) ?? null,
    image: (d.image as string | undefined) ?? null,
    statut: (d.statut as StatutPro | undefined) ?? "en_verification",
    creeLe: millis(d.creeLe as Horodatage),
  };
}

export function versRealisation(id: string, d: Record<string, unknown>): Realisation {
  const photos = (d.photos as string[] | undefined) ?? [];
  return {
    id,
    titre: String(d.titre ?? ""),
    type: String(d.type ?? ""),
    quartier: String(d.quartier ?? ""),
    description: String(d.description ?? ""),
    materiaux: String(d.materiaux ?? ""),
    duree: String(d.duree ?? ""),
    date: (d.date as string | undefined) || undefined,
    image: photos[0],
    photos,
    verifiee: Boolean(d.verifiee),
  };
}

// ——— Avis, messages de contact et signalements (modération dans le backoffice /admin) ———

export type StatutAvis = "a_moderer" | "publie" | "refuse";
export type CibleAvis = "artisan" | "magasin";
export type Recommandation = "oui" | "reserves" | "non";
export type ExperienceAvis = "prestation" | "achat" | "devis" | "contact";

/** avis/{cibleType_cibleId_auteurId} : un seul avis par client et par professionnel. */
export type AvisDoc = {
  id: string;
  cibleType: CibleAvis;
  cibleId: string;
  cibleNom: string;
  auteurId: string;
  /** « Grâce N. » */
  auteur: string;
  /** note de 1 à 5 par critère noté */
  notes: Record<string, number>;
  /** moyenne des critères notés */
  note: number;
  recommandation: Recommandation;
  experience: ExperienceAvis;
  /** mois de la prestation ou de l'achat, « 2026-10 » */
  date: string | null;
  texte: string;
  statut: StatutAvis;
  /** expérience (prestation ou achat) confirmée par l'équipe : seul un avis vérifié porte le badge */
  verifie: boolean;
  motifRefus: string | null;
  creeLe: number;
  modereLe: number;
};

export function versAvis(id: string, d: Record<string, unknown>): AvisDoc {
  return {
    id,
    cibleType: d.cibleType === "magasin" ? "magasin" : "artisan",
    cibleId: String(d.cibleId ?? ""),
    cibleNom: String(d.cibleNom ?? ""),
    auteurId: String(d.auteurId ?? ""),
    auteur: String(d.auteur ?? ""),
    notes: (d.notes as Record<string, number> | undefined) ?? {},
    note: Number(d.note ?? 0),
    recommandation: (d.recommandation as Recommandation | undefined) ?? "oui",
    experience: (d.experience as ExperienceAvis | undefined) ?? "contact",
    date: (d.date as string | undefined) || null,
    texte: String(d.texte ?? ""),
    statut: (d.statut as StatutAvis | undefined) ?? "a_moderer",
    verifie: Boolean(d.verifie),
    motifRefus: (d.motifRefus as string | undefined) || null,
    creeLe: millis(d.creeLe as Horodatage),
    modereLe: millis(d.modereLe as Horodatage),
  };
}

export type StatutTraitement = "nouveau" | "traite";

/** contacts/{id} : formulaire « Nous contacter ». */
export type ContactDoc = {
  id: string;
  nom: string;
  telephone: string | null;
  email: string | null;
  sujet: string;
  message: string;
  statut: StatutTraitement;
  recuLe: number;
};

export function versContact(id: string, d: Record<string, unknown>): ContactDoc {
  return {
    id,
    nom: String(d.nom ?? ""),
    telephone: (d.telephone as string | undefined) || null,
    email: (d.email as string | undefined) || null,
    sujet: String(d.sujet ?? ""),
    message: String(d.message ?? ""),
    statut: d.statut === "traite" ? "traite" : "nouveau",
    recuLe: millis(d.recuLe as Horodatage),
  };
}

/** signalements/{id} : un profil ou un avis signalé par un visiteur. */
export type SignalementDoc = {
  id: string;
  cible: "profil" | "avis";
  cibleId: string;
  /** ce qui est signalé, lisible par l'équipe (« Avis de Grâce N. sur Jean-Claude Mbemba ») */
  libelle: string;
  motif: string;
  auteurId: string | null;
  statut: StatutTraitement;
  creeLe: number;
};

export function versSignalement(id: string, d: Record<string, unknown>): SignalementDoc {
  return {
    id,
    cible: d.cible === "avis" ? "avis" : "profil",
    cibleId: String(d.cibleId ?? ""),
    libelle: String(d.libelle ?? ""),
    motif: String(d.motif ?? ""),
    auteurId: (d.auteurId as string | undefined) || null,
    statut: d.statut === "traite" ? "traite" : "nouveau",
    creeLe: millis(d.creeLe as Horodatage),
  };
}

const NOMS_MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

/** « 2026-10 » (ou, à défaut, la date d'envoi) → « Octobre 2026 ». */
export function moisLisible(date: string | null, repli = 0): string {
  const [a, m] = date ? date.split("-").map(Number) : [];
  if (a && m) return `${NOMS_MOIS[m - 1]} ${a}`;
  if (!repli) return "";
  const d = new Date(repli);
  return `${NOMS_MOIS[d.getMonth()]} ${d.getFullYear()}`;
}
