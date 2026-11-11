"use client";

import { useSyncExternalStore } from "react";
import { notifierNouveauMessage } from "./backend";
import { SUPABASE_ACTIF, estDemo, sb, verifier } from "./backend/supabase";
import { metierLabel } from "./data";
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
 * Pros inscrits (Supabase actif) : tables demandes_devis et devis (supabase/migrations/0003_devis.sql),
 * en temps réel. Pros de démonstration (ou maquette) : gardé dans le navigateur.
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
  ecouterSupabase();
  abonnes.add(f);
  return () => abonnes.delete(f);
};

function modifier(id: string, f: (d: DemandeDevis) => DemandeDevis) {
  ecrire(lire().map((d) => (d.id === id ? f(d) : d)));
}

// ——— Supabase : demandes avec les pros inscrits (les pros de démo restent dans le navigateur) ———

type LigneDevisDb = {
  rubriques: RubriqueDevis[];
  delai: string;
  validite: string;
  materiaux_inclus: boolean;
  paiement: string;
  note: string;
  envoye_le: string | null;
};

type LigneDemande = {
  id: string;
  client_id: string;
  pro_id: string;
  texte: string;
  quartier: string;
  date_souhaitee: string | null;
  budget: string | null;
  statut: StatutDemande;
  motif_declin: string | null;
  cree_le: string;
  devis: LigneDevisDb | LigneDevisDb[] | null;
  pro: { type: TypePro; nom: string; metier: string | null; quartier: string; image: string | null; telephone_public: string | null } | null;
  client: { prenom: string; telephone: string } | null;
};

let distantes: DemandeDevis[] = [];
let combinees: DemandeDevis[] | null = null;
let ecoute = false;

function versDemande(l: LigneDemande, moi: string): DemandeDevis {
  const dv = Array.isArray(l.devis) ? l.devis[0] : l.devis;
  const p = l.pro;
  return {
    id: l.id,
    moi: l.pro_id === moi ? "pro" : "client",
    pro: {
      type: p?.type ?? "artisan",
      id: l.pro_id,
      nom: p?.nom ?? "Professionnel",
      sous: p?.type === "boutique" ? `Quincaillerie · ${p.quartier}` : p?.metier ? metierLabel(p.metier).artisan : "Artisan",
      image: p?.image ?? undefined,
      telephone: p?.telephone_public ?? undefined,
    },
    client: { prenom: l.client?.prenom ?? "Client", telephone: l.client?.telephone ?? "" },
    texte: l.texte,
    quartier: l.quartier,
    dateSouhaitee: l.date_souhaitee ?? undefined,
    budget: l.budget ?? undefined,
    creeLe: Date.parse(l.cree_le),
    statut: l.statut,
    motifDeclin: l.motif_declin ?? undefined,
    devis: dv
      ? {
          rubriques: dv.rubriques,
          delai: dv.delai,
          validite: dv.validite,
          materiauxInclus: dv.materiaux_inclus,
          paiement: dv.paiement,
          note: dv.note,
          envoyeLe: dv.envoye_le ? Date.parse(dv.envoye_le) : undefined,
        }
      : undefined,
  };
}

const prevenir = () => {
  combinees = null;
  abonnes.forEach((f) => f());
};

async function chargerDistantes() {
  const s = sessionActuelle();
  if (!s) {
    distantes = [];
    return prevenir();
  }
  try {
    const lignes = verifier(
      await sb()
        .from("demandes_devis")
        .select("*, devis(*), pro:pros(type, nom, metier, quartier, image, telephone_public), client:comptes(prenom, telephone)")
        .order("cree_le", { ascending: false }),
    ) as LigneDemande[];
    distantes = lignes.map((l) => versDemande(l, s.id));
    prevenir();
  } catch {
    /* hors ligne : on garde les dernières demandes connues */
  }
}

let rechargement: ReturnType<typeof setTimeout> | null = null;

/** Recharge un peu après un changement (plusieurs événements temps réel arrivent groupés). */
const rechargerBientot = () => {
  if (rechargement) clearTimeout(rechargement);
  rechargement = setTimeout(() => void chargerDistantes(), 150);
};

function ecouterSupabase() {
  if (ecoute || !SUPABASE_ACTIF || typeof window === "undefined") return;
  ecoute = true;
  let canal: ReturnType<ReturnType<typeof sb>["channel"]> | null = null;
  surSession(() => {
    void chargerDistantes();
    if (canal) void sb().removeChannel(canal);
    canal = sessionActuelle()
      ? sb()
          .channel("devis")
          .on("postgres_changes", { event: "*", schema: "public", table: "demandes_devis" }, rechargerBientot)
          .on("postgres_changes", { event: "*", schema: "public", table: "devis" }, rechargerBientot)
          .subscribe()
      : null;
  });
}

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
    // L'alerte WhatsApp/SMS au pro part de la base (trigger → Edge Function « notifier »).
    verifier(
      await sb().from("demandes_devis").insert({
        client_id: s.id,
        pro_id: d.pro.id,
        texte: d.texte.trim(),
        quartier: d.quartier,
        date_souhaitee: d.dateSouhaitee || null,
        budget: d.budget || null,
      }),
    );
    return chargerDistantes();
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
    const actuelle = distantes.find((d) => d.id === id);
    const precedent = actuelle?.devis?.envoyeLe;
    verifier(
      await sb()
        .from("devis")
        .upsert({
          demande_id: id,
          rubriques: devis.rubriques,
          delai: devis.delai,
          validite: devis.validite,
          materiaux_inclus: devis.materiauxInclus,
          paiement: devis.paiement,
          note: devis.note,
          envoye_le: envoyer ? new Date().toISOString() : precedent ? new Date(precedent).toISOString() : null,
          modifie_le: new Date().toISOString(),
        }),
    );
    // un devis déjà envoyé reste « envoyé » même si on enregistre une correction en brouillon
    const statut = envoyer || actuelle?.statut === "envoyee" ? "envoyee" : "brouillon";
    if (statut !== actuelle?.statut) verifier(await sb().from("demandes_devis").update({ statut }).eq("id", id));
    return chargerDistantes();
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
    verifier(await sb().from("demandes_devis").update({ statut: "declinee", motif_declin: motif.trim() || null }).eq("id", id));
    return chargerDistantes();
  }
  modifier(id, (d) => ({ ...d, statut: "declinee", motifDeclin: motif.trim() || undefined }));
}

/** Réponse du client au devis reçu. */
export async function repondreDevis(id: string, accepte: boolean): Promise<void> {
  if (estDistante(id)) {
    verifier(await sb().from("demandes_devis").update({ statut: accepte ? "acceptee" : "refusee" }).eq("id", id));
    return chargerDistantes();
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
