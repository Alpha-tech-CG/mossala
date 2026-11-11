"use client";

import { useSyncExternalStore } from "react";
import { SUPABASE_ACTIF } from "./backend/supabase";

/**
 * Compte connecté par code SMS (Firebase), quand Supabase est actif.
 * En maquette, il n'y a pas de session : `session` reste null et `pret` passe à true.
 */
export type Session = { id: string; telephone: string };

type Etat = { pret: boolean; session: Session | null };

let etat: Etat = { pret: !SUPABASE_ACTIF, session: null };
const abonnes = new Set<() => void>();
let ecoute = false;

function demarrer() {
  if (ecoute || !SUPABASE_ACTIF || typeof window === "undefined") return;
  ecoute = true;
  void import("./backend/firebase").then(({ surConnexion }) =>
    surConnexion((u) => {
      etat = { pret: true, session: u };
      abonnes.forEach((f) => f());
    }),
  );
}

const SERVEUR: Etat = { pret: false, session: null };

/** S'abonne aux changements de session (pour les modules qui gardent un cache). */
export function surSession(f: () => void): () => void {
  demarrer();
  abonnes.add(f);
  return () => abonnes.delete(f);
}

export const sessionActuelle = () => etat.session;

export function useSession(): Etat {
  return useSyncExternalStore(surSession, () => etat, () => SERVEUR);
}
