// Données de démonstration — à remplacer par Firebase.

/**
 * Pilote : messages gratuits et illimités, aucun paiement (décision du 2026-11-09).
 * Passer à true pour la version pro : 5 messages/mois puis pass illimité payant.
 */
export const QUOTA_ACTIF = false;

/** Version pro : messages gratuits par mois, puis accès illimité payant. */
export const MESSAGES_GRATUITS_PAR_MOIS = 5;
export const PRIX_ILLIMITE_FCFA = 500;
export const DUREE_ILLIMITE_JOURS = 30; // validé par le client

/**
 * Accès aux profils (décision client du 2026-11-09) : la liste des résultats est publique,
 * mais voir un profil complet demande un compte. Un compte gratuit ouvre 5 profils par mois,
 * ensuite le client passe Premium. Les messages, eux, restent gratuits et illimités.
 */
/** Profils complets qu'un visiteur peut ouvrir sans compte, avant de devoir s'inscrire. */
export const PROFILS_SANS_COMPTE = 3;

import { getCategorie, getMetier } from "./metiers";

export { categories, metiers, getMetier, getCategorie } from "./metiers";
export type { Categorie, CategorieId, Metier } from "./metiers";

/** Identifiant d'un métier du catalogue (voir src/lib/metiers.ts). */
export type MetierId = string;

export const quartiers = [
  "Bacongo",
  "Poto-Poto",
  "Moungali",
  "Talangaï",
  "Makélékélé",
  "Ouenzé",
  "Mfilou",
  "Centre-ville",
];

export type Badge =
  | "Téléphone vérifié"
  | "Identité vérifiée"
  | "Références contrôlées"
  | "Témoignages vérifiés"
  | "Réalisations vérifiées"
  | "Réponse rapide"
  | "Top avis";

export type Realisation = {
  /** identifiant en base (réalisations publiées par un artisan inscrit) */
  id?: string;
  titre: string;
  type: string;
  quartier: string;
  description: string;
  materiaux: string;
  duree: string;
  /** photo de couverture */
  image: string;
  /** autres photos du chantier (avant, pendant, après) */
  photos?: string[];
  /** mois du chantier, ex. « Octobre 2026 » */
  date?: string;
  verifiee: boolean;
};

export type Avis = {
  auteur: string;
  note: number;
  date: string;
  texte: string;
  reponse?: string;
  /** Ce que l'auteur a réellement vécu : seule une prestation confirmée compte comme avis vérifié. */
  experience?: "prestation" | "devis" | "contact";
};

export type Artisan = {
  id: string;
  nom: string;
  metier: MetierId;
  /** Ville de l'artisan (Brazzaville si non précisée). */
  ville?: string;
  quartier: string;
  zones: string[];
  note: number;
  nbAvis: number;
  reponse: string;
  disponible: "aujourdhui" | "semaine" | "plus-tard";
  image?: string;
  badges: Badge[];
  sponsorise?: boolean;
  description: string;
  telephone: string;
  /** true : numéro affiché, on peut l'appeler directement. false : contact par message uniquement. */
  numeroPublic: boolean;
  realisations: Realisation[];
  avis: Avis[];
};

export const artisans: Artisan[] = [
  {
    id: "jean-claude-mbemba",
    nom: "Jean-Claude Mbemba",
    metier: "plombier",
    quartier: "Bacongo",
    zones: ["Bacongo", "Makélékélé", "Centre-ville"],
    note: 4.8,
    nbAvis: 64,
    reponse: "Répond en 30 min",
    disponible: "aujourdhui",
    image: "/images/jean-claude.jpg",
    badges: ["Identité vérifiée", "Références contrôlées", "Réponse rapide", "Top avis"],
    description:
      "Plombier depuis 12 ans. Fuites, robinetterie, chauffe-eau, installation de salles de bain complètes.",
    telephone: "+242 06 612 34 56",
    numeroPublic: true,
    realisations: [
      {
        titre: "Rénovation d'une salle de bain",
        type: "Plomberie et carrelage",
        quartier: "Bacongo",
        description:
          "Remplacement de la robinetterie, réparation des tuyauteries et pose de carrelage.",
        materiaux: "Robinet, tuyaux PVC, colle, carrelage",
        duree: "3 jours",
        image: "/images/jean-claude.jpg",
        verifiee: true,
      },
      {
        titre: "Remplacement d'un chauffe-eau",
        type: "Plomberie",
        quartier: "Centre-ville",
        description: "Dépose de l'ancien ballon et installation d'un chauffe-eau 100 L.",
        materiaux: "Chauffe-eau 100 L, raccords, groupe de sécurité",
        duree: "1 jour",
        image: "/images/ciment.jpg",
        verifiee: false,
      },
    ],
    avis: [
      {
        auteur: "Grâce N.",
        experience: "prestation",
        note: 5,
        date: "Octobre 2026",
        texte:
          "Ponctuel, travail propre et le prix du devis a été respecté. Je recommande.",
        reponse: "Merci Madame, au plaisir de vous aider à nouveau.",
      },
      {
        auteur: "Hervé K.",
        experience: "prestation",
        note: 4,
        date: "Septembre 2026",
        texte: "Bon travail, un peu de retard le premier jour mais il a prévenu.",
      },
    ],
  },
  {
    id: "patrick-nzambi",
    nom: "Patrick Nzambi",
    metier: "electricien-batiment",
    quartier: "Poto-Poto",
    zones: ["Poto-Poto", "Moungali", "Ouenzé"],
    note: 4.9,
    nbAvis: 81,
    reponse: "Répond en 1 h",
    disponible: "aujourdhui",
    image: "/images/patrick.jpg",
    badges: ["Identité vérifiée", "Témoignages vérifiés", "Top avis"],
    description:
      "Électricien bâtiment. Mise aux normes, tableaux électriques, éclairage, dépannage rapide.",
    telephone: "+242 05 523 45 67",
    numeroPublic: false,
    realisations: [
      {
        titre: "Tableau électrique refait à neuf",
        type: "Électricité",
        quartier: "Poto-Poto",
        description: "Remplacement complet d'un tableau vétuste avec disjoncteurs différentiels.",
        materiaux: "Tableau 3 rangées, disjoncteurs, câbles",
        duree: "1 jour",
        image: "/images/patrick.jpg",
        verifiee: true,
      },
    ],
    avis: [
      {
        auteur: "Sandrine M.",
        experience: "prestation",
        note: 5,
        date: "Octobre 2026",
        texte: "Très professionnel, il a expliqué chaque étape. Devis clair.",
      },
    ],
  },
  {
    id: "divine-makosso",
    nom: "Divine Makosso",
    metier: "peintre-en-batiment",
    quartier: "Moungali",
    zones: ["Moungali", "Poto-Poto", "Centre-ville"],
    note: 4.7,
    nbAvis: 39,
    reponse: "Répond en 2 h",
    disponible: "semaine",
    image: "/images/divine.jpg",
    badges: ["Téléphone vérifié", "Réalisations vérifiées"],
    description:
      "Peinture intérieure et extérieure, enduits, finitions décoratives. Travail soigné.",
    telephone: "+242 06 634 56 78",
    numeroPublic: true,
    realisations: [
      {
        titre: "Salon repeint en deux tons",
        type: "Peinture intérieure",
        quartier: "Moungali",
        description: "Préparation des murs, enduit, deux couches de peinture satinée.",
        materiaux: "Peinture 20 L, enduit, bâche",
        duree: "2 jours",
        image: "/images/peinture.jpg",
        verifiee: true,
      },
    ],
    avis: [
      {
        auteur: "Junior B.",
        experience: "prestation",
        note: 5,
        date: "Août 2026",
        texte: "Finitions impeccables et chantier laissé propre.",
      },
    ],
  },
  {
    id: "marcel-ngouaka",
    nom: "Marcel Ngouaka",
    metier: "menuisier-bois",
    quartier: "Talangaï",
    zones: ["Talangaï", "Ouenzé"],
    note: 4.6,
    nbAvis: 27,
    reponse: "Répond en 3 h",
    disponible: "semaine",
    image: "/images/marcel.jpg",
    badges: ["Identité vérifiée", "Références contrôlées"],
    description: "Menuiserie bois et alu : portes, placards, cuisines sur mesure.",
    telephone: "+242 05 545 67 89",
    numeroPublic: false,
    realisations: [
      {
        titre: "Placard sur mesure",
        type: "Menuiserie",
        quartier: "Talangaï",
        description: "Fabrication et pose d'un placard trois portes en bois massif.",
        materiaux: "Bois, charnières, poignées",
        duree: "4 jours",
        image: "/images/marcel.jpg",
        verifiee: false,
      },
    ],
    avis: [
      {
        auteur: "Prisca O.",
        experience: "prestation",
        note: 4,
        date: "Juillet 2026",
        texte: "Beau travail, délai un peu plus long que prévu.",
      },
    ],
  },
  {
    id: "armel-bikouta",
    nom: "Armel Bikouta",
    metier: "plombier",
    quartier: "Makélékélé",
    zones: ["Makélékélé", "Bacongo", "Mfilou"],
    note: 4.9,
    nbAvis: 22,
    reponse: "Répond en 1 h",
    disponible: "aujourdhui",
    badges: ["Téléphone vérifié", "Identité vérifiée"],
    description: "Plomberie sanitaire, débouchage, installation de pompes.",
    telephone: "+242 06 656 78 90",
    numeroPublic: true,
    realisations: [],
    avis: [],
  },
  {
    id: "rostand-ondongo",
    nom: "Rostand Ondongo",
    metier: "installateur-de-climatiseurs",
    quartier: "Centre-ville",
    zones: ["Centre-ville", "Poto-Poto", "Bacongo"],
    note: 4.6,
    nbAvis: 18,
    reponse: "Répond en 2 h",
    disponible: "plus-tard",
    badges: ["Téléphone vérifié"],
    description: "Installation, entretien et recharge de climatiseurs split et cassette.",
    telephone: "+242 05 567 89 01",
    numeroPublic: false,
    realisations: [],
    avis: [],
  },
  {
    id: "christian-loemba",
    nom: "Christian Loemba",
    metier: "serrurier",
    quartier: "Ouenzé",
    zones: ["Ouenzé", "Talangaï", "Moungali"],
    note: 4.5,
    nbAvis: 15,
    reponse: "Répond en 45 min",
    disponible: "aujourdhui",
    badges: ["Identité vérifiée", "Réponse rapide"],
    description: "Ouverture de porte, changement de serrures, portails et grilles.",
    telephone: "+242 06 678 90 12",
    numeroPublic: true,
    realisations: [],
    avis: [],
  },
  {
    id: "gildas-mabiala",
    nom: "Gildas Mabiala",
    metier: "mecanicien-automobile",
    quartier: "Ouenzé",
    zones: ["Ouenzé", "Talangaï", "Poto-Poto"],
    note: 4.7,
    nbAvis: 33,
    reponse: "Répond en 1 h",
    disponible: "aujourdhui",
    badges: ["Identité vérifiée", "Références contrôlées"],
    description: "Diagnostic, vidange, freins, embrayage. Dépannage à domicile possible.",
    telephone: "+242 06 689 01 23",
    numeroPublic: true,
    realisations: [],
    avis: [],
  },
  {
    id: "mireille-kouka",
    nom: "Mireille Kouka",
    metier: "couturier",
    quartier: "Poto-Poto",
    zones: ["Poto-Poto", "Moungali", "Centre-ville"],
    note: 4.9,
    nbAvis: 58,
    reponse: "Répond en 2 h",
    disponible: "semaine",
    badges: ["Téléphone vérifié", "Top avis"],
    description: "Couture sur mesure en pagne et wax, tenues de cérémonie, retouches.",
    telephone: "+242 05 590 12 34",
    numeroPublic: false,
    realisations: [],
    avis: [],
  },
  {
    id: "nadege-bouanga",
    nom: "Nadège Bouanga",
    metier: "tresseuse",
    quartier: "Moungali",
    zones: ["Moungali", "Bacongo", "Poto-Poto"],
    note: 4.8,
    nbAvis: 41,
    reponse: "Répond en 30 min",
    disponible: "aujourdhui",
    badges: ["Téléphone vérifié", "Réponse rapide"],
    description: "Tresses, nattes, tissages et coiffure à domicile.",
    telephone: "+242 06 601 23 45",
    numeroPublic: true,
    realisations: [],
    avis: [],
  },
  {
    id: "serge-malonga",
    nom: "Serge Malonga",
    metier: "electricien-batiment",
    ville: "Pointe-Noire",
    quartier: "Mvou-Mvou",
    zones: ["Mvou-Mvou", "Lumumba", "Tié-Tié"],
    note: 4.7,
    nbAvis: 22,
    reponse: "Répond en 1 h",
    disponible: "aujourdhui",
    badges: ["Téléphone vérifié", "Identité vérifiée"],
    description: "Installations électriques, tableaux, dépannages et mise aux normes.",
    telephone: "+242 06 640 12 77",
    numeroPublic: false,
    realisations: [],
    avis: [],
  },
  {
    id: "prisca-tchicaya",
    nom: "Prisca Tchicaya",
    metier: "couturier",
    ville: "Pointe-Noire",
    quartier: "Lumumba",
    zones: ["Lumumba", "Mvou-Mvou"],
    note: 4.9,
    nbAvis: 31,
    reponse: "Répond en 30 min",
    disponible: "semaine",
    badges: ["Téléphone vérifié", "Réponse rapide"],
    description: "Tenues en pagne, retouches et confection sur mesure.",
    telephone: "+242 05 641 33 08",
    numeroPublic: true,
    realisations: [],
    avis: [],
  },
  {
    id: "fabrice-moukala",
    nom: "Fabrice Moukala",
    metier: "plombier",
    ville: "Dolisie",
    quartier: "Centre-ville",
    zones: ["Centre-ville"],
    note: 4.6,
    nbAvis: 12,
    reponse: "Répond en 2 h",
    disponible: "semaine",
    badges: ["Téléphone vérifié"],
    description: "Plomberie, forages et installation de réservoirs.",
    telephone: "+242 06 652 90 14",
    numeroPublic: false,
    realisations: [],
    avis: [],
  },
  {
    id: "herve-ngakosso",
    nom: "Hervé Ngakosso",
    metier: "menuisier-bois",
    ville: "Ouesso",
    quartier: "Centre-ville",
    zones: ["Centre-ville"],
    note: 4.8,
    nbAvis: 9,
    reponse: "Répond en 3 h",
    disponible: "plus-tard",
    badges: ["Téléphone vérifié"],
    description: "Meubles et portes en bois, sur mesure.",
    telephone: "+242 05 663 47 21",
    numeroPublic: false,
    realisations: [],
    avis: [],
  },
];

/* ------------------------------------------------------------------ *
 * Quincaillerie : villes, boutiques, catalogue et offres par boutique *
 * MAQUETTE : avec Supabase, ce seront les tables villes, boutiques,   *
 * produits et offres (prix et stock propres à chaque boutique).       *
 * ------------------------------------------------------------------ */

export type Ville = { nom: string; quartiers: string[] };

/** Grandes villes du Congo. Les quartiers (arrondissements) sont renseignés pour les deux métropoles. */
const villesBrutes: Ville[] = [
  {
    nom: "Brazzaville",
    quartiers: ["Bacongo", "Makélékélé", "Poto-Poto", "Moungali", "Ouenzé", "Talangaï", "Mfilou", "Madibou", "Djiri", "Centre-ville"],
  },
  { nom: "Pointe-Noire", quartiers: ["Lumumba", "Mvou-Mvou", "Tié-Tié", "Loandjili", "Mongo-Mpoukou", "Ngoyo"] },
  { nom: "Dolisie", quartiers: [] },
  { nom: "Nkayi", quartiers: [] },
  { nom: "Ouesso", quartiers: [] },
  { nom: "Owando", quartiers: [] },
  { nom: "Oyo", quartiers: [] },
  { nom: "Impfondo", quartiers: [] },
  { nom: "Madingou", quartiers: [] },
  { nom: "Sibiti", quartiers: [] },
  { nom: "Kinkala", quartiers: [] },
  { nom: "Gamboma", quartiers: [] },
  { nom: "Djambala", quartiers: [] },
  { nom: "Mossendjo", quartiers: [] },
  { nom: "Ewo", quartiers: [] },
];

/** Les villes, classées par ordre alphabétique. */
export const villes: Ville[] = [...villesBrutes].sort((a, b) => a.nom.localeCompare(b.nom, "fr"));

export const VILLE_DEFAUT = "Brazzaville";
export const getVille = (nom?: string) => villes.find((v) => v.nom === nom);

/** Ville d'un artisan (les fiches sans ville sont à Brazzaville). */
export const villeArtisan = (a: { ville?: string }) => a.ville ?? VILLE_DEFAUT;

/** « Bacongo » à Brazzaville, « Lumumba, Pointe-Noire » ailleurs. */
export const lieuArtisan = (a: { ville?: string; quartier: string }) =>
  villeArtisan(a) === VILLE_DEFAUT ? a.quartier : `${a.quartier}, ${villeArtisan(a)}`;

/** Quartiers limitrophes, pour proposer d'abord les boutiques les plus proches. */
const voisins: Record<string, string[]> = {
  Bacongo: ["Makélékélé", "Centre-ville", "Poto-Poto"],
  Makélékélé: ["Bacongo", "Madibou"],
  "Poto-Poto": ["Moungali", "Centre-ville", "Bacongo", "Ouenzé"],
  Moungali: ["Poto-Poto", "Ouenzé", "Mfilou"],
  Ouenzé: ["Moungali", "Talangaï", "Poto-Poto"],
  Talangaï: ["Ouenzé", "Djiri"],
  Mfilou: ["Moungali", "Madibou"],
  Madibou: ["Makélékélé", "Mfilou"],
  Djiri: ["Talangaï"],
  "Centre-ville": ["Poto-Poto", "Bacongo"],
  Lumumba: ["Mvou-Mvou"],
  "Mvou-Mvou": ["Lumumba", "Tié-Tié"],
  "Tié-Tié": ["Mvou-Mvou", "Loandjili"],
  Loandjili: ["Tié-Tié", "Mongo-Mpoukou", "Ngoyo"],
  "Mongo-Mpoukou": ["Loandjili"],
  Ngoyo: ["Loandjili"],
};

export type Lieu = { ville: string; quartier?: string };

export type Boutique = {
  id: string;
  nom: string;
  ville: string;
  quartier: string;
  adresse: string;
  telephone: string;
  horaires: string;
  /** Photo de la devanture ou de l'intérieur (envoyée par le boutiquier). */
  image?: string;
};

export const boutiques: Boutique[] = [
  {
    id: "total-bacongo",
    nom: "Quincaillerie Total Bacongo",
    ville: "Brazzaville",
    quartier: "Bacongo",
    adresse: "Av. Matsoua, près du marché Total",
    telephone: "+242 06 700 11 22",
    horaires: "Lun–Sam · 7h30–18h30",
    image: "/images/ciment.jpg",
  },
  {
    id: "batiplus-poto-poto",
    nom: "Bâtiplus Poto-Poto",
    ville: "Brazzaville",
    quartier: "Poto-Poto",
    adresse: "Rue Mbochis, face à la pharmacie",
    telephone: "+242 05 700 33 44",
    horaires: "Lun–Sam · 8h–19h",
    image: "/images/peinture.jpg",
  },
  {
    id: "moungali-materiaux",
    nom: "Moungali Matériaux",
    ville: "Brazzaville",
    quartier: "Moungali",
    adresse: "Av. de la Paix, rond-point Moungali",
    telephone: "+242 06 711 45 90",
    horaires: "Lun–Sam · 7h–18h",
  },
  {
    id: "talangai-btp",
    nom: "Talangaï BTP",
    ville: "Brazzaville",
    quartier: "Talangaï",
    adresse: "Route du Nord, arrêt Mikalou",
    telephone: "+242 05 722 18 63",
    horaires: "Lun–Dim · 7h–19h",
  },
  {
    id: "ocean-batiment",
    nom: "Océan Bâtiment",
    ville: "Pointe-Noire",
    quartier: "Lumumba",
    adresse: "Av. Charles de Gaulle",
    telephone: "+242 06 730 52 14",
    horaires: "Lun–Sam · 7h30–18h30",
  },
  {
    id: "quincaillerie-tie-tie",
    nom: "Quincaillerie de Tié-Tié",
    ville: "Pointe-Noire",
    quartier: "Tié-Tié",
    adresse: "En face du marché de Tié-Tié",
    telephone: "+242 05 741 07 36",
    horaires: "Lun–Sam · 8h–18h",
  },
  {
    id: "niari-materiaux",
    nom: "Niari Matériaux",
    ville: "Dolisie",
    quartier: "Centre-ville",
    adresse: "Près de la gare",
    telephone: "+242 06 752 61 08",
    horaires: "Lun–Sam · 7h30–17h30",
  },
  {
    id: "sangha-quincaillerie",
    nom: "Quincaillerie de la Sangha",
    ville: "Ouesso",
    quartier: "Centre-ville",
    adresse: "Rue du port",
    telephone: "+242 05 763 29 41",
    horaires: "Lun–Sam · 8h–17h",
  },
];

export const getBoutique = (id: string) => boutiques.find((b) => b.id === id)!;

/**
 * Proximité d'une boutique par rapport au client :
 * 0 = même quartier, 1 = quartier voisin, 2 = même ville, 3 = autre ville.
 */
export function proximite(b: Boutique, lieu: Lieu): 0 | 1 | 2 | 3 {
  if (b.ville !== lieu.ville) return 3;
  if (!lieu.quartier) return 2;
  if (b.quartier === lieu.quartier) return 0;
  return voisins[lieu.quartier]?.includes(b.quartier) ? 1 : 2;
}

export const libelleProximite = (b: Boutique, lieu: Lieu) =>
  ["Dans votre quartier", "Quartier voisin", `À ${b.ville}`, `À ${b.ville}`][proximite(b, lieu)];

/** Fiche catalogue : commune à toutes les boutiques. Prix et stock sont dans les offres. */
export type Produit = {
  id: string;
  nom: string;
  categorie: string;
  marque: string;
  unite: string;
  image?: string;
  description: string;
};

export const categoriesProduits = [
  "Ciment",
  "Peinture",
  "Électricité",
  "Plomberie",
  "Outillage",
  "Fixation",
  "Carrelage",
];

export const produits: Produit[] = [
  {
    id: "ciment-42-5",
    nom: "Ciment 42,5 kg",
    categorie: "Ciment",
    marque: "Dangote",
    unite: "sac",
    image: "/images/ciment.jpg",
    description: "Ciment Portland CPJ 42,5 pour maçonnerie, dalles et enduits.",
  },
  {
    id: "peinture-blanche-20l",
    nom: "Peinture blanche 20 L",
    categorie: "Peinture",
    marque: "Seigneurie",
    unite: "seau",
    image: "/images/peinture.jpg",
    description: "Peinture acrylique mate pour murs et plafonds intérieurs.",
  },
  {
    id: "tuyau-pvc-32",
    nom: "Tuyau PVC Ø32 (4 m)",
    categorie: "Plomberie",
    marque: "Nicoll",
    unite: "barre",
    description: "Tuyau PVC pression pour alimentation et évacuation.",
  },
  {
    id: "cable-2-5",
    nom: "Câble 2,5 mm² (100 m)",
    categorie: "Électricité",
    marque: "Nexans",
    unite: "rouleau",
    description: "Câble rigide pour prises et circuits de puissance.",
  },
  {
    id: "ciment-32-5",
    nom: "Ciment 32,5 kg",
    categorie: "Ciment",
    marque: "Forspak",
    unite: "sac",
    description: "Ciment pour mortiers, crépis et petits travaux de maçonnerie.",
  },
  {
    id: "peinture-glycero-4l",
    nom: "Peinture glycéro 4 L",
    categorie: "Peinture",
    marque: "Astral",
    unite: "pot",
    description: "Laque brillante pour boiseries, portes et ferronnerie.",
  },
  {
    id: "disjoncteur-16a",
    nom: "Disjoncteur 16 A",
    categorie: "Électricité",
    marque: "Legrand",
    unite: "pièce",
    description: "Disjoncteur divisionnaire pour circuits de prises.",
  },
  {
    id: "ampoule-led-12w",
    nom: "Ampoule LED 12 W",
    categorie: "Électricité",
    marque: "Philips",
    unite: "pièce",
    description: "Culot E27, lumière blanche, équivalent 100 W.",
  },
  {
    id: "robinet-laiton",
    nom: "Robinet laiton 1/2″",
    categorie: "Plomberie",
    marque: "Sferaco",
    unite: "pièce",
    description: "Robinet d'arrêt en laiton pour cuisine et salle d'eau.",
  },
  {
    id: "marteau-500g",
    nom: "Marteau de coffreur 500 g",
    categorie: "Outillage",
    marque: "Stanley",
    unite: "pièce",
    description: "Manche fibre antivibration, tête forgée.",
  },
  {
    id: "truelle",
    nom: "Truelle de maçon",
    categorie: "Outillage",
    marque: "Taliaplast",
    unite: "pièce",
    description: "Lame acier trempé, manche bois.",
  },
  {
    id: "pointes-70",
    nom: "Pointes 70 mm (1 kg)",
    categorie: "Fixation",
    marque: "Tréfileries",
    unite: "kg",
    description: "Pointes tête plate pour coffrage et charpente.",
  },
  {
    id: "chevilles-8",
    nom: "Chevilles 8 mm (boîte de 100)",
    categorie: "Fixation",
    marque: "Fischer",
    unite: "boîte",
    description: "Chevilles nylon pour béton et brique pleine.",
  },
  {
    id: "carreau-40",
    nom: "Carreau de sol 40×40",
    categorie: "Carrelage",
    marque: "Twyford",
    unite: "m²",
    description: "Grès émaillé antidérapant pour intérieur et terrasse.",
  },
];

export const getProduit = (id: string) => produits.find((p) => p.id === id);

/** Prix et stock d'un produit dans une boutique donnée. */
export type Offre = { produit: string; boutique: string; prix: number; stock: number; promo?: number };

const o = (produit: string, boutique: string, prix: number, stock: number, promo?: number): Offre => ({
  produit,
  boutique,
  prix,
  stock,
  promo,
});

export const offres: Offre[] = [
  o("ciment-42-5", "total-bacongo", 8500, 120, 7900),
  o("ciment-42-5", "batiplus-poto-poto", 8700, 40),
  o("ciment-42-5", "moungali-materiaux", 8400, 80),
  o("ciment-42-5", "talangai-btp", 8600, 25),
  o("ciment-42-5", "ocean-batiment", 9200, 200),
  o("ciment-42-5", "quincaillerie-tie-tie", 9000, 60),
  o("ciment-42-5", "niari-materiaux", 9500, 30),
  o("ciment-42-5", "sangha-quincaillerie", 11000, 15),
  o("ciment-32-5", "total-bacongo", 7500, 90),
  o("ciment-32-5", "batiplus-poto-poto", 7500, 50),
  o("ciment-32-5", "moungali-materiaux", 7500, 60),
  o("ciment-32-5", "ocean-batiment", 8200, 100),
  o("ciment-32-5", "niari-materiaux", 8500, 20),
  o("peinture-blanche-20l", "batiplus-poto-poto", 32000, 18),
  o("peinture-blanche-20l", "total-bacongo", 33500, 10),
  o("peinture-blanche-20l", "moungali-materiaux", 31000, 6),
  o("peinture-blanche-20l", "ocean-batiment", 34000, 12),
  o("peinture-blanche-20l", "quincaillerie-tie-tie", 33000, 8),
  o("peinture-glycero-4l", "batiplus-poto-poto", 14500, 20),
  o("peinture-glycero-4l", "talangai-btp", 15000, 9),
  o("peinture-glycero-4l", "ocean-batiment", 16000, 14),
  o("cable-2-5", "batiplus-poto-poto", 38000, 7),
  o("cable-2-5", "total-bacongo", 39500, 12),
  o("cable-2-5", "moungali-materiaux", 37500, 4),
  o("cable-2-5", "talangai-btp", 38500, 10),
  o("cable-2-5", "ocean-batiment", 41000, 9),
  o("cable-2-5", "niari-materiaux", 42000, 3),
  o("disjoncteur-16a", "total-bacongo", 6500, 30),
  o("disjoncteur-16a", "batiplus-poto-poto", 6500, 25),
  o("disjoncteur-16a", "moungali-materiaux", 6500, 15),
  o("disjoncteur-16a", "talangai-btp", 6500, 12),
  o("disjoncteur-16a", "ocean-batiment", 6500, 20),
  o("ampoule-led-12w", "batiplus-poto-poto", 1500, 200),
  o("ampoule-led-12w", "total-bacongo", 1500, 150),
  o("ampoule-led-12w", "quincaillerie-tie-tie", 1700, 100),
  o("ampoule-led-12w", "sangha-quincaillerie", 2000, 40),
  o("tuyau-pvc-32", "total-bacongo", 4500, 60),
  o("tuyau-pvc-32", "moungali-materiaux", 4300, 35),
  o("tuyau-pvc-32", "talangai-btp", 4700, 50),
  o("tuyau-pvc-32", "ocean-batiment", 4800, 80),
  o("tuyau-pvc-32", "quincaillerie-tie-tie", 4600, 45),
  o("tuyau-pvc-32", "niari-materiaux", 5000, 20),
  o("robinet-laiton", "total-bacongo", 5500, 25),
  o("robinet-laiton", "batiplus-poto-poto", 6000, 18),
  o("robinet-laiton", "ocean-batiment", 6500, 10),
  o("marteau-500g", "total-bacongo", 7000, 15),
  o("marteau-500g", "batiplus-poto-poto", 7000, 12),
  o("marteau-500g", "moungali-materiaux", 6500, 8),
  o("marteau-500g", "niari-materiaux", 7500, 5),
  o("truelle", "total-bacongo", 3000, 30),
  o("truelle", "talangai-btp", 2800, 20),
  o("truelle", "quincaillerie-tie-tie", 3200, 25),
  o("truelle", "sangha-quincaillerie", 3500, 10),
  o("pointes-70", "total-bacongo", 1800, 80),
  o("pointes-70", "batiplus-poto-poto", 1800, 60),
  o("pointes-70", "moungali-materiaux", 1700, 40),
  o("pointes-70", "talangai-btp", 1900, 50),
  o("pointes-70", "ocean-batiment", 2000, 70),
  o("pointes-70", "niari-materiaux", 2100, 30),
  o("pointes-70", "sangha-quincaillerie", 2300, 20),
  o("chevilles-8", "batiplus-poto-poto", 2500, 40),
  o("chevilles-8", "moungali-materiaux", 2400, 25),
  o("chevilles-8", "ocean-batiment", 2800, 30),
  o("carreau-40", "total-bacongo", 6500, 300),
  o("carreau-40", "batiplus-poto-poto", 7000, 180),
  o("carreau-40", "ocean-batiment", 7200, 250),
  o("carreau-40", "quincaillerie-tie-tie", 6900, 120),
];

/** Prix payé par le client (prix promo s'il y en a un). */
export const prixOffre = (of: Offre) => of.promo ?? of.prix;

export type OffreBoutique = Offre & { b: Boutique; distance: 0 | 1 | 2 | 3 };

/**
 * Offres d'un produit autour du client, triées par proximité puis par prix
 * (ou par prix puis proximité). Seules les boutiques de la ville sont gardées.
 */
export function offresProduit(produitId: string, lieu: Lieu, tri: "proche" | "prix" = "proche"): OffreBoutique[] {
  return offres
    .filter((of) => of.produit === produitId)
    .map((of) => {
      const b = getBoutique(of.boutique);
      return { ...of, b, distance: proximite(b, lieu) };
    })
    .filter((of) => of.distance < 3)
    .sort((x, y) =>
      tri === "prix"
        ? prixOffre(x) - prixOffre(y) || x.distance - y.distance
        : x.distance - y.distance || prixOffre(x) - prixOffre(y),
    );
}

/** Résumé d'un produit dans la ville du client : meilleur prix, écart, boutique la plus proche. */
export function resumeProduit(produitId: string, lieu: Lieu) {
  const liste = offresProduit(produitId, lieu);
  if (!liste.length) return null;
  const prix = liste.map(prixOffre);
  const min = Math.min(...prix);
  const max = Math.max(...prix);
  const moinsCher = liste.find((of) => prixOffre(of) === min)!;
  return {
    nb: liste.length,
    min,
    max,
    memePrix: min === max,
    moinsCher,
    plusProche: liste[0],
    promo: liste.some((of) => of.promo),
  };
}

/** Lien vers une page quincaillerie en conservant la ville et le quartier choisis. */
export function lienLieu(chemin: string, lieu: Lieu, extra: Record<string, string | undefined> = {}) {
  const q = new URLSearchParams();
  if (lieu.ville !== VILLE_DEFAUT) q.set("ville", lieu.ville);
  if (lieu.quartier) q.set("quartier", lieu.quartier);
  for (const [k, v] of Object.entries(extra)) if (v) q.set(k, v);
  const s = q.toString();
  return s ? `${chemin}?${s}` : chemin;
}

/** Lit la ville et le quartier dans les paramètres d'URL (valeurs inconnues ignorées). */
export function lieuDepuis(params: { ville?: unknown; quartier?: unknown }): Lieu {
  const v = getVille(typeof params.ville === "string" ? params.ville : undefined) ?? getVille(VILLE_DEFAUT)!;
  const quartier = typeof params.quartier === "string" && v.quartiers.includes(params.quartier) ? params.quartier : undefined;
  return { ville: v.nom, quartier };
}

/** Libellé du métier d'un artisan (+ sa catégorie principale). */
export const metierLabel = (id: MetierId) => {
  const m = getMetier(id);
  if (!m) throw new Error(`Métier inconnu : ${id} (à ajouter dans src/lib/metiers.ts)`);
  return { id: m.id, label: m.label, artisan: m.label, categorie: getCategorie(m.categories[0])! };
};
export const getArtisan = (id: string) => artisans.find((a) => a.id === id);

export const fcfa = (n: number) =>
  new Intl.NumberFormat("fr-FR").format(n).replace(/ | /g, " ") + " FCFA";

export const note = (n: number) => n.toFixed(1).replace(".", ",");

export const initiales = (nom: string) =>
  nom
    .split(/[\s-]+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/** Nombre minimum d'avis avant d'attribuer un badge de réputation. */
export const AVIS_MIN_REPUTATION = 5;

/**
 * Badges de réputation (grille d'évaluation MOSALA 242) : attribués automatiquement
 * à partir des avis, jamais achetables. « Très ponctuel », « Excellent rapport qualité-prix »
 * et « Qualité reconnue » viendront avec les notes par critère stockées en base.
 */
export function badgesReputation(a: Pick<Artisan, "note" | "nbAvis">): string[] {
  if (a.nbAvis < AVIS_MIN_REPUTATION) return ["Nouveau professionnel"];
  return a.note >= 4.5 && a.nbAvis >= 10 ? ["Professionnel recommandé"] : [];
}
