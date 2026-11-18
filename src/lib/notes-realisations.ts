"use client";

import { useEffect, useSyncExternalStore } from "react";
import { estDemo } from "./backend/actif";
import { sessionActuelle, useSession } from "./session";

/**
 * Notes (1 à 5 étoiles) données aux réalisations, dans le fil de l'application.
 *
 * Clé d'une réalisation : « proId_realisationId » (réalisation en base) ou
 * « proId_demoN » (réalisation de démonstration, N = sa place dans la liste).
 *
 * MAQUETTE / artisans de démonstration : la note de l'utilisateur est gardée dans le navigateur.
 * PRODUCTION : notesRealisations/{cle}_{uid} = { proId, realisationId, auteurId, note, majLe }
 * (une note par client et par réalisation, modifiable), et la Cloud Function
 * « statsNoteRealisation » tient à jour statsRealisations/{cle} = { somme, nombre }.
 */

export type StatsNote = { somme: number; nombre: number };
type Etat = { miennes: Record<string, number>; stats: Record<string, StatsNote> };

const CLE_LOCALE = "artopif-notes-realisations";
let etat: Etat = { miennes: {}, stats: {} };
let charge = false;
const abonnes = new Set<() => void>();
const publier = (e: Etat) => {
  etat = e;
  abonnes.forEach((f) => f());
};

function chargerLocal() {
  if (charge || typeof window === "undefined") return;
  charge = true;
  try {
    const miennes = JSON.parse(localStorage.getItem(CLE_LOCALE) ?? "{}") as Record<string, number>;
    etat = { ...etat, miennes: { ...miennes, ...etat.miennes } };
  } catch {
    /* stockage indisponible */
  }
}

export const cleRealisation = (proId: string, realisationId: string | undefined, index: number) =>
  realisationId ? `${proId}_${realisationId}` : `${proId}_demo${index}`;

const SERVEUR: Etat = { miennes: {}, stats: {} };

export function useNotes(): Etat {
  return useSyncExternalStore(
    (f) => {
      chargerLocal();
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => {
      chargerLocal();
      return etat;
    },
    () => SERVEUR,
  );
}

/** Moyenne affichée (une décimale) et nombre de notes, en comptant celle de l'utilisateur. */
export function resume(e: Etat, cle: string, proId: string): { moyenne: number; nombre: number; mienne: number } {
  const mienne = e.miennes[cle] ?? 0;
  if (estDemo(proId)) return { moyenne: mienne, nombre: mienne ? 1 : 0, mienne };
  const s = e.stats[cle] ?? { somme: 0, nombre: 0 };
  return { moyenne: s.nombre ? Math.round((s.somme / s.nombre) * 10) / 10 : 0, nombre: s.nombre, mienne };
}

// ——— Production : statistiques et note de l'utilisateur lues dans Firestore ———

/** Réalisations déjà lues, par compte (« uid:cle »). */
const demandees = new Set<string>();
let dernierUid: string | null = null;

/** Charge (une fois par compte) les statistiques et la note de l'utilisateur pour ces réalisations en base. */
export function useChargerNotes(cles: { cle: string; proId: string }[]) {
  const { session } = useSession();
  const uid = session?.id ?? null;
  const aCharger = cles.filter((c) => !estDemo(c.proId)).map((c) => c.cle);
  const signature = aCharger.join("|");
  useEffect(() => {
    if (uid !== dernierUid) {
      // autre compte : ses notes à lui, pas celles du précédent
      dernierUid = uid;
      const miennes = Object.fromEntries(Object.entries(etat.miennes).filter(([c]) => c.includes("_demo")));
      publier({ ...etat, miennes });
    }
    const nouvelles = signature ? signature.split("|").filter((c) => !demandees.has(`${uid}:${c}`)) : [];
    if (!nouvelles.length) return;
    nouvelles.forEach((c) => demandees.add(`${uid}:${c}`));
    void (async () => {
      const [{ doc, getDoc }, { db }] = await Promise.all([import("firebase/firestore"), import("./backend/firebase")]);
      const lus = await Promise.all(
        nouvelles.map(async (cle) => {
          const [stats, mienne] = await Promise.all([
            getDoc(doc(db(), "statsRealisations", cle)).catch(() => null),
            uid ? getDoc(doc(db(), "notesRealisations", `${cle}_${uid}`)).catch(() => null) : null,
          ]);
          return { cle, stats: stats?.data() as StatsNote | undefined, mienne: mienne?.data()?.note as number | undefined };
        }),
      );
      const suivant = { miennes: { ...etat.miennes }, stats: { ...etat.stats } };
      for (const l of lus) {
        if (l.stats) suivant.stats[l.cle] = { somme: l.stats.somme ?? 0, nombre: l.stats.nombre ?? 0 };
        if (l.mienne) suivant.miennes[l.cle] = l.mienne;
      }
      publier(suivant);
    })();
  }, [signature, uid]);
}

export class ConnexionRequise extends Error {
  constructor() {
    super("Connectez-vous pour noter une réalisation.");
  }
}

/** Donne (ou change) sa note. Mise à jour immédiate à l'écran, la base suit. */
export async function noter(r: { cle: string; proId: string; realisationId?: string }, note: number): Promise<void> {
  const n = Math.max(1, Math.min(5, Math.round(note)));
  const avant = etat;
  const ancienne = etat.miennes[r.cle] ?? 0;

  if (estDemo(r.proId) || !r.realisationId) {
    const miennes = { ...etat.miennes, [r.cle]: n };
    try {
      const locales = JSON.parse(localStorage.getItem(CLE_LOCALE) ?? "{}") as Record<string, number>;
      localStorage.setItem(CLE_LOCALE, JSON.stringify({ ...locales, [r.cle]: n }));
    } catch {
      /* gardée le temps de la visite */
    }
    publier({ ...etat, miennes });
    return;
  }

  const s = sessionActuelle();
  if (!s) throw new ConnexionRequise();
  const st = etat.stats[r.cle] ?? { somme: 0, nombre: 0 };
  publier({
    miennes: { ...etat.miennes, [r.cle]: n },
    stats: { ...etat.stats, [r.cle]: { somme: st.somme - ancienne + n, nombre: st.nombre + (ancienne ? 0 : 1) } },
  });
  try {
    const [{ doc, serverTimestamp, setDoc }, { db }] = await Promise.all([
      import("firebase/firestore"),
      import("./backend/firebase"),
    ]);
    await setDoc(doc(db(), "notesRealisations", `${r.cle}_${s.id}`), {
      proId: r.proId,
      realisationId: r.realisationId,
      auteurId: s.id,
      note: n,
      majLe: serverTimestamp(),
    });
  } catch (e) {
    publier(avant);
    throw e;
  }
}
