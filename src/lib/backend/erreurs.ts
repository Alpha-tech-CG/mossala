/** Erreurs Firebase (connexion, base, fonctions, stockage) → message lisible. Sans dépendance au SDK. */
export function messageErreur(e: unknown): string {
  const { code = "", message = "" } = (e as { code?: string; message?: string }) ?? {};
  const messages: Record<string, string> = {
    // Connexion
    "auth/invalid-phone-number": "Ce numéro n’est pas valide. Vérifiez-le (ex. 06 612 34 56).",
    "auth/missing-phone-number": "Saisissez votre numéro de téléphone.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
    "auth/quota-exceeded": "Le service SMS est momentanément saturé. Réessayez plus tard.",
    "auth/invalid-verification-code": "Code incorrect. Vérifiez le SMS reçu.",
    "auth/code-expired": "Ce code a expiré. Demandez un nouveau code.",
    "auth/captcha-check-failed": "Vérification de sécurité échouée. Rechargez la page.",
    "auth/network-request-failed": "Pas de connexion internet. Réessayez.",
    "auth/operation-not-allowed": "Ce mode de connexion n’est pas encore activé (configuration du service).",
    "auth/unauthorized-domain": "Ce site n’est pas encore autorisé par le service de connexion.",
    "auth/user-disabled": "Ce compte est désactivé. Contactez l’équipe Artopif.",
    "auth/invalid-custom-token": "Connexion refusée. Demandez un nouveau code.",
    // Base de données et stockage
    "permission-denied": "Action refusée : reconnectez-vous puis réessayez.",
    "storage/unauthorized": "Envoi de la photo refusé : reconnectez-vous puis réessayez.",
    "storage/quota-exceeded": "Stockage des photos plein. Réessayez plus tard.",
    unavailable: "Service momentanément indisponible. Réessayez.",
    "functions/unavailable": "Service momentanément indisponible. Réessayez.",
    "functions/internal": "Une erreur est survenue. Réessayez.",
    "functions/not-found": "Le service de connexion par email n’est pas encore déployé.",
  };
  if (messages[code]) return messages[code];
  // Les Cloud Functions renvoient déjà un message en français (firebase-functions/index.js).
  if (code.startsWith("functions/") && message) return message;
  if (/fetch|network|offline/i.test(message)) return "Pas de connexion internet. Réessayez.";
  if (!code && message) return message;
  return `Une erreur est survenue${code ? ` (${code})` : ""}. Réessayez.`;
}
