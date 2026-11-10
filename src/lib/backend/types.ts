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
