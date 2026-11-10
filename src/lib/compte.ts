"use client";

import { useSyncExternalStore } from "react";
import { PROFILS_SANS_COMPTE } from "./data";
import type { Identite } from "@/components/Identite";

/**
 * Compte client : inscription, profils consultés dans le mois, Premium et favoris.
 * MAQUETTE : stocké dans le navigateur. Avec Supabase, le compte passe par l'OTP SMS
 * et le compteur + le Premium vivent côté serveur (table par utilisateur, RLS),
 * sinon un client pourrait les réinitialiser.
 */

/** Identité complète du client (+ `telephone` : son numéro principal, utilisé pour le rappel). */
export type Compte = Partial<Omit<Identite, "prenom">> & { prenom: string; telephone: string; creeLe: number };

type Etat = {
  compte: Compte | null;
  mois: string;
  /** artisans dont le profil a été ouvert ce mois-ci (revoir un profil ne compte pas deux fois) */
  consultes: string[];
  premiumJusqua: number | null;
  favoris: string[];
  /** profils ouverts avant de créer un compte (3 au maximum, sans remise à zéro) */
  vusSansCompte: string[];
};

const CLE = "artico-compte";
const moisCourant = () => new Date().toISOString().slice(0, 7);
const vide = (): Etat => ({ compte: null, mois: moisCourant(), consultes: [], premiumJusqua: null, favoris: [], vusSansCompte: [] });

let cache: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (cache) return cache;
  let e = vide();
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) e = { ...e, ...(JSON.parse(brut) as Partial<Etat>) };
  } catch {
    /* stockage indisponible : on repart d'un état vide */
  }
  // nouveau mois : les profils gratuits repartent à zéro (le Premium reste valable)
  if (e.mois !== moisCourant()) e = { ...e, mois: moisCourant(), consultes: [] };
  if (e.premiumJusqua !== null && e.premiumJusqua < Date.now()) e = { ...e, premiumJusqua: null };
  cache = e;
  return e;
}

function ecrire(e: Etat) {
  cache = e;
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* ignoré */
  }
  abonnes.forEach((f) => f());
}

const NOMS_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** État neutre du rendu serveur : aucune date lue pendant le pré-rendu. */
const SERVEUR: Etat = { compte: null, mois: "", consultes: [], premiumJusqua: null, favoris: [], vusSansCompte: [] };

export function useCompte() {
  const etat = useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    lire,
    () => null,
  );
  const e = etat ?? SERVEUR;
  const premium = e.premiumJusqua !== null;
  const vusSansCompte = e.vusSansCompte ?? [];
  const restantsSansCompte = Math.max(0, PROFILS_SANS_COMPTE - vusSansCompte.length);
  return {
    /** false pendant le rendu serveur : on ne sait pas encore qui est connecté */
    pret: etat !== null,
    compte: e.compte,
    inscrit: e.compte !== null,
    mois: e.mois ? NOMS_MOIS[Number(e.mois.slice(5, 7)) - 1] : "",
    consultes: e.consultes,
    /** visiteur sans compte : profils encore ouvrables avant de devoir s'inscrire */
    restantsSansCompte,
    premium,
    premiumJusqua: premium ? new Date(e.premiumJusqua!) : null,
    favoris: e.favoris,
    /** inscrit : tous les profils ; sans compte : 3 profils au maximum */
    peutVoir: (id: string) => e.compte !== null || vusSansCompte.includes(id) || restantsSansCompte > 0,
    /** compte un profil ouvert sans compte (rien à compter une fois inscrit) */
    consulter: (id: string) => {
      const x = lire();
      if (x.compte) return;
      const vus = x.vusSansCompte ?? [];
      if (vus.includes(id) || vus.length >= PROFILS_SANS_COMPTE) return;
      ecrire({ ...x, vusSansCompte: [...vus, id] });
    },
    // TODO backend : envoyerCodeSms + vérification OTP (Supabase Auth téléphone)
    inscrire: (i: Identite) =>
      ecrire({ ...lire(), compte: { ...i, telephone: i.telephones[0]?.numero ?? "", creeLe: Date.now() } }),
    deconnecter: () => ecrire({ ...lire(), compte: null }),
    basculerFavori: (id: string) => {
      const x = lire();
      ecrire({ ...x, favoris: x.favoris.includes(id) ? x.favoris.filter((f) => f !== id) : [...x.favoris, id] });
    },
  };
}
