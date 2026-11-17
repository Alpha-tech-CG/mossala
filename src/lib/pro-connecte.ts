"use client";

import { useSyncExternalStore } from "react";
import { BACKEND_ACTIF } from "./backend/actif";
import type { Pro } from "./backend/modele";
import { ARTISAN_DEMO_ID, BOUTIQUE_DEMO_ID } from "./pro-data";
import { sessionActuelle, surSession } from "./session";

/**
 * Professionnel dont on affiche l'espace :
 *  - production + connecté avec un profil pro → son vrai profil (`demo: false`) ;
 *  - sinon → l'artisan ou la boutique de démonstration (`demo: true`).
 */
type Etat = { pret: boolean; pro: Pro | null };

let etat: Etat = { pret: !BACKEND_ACTIF, pro: null };
const abonnes = new Set<() => void>();
let ecoute = false;

async function charger() {
  const s = sessionActuelle();
  try {
    const { monProfilPro } = await import("./backend/pros");
    etat = { pret: true, pro: s ? await monProfilPro(s.id) : null };
  } catch {
    etat = { pret: true, pro: null };
  }
  abonnes.forEach((f) => f());
}

function abonner(f: () => void) {
  if (!ecoute && BACKEND_ACTIF) {
    ecoute = true;
    surSession(() => void charger());
  }
  abonnes.add(f);
  return () => abonnes.delete(f);
}

/** À appeler après la création ou la modification du profil pro. */
export const rechargerProConnecte = () => (BACKEND_ACTIF ? charger() : Promise.resolve());

const SERVEUR: Etat = { pret: false, pro: null };

export function useProConnecte(type: "artisan" | "boutique") {
  const e = useSyncExternalStore(abonner, () => etat, () => SERVEUR);
  const reel = e.pro && e.pro.type === type ? e.pro : null;
  return {
    pret: e.pret,
    /** identifiant à utiliser pour la messagerie, les devis, les réalisations */
    id: reel?.id ?? (type === "artisan" ? ARTISAN_DEMO_ID : BOUTIQUE_DEMO_ID),
    demo: !reel,
    pro: reel,
    /** profil pro d'un autre type (ex. une boutique qui ouvre l'espace artisan) */
    autreType: e.pro && e.pro.type !== type ? e.pro.type : null,
  };
}
