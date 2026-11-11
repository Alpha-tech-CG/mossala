"use client";

import { useSyncExternalStore } from "react";
import { SUPABASE_ACTIF } from "./backend/supabase";
import { monProfilPro, type LignePro } from "./backend/pros";
import { ARTISAN_DEMO_ID, BOUTIQUE_DEMO_ID } from "./pro-data";
import { sessionActuelle, surSession } from "./session";

/**
 * Professionnel dont on affiche l'espace :
 *  - Supabase actif + connecté avec un profil pro → son vrai profil (`demo: false`) ;
 *  - sinon → l'artisan ou la boutique de démonstration (`demo: true`).
 */
type Etat = { pret: boolean; pro: LignePro | null };

let etat: Etat = { pret: !SUPABASE_ACTIF, pro: null };
const abonnes = new Set<() => void>();
let ecoute = false;

async function charger() {
  const s = sessionActuelle();
  try {
    etat = { pret: true, pro: s ? await monProfilPro(s.id) : null };
  } catch {
    etat = { pret: true, pro: null };
  }
  abonnes.forEach((f) => f());
}

function abonner(f: () => void) {
  if (!ecoute && SUPABASE_ACTIF) {
    ecoute = true;
    surSession(() => void charger());
  }
  abonnes.add(f);
  return () => abonnes.delete(f);
}

/** À appeler après la création ou la modification du profil pro. */
export const rechargerProConnecte = () => (SUPABASE_ACTIF ? charger() : Promise.resolve());

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
