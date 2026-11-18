import { artisans, getMetier } from "../data";

/**
 * MAQUETTE uniquement : 90 jours d'audience, de surveillance technique et de demande par métier,
 * pour la section « Intelligence » de la console. Gardé dans ce navigateur.
 * En production, ces chiffres viennent des outils branchés (analyse d'audience, surveillance
 * des erreurs et de la disponibilité) et des demandes réelles enregistrées dans Firestore.
 *
 * Deux incidents sont glissés exprès dans les données, pour que la détection d'anomalies
 * ait quelque chose à trouver : une panne de SMS il y a 3 jours et un pic d'inscriptions il y a 9 jours.
 */

export type JourAudience = {
  jour: number; // minuit, en ms
  visiteurs: number;
  sessions: number;
  pagesVues: number;
  dureeMoySec: number;
  rebondPct: number;
  inscriptions: number;
};

export type JourTechnique = {
  jour: number;
  disponibilitePct: number;
  latenceP95Ms: number;
  erreurs: number;
  smsEchoues: number;
};

export type DemandeHebdo = { metier: string; quartier: string; semaines: number[] };

export type DonneesIntelligence = {
  genereLe: number;
  audience: JourAudience[];
  technique: JourTechnique[];
  pages: Record<string, number>; // vues sur 30 jours, par page type
  appareils: { mobile: number; ordinateur: number; appli: number };
  heures: number[]; // 24 valeurs : visites selon l'heure
  sources: Record<string, number>;
  entonnoir: { etape: string; n: number }[];
  quartiersVisiteurs: Record<string, number>;
  demande: DemandeHebdo[]; // 16 dernières semaines
  erreursParPage: Record<string, number>;
};

const JOUR = 24 * 3600 * 1000;
const CLE = "artopif-demo-intelligence";
const VERSION = 1;

/** Générateur pseudo-aléatoire à graine (mêmes tirages d'un rechargement à l'autre). */
function rng(graine: number) {
  let s = graine >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

const minuit = (ms: number) => {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
};

export function genererIntelligence(): DonneesIntelligence {
  const r = rng(20261118);
  const bruit = (amp: number) => (r() * 2 - 1) * amp;
  const aujourdhui = minuit(Date.now());

  const audience: JourAudience[] = [];
  const technique: JourTechnique[] = [];
  for (let i = 89; i >= 0; i--) {
    const jour = aujourdhui - i * JOUR;
    const jd = new Date(jour).getDay(); // 0 dimanche
    const tendance = 140 + (89 - i) * 2.4; // la plateforme grandit
    const semaine = jd === 0 ? 0.62 : jd === 6 ? 0.8 : jd === 1 ? 1.12 : 1;
    let visiteurs = Math.round(tendance * semaine * (1 + bruit(0.12)));
    let inscriptions = Math.max(0, Math.round(visiteurs * 0.035 * (1 + bruit(0.35))));
    if (i === 9) inscriptions *= 4; // pic d'inscriptions (campagne radio)
    if (i === 3) visiteurs = Math.round(visiteurs * 0.83);
    const sessions = Math.round(visiteurs * (1.18 + bruit(0.05)));
    audience.push({
      jour,
      visiteurs,
      sessions,
      pagesVues: Math.round(sessions * (3.6 + bruit(0.4))),
      dureeMoySec: Math.round(190 + bruit(35)),
      rebondPct: Math.round(38 + bruit(6)),
      inscriptions,
    });
    const panne = i === 3;
    technique.push({
      jour,
      disponibilitePct: panne ? 99.1 : Math.min(100, 99.95 + bruit(0.05)),
      latenceP95Ms: Math.round((panne ? 1450 : 420) + bruit(60)),
      erreurs: Math.max(0, Math.round((panne ? 64 : 4) + bruit(3))),
      smsEchoues: panne ? 38 : Math.max(0, Math.round(1 + bruit(1.5))),
    });
  }

  const pages: Record<string, number> = {
    "/": 9400,
    "/recherche": 7100,
    "/artisans/[id]": 6300,
    "/quincaillerie": 3900,
    "/appli": 3300,
    "/quincaillerie/[produit]": 2600,
    "/messages": 2100,
    "/devis/nouveau": 1500,
    "/metiers": 1300,
    "/appli/proches": 1250,
    "/appli/photo": 640,
    "/pro/espace": 900,
    "/profil": 820,
    "/contact": 300,
  };
  for (const k of Object.keys(pages)) pages[k] = Math.round(pages[k] * (1 + bruit(0.08)));

  const heures = Array.from({ length: 24 }, (_, h) => {
    const base = h < 6 ? 6 : h < 8 ? 40 : h < 12 ? 95 : h < 14 ? 120 : h < 18 ? 85 : h < 22 ? 110 : 35;
    return Math.round(base * (1 + bruit(0.15)));
  });

  // Demande hebdomadaire par métier et quartier (16 semaines), avec des tendances différentes
  const quartiersListe = ["Bacongo", "Poto-Poto", "Moungali", "Talangaï", "Makélékélé", "Ouenzé", "Mfilou", "Centre-ville"];
  const metiersDemo = [...new Set(artisans.map((a) => a.metier))].filter((m) => getMetier(m));
  const pentes: Record<string, number> = {};
  metiersDemo.forEach((m, k) => (pentes[m] = [0.09, 0.02, -0.03, 0.05, 0.12, 0, -0.01, 0.07][k % 8]));
  const demande: DemandeHebdo[] = [];
  for (const metier of metiersDemo)
    for (const quartier of quartiersListe) {
      const base = 2 + r() * 6;
      demande.push({
        metier,
        quartier,
        semaines: Array.from({ length: 16 }, (_, s) =>
          Math.max(0, Math.round(base * (1 + pentes[metier] * s) * (1 + bruit(0.25)) + (s % 4 === 0 ? 1 : 0))),
        ),
      });
    }

  return {
    genereLe: Date.now(),
    audience,
    technique,
    pages,
    appareils: { mobile: 68, ordinateur: 21, appli: 11 },
    heures,
    sources: { "Recherche Google": 41, WhatsApp: 27, "Accès direct": 18, Facebook: 10, Autres: 4 },
    entonnoir: [
      { etape: "Visite", n: 10000 },
      { etape: "Recherche d’un artisan", n: 6200 },
      { etape: "Profil consulté", n: 3900 },
      { etape: "Contact ou devis", n: 1350 },
      { etape: "Prestation confirmée", n: 520 },
      { etape: "Avis laissé", n: 210 },
    ],
    quartiersVisiteurs: { Bacongo: 18, "Poto-Poto": 16, Moungali: 14, Talangaï: 13, Makélékélé: 12, Ouenzé: 10, "Centre-ville": 9, Mfilou: 8 },
    demande,
    erreursParPage: { "/devis/nouveau": 21, "/appli/photo": 14, "/messages": 9, "/pro/espace": 5, "/recherche": 3 },
  };
}

/** Données de démonstration (créées à la première ouverture, puis gardées). */
export function lireIntelligence(): DonneesIntelligence {
  try {
    const brut = JSON.parse(localStorage.getItem(CLE) ?? "null") as (DonneesIntelligence & { v?: number }) | null;
    // régénérées chaque jour, pour que « aujourd'hui » reste aujourd'hui
    if (brut && brut.v === VERSION && minuit(brut.genereLe) === minuit(Date.now())) return brut;
  } catch {
    /* on régénère */
  }
  const d = genererIntelligence();
  try {
    localStorage.setItem(CLE, JSON.stringify({ ...d, v: VERSION }));
  } catch {
    /* gardées le temps de la visite */
  }
  return d;
}
