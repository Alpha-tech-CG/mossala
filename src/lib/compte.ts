"use client";

import { useSyncExternalStore } from "react";
import { DUREE_PREMIUM_JOURS, PROFILS_GRATUITS_PAR_MOIS } from "./data";
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
};

const CLE = "artico-compte";
const moisCourant = () => new Date().toISOString().slice(0, 7);
const vide = (): Etat => ({ compte: null, mois: moisCourant(), consultes: [], premiumJusqua: null, favoris: [] });

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
const SERVEUR: Etat = { compte: null, mois: "", consultes: [], premiumJusqua: null, favoris: [] };

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
  const restants = Math.max(0, PROFILS_GRATUITS_PAR_MOIS - e.consultes.length);
  return {
    /** false pendant le rendu serveur : on ne sait pas encore qui est connecté */
    pret: etat !== null,
    compte: e.compte,
    inscrit: e.compte !== null,
    mois: e.mois ? NOMS_MOIS[Number(e.mois.slice(5, 7)) - 1] : "",
    consultes: e.consultes,
    restants,
    premium,
    premiumJusqua: premium ? new Date(e.premiumJusqua!) : null,
    favoris: e.favoris,
    /** profil déjà ouvert ce mois-ci, ou encore ouvrable */
    peutVoir: (id: string) => e.compte !== null && (premium || e.consultes.includes(id) || restants > 0),
    /** compte une consultation (sans effet si déjà vu ce mois-ci ou Premium) */
    consulter: (id: string) => {
      const x = lire();
      if (!x.compte || x.consultes.includes(id)) return;
      if (x.premiumJusqua === null && x.consultes.length >= PROFILS_GRATUITS_PAR_MOIS) return;
      ecrire({ ...x, consultes: [...x.consultes, id] });
    },
    // TODO backend : envoyerCodeSms + vérification OTP (Supabase Auth téléphone)
    inscrire: (i: Identite) =>
      ecrire({ ...lire(), compte: { ...i, telephone: i.telephones[0]?.numero ?? "", creeLe: Date.now() } }),
    deconnecter: () => ecrire({ ...lire(), compte: null }),
    /** MAQUETTE : le paiement Mobile Money (MTN MoMo / Airtel Money) sera branché plus tard */
    activerPremium: () => ecrire({ ...lire(), premiumJusqua: Date.now() + DUREE_PREMIUM_JOURS * 86_400_000 }),
    basculerFavori: (id: string) => {
      const x = lire();
      ecrire({ ...x, favoris: x.favoris.includes(id) ? x.favoris.filter((f) => f !== id) : [...x.favoris, id] });
    },
  };
}
