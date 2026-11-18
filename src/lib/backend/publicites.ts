"use client";

import { useSyncExternalStore } from "react";
import { BACKEND_ACTIF } from "./actif";
import { EVENEMENT_LOCAL, lireLocal } from "./local";
import type { PubDoc } from "./modele";

/**
 * Campagnes publicitaires actives (publicites/{id}, statut « active »), lues une fois par visite.
 * Tant qu'elles ne sont pas chargées (rendu serveur, premier affichage), les espaces restent
 * neutres : aucun décalage entre le serveur et le navigateur.
 */
type Campagnes = PubDoc[];

let cache: Campagnes | null = null;
let charge = false;
const abonnes = new Set<() => void>();
const prevenir = () => abonnes.forEach((f) => f());

async function charger() {
  if (!BACKEND_ACTIF) {
    cache = lireLocal().publicites.filter((p) => p.statut === "active");
    prevenir();
    return;
  }
  try {
    const [{ collection, getDocs, query, where }, { db }, { versPubDoc }] = await Promise.all([
      import("firebase/firestore"),
      import("./firebase"),
      import("./modele"),
    ]);
    const snap = await getDocs(query(collection(db(), "publicites"), where("statut", "==", "active")));
    cache = snap.docs.map((d) => versPubDoc(d.id, d.data()));
  } catch (e) {
    console.error("publicites", e);
    cache = []; // en cas d'erreur : espaces libres
  }
  prevenir();
}

function abonner(f: () => void) {
  abonnes.add(f);
  if (!charge) {
    charge = true;
    void charger();
    // maquette : la console (même navigateur) met les pubs à jour en direct
    if (!BACKEND_ACTIF) window.addEventListener(EVENEMENT_LOCAL, () => void charger());
  }
  return () => abonnes.delete(f);
}

/** Campagnes actives, ou null tant qu'elles ne sont pas chargées. */
export function useCampagnes(): Campagnes | null {
  return useSyncExternalStore(
    abonner,
    () => cache,
    () => null,
  );
}

/** Après un changement dans la console (production) : relire les campagnes. */
export function oublierReglagesPubs() {
  void charger();
}
