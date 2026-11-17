import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { BACKEND_ACTIF } from "./actif";
import { db } from "./firebase";
import { idLocal, modifierLocal } from "./local";

export const SUJETS_CONTACT = [
  "Question sur un artisan ou un magasin",
  "Je suis un professionnel",
  "Signaler un avis ou un problème",
  "Publicité et partenariats",
  "Autre demande",
] as const;

export type MessageContact = {
  nom: string;
  telephone: string | null;
  email: string | null;
  sujet: (typeof SUJETS_CONTACT)[number];
  message: string;
};

/**
 * Formulaire « Nous contacter » : le message est enregistré dans contacts/{id}
 * (écriture seule depuis le navigateur, lecture par l'équipe dans la console Firebase).
 * La Cloud Function alerteContact prévient l'équipe par email.
 * En maquette (sans Firebase), le message est gardé dans le navigateur.
 */
export async function envoyerMessageContact(m: MessageContact): Promise<void> {
  if (!BACKEND_ACTIF) {
    // maquette : gardé dans le navigateur, visible dans le backoffice /admin
    modifierLocal((b) => ({
      ...b,
      contacts: [{ ...m, id: idLocal(), statut: "nouveau", recuLe: Date.now() }, ...b.contacts],
    }));
    return;
  }
  await addDoc(collection(db(), "contacts"), { ...m, statut: "nouveau", recuLe: serverTimestamp() });
}
