import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { BACKEND_ACTIF } from "./actif";
import { db } from "./firebase";
import { idLocal, modifierLocal } from "./local";

/**
 * Demandes envoyées par les visiteurs et traitées dans le backoffice /admin.
 * Maquette (sans Firebase) : gardées dans le navigateur.
 */

export type NouvelleDemandeAnnonceur = { nom: string; type: string; telephone: string; interets: string[] };

/** Formulaire « Être recontacté » de la page Nos services → demandesAnnonceurs/{id}. */
export async function envoyerDemandeAnnonceur(d: NouvelleDemandeAnnonceur): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({
      ...b,
      demandesAnnonceurs: [{ ...d, id: idLocal(), statut: "nouveau", recuLe: Date.now() }, ...b.demandesAnnonceurs],
    }));
    return;
  }
  await addDoc(collection(db(), "demandesAnnonceurs"), { ...d, statut: "nouveau", recuLe: serverTimestamp() });
}

/** « Proposez un métier » (page Tous les métiers) → propositionsMetiers/{id}. */
export async function proposerMetier(nom: string, categorie: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({
      ...b,
      propositionsMetiers: [{ id: idLocal(), nom, categorie, statut: "nouveau", recuLe: Date.now() }, ...b.propositionsMetiers],
    }));
    return;
  }
  await addDoc(collection(db(), "propositionsMetiers"), { nom, categorie, statut: "nouveau", recuLe: serverTimestamp() });
}
