// Types neutres du backend : ils ne dépendent d'aucun fournisseur (Firebase, Supabase, Neon…).

/** Code SMS envoyé, en attente de la saisie de l'utilisateur. */
export type VerificationTelephone = {
  /** Vérifie le code ; renvoie l'identifiant du compte et le numéro vérifié. */
  confirmer(code: string): Promise<{ id: string; telephone: string }>;
};

export type NouveauProfilPro = {
  type: "artisan" | "boutique";
  nom: string;
  /** numéro vérifié par SMS, format international */
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
 * Nouveau message à transmettre et à notifier au destinataire (celui qui ne l'a pas écrit).
 * Sert d'entrée unique à `notifierNouveauMessage` : le jour où le backend est prêt, seule
 * cette fonction change, pas les composants de la messagerie.
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
