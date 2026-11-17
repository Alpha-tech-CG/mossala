import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { sessionActuelle } from "../session";
import { BACKEND_ACTIF } from "./actif";
import { db } from "./firebase";
import { idLocal, lireLocal, modifierLocal } from "./local";
import type { CibleAvis, ExperienceAvis, Recommandation } from "./modele";

export type NouvelAvis = {
  cibleType: CibleAvis;
  cibleId: string;
  cibleNom: string;
  /** « Grâce N. » */
  auteur: string;
  notes: Record<string, number>;
  note: number;
  recommandation: Recommandation;
  experience: ExperienceAvis;
  date: string | null;
  texte: string;
};

/** Un seul avis par client et par professionnel : l'identifiant le garantit (règles Firestore). */
const idAvis = (a: Pick<NouvelAvis, "cibleType" | "cibleId">, auteurId: string) =>
  `${a.cibleType}_${a.cibleId}_${auteurId}`;

export class AvisDejaDonne extends Error {
  constructor() {
    super("Vous avez déjà donné votre avis sur ce professionnel.");
  }
}

/**
 * Enregistre un avis « à modérer » : il n'est publié qu'après validation par l'équipe (backoffice).
 * Lève AvisDejaDonne si le client a déjà évalué ce professionnel.
 */
export async function publierAvis(a: NouvelAvis): Promise<void> {
  const base = {
    ...a,
    statut: "a_moderer" as const,
    verifie: false,
    motifRefus: null,
  };

  if (!BACKEND_ACTIF) {
    const auteurId = "maquette";
    const id = idAvis(a, auteurId);
    if (lireLocal().avis.some((v) => v.id === id)) throw new AvisDejaDonne();
    modifierLocal((b) => ({ ...b, avis: [{ ...base, id, auteurId, creeLe: Date.now(), modereLe: 0 }, ...b.avis] }));
    return;
  }

  const session = sessionActuelle();
  if (!session) throw Object.assign(new Error("non connecté"), { code: "permission-denied" });
  const ref = doc(db(), "avis", idAvis(a, session.id));
  if ((await getDoc(ref)).exists()) throw new AvisDejaDonne();
  await setDoc(ref, { ...base, auteurId: session.id, modereLe: null, creeLe: serverTimestamp() });
}

export type NouveauSignalement = {
  cible: "profil" | "avis";
  cibleId: string;
  libelle: string;
  motif: string;
};

/** Signale un profil ou un avis à l'équipe de modération (connecté ou non). */
export async function envoyerSignalement(s: NouveauSignalement): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({
      ...b,
      signalements: [{ ...s, id: idLocal(), auteurId: null, statut: "nouveau", creeLe: Date.now() }, ...b.signalements],
    }));
    return;
  }
  await addDoc(collection(db(), "signalements"), {
    ...s,
    auteurId: sessionActuelle()?.id ?? null,
    statut: "nouveau",
    creeLe: serverTimestamp(),
  });
}
