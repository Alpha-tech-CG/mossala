/**
 * Point d'entrée du backend pour les pages (connexion, profils pros, alertes de la maquette).
 * Production : Firebase (./firebase.ts, ./pros.ts). Interrupteur : ./actif.ts.
 */
export { envoyerCodeEmail, envoyerCodeSms, nettoyerVerification } from "./firebase";
export { creerProfilPro } from "./pros";
export { SUJETS_CONTACT, envoyerMessageContact } from "./contact";
export type { MessageContact } from "./contact";
export { AvisDejaDonne, envoyerSignalement, publierAvis, repondreAvis } from "./avis";
export type { NouvelAvis, NouveauSignalement } from "./avis";
export { estMonCommentaire, lireCommentaires, publierCommentaire, retirerCommentaire } from "./commentaires";
export type { NouveauCommentaire } from "./commentaires";
export { envoyerDemandeAnnonceur, proposerMetier } from "./demandes";
export type { NouvelleDemandeAnnonceur } from "./demandes";
export { messageErreur } from "./erreurs";
export { BACKEND_ACTIF, estDemo } from "./actif";
export { destinatairesAlerte, notifierNouveauMessage, texteAlerte } from "./notifications";
export type { NotificationMessage, NouveauProfilPro, NumeroJoignable, Session, VerificationCode } from "./types";

/** Numéro congolais saisi (« 06 612 34 56 ») → format international (+242066123456). */
export function versE164(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "").replace(/^242/, "");
  return `+242${chiffres}`;
}
