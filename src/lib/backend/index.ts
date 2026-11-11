/**
 * Point d'entrée unique du backend. Les pages importent uniquement d'ici.
 *
 * Démo : Firebase. Pour passer à Supabase ou Neon, écrire ./supabase.ts (ou ./neon.ts)
 * avec les mêmes fonctions et remplacer la ligne ci-dessous.
 */
import { creerProfilPro as creerProfilProFirebase } from "./firebase";
import { creerProfilProSupabase } from "./pros";
import { SUPABASE_ACTIF } from "./supabase";
import type { NouveauProfilPro } from "./types";

export { envoyerCodeSms, messageErreur, nettoyerVerification } from "./firebase";
export { SUPABASE_ACTIF, estDemo } from "./supabase";

/** Crée le profil pro : dans Supabase s'il est configuré, sinon dans Firestore (démo). */
export const creerProfilPro = (id: string, p: NouveauProfilPro): Promise<void> =>
  SUPABASE_ACTIF ? creerProfilProSupabase(id, p) : creerProfilProFirebase(id, p);
export { destinatairesAlerte, notifierNouveauMessage, texteAlerte } from "./notifications";
export type { NotificationMessage, NouveauProfilPro, NumeroJoignable, VerificationTelephone } from "./types";

/** Numéro congolais saisi (« 06 612 34 56 ») → format international (+242066123456). */
export function versE164(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "").replace(/^242/, "");
  return `+242${chiffres}`;
}
