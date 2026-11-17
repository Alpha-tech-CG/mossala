import type { NotificationMessage } from "./types";

/**
 * Prévient le destinataire d'un nouveau message, par WhatsApp et SMS.
 *
 * MAQUETTE SEULEMENT (artisans de démonstration, ou Firebase non configuré) : ne fait rien
 * de réel, les conversations vivent dans le navigateur.
 *
 * En production, on n'appelle JAMAIS un fournisseur SMS/WhatsApp depuis le navigateur (la
 * clé secrète serait exposée). Le vrai chemin est :
 *   1. le message (ou la demande de devis) est écrit dans Firestore, protégé par les règles ;
 *   2. une Cloud Function (firebase-functions/index.js : alerteMessage, alerteDemande,
 *      alerteDevis) se déclenche à l'écriture ;
 *   3. elle lit les numéros du destinataire et appelle Africa's Talking avec une clé secrète.
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
  // En production, les échanges avec les pros inscrits n'appellent pas cette fonction : le
  // message est écrit dans Firestore et une Cloud Function envoie l'alerte.
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
