"use client";

import { useSyncExternalStore } from "react";
import { getBoutique } from "@/lib/data";
import { BOUTIQUE_DEMO_ID, reservationsBoutique, type ReservationBoutique } from "@/lib/pro-data";

/**
 * État de l'espace boutique (formule, stock, ventes, clients, promotions).
 * MAQUETTE : gardé dans le navigateur. Avec Supabase : tables produits, mouvements_stock,
 * ventes, clients_boutique, promotions, abonnements, protégées par RLS (propriétaire seul).
 */

export type Formule = "gratuit" | "premium";

export type Article = {
  id: string;
  nom: string;
  categorie: string;
  unite: string;
  prix: number;
  /** prix d'achat fournisseur, pour calculer la marge */
  prixAchat: number;
  stock: number;
  /** alerte quand le stock descend à ce niveau */
  seuil: number;
  promo?: { prix: number; jusqua: string };
  enLigne: boolean;
};

export type Vente = {
  id: string;
  date: string; // AAAA-MM-JJ
  articleId: string;
  quantite: number;
  prixUnitaire: number;
  clientId?: string;
  canal: "comptoir" | "reservation";
  paiement: "Espèces" | "MTN MoMo" | "Airtel Money";
};

export type Client = {
  id: string;
  nom: string;
  telephone: string;
  type: "Artisan" | "Particulier" | "Entreprise";
  note: string;
};

export type Mouvement = {
  id: string;
  date: string;
  articleId: string;
  quantite: number; // + entrée, - sortie
  motif: "Réception fournisseur" | "Vente" | "Casse / perte" | "Inventaire";
};

export type Infos = { nom: string; telephone: string; horaires: string; adresse: string; description: string };

export type EtatBoutique = {
  formule: Formule;
  reservations: ReservationBoutique[];
  articles: Article[];
  ventes: Vente[];
  clients: Client[];
  mouvements: Mouvement[];
  infos: Infos;
};

const CLE = "artico-boutique";
export const AUJOURDHUI = "2026-11-09"; // date de démonstration

const jour = (decalage: number) => {
  const d = new Date(`${AUJOURDHUI}T12:00:00`);
  d.setDate(d.getDate() - decalage);
  return d.toISOString().slice(0, 10);
};

const ARTICLES: Article[] = [
  { id: "ciment-42-5", nom: "Ciment 42,5 kg", categorie: "Ciment", unite: "sac", prix: 8500, prixAchat: 7200, stock: 120, seuil: 30, promo: { prix: 7900, jusqua: "2026-11-30" }, enLigne: true },
  { id: "tuyau-pvc-32", nom: "Tuyau PVC Ø32 (4 m)", categorie: "Plomberie", unite: "barre", prix: 4500, prixAchat: 3300, stock: 60, seuil: 15, enLigne: true },
  { id: "fer-10", nom: "Fer à béton Ø10 (12 m)", categorie: "Fer", unite: "barre", prix: 5200, prixAchat: 4400, stock: 14, seuil: 20, enLigne: true },
  { id: "sable", nom: "Sable de rivière", categorie: "Agrégats", unite: "m³", prix: 18000, prixAchat: 13000, stock: 9, seuil: 5, enLigne: true },
  { id: "pointes-70", nom: "Pointes 70 mm (1 kg)", categorie: "Fixation", unite: "kg", prix: 1500, prixAchat: 1000, stock: 45, seuil: 10, enLigne: true },
  { id: "robinet", nom: "Robinet mural chromé", categorie: "Plomberie", unite: "pièce", prix: 6500, prixAchat: 4200, stock: 4, seuil: 5, enLigne: true },
  { id: "disjoncteur-20", nom: "Disjoncteur 20 A", categorie: "Électricité", unite: "pièce", prix: 4000, prixAchat: 2700, stock: 22, seuil: 8, enLigne: false },
  { id: "carreau-40", nom: "Carreau sol 40×40 (m²)", categorie: "Carrelage", unite: "m²", prix: 7500, prixAchat: 5600, stock: 0, seuil: 10, enLigne: true },
];

const CLIENTS: Client[] = [
  { id: "c1", nom: "Jean-Claude M.", telephone: "+242 06 612 34 56", type: "Artisan", note: "Plombier, achète chaque semaine. Prévenir des arrivages PVC." },
  { id: "c2", nom: "Hervé K.", telephone: "+242 05 540 11 02", type: "Particulier", note: "Construction de maison à Makélékélé." },
  { id: "c3", nom: "Nadia B.", telephone: "+242 06 877 45 10", type: "Particulier", note: "" },
  { id: "c4", nom: "BTP Congo Services", telephone: "+242 05 300 22 90", type: "Entreprise", note: "Paiement en fin de chantier, gros volumes de ciment." },
  { id: "c5", nom: "Sylvain O.", telephone: "+242 06 410 77 33", type: "Particulier", note: "" },
];

/** 30 jours de ventes de démonstration, générées de façon déterministe. */
function ventesDemo(): Vente[] {
  const v: Vente[] = [];
  let graine = 7;
  const alea = () => ((graine = (graine * 9301 + 49297) % 233280) / 233280);
  const paiements = ["Espèces", "MTN MoMo", "Airtel Money"] as const;
  for (let d = 29; d >= 0; d--) {
    const n = 2 + Math.floor(alea() * 5);
    for (let i = 0; i < n; i++) {
      const a = ARTICLES[Math.floor(alea() * 6)];
      v.push({
        id: `v${d}-${i}`,
        date: jour(d),
        articleId: a.id,
        quantite: 1 + Math.floor(alea() * (a.prix > 10000 ? 2 : 8)),
        prixUnitaire: a.prix,
        clientId: alea() > 0.5 ? CLIENTS[Math.floor(alea() * CLIENTS.length)].id : undefined,
        canal: alea() > 0.7 ? "reservation" : "comptoir",
        paiement: paiements[Math.floor(alea() * 3)],
      });
    }
  }
  return v;
}

function etatInitial(): EtatBoutique {
  const b = getBoutique(BOUTIQUE_DEMO_ID);
  return {
    formule: "gratuit",
    reservations: reservationsBoutique,
    articles: ARTICLES,
    ventes: ventesDemo(),
    clients: CLIENTS,
    mouvements: [
      { id: "m1", date: jour(2), articleId: "ciment-42-5", quantite: 100, motif: "Réception fournisseur" },
      { id: "m2", date: jour(1), articleId: "carreau-40", quantite: -3, motif: "Casse / perte" },
    ],
    infos: {
      nom: b.nom,
      adresse: b.adresse,
      horaires: b.horaires,
      telephone: b.telephone,
      description: "Ciment, fer, plomberie et électricité au meilleur prix de Bacongo. Livraison possible sur chantier.",
    },
  };
}

let cache: EtatBoutique | null = null;
const abonnes = new Set<() => void>();

function lire(): EtatBoutique {
  if (cache) return cache;
  const initial = etatInitial();
  let e = initial;
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) e = { ...initial, ...(JSON.parse(brut) as Partial<EtatBoutique>) };
  } catch {
    /* stockage indisponible */
  }
  cache = e;
  return e;
}

function ecrire(e: EtatBoutique) {
  cache = e;
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* ignoré */
  }
  abonnes.forEach((f) => f());
}

/** Accès à l'état de la boutique ; `null` pendant le rendu serveur. */
export function useBoutique() {
  const etat = useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    lire,
    () => null,
  );
  const maj = (f: (e: EtatBoutique) => EtatBoutique) => {
    ecrire(f(lire()));
  };
  return {
    etat,
    maj,
    reinitialiser: () => {
      try {
        localStorage.removeItem(CLE);
      } catch {
        /* ignoré */
      }
      cache = null;
      abonnes.forEach((f) => f());
    },
  };
}

export const nouvelId = () => Math.random().toString(36).slice(2, 9);
export const prixVente = (a: Article) =>
  a.promo && a.promo.jusqua >= AUJOURDHUI ? a.promo.prix : a.prix;
