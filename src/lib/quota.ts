"use client";

import { useSyncExternalStore } from "react";
import { DUREE_ILLIMITE_JOURS, MESSAGES_GRATUITS_PAR_MOIS } from "./data";

/**
 * Quota de messages du client.
 * MAQUETTE : stocké dans le navigateur. Avec Supabase, le compteur et le pass
 * vivront côté serveur (table par utilisateur), sinon un client pourrait le réinitialiser.
 */

type Etat = { mois: string; envoyes: number; illimiteJusqua: number | null };

const CLE = "ab-quota";
const moisCourant = () => new Date().toISOString().slice(0, 7);
const vide = (): Etat => ({
  mois: moisCourant(),
  envoyes: 0,
  illimiteJusqua: null,
});

let cache: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (cache) return cache;
  let e = vide();
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) e = JSON.parse(brut) as Etat;
  } catch {
    /* stockage indisponible : on repart d'un état vide */
  }
  // nouveau mois : le compteur gratuit repart à zéro (le pass reste valable)
  if (e.mois !== moisCourant()) e = { ...e, mois: moisCourant(), envoyes: 0 };
  // pass expiré : on revient au quota gratuit
  if (e.illimiteJusqua !== null && e.illimiteJusqua < Date.now())
    e = { ...e, illimiteJusqua: null };
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

const NOMS_MOIS = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const SERVEUR: Etat = { mois: "", envoyes: 0, illimiteJusqua: null };

export function useQuota() {
  const etat = useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    lire,
    () => SERVEUR,
  );
  const illimite = etat.illimiteJusqua !== null;
  const restants = Math.max(0, MESSAGES_GRATUITS_PAR_MOIS - etat.envoyes);
  return {
    /** nom du mois en cours (vide pendant le rendu serveur) */
    mois: etat.mois ? NOMS_MOIS[Number(etat.mois.slice(5, 7)) - 1] : "",
    illimite,
    restants,
    illimiteJusqua: illimite ? new Date(etat.illimiteJusqua!) : null,
    peutEnvoyer: illimite || restants > 0,
    /** à appeler après un envoi réussi */
    consommer: () => {
      const e = lire();
      if (!illimite) ecrire({ ...e, envoyes: e.envoyes + 1 });
    },
    /** MAQUETTE : le paiement Mobile Money sera branché plus tard */
    activerIllimite: () =>
      ecrire({
        ...lire(),
        illimiteJusqua: Date.now() + DUREE_ILLIMITE_JOURS * 86_400_000,
      }),
  };
}
