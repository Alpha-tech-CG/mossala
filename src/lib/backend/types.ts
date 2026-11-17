// Types neutres du backend.

/** Compte connecté : par code SMS (`telephone` vérifié) ou par code email (`email` vérifié). */
export type Session = { id: string; telephone: string; email: string };

/** Code envoyé (SMS ou email), en attente de la saisie de l'utilisateur. */
export type VerificationCode = {
  /** Vérifie le code et connecte l'utilisateur. */
  confirmer(code: string): Promise<Session>;
};

export type NouveauProfilPro = {
  type: "artisan" | "boutique";
  nom: string;
  /** numéro principal (vérifié par SMS si la connexion s'est faite par SMS), format international */
  telephone: string;
  numeroPublic: boolean;
  // artisan
  metier?: string;
  zones?: string[];
  /** responsable du compte et coordonnées (communs artisan et magasin) */
  responsable: { nom: string; prenom: string; email?: string };
  adresse: string;
  ville: string;
  quartier: string;
  /** de 1 à 3 numéros, avec ceux qui ont WhatsApp */
  telephones: { numero: string; whatsapp: boolean }[];
};

/** Un numéro et s'il est joignable sur WhatsApp. */
export type NumeroJoignable = { numero: string; whatsapp: boolean };

/**
 * Nouveau message à notifier au destinataire (celui qui ne l'a pas écrit).
 * Ne sert plus qu'à la maquette : en production, l'alerte part des Cloud Functions.
 */
export type NotificationMessage = {
  conversationId: string;
  de: "client" | "artisan";
  texte: string;
  /** nom de l'expéditeur, affiché dans l'alerte */
  expediteur: string;
  /** destinataire à prévenir */
  destinataire: {
    nom: string;
    telephones: NumeroJoignable[];
  };
};
