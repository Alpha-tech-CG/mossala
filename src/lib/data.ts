// Données de démonstration — à remplacer par Supabase.

/** Mise en relation : messages gratuits par mois, puis accès illimité payant. */
export const MESSAGES_GRATUITS_PAR_MOIS = 5;
export const PRIX_ILLIMITE_FCFA = 500;
export const DUREE_ILLIMITE_JOURS = 30; // validé par le client

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
  titre: string;
  type: string;
  quartier: string;
  description: string;
  materiaux: string;
  duree: string;
  image: string;
  verifiee: boolean;
};

export type Avis = {
  auteur: string;
  note: number;
  date: string;
  texte: string;
  reponse?: string;
};

export type Artisan = {
  id: string;
  nom: string;
  metier: MetierId;
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
        note: 5,
        date: "Octobre 2026",
        texte:
          "Ponctuel, travail propre et le prix du devis a été respecté. Je recommande.",
        reponse: "Merci Madame, au plaisir de vous aider à nouveau.",
      },
      {
        auteur: "Hervé K.",
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
];

export type Boutique = {
  id: string;
  nom: string;
  quartier: string;
  adresse: string;
  telephone: string;
  horaires: string;
};

export const boutiques: Boutique[] = [
  {
    id: "total-bacongo",
    nom: "Quincaillerie Total Bacongo",
    quartier: "Bacongo",
    adresse: "Av. Matsoua, près du marché Total",
    telephone: "+242 06 700 11 22",
    horaires: "Lun–Sam · 7h30–18h30",
  },
  {
    id: "batiplus-poto-poto",
    nom: "Bâtiplus Poto-Poto",
    quartier: "Poto-Poto",
    adresse: "Rue Mbochis, face à la pharmacie",
    telephone: "+242 05 700 33 44",
    horaires: "Lun–Sam · 8h–19h",
  },
];

export type Produit = {
  id: string;
  nom: string;
  categorie: string;
  marque: string;
  prix: number;
  unite: string;
  stock: number;
  boutique: string;
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
    prix: 8500,
    unite: "sac",
    stock: 120,
    boutique: "total-bacongo",
    image: "/images/ciment.jpg",
    description: "Ciment Portland CPJ 42,5 pour maçonnerie, dalles et enduits.",
  },
  {
    id: "peinture-blanche-20l",
    nom: "Peinture blanche 20 L",
    categorie: "Peinture",
    marque: "Seigneurie",
    prix: 32000,
    unite: "seau",
    stock: 18,
    boutique: "batiplus-poto-poto",
    image: "/images/peinture.jpg",
    description: "Peinture acrylique mate pour murs et plafonds intérieurs.",
  },
  {
    id: "tuyau-pvc-32",
    nom: "Tuyau PVC Ø32 (4 m)",
    categorie: "Plomberie",
    marque: "Nicoll",
    prix: 4500,
    unite: "barre",
    stock: 60,
    boutique: "total-bacongo",
    description: "Tuyau PVC pression pour alimentation et évacuation.",
  },
  {
    id: "cable-2-5",
    nom: "Câble 2,5 mm² (100 m)",
    categorie: "Électricité",
    marque: "Nexans",
    prix: 38000,
    unite: "rouleau",
    stock: 7,
    boutique: "batiplus-poto-poto",
    description: "Câble rigide pour prises et circuits de puissance.",
  },
];

/** Libellé du métier d'un artisan (+ sa catégorie principale). */
export const metierLabel = (id: MetierId) => {
  const m = getMetier(id);
  if (!m) throw new Error(`Métier inconnu : ${id} (à ajouter dans src/lib/metiers.ts)`);
  return { id: m.id, label: m.label, artisan: m.label, categorie: getCategorie(m.categories[0])! };
};
export const getArtisan = (id: string) => artisans.find((a) => a.id === id);
export const getProduit = (id: string) => produits.find((p) => p.id === id);
export const getBoutique = (id: string) => boutiques.find((b) => b.id === id)!;

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
