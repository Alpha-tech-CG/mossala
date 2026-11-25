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
  /** réponse publique du professionnel à cet avis (null tant qu'il n'a pas répondu) */
  reponse: string | null;
  reponduLe: number;
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
    reponse: (d.reponse as string | undefined) || null,
    reponduLe: millis(d.reponduLe as Horodatage),
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

/** signalements/{id} : un profil, un avis ou un commentaire signalé par un visiteur. */
export type SignalementDoc = {
  id: string;
  cible: "profil" | "avis" | "commentaire";
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
    cible: d.cible === "avis" ? "avis" : d.cible === "commentaire" ? "commentaire" : "profil",
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

// ——— Demandes annonceurs, métiers proposés, publicités, journal du backoffice ———

/** demandesAnnonceurs/{id} : formulaire « Être recontacté » de la page Nos services. */
export type DemandeAnnonceurDoc = {
  id: string;
  nom: string;
  type: string;
  telephone: string;
  interets: string[];
  statut: StatutTraitement;
  recuLe: number;
};

export function versDemandeAnnonceur(id: string, d: Record<string, unknown>): DemandeAnnonceurDoc {
  return {
    id,
    nom: String(d.nom ?? ""),
    type: String(d.type ?? ""),
    telephone: String(d.telephone ?? ""),
    interets: (d.interets as string[] | undefined) ?? [],
    statut: d.statut === "traite" ? "traite" : "nouveau",
    recuLe: millis(d.recuLe as Horodatage),
  };
}

export type StatutProposition = "nouveau" | "accepte" | "refuse";

/** propositionsMetiers/{id} : métier manquant proposé par un visiteur (page Tous les métiers). */
export type PropositionMetierDoc = {
  id: string;
  nom: string;
  /** identifiant de catégorie (src/lib/metiers.ts) */
  categorie: string;
  statut: StatutProposition;
  recuLe: number;
};

export function versPropositionMetier(id: string, d: Record<string, unknown>): PropositionMetierDoc {
  return {
    id,
    nom: String(d.nom ?? ""),
    categorie: String(d.categorie ?? ""),
    statut: d.statut === "accepte" || d.statut === "refuse" ? d.statut : "nouveau",
    recuLe: millis(d.recuLe as Horodatage),
  };
}

export const EMPLACEMENTS_PUB = ["accueil-1", "accueil-2", "pages", "laterale-gauche", "laterale-droite"] as const;
export type Emplacement = (typeof EMPLACEMENTS_PUB)[number];

/** Création publicitaire affichée sur le site. */
export type Pub = {
  type: "image" | "video";
  /** image, ou fichier vidéo MP4 */
  src: string;
  /** image affichée avant la lecture de la vidéo */
  poster?: string;
  annonceur: string;
  titre: string;
  texte?: string;
  cta: string;
  href: string;
};

export type StatutPub = "active" | "suspendue";

/**
 * publicites/{id} : une campagne publicitaire créée par l'équipe dans la console admin.
 * Plusieurs campagnes actives sur le même emplacement s'affichent à tour de rôle.
 */
export type PubDoc = Pub & {
  id: string;
  emplacement: Emplacement;
  statut: StatutPub;
  /** dates de diffusion « 2026-11-01 » (incluses), facultatives */
  debut: string | null;
  fin: string | null;
  creeLe: number;
  modifieLe: number;
};

export function versPubDoc(id: string, d: Record<string, unknown>): PubDoc {
  return {
    id,
    emplacement: (EMPLACEMENTS_PUB as readonly string[]).includes(String(d.emplacement)) ? (d.emplacement as Emplacement) : "pages",
    type: d.type === "video" ? "video" : "image",
    src: String(d.src ?? ""),
    poster: (d.poster as string | undefined) || undefined,
    annonceur: String(d.annonceur ?? ""),
    titre: String(d.titre ?? ""),
    texte: (d.texte as string | undefined) || undefined,
    cta: String(d.cta ?? ""),
    href: String(d.href ?? ""),
    statut: d.statut === "suspendue" ? "suspendue" : "active",
    debut: (d.debut as string | undefined) || null,
    fin: (d.fin as string | undefined) || null,
    creeLe: millis(d.creeLe as Horodatage),
    modifieLe: millis(d.modifieLe as Horodatage),
  };
}

/** La campagne est-elle à diffuser aujourd'hui (« 2026-11-18 ») ? */
export const pubEnDiffusion = (p: PubDoc, aujourdhui: string) =>
  p.statut === "active" && Boolean(p.src) && (!p.debut || p.debut <= aujourdhui) && (!p.fin || aujourdhui <= p.fin);

/** journal/{id} : trace de chaque action de l'équipe dans le backoffice (ni modifiable ni supprimable). */
export type EntreeJournal = {
  id: string;
  /** « Avis publié », « Pro suspendu »… */
  action: string;
  /** ce sur quoi porte l'action, lisible (« Avis de Grâce N. sur Jean-Claude Mbemba ») */
  cible: string;
  auteurId: string;
  /** numéro ou email du membre de l'équipe */
  auteur: string;
  date: number;
};

export function versEntreeJournal(id: string, d: Record<string, unknown>): EntreeJournal {
  return {
    id,
    action: String(d.action ?? ""),
    cible: String(d.cible ?? ""),
    auteurId: String(d.auteurId ?? ""),
    auteur: String(d.auteur ?? ""),
    date: millis(d.date as Horodatage),
  };
}

// ——— Équipe : rôles et permissions de la console ———

/**
 * Sections d'action de la console que le responsable (owner) peut déléguer à un membre.
 * Ces clés doivent rester synchronisées avec firestore.rules (fonction peut()) et avec
 * la Cloud Function gererMembre (firebase-functions/index.js).
 */
export const PERMISSIONS = [
  "avis",
  "commentaires",
  "signalements",
  "realisations",
  "pros",
  "clients",
  "publicites",
  "annonceurs",
  "contacts",
  "metiers",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

/** Libellé lisible de chaque permission (cases à cocher de la section Équipe). */
export const LIBELLES_PERMISSIONS: Record<Permission, string> = {
  avis: "Modérer les avis",
  commentaires: "Modérer les commentaires",
  signalements: "Traiter les signalements",
  realisations: "Vérifier les réalisations",
  pros: "Gérer les professionnels",
  clients: "Voir les clients",
  publicites: "Gérer les publicités",
  annonceurs: "Traiter les annonceurs",
  contacts: "Traiter les messages",
  metiers: "Décider des métiers proposés",
};

export type RoleEquipe = "owner" | "membre";

/** equipe/{uid} : un membre de l'équipe de la console, créé par le responsable. */
export type MembreDoc = {
  id: string;
  nom: string;
  /** numéro ou email qui identifie le compte (lisible dans la console) */
  identifiant: string;
  role: RoleEquipe;
  permissions: Permission[];
  actif: boolean;
  /** uid du responsable qui a créé ou modifié ce membre */
  parId: string;
  creeLe: number;
  majLe: number;
};

export function versMembre(id: string, d: Record<string, unknown>): MembreDoc {
  const perms = (d.permissions as string[] | undefined) ?? [];
  return {
    id,
    nom: String(d.nom ?? ""),
    identifiant: String(d.identifiant ?? ""),
    role: d.role === "owner" ? "owner" : "membre",
    permissions: PERMISSIONS.filter((p) => perms.includes(p)),
    actif: d.actif !== false,
    parId: String(d.parId ?? ""),
    creeLe: millis(d.creeLe as Horodatage),
    majLe: millis(d.majLe as Horodatage),
  };
}

/** Droits effectifs du compte connecté dans la console (owner : tout est permis). */
export type ProfilEquipe = { role: RoleEquipe; permissions: Permission[] };

/** Le profil a-t-il le droit `p` ? Le responsable (owner) a tous les droits. */
export const profilPeut = (profil: ProfilEquipe, p: Permission) =>
  profil.role === "owner" || profil.permissions.includes(p);

/** Profil responsable : accès à toutes les sections. */
export const PROFIL_OWNER: ProfilEquipe = { role: "owner", permissions: [...PERMISSIONS] };

// ——— Commentaires (fil façon réseau social, sous les réalisations) ———

export type StatutCommentaire = "visible" | "masque";

/**
 * commentaires/{id} : un commentaire public sous une réalisation. Un commentaire racine
 * (parentId null) ou une réponse (parentId = id du commentaire racine, un seul niveau).
 * Publié aussitôt (pas de modération a priori) ; l'équipe peut le masquer, chacun signale.
 */
export type CommentaireDoc = {
  id: string;
  /** cible = `${proId}_${realisationId}` : regroupe les commentaires d'une réalisation */
  cibleId: string;
  proId: string;
  realisationId: string;
  auteurId: string;
  /** « Grâce N. » ou le nom du professionnel */
  auteurNom: string;
  /** true si c'est le professionnel de la réalisation qui écrit (badge « Auteur ») */
  estPro: boolean;
  /** null = commentaire racine ; sinon id du commentaire auquel on répond */
  parentId: string | null;
  texte: string;
  statut: StatutCommentaire;
  creeLe: number;
};

export function versCommentaire(id: string, d: Record<string, unknown>): CommentaireDoc {
  return {
    id,
    cibleId: String(d.cibleId ?? ""),
    proId: String(d.proId ?? ""),
    realisationId: String(d.realisationId ?? ""),
    auteurId: String(d.auteurId ?? ""),
    auteurNom: String(d.auteurNom ?? ""),
    estPro: Boolean(d.estPro),
    parentId: (d.parentId as string | undefined) || null,
    texte: String(d.texte ?? ""),
    statut: d.statut === "masque" ? "masque" : "visible",
    creeLe: millis(d.creeLe as Horodatage),
  };
}

/** Identifiant de regroupement des commentaires d'une réalisation. */
export const cibleRealisation = (proId: string, realisationId: string) => `${proId}_${realisationId}`;
