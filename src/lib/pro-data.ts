// Données de démonstration de l'espace professionnel — à remplacer par Firebase.
// L'artisan connecté en démo est Jean-Claude Mbemba (plombier, Bacongo).

export const ARTISAN_DEMO_ID = "jean-claude-mbemba";

export type Urgence = "urgent" | "semaine" | "flexible";

export type Demande = {
  id: string;
  client: string;
  quartier: string;
  recu: string; // « il y a 12 min »
  urgence: Urgence;
  message: string;
  dateSouhaitee: string;
  budget?: string;
  photos: string[];
  telephone: string; // numéro laissé par le client pour être rappelé
  statut: "nouvelle" | "repondue" | "declinee";
};

export const demandes: Demande[] = [
  {
    id: "d1",
    client: "Marie Ngoma",
    quartier: "Moungali",
    recu: "il y a 12 min",
    urgence: "urgent",
    message:
      "Fuite d’eau sous l’évier de la cuisine. L’eau coule depuis ce matin, le meuble est mouillé. Merci de venir aujourd’hui si possible.",
    dateSouhaitee: "Aujourd’hui, avant 12 h",
    budget: "40 000 à 60 000 FCFA",
    photos: ["/images/ciment.jpg", "/images/peinture.jpg"],
    telephone: "+242 06 444 12 12",
    statut: "nouvelle",
  },
  {
    id: "d2",
    client: "Paul Bakala",
    quartier: "Makélékélé",
    recu: "il y a 1 h",
    urgence: "semaine",
    message: "Installation de deux robinets et remplacement d’une chasse d’eau.",
    dateSouhaitee: "Cette semaine",
    photos: [],
    telephone: "+242 05 333 45 45",
    statut: "nouvelle",
  },
  {
    id: "d3",
    client: "Grâce Nkounkou",
    quartier: "Bacongo",
    recu: "hier",
    urgence: "flexible",
    message: "Je voudrais refaire la salle de bain complète, pouvez-vous passer voir ?",
    dateSouhaitee: "Dans le mois",
    budget: "À discuter",
    photos: ["/images/jean-claude.jpg"],
    telephone: "+242 06 222 78 78",
    statut: "repondue",
  },
  {
    id: "d4",
    client: "Hervé Kimbembe",
    quartier: "Mfilou",
    recu: "il y a 3 jours",
    urgence: "semaine",
    message: "Chauffe-eau qui ne chauffe plus.",
    dateSouhaitee: "Cette semaine",
    photos: [],
    telephone: "+242 05 111 90 90",
    statut: "declinee",
  },
];

export const getDemande = (id: string) => demandes.find((d) => d.id === id);

export type RendezVous = {
  id: string;
  jour: string; // AAAA-MM-JJ
  heure: string;
  duree: string;
  titre: string;
  lieu: string;
  client: string;
  statut: "confirme" | "en-cours" | "a-preparer";
};

/** Semaine affichée dans l'agenda de démo (lundi 9 → dimanche 15 novembre 2026). */
export const semaine = [
  { jour: "2026-11-09", court: "Lun", num: 9 },
  { jour: "2026-11-10", court: "Mar", num: 10 },
  { jour: "2026-11-11", court: "Mer", num: 11 },
  { jour: "2026-11-12", court: "Jeu", num: 12 },
  { jour: "2026-11-13", court: "Ven", num: 13 },
  { jour: "2026-11-14", court: "Sam", num: 14 },
  { jour: "2026-11-15", court: "Dim", num: 15 },
];
export const JOUR_DEMO = "2026-11-09";

export const rendezVous: RendezVous[] = [
  { id: "r1", jour: "2026-11-09", heure: "09h00", duree: "2 h", titre: "Diagnostic fuite", lieu: "Moungali", client: "Marie Ngoma", statut: "confirme" },
  { id: "r2", jour: "2026-11-09", heure: "14h00", duree: "3 h", titre: "Remplacement du chauffe-eau", lieu: "Bacongo, rue de la Paix", client: "Joseph Malonga", statut: "en-cours" },
  { id: "r3", jour: "2026-11-09", heure: "17h30", duree: "1 h", titre: "Visite pour travaux salle de bain", lieu: "Bacongo", client: "Grâce Nkounkou", statut: "a-preparer" },
  { id: "r4", jour: "2026-11-11", heure: "10h00", duree: "2 h", titre: "Pose de deux robinets", lieu: "Makélékélé", client: "Paul Bakala", statut: "confirme" },
  { id: "r5", jour: "2026-11-13", heure: "08h30", duree: "4 h", titre: "Remplacement colonne d’eau", lieu: "Centre-ville", client: "Hôtel Le Flamboyant", statut: "confirme" },
];

export const statsArtisan = {
  vuesProfil: 184,
  appelsRecus: 23, // clics « Appeler » quand le numéro est public
  chantiersMois: 12,
};

// ——— Boutiquier ———

export const BOUTIQUE_DEMO_ID = "total-bacongo";

export type ReservationBoutique = {
  code: string;
  client: string;
  produit: string;
  quantite: number;
  unite: string;
  total: number;
  creneau: string;
  statut: "a-confirmer" | "prete" | "retiree" | "annulee";
};

export const reservationsBoutique: ReservationBoutique[] = [
  { code: "QB-7KD2X", client: "Hervé K.", produit: "Ciment 42,5 kg", quantite: 10, unite: "sacs", total: 85000, creneau: "Aujourd’hui 14h–18h", statut: "a-confirmer" },
  { code: "QB-M4P9A", client: "Jean-Claude M. (artisan)", produit: "Tuyau PVC Ø32 (4 m)", quantite: 6, unite: "barres", total: 27000, creneau: "Aujourd’hui 14h–18h", statut: "prete" },
  { code: "QB-2ZR8T", client: "Nadia B.", produit: "Ciment 42,5 kg", quantite: 3, unite: "sacs", total: 25500, creneau: "Demain 8h–12h", statut: "a-confirmer" },
  { code: "QB-9HX3L", client: "Sylvain O.", produit: "Tuyau PVC Ø32 (4 m)", quantite: 2, unite: "barres", total: 9000, creneau: "Hier", statut: "retiree" },
];
