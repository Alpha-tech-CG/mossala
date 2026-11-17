"use client";

import { useSyncExternalStore } from "react";
import { notifierNouveauMessage } from "./backend";
import {
  type Timestamp,
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { BACKEND_ACTIF, estDemo } from "./backend/actif";
import { db } from "./backend/firebase";
import { proPublic } from "./backend/pros";
import { sessionActuelle, surSession } from "./session";

/**
 * Demandes de devis et devis chiffrés (client ↔ artisan ou boutique).
 *
 * Le client écrit son besoin en langage naturel (« 10 sacs de ciment et 3 camions de sable
 * livrés à Kibina »). Le professionnel répond par un devis détaillé, organisé comme le modèle
 * Excel du client : des rubriques (1. Fondations, 2. Élévation…), des lignes
 * désignation / quantité / unité / prix unitaire, un sous-total par rubrique et un total.
 * Chaque ligne peut aussi porter une fourchette de prix du marché (« de … à … »).
 *
 * Pros inscrits (production) : Firestore demandes/{id} (avec le devis envoyé) et brouillons/{id}
 * (devis en cours, visible du pro seul), en temps réel. Pros de démonstration (ou maquette) :
 * gardé dans le navigateur.
 */

export type TypePro = "artisan" | "boutique";

export type ProDevis = {
  type: TypePro;
  id: string;
  nom: string;
  /** métier de l'artisan ou « Quincaillerie » */
  sous: string;
  image?: string;
  telephone?: string;
};

export type LigneDevis = {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
  /** fourchette de prix constatée sur le marché (facultative) */
  prixMin?: number;
  prixMax?: number;
};

export type RubriqueDevis = { id: string; titre: string; lignes: LigneDevis[] };

export type Devis = {
  rubriques: RubriqueDevis[];
  delai: string;
  validite: string;
  materiauxInclus: boolean;
  paiement: string;
  note: string;
  envoyeLe?: number;
};

export type StatutDemande =
  /** reçue, pas encore chiffrée */
  | "nouvelle"
  /** le pro a commencé le devis sans l'envoyer */
  | "brouillon"
  /** devis envoyé, en attente de la réponse du client */
  | "envoyee"
  | "acceptee"
  | "refusee"
  /** le pro ne peut pas répondre */
  | "declinee";

export type DemandeDevis = {
  id: string;
  /** demande enregistrée en base : le côté de l'utilisateur connecté */
  moi?: "client" | "pro";
  pro: ProDevis;
  client: { prenom: string; telephone: string };
  /** besoin décrit par le client, en langage naturel */
  texte: string;
  quartier: string;
  dateSouhaitee?: string;
  budget?: string;
  creeLe: number;
  statut: StatutDemande;
  devis?: Devis;
  /** raison laissée par le pro quand il décline */
  motifDeclin?: string;
};

// ——— Calculs ———

export const montantLigne = (l: LigneDevis) => Math.round((l.quantite || 0) * (l.prixUnitaire || 0));

export const sousTotal = (r: RubriqueDevis) => r.lignes.reduce((s, l) => s + montantLigne(l), 0);

export const totalDevis = (d: Pick<Devis, "rubriques">) => d.rubriques.reduce((s, r) => s + sousTotal(r), 0);

/**
 * Total minimum et maximum d'après les fourchettes du marché.
 * Une ligne sans fourchette compte pour son prix unitaire dans les deux bornes.
 * `null` si aucune ligne n'a de fourchette.
 */
export function fourchetteDevis(d: Pick<Devis, "rubriques">): { min: number; max: number } | null {
  let min = 0;
  let max = 0;
  let avecFourchette = false;
  for (const r of d.rubriques)
    for (const l of r.lignes) {
      const q = l.quantite || 0;
      const bas = l.prixMin ?? l.prixUnitaire;
      const haut = l.prixMax ?? l.prixUnitaire;
      if (l.prixMin !== undefined || l.prixMax !== undefined) avecFourchette = true;
      min += q * Math.min(bas, haut);
      max += q * Math.max(bas, haut);
    }
  return avecFourchette ? { min: Math.round(min), max: Math.round(max) } : null;
}

// ——— Aide à la saisie : lignes proposées à partir du texte du client ———

export type ArticleCatalogue = { nom: string; unite: string; prix: number };

const sansAccents = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

/** Mots qui ne suffisent pas à reconnaître un article. */
const MOTS_VIDES = new Set(["de", "du", "des", "la", "le", "les", "pour", "avec", "sac", "sacs", "kg", "mm", "m", "piece", "barre"]);

/**
 * Repère dans la demande les articles du catalogue de la boutique et la quantité écrite juste
 * avant (« 10 sacs de ciment » → Ciment 42,5 kg × 10). Simple et local : le pro vérifie
 * toujours les lignes proposées avant d'envoyer le devis.
 */
export function proposerLignes(texte: string, catalogue: ArticleCatalogue[]): LigneDevis[] {
  const t = sansAccents(texte);
  const lignes: LigneDevis[] = [];
  for (const a of catalogue) {
    const mots = sansAccents(a.nom)
      .split(/[^a-z0-9]+/)
      .filter((m) => m.length > 2 && !MOTS_VIDES.has(m) && !/^\d+$/.test(m));
    const cle = mots[0];
    if (!cle) continue;
    const racine = cle.length > 5 ? cle.slice(0, cle.length - 1) : cle; // ciment / ciments, tuyau / tuyaux
    const pos = t.search(new RegExp(`\\b${racine}`));
    if (pos < 0) continue;
    // quantité : le dernier nombre dans les 25 caractères qui précèdent le mot
    const avant = t.slice(Math.max(0, pos - 25), pos);
    const nombres = avant.match(/\d+(?:[.,]\d+)?/g);
    const quantite = nombres ? Number(nombres[nombres.length - 1].replace(",", ".")) : 1;
    lignes.push({ id: nouvelId(), designation: a.nom, quantite, unite: a.unite, prixUnitaire: a.prix });
  }
  return lignes;
}

// ——— Modèles de rubriques ———

/** Rubriques du modèle Excel du client (chantier de construction). */
export const RUBRIQUES_CHANTIER = [
  "Fondations, longrines & ancrages",
  "Élévation (poteaux, chaînage, murs)",
  "Plancher / dallage",
  "Évacuation des eaux",
  "Charpente & toiture",
  "Finitions & fermetures",
  "Logistique & imprévus",
];

export const UNITES = ["Unité", "Forfait", "Ensemble", "Tonne", "Sac", "Barre", "kg", "Mètre", "m²", "m³", "Camion 8 m³", "Rouleau", "Heure", "Jour"];

export const nouvelId = () => Math.random().toString(36).slice(2, 10);

export const nouvelleLigne = (p: Partial<LigneDevis> = {}): LigneDevis => ({
  id: nouvelId(),
  designation: "",
  quantite: 1,
  unite: "Unité",
  prixUnitaire: 0,
  ...p,
});

export const nouvelleRubrique = (titre = "", lignes: LigneDevis[] = [nouvelleLigne()]): RubriqueDevis => ({
  id: nouvelId(),
  titre,
  lignes,
});

export const devisVide = (type: TypePro): Devis => ({
  rubriques: [nouvelleRubrique(type === "boutique" ? "Matériaux" : "Fournitures")],
  delai: type === "boutique" ? "Retrait sous 24 h" : "Sous 1 semaine",
  validite: "30 jours",
  materiauxInclus: true,
  paiement: type === "boutique" ? "Au retrait" : "50 % au démarrage, le reste à la fin",
  note: "",
});

// ——— Stockage (maquette) ———

const CLE = "artico-devis";

let cache: DemandeDevis[] | null = null;
const abonnes = new Set<() => void>();

function lire(): DemandeDevis[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(CLE) ?? "[]") as DemandeDevis[];
  } catch {
    cache = [];
  }
  return cache;
}

function ecrire(d: DemandeDevis[]) {
  cache = d;
  combinees = null;
  try {
    localStorage.setItem(CLE, JSON.stringify(d));
  } catch {
    /* ignoré */
  }
  abonnes.forEach((f) => f());
}

// Le client et l'espace pro peuvent être ouverts dans deux onglets : on se synchronise.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== CLE) return;
    cache = null;
    combinees = null;
    abonnes.forEach((f) => f());
  });
}

const abonner = (f: () => void) => {
  ecouterBase();
  abonnes.add(f);
  return () => abonnes.delete(f);
};

function modifier(id: string, f: (d: DemandeDevis) => DemandeDevis) {
  ecrire(lire().map((d) => (d.id === id ? f(d) : d)));
}

// ——— Production (Firestore) : demandes avec les pros inscrits (les pros de démo restent dans le navigateur) ———

type DocDevis = Omit<Devis, "envoyeLe"> & { envoyeLe?: Timestamp | null };

type DocDemande = {
  clientId: string;
  proId: string;
  participants: string[];
  client: { prenom: string; telephone: string };
  pro: { type: TypePro; nom: string; sous: string; image: string | null; telephone: string | null };
  texte: string;
  quartier: string;
  dateSouhaitee: string | null;
  budget: string | null;
  statut: StatutDemande;
  motifDeclin: string | null;
  /** dernier devis envoyé au client */
  devis: DocDevis | null;
  creeLe: Timestamp | null;
};

let docsDemandes = new Map<string, DocDemande>();
let docsBrouillons = new Map<string, DocDevis>();
let distantes: DemandeDevis[] = [];
let combinees: DemandeDevis[] | null = null;
let ecoute = false;

const versDevis = (d: DocDevis): Devis => ({
  rubriques: d.rubriques ?? [],
  delai: d.delai ?? "",
  validite: d.validite ?? "",
  materiauxInclus: d.materiauxInclus ?? true,
  paiement: d.paiement ?? "",
  note: d.note ?? "",
  envoyeLe: d.envoyeLe?.toMillis(),
});

function versDemande(id: string, l: DocDemande, moi: string): DemandeDevis {
  const estPro = l.proId === moi;
  // le pro voit son brouillon s'il en a un, sinon le dernier devis envoyé
  const brouillon = estPro ? docsBrouillons.get(id) : undefined;
  const dv = brouillon ?? l.devis;
  return {
    id,
    moi: estPro ? "pro" : "client",
    pro: {
      type: l.pro?.type ?? "artisan",
      id: l.proId,
      nom: l.pro?.nom ?? "Professionnel",
      sous: l.pro?.sous ?? "",
      image: l.pro?.image ?? undefined,
      telephone: l.pro?.telephone ?? undefined,
    },
    client: { prenom: l.client?.prenom ?? "Client", telephone: l.client?.telephone ?? "" },
    texte: l.texte,
    quartier: l.quartier,
    dateSouhaitee: l.dateSouhaitee ?? undefined,
    budget: l.budget ?? undefined,
    creeLe: l.creeLe?.toMillis() ?? Date.now(),
    statut: l.statut,
    motifDeclin: l.motifDeclin ?? undefined,
    devis: dv ? { ...versDevis(dv), envoyeLe: l.devis?.envoyeLe?.toMillis() } : undefined,
  };
}

const prevenir = () => {
  combinees = null;
  abonnes.forEach((f) => f());
};

function recalculer() {
  const s = sessionActuelle();
  distantes = s
    ? [...docsDemandes].map(([id, d]) => versDemande(id, d, s.id)).sort((a, b) => b.creeLe - a.creeLe)
    : [];
  prevenir();
}

function ecouterBase() {
  if (ecoute || !BACKEND_ACTIF || typeof window === "undefined") return;
  ecoute = true;
  let arreter: (() => void)[] = [];
  surSession(() => {
    arreter.forEach((f) => f());
    arreter = [];
    docsDemandes = new Map();
    docsBrouillons = new Map();
    const s = sessionActuelle();
    if (!s) return recalculer();
    const lecture = { serverTimestamps: "estimate" } as const;
    arreter = [
      onSnapshot(
        query(collection(db(), "demandes"), where("participants", "array-contains", s.id)),
        (snap) => {
          docsDemandes = new Map(snap.docs.map((d) => [d.id, d.data(lecture) as DocDemande]));
          recalculer();
        },
        () => {
          /* hors ligne ou refusé : on garde les dernières demandes connues */
        },
      ),
      onSnapshot(
        query(collection(db(), "brouillons"), where("proId", "==", s.id)),
        (snap) => {
          docsBrouillons = new Map(snap.docs.map((d) => [d.id, d.data(lecture) as DocDevis]));
          recalculer();
        },
        () => {},
      ),
    ];
  });
}

/** Contenu du devis tel qu'enregistré (sans la date d'envoi). */
const contenuDevis = (d: Devis) => ({
  rubriques: d.rubriques,
  delai: d.delai,
  validite: d.validite,
  materiauxInclus: d.materiauxInclus,
  paiement: d.paiement,
  note: d.note,
});

const estDistante = (id: string) => distantes.some((d) => d.id === id);

/** Demandes locales (démo) et distantes (base), une seule liste stable pour React. */
function toutes(): DemandeDevis[] {
  combinees ??= [...distantes, ...lire()];
  return combinees;
}

// ——— Actions ———

/** Le client envoie sa demande en langage naturel. */
export async function creerDemande(d: Omit<DemandeDevis, "id" | "creeLe" | "statut">): Promise<void> {
  if (!estDemo(d.pro.id)) {
    const s = sessionActuelle();
    if (!s) throw new Error("Connectez-vous pour envoyer votre demande.");
    const pro = await proPublic(d.pro.id);
    if (!pro) throw new Error("Ce professionnel n’est pas encore disponible.");
    // L'alerte WhatsApp/SMS au pro part de la Cloud Function « alerteDemande ».
    await addDoc(collection(db(), "demandes"), {
      clientId: s.id,
      proId: pro.id,
      participants: [s.id, pro.id],
      client: { prenom: d.client.prenom, telephone: d.client.telephone },
      pro: { type: pro.type, nom: pro.nom, sous: d.pro.sous, image: pro.image, telephone: pro.telephonePublic },
      texte: d.texte.trim(),
      quartier: d.quartier,
      dateSouhaitee: d.dateSouhaitee || null,
      budget: d.budget || null,
      statut: "nouvelle",
      motifDeclin: null,
      devis: null,
      creeLe: serverTimestamp(),
    });
    return;
  }
  const demande: DemandeDevis = { ...d, texte: d.texte.trim(), id: nouvelId(), creeLe: Date.now(), statut: "nouvelle" };
  ecrire([demande, ...lire()]);
  // Alerte WhatsApp/SMS au professionnel (point de branchement, sans effet en maquette).
  void notifierNouveauMessage({
    conversationId: `devis-${demande.id}`,
    de: "client",
    texte: `Demande de devis : ${demande.texte}`,
    expediteur: demande.client.prenom,
    destinataire: {
      nom: demande.pro.nom,
      telephones: demande.pro.telephone ? [{ numero: demande.pro.telephone, whatsapp: true }] : [],
    },
  });
}

/** Le pro enregistre son devis ; `envoyer` le transmet au client. */
export async function enregistrerDevis(id: string, devis: Devis, envoyer: boolean): Promise<void> {
  if (estDistante(id)) {
    const s = sessionActuelle();
    if (!s) throw new Error("Connectez-vous pour enregistrer ce devis.");
    const actuelle = distantes.find((d) => d.id === id);
    const base = db();
    if (envoyer) {
      // le devis envoyé devient visible du client ; le brouillon n'a plus lieu d'être
      const lot = writeBatch(base);
      lot.update(doc(base, "demandes", id), { statut: "envoyee", devis: { ...contenuDevis(devis), envoyeLe: serverTimestamp() } });
      lot.delete(doc(base, "brouillons", id));
      await lot.commit();
      return;
    }
    await setDoc(doc(base, "brouillons", id), { proId: s.id, ...contenuDevis(devis), modifieLe: serverTimestamp() });
    // un devis déjà envoyé reste « envoyé » même si on enregistre une correction en brouillon
    if (actuelle && actuelle.statut !== "envoyee" && actuelle.statut !== "brouillon")
      await updateDoc(doc(base, "demandes", id), { statut: "brouillon" });
    return;
  }
  modifier(id, (d) => ({
    ...d,
    devis: envoyer ? { ...devis, envoyeLe: Date.now() } : devis,
    statut: envoyer ? "envoyee" : "brouillon",
  }));
  if (!envoyer) return;
  const d = lire().find((x) => x.id === id);
  if (!d) return;
  void notifierNouveauMessage({
    conversationId: `devis-${id}`,
    de: "artisan",
    texte: `Votre devis est prêt : ${totalDevis(devis).toLocaleString("fr-FR")} FCFA`,
    expediteur: d.pro.nom,
    destinataire: { nom: d.client.prenom, telephones: [{ numero: d.client.telephone, whatsapp: true }] },
  });
}

export async function declinerDemande(id: string, motif: string): Promise<void> {
  if (estDistante(id)) {
    await updateDoc(doc(db(), "demandes", id), { statut: "declinee", motifDeclin: motif.trim() || null });
    return;
  }
  modifier(id, (d) => ({ ...d, statut: "declinee", motifDeclin: motif.trim() || undefined }));
}

/** Réponse du client au devis reçu. */
export async function repondreDevis(id: string, accepte: boolean): Promise<void> {
  if (estDistante(id)) {
    await updateDoc(doc(db(), "demandes", id), { statut: accepte ? "acceptee" : "refusee" });
    return;
  }
  modifier(id, (d) => (d.statut === "envoyee" ? { ...d, statut: accepte ? "acceptee" : "refusee" } : d));
}

/**
 * Demandes vues par le client (les siennes, plus les démos) ou par un professionnel
 * (celles qu'il a reçues). `null` côté serveur.
 */
export function useDemandesDevis(pro?: { type: TypePro; id: string }): DemandeDevis[] | null {
  const liste = useSyncExternalStore(abonner, toutes, () => null);
  if (!liste) return null;
  return pro
    ? liste.filter((d) => d.pro.type === pro.type && d.pro.id === pro.id)
    : liste.filter((d) => d.moi !== "pro");
}

export const libelleStatut: Record<StatutDemande, [string, string]> = {
  nouvelle: ["Nouvelle", "bg-accent/20 text-accent-ink"],
  brouillon: ["Devis en cours", "bg-secondary text-primary"],
  envoyee: ["Devis envoyé", "bg-primary/10 text-primary"],
  acceptee: ["Accepté", "bg-success/10 text-success"],
  refusee: ["Refusé", "bg-destructive/10 text-destructive"],
  declinee: ["Décliné", "bg-muted text-muted-foreground"],
};

/** Libellés côté client (il attend une réponse plutôt qu'il ne « reçoit » une demande). */
export const libelleStatutClient: Record<StatutDemande, string> = {
  nouvelle: "En attente du devis",
  brouillon: "Devis en préparation",
  envoyee: "Devis reçu",
  acceptee: "Devis accepté",
  refusee: "Devis refusé",
  declinee: "Ne peut pas répondre",
};
