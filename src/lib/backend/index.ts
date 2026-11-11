/**
 * Point d'entrée unique du backend. Les pages importent uniquement d'ici.
 *
 * Démo : Firebase. Pour passer à Supabase ou Neon, écrire ./supabase.ts (ou ./neon.ts)
 * avec les mêmes fonctions et remplacer la ligne ci-dessous.
 */
export { creerProfilPro, envoyerCodeSms, messageErreur, nettoyerVerification } from "./firebase";
export { destinatairesAlerte, notifierNouveauMessage, texteAlerte } from "./notifications";
export type { NotificationMessage, NouveauProfilPro, NumeroJoignable, VerificationTelephone } from "./types";

/** Numéro congolais saisi (« 06 612 34 56 ») → format international (+242066123456). */
export function versE164(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "").replace(/^242/, "");
  return `+242${chiffres}`;
}
