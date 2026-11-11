import type { NotificationMessage } from "./types";

/**
 * Prévient le destinataire d'un nouveau message, par WhatsApp et SMS.
 *
 * MAQUETTE : ne fait rien de réel — les conversations vivent dans le navigateur. C'est le
 * SEUL endroit du code à brancher quand le backend sera prêt ; les composants de la
 * messagerie n'ont pas à changer. Le mode d'emploi complet est dans `supabase/` à la
 * racine du projet (schéma, Edge Function, variables d'environnement).
 *
 * En production, on n'appelle JAMAIS un fournisseur SMS/WhatsApp depuis le navigateur (la
 * clé secrète serait exposée). Le vrai chemin est :
 *   1. le message est écrit dans Supabase (table `messages`, protégée par RLS) ;
 *   2. un trigger Postgres déclenche l'Edge Function `notifier-message` ;
 *   3. l'Edge Function lit les numéros du destinataire et appelle le fournisseur
 *      (Africa's Talking ou Twilio) avec une clé secrète côté serveur.
 * Cette fonction côté client se contentera donc d'écrire le message ; l'alerte part du serveur.
 */
export async function notifierNouveauMessage(n: NotificationMessage): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    // Trace de démonstration : aucune alerte réelle n'est envoyée.
    const cibles = destinatairesAlerte(n);
    console.info(
      `[maquette] alerte à ${n.destinataire.nom} —`,
      `WhatsApp: ${cibles.whatsapp.join(", ") || "aucun"} · SMS: ${cibles.sms.join(", ")}`,
      `\n${texteAlerte(n)}`,
    );
  }
  // TODO backend : écrire le message dans Supabase ; l'Edge Function `notifier-message`
  // s'occupe de l'envoi WhatsApp/SMS. Voir supabase/functions/notifier-message/.
}

/** Texte de l'alerte WhatsApp/SMS envoyée au destinataire. */
export function texteAlerte(n: NotificationMessage): string {
  const apercu = n.texte.length > 80 ? `${n.texte.slice(0, 77)}…` : n.texte;
  return `Artopif : ${n.expediteur} vous a écrit « ${apercu} ». Répondez-lui sur artopif.`;
}

/**
 * Répartit les numéros du destinataire : d'abord ceux joignables sur WhatsApp,
 * puis tous les numéros pour le SMS de secours.
 */
export function destinatairesAlerte(n: NotificationMessage): { whatsapp: string[]; sms: string[] } {
  return {
    whatsapp: n.destinataire.telephones.filter((t) => t.whatsapp).map((t) => t.numero),
    sms: n.destinataire.telephones.map((t) => t.numero),
  };
}
