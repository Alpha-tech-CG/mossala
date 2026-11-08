/**
 * Catalogue des métiers, d'après la liste fournie par le client
 * (« Liste des jobs des artisans », novembre 2026).
 *
 * POUR AJOUTER UN MÉTIER : ajoutez simplement son nom dans la bonne catégorie.
 * Un métier peut figurer dans plusieurs catégories (ex. Charpentier).
 * Avec Supabase, cette liste deviendra une table gérée depuis le back-office.
 */

export type CategorieId =
  | "batiment"
  | "mecanique"
  | "bois"
  | "metallurgie"
  | "textile"
  | "alimentaire"
  | "electricite"
  | "beaute"
  | "art"
  | "agriculture"
  | "services";

export type Categorie = {
  id: CategorieId;
  label: string;
  court: string; // libellé court pour la grille d'accueil
  metiers: string[];
};

export const categories: Categorie[] = [
  {
    id: "batiment",
    label: "Bâtiment et travaux de construction",
    court: "Bâtiment",
    metiers: [
      "Maçon", "Aide-maçon", "Carreleur", "Plâtrier", "Peintre en bâtiment", "Plombier",
      "Électricien bâtiment", "Menuisier bois", "Menuisier aluminium", "Vitrier", "Charpentier",
      "Couvreur", "Ferrailleur", "Soudeur bâtiment", "Staffeur", "Poseur de faux plafonds",
      "Poseur de cloisons", "Étancheur", "Terrassier", "Constructeur de bâtiments",
    ],
  },
  {
    id: "mecanique",
    label: "Mécanique, automobile et transport",
    court: "Mécanique & auto",
    metiers: [
      "Mécanicien automobile", "Mécanicien moto", "Mécanicien poids lourds", "Électricien automobile",
      "Électronicien automobile", "Tôlier automobile", "Peintre automobile", "Carrossier",
      "Vulcanisateur", "Réparateur de pneus", "Soudeur automobile", "Réparateur de moteurs",
      "Réparateur de groupes électrogènes", "Mécanicien d'engins de chantier", "Réparateur de vélos",
    ],
  },
  {
    id: "bois",
    label: "Bois, mobilier et ameublement",
    court: "Bois & mobilier",
    metiers: [
      "Ébéniste", "Menuisier", "Charpentier", "Sculpteur sur bois", "Fabricant de meubles",
      "Tapissier", "Garnisseur de sièges", "Restaurateur de meubles",
      "Fabricant de portes et fenêtres", "Fabricant de cercueils",
    ],
  },
  {
    id: "metallurgie",
    label: "Métallurgie, soudure et fabrication",
    court: "Métal & soudure",
    metiers: [
      "Soudeur", "Forgeron", "Ferronnier", "Métallier", "Serrurier", "Chaudronnier",
      "Fabricant de portails", "Fabricant de grilles de sécurité",
      "Fabricant de charpentes métalliques", "Réparateur de structures métalliques", "Aluminiumier",
    ],
  },
  {
    id: "textile",
    label: "Textile, couture et habillement",
    court: "Couture & textile",
    metiers: [
      "Tailleur", "Couturier", "Styliste", "Modéliste", "Brodeur", "Tricoteur", "Tisserand",
      "Tapissier décorateur", "Cordonnier", "Fabricant de chaussures", "Maroquinier",
      "Fabricant de sacs", "Réparateur de vêtements",
    ],
  },
  {
    id: "alimentaire",
    label: "Artisanat alimentaire et transformation",
    court: "Alimentaire",
    metiers: [
      "Boulanger", "Pâtissier", "Chocolatier", "Fabricant de beignets", "Fabricant de jus naturels",
      "Transformateur de manioc", "Fabricant de chikwangue", "Fabricant de foufou",
      "Fumoir de poissons", "Transformateur de produits agricoles", "Fabricant de confitures",
      "Charcutier", "Glacier artisanal",
    ],
  },
  {
    id: "electricite",
    label: "Électricité, électronique et froid",
    court: "Électricité & froid",
    metiers: [
      "Électricien", "Électronicien", "Réparateur de téléphones", "Réparateur d'ordinateurs",
      "Technicien de maintenance informatique", "Réparateur de téléviseurs", "Frigoriste",
      "Installateur de climatiseurs", "Réparateur de réfrigérateurs",
      "Installateur de panneaux solaires", "Technicien en énergie solaire",
      "Réparateur d'appareils électroménagers",
    ],
  },
  {
    id: "beaute",
    label: "Coiffure, esthétique et soins personnels",
    court: "Coiffure & beauté",
    metiers: [
      "Coiffeur homme", "Coiffeuse femme", "Tresseuse", "Barbier", "Perruquier",
      "Fabricant de perruques", "Esthéticienne", "Maquilleur", "Manucure", "Pédicure", "Masseuse",
      "Tatoueur",
    ],
  },
  {
    id: "art",
    label: "Artisanat traditionnel et artistique",
    court: "Art & tradition",
    metiers: [
      "Sculpteur sur bois", "Sculpteur sur pierre", "Potier", "Céramiste", "Vannier",
      "Tisserand traditionnel", "Fabricant d'objets en raphia", "Fabricant de paniers",
      "Fabricant de nattes", "Bijoutier", "Orfèvre", "Graveur", "Artisan maroquinier",
      "Fabricant d'instruments de musique traditionnels", "Peintre artisanal",
      "Fabricant d'objets décoratifs",
    ],
  },
  {
    id: "agriculture",
    label: "Agriculture, élevage et métiers connexes",
    court: "Agriculture & élevage",
    metiers: [
      "Maraîcher", "Horticulteur", "Pépiniériste", "Éleveur de volailles", "Éleveur de porcs",
      "Éleveur de chèvres", "Pisciculteur", "Apiculteur", "Pêcheur artisanal", "Fumoir de poissons",
      "Transformateur de produits agricoles", "Fabricant d'aliments pour animaux",
    ],
  },
  {
    id: "services",
    label: "Autres services et métiers manuels",
    court: "Autres services",
    metiers: [
      "Réparateur de chaussures", "Réparateur de matelas", "Réparateur d'horloges et montres",
      "Photographe", "Encadreur", "Imprimeur artisanal", "Sérigraphe", "Fabricant de tampons",
      "Réparateur de mobilier", "Nettoyeur de tapis", "Décorateur événementiel",
    ],
  },
];

export const slug = (s: string) =>
  s
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['’]/g, "-")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export type Metier = { id: string; label: string; categories: CategorieId[] };

/** Liste unique des métiers (un métier présent dans 2 catégories n'apparaît qu'une fois). */
export const metiers: Metier[] = (() => {
  const map = new Map<string, Metier>();
  for (const c of categories)
    for (const label of c.metiers) {
      const id = slug(label);
      const m = map.get(id);
      if (m) m.categories.push(c.id);
      else map.set(id, { id, label, categories: [c.id] });
    }
  return [...map.values()];
})();

export const getMetier = (id: string) => metiers.find((m) => m.id === id);
export const getCategorie = (id: string) => categories.find((c) => c.id === id);
