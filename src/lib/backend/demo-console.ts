import { CRITERES_ARTISAN, CRITERES_MAGASIN, artisans, boutiques } from "../data";
import { SUJETS_CONTACT } from "./contact";
import { idLocal, modifierLocal } from "./local";
import type { AvisDoc, ContactDoc, DemandeAnnonceurDoc, PropositionMetierDoc, SignalementDoc } from "./modele";

/**
 * MAQUETTE uniquement : remplit la console avec 90 jours d'activité fictive (avis, messages,
 * signalements, annonceurs, métiers proposés, inscriptions) pour voir les graphiques.
 * Rien n'est envoyé ailleurs que dans ce navigateur. Jamais utilisé en production.
 */

const JOUR = 24 * 3600 * 1000;
const PRENOMS = ["Grâce", "Hervé", "Sandrine", "Christelle", "Junior", "Ornella", "Rodrigue", "Prisca", "Fabrice", "Merveille", "Arnaud", "Nadège", "Destin", "Exaucé", "Divine"];
const NOMS = ["Mbemba", "Nzambi", "Makosso", "Ngouaka", "Bikouta", "Loemba", "Mabiala", "Kouka", "Tchicaya", "Moukala", "Ondongo", "Malonga"];
const TEXTES = [
  "Travail propre et soigné, je recommande.",
  "Ponctuel et le prix du devis a été respecté.",
  "Bon conseil, mais un peu de retard le premier jour.",
  "Très professionnel, je referai appel à lui.",
  "Correct, sans plus.",
  "Accueil chaleureux et produits disponibles.",
  "Prix un peu élevés mais bonne qualité.",
  "Déçu : délai non respecté.",
  "",
];

const hasard = <T,>(t: readonly T[]) => t[Math.floor(Math.random() * t.length)];
/** Date aléatoire dans les `jours` derniers jours, avec plus d'activité récemment. */
const dateRecente = (jours: number) => Date.now() - Math.floor(Math.random() ** 1.6 * jours * JOUR) - Math.floor(Math.random() * 8 * 3600 * 1000);
const noteAleatoire = () => hasard([5, 5, 5, 4, 4, 4, 4, 3, 3, 2, 1]);

export function remplirDemo() {
  const cibles = [
    ...artisans.map((a) => ({ type: "artisan" as const, id: a.id, nom: a.nom, criteres: CRITERES_ARTISAN })),
    ...boutiques.map((b) => ({ type: "magasin" as const, id: b.id, nom: b.nom, criteres: CRITERES_MAGASIN })),
  ];

  const avis: AvisDoc[] = Array.from({ length: 140 }, () => {
    const c = hasard(cibles);
    const creeLe = dateRecente(90);
    const notes = Object.fromEntries(c.criteres.map((k) => [k, noteAleatoire()]));
    const valeurs = Object.values(notes);
    const note = Math.round((valeurs.reduce((a, b) => a + b, 0) / valeurs.length) * 10) / 10;
    const recent = Date.now() - creeLe < 4 * JOUR;
    const statut = recent && Math.random() < 0.6 ? "a_moderer" : Math.random() < 0.88 ? "publie" : "refuse";
    const experience = c.type === "magasin" ? hasard(["achat", "achat", "achat", "devis"] as const) : hasard(["prestation", "prestation", "prestation", "devis", "contact"] as const);
    return {
      id: idLocal(),
      cibleType: c.type,
      cibleId: c.id,
      cibleNom: c.nom,
      auteurId: idLocal(),
      auteur: `${hasard(PRENOMS)} ${hasard(NOMS)[0]}.`,
      notes,
      note,
      recommandation: note >= 4 ? "oui" : note >= 3 ? "reserves" : "non",
      experience,
      date: null,
      texte: hasard(TEXTES),
      statut,
      verifie: statut === "publie" && (experience === "prestation" || experience === "achat") && Math.random() < 0.7,
      motifRefus: statut === "refuse" ? hasard(["Avis faux ou suspect", "Propos injurieux ou diffamatoires", "Ne concerne pas ce professionnel"]) : null,
      creeLe,
      modereLe: statut === "a_moderer" ? 0 : creeLe + JOUR,
    };
  });

  const contacts: ContactDoc[] = Array.from({ length: 45 }, () => {
    const recuLe = dateRecente(90);
    return {
      id: idLocal(),
      nom: `${hasard(PRENOMS)} ${hasard(NOMS)}`,
      telephone: `06 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`,
      email: null,
      sujet: hasard(SUJETS_CONTACT),
      message: "Bonjour, j’aimerais avoir plus d’informations. Merci de me rappeler.",
      statut: Date.now() - recuLe < 6 * JOUR && Math.random() < 0.6 ? "nouveau" : "traite",
      recuLe,
    };
  });

  const signalements: SignalementDoc[] = avis
    .filter((v) => v.statut !== "refuse")
    .slice(0, 8)
    .map((v) => ({
      id: idLocal(),
      cible: "avis",
      cibleId: v.id,
      libelle: `Avis de ${v.auteur} sur ${v.cibleNom}`,
      motif: hasard(["Avis faux ou acheté", "Propos injurieux", "Autre"]),
      auteurId: null,
      statut: Math.random() < 0.5 ? "nouveau" : "traite",
      creeLe: dateRecente(30),
    }));

  const demandesAnnonceurs: DemandeAnnonceurDoc[] = Array.from({ length: 12 }, () => ({
    id: idLocal(),
    nom: hasard(["Bâtiplus", "Ciments du Congo", "Quincaillerie Moderne", "Peintures Kintélé", "Menuiserie Ngouaka", "Total Bacongo"]),
    type: hasard(["Artisan", "Boutique / quincaillerie", "Marque ou entreprise"]),
    telephone: `05 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`,
    interets: [hasard(["Vidéo sur l’accueil", "Image sur l’accueil", "Bannière sur tout le site", "Annonces sponsorisées"])],
    statut: Math.random() < 0.4 ? "nouveau" : "traite",
    recuLe: dateRecente(60),
  }));

  const propositionsMetiers: PropositionMetierDoc[] = ["Vitrier", "Puisatier", "Frigoriste", "Tapissier", "Ferronnier d’art", "Installateur solaire"].map((nom) => ({
    id: idLocal(),
    nom,
    categorie: "batiment",
    statut: hasard(["nouveau", "nouveau", "accepte", "refuse"] as const),
    recuLe: dateRecente(60),
  }));

  const comptes = Array.from({ length: 70 }, () => ({
    id: idLocal(),
    prenom: hasard(PRENOMS),
    nom: hasard(NOMS),
    telephone: `06 ${Math.floor(100 + Math.random() * 900)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`,
    ville: hasard(["Brazzaville", "Brazzaville", "Brazzaville", "Pointe-Noire", "Dolisie"]),
    creeLe: dateRecente(90),
  }));

  const ids = [...artisans.map((a) => a.id), ...boutiques.map((b) => b.id)];
  const datesPros = Object.fromEntries(ids.map((id) => [id, dateRecente(90)]));
  const statutsPros = Object.fromEntries(ids.filter(() => Math.random() < 0.15).map((id) => [id, "en_verification" as const]));

  modifierLocal((b) => ({
    ...b,
    avis: [...avis, ...b.avis].sort((x, y) => y.creeLe - x.creeLe),
    contacts: [...contacts, ...b.contacts].sort((x, y) => y.recuLe - x.recuLe),
    signalements: [...signalements, ...b.signalements],
    demandesAnnonceurs: [...demandesAnnonceurs, ...b.demandesAnnonceurs].sort((x, y) => y.recuLe - x.recuLe),
    propositionsMetiers: [...propositionsMetiers, ...b.propositionsMetiers],
    comptes: [...comptes, ...b.comptes].sort((x, y) => y.creeLe - x.creeLe),
    datesPros: { ...b.datesPros, ...datesPros },
    statutsPros: { ...b.statutsPros, ...statutsPros },
  }));
}

const CLE_AUTO = "artopif-demo-auto";

/**
 * MAQUETTE : à la première ouverture de la console dans un navigateur, la remplit avec les
 * données de démonstration (pour une démo sur n'importe quel appareil, sans manipulation).
 * Une seule fois par navigateur : si l'équipe vide les données, elles ne reviennent pas.
 */
export function remplirDemoUneFois(): void {
  try {
    if (localStorage.getItem(CLE_AUTO)) return;
    localStorage.setItem(CLE_AUTO, "1");
  } catch {
    return; // stockage indisponible : pas de remplissage automatique
  }
  remplirDemo();
}
