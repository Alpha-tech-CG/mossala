/**
 * Analyses de la console (section « Analyses ML ») : calculs faits dans le navigateur, sur les
 * données de la console. Aucune dépendance, aucun envoi de données.
 *
 * 1. Faux avis : score de suspicion par régression logistique sur 6 signaux de fraude connus.
 *    Les poids sont des valeurs de départ ; avec assez d'avis modérés en production, on les
 *    réapprend sur les décisions de l'équipe (publié / refusé).
 * 2. Prévision de la demande : lissage exponentiel double de Holt (niveau + tendance), paramètres
 *    choisis par recherche sur grille, intervalle à 95 % tiré des erreurs passées.
 * 3. Anomalies : écart robuste (médiane et MAD sur 28 jours glissants) ; alerte au-delà de 3,5.
 * 4. Recommandation : score multicritère expliqué (proximité, qualité bayésienne, réactivité,
 *    disponibilité, confiance). Avec l'historique réel, on y ajoutera le filtrage collaboratif.
 */
import type { AvisDoc } from "./backend/modele";
import type { Artisan } from "./data";
import { CENTRES_QUARTIERS, distanceKm } from "./proximite";

const HEURE = 3600 * 1000;
const JOUR = 24 * HEURE;
const sigmoide = (x: number) => 1 / (1 + Math.exp(-x));
const normaliser = (t: string) =>
  t.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim();

// ——— 1. Faux avis ———

export type SignalAvis = { id: string; libelle: string; poids: number };

export const SIGNAUX: SignalAvis[] = [
  { id: "rafaleAuteur", libelle: "Même compte : 3 avis ou plus en 24 h", poids: 3.2 },
  { id: "texteCopie", libelle: "Texte identique publié par d’autres comptes", poids: 2.6 },
  { id: "rafaleCible", libelle: "Afflux d’avis sur ce pro en 24 h, très au-dessus de son rythme", poids: 2.2 },
  { id: "ecartMoyenne", libelle: "Note très éloignée des autres avis sur ce pro", poids: 1.4 },
  { id: "extremeVide", libelle: "Note extrême (1 ou 5) sans explication", poids: 0.9 },
  { id: "sansExperience", libelle: "Note extrême sans prestation ni achat", poids: 0.8 },
];
const BIAIS = -4;

export type AvisScore = { avis: AvisDoc; probabilite: number; signaux: SignalAvis[] };

export function scorerAvis(avis: AvisDoc[]): AvisScore[] {
  const parAuteur = new Map<string, AvisDoc[]>();
  const parCible = new Map<string, AvisDoc[]>();
  const parTexte = new Map<string, AvisDoc[]>();
  for (const v of avis) {
    parAuteur.set(v.auteurId, [...(parAuteur.get(v.auteurId) ?? []), v]);
    parCible.set(v.cibleId, [...(parCible.get(v.cibleId) ?? []), v]);
    const t = normaliser(v.texte ?? "");
    if (t.length >= 20) parTexte.set(t, [...(parTexte.get(t) ?? []), v]);
  }

  return avis.map((v) => {
    const actifs = new Set<string>();
    const proches = (l: AvisDoc[], fenetre: number) => l.filter((x) => Math.abs(x.creeLe - v.creeLe) <= fenetre);

    if (proches(parAuteur.get(v.auteurId) ?? [], JOUR).length >= 3) actifs.add("rafaleAuteur");

    const t = normaliser(v.texte ?? "");
    if (t.length >= 20) {
      const autres = proches(parTexte.get(t) ?? [], 7 * JOUR).filter((x) => x.auteurId !== v.auteurId);
      if (autres.length >= 1) actifs.add("texteCopie");
    }

    const surCible = parCible.get(v.cibleId) ?? [];
    const autour = proches(surCible, JOUR).length;
    if (surCible.length >= 3) {
      const etendue = Math.max(7, (Math.max(...surCible.map((x) => x.creeLe)) - Math.min(...surCible.map((x) => x.creeLe))) / JOUR);
      const rythme = surCible.length / etendue; // avis par jour, en moyenne
      if (autour >= 4 && autour > 5 * rythme) actifs.add("rafaleCible");
      const autresNotes = surCible.filter((x) => x !== v).map((x) => x.note);
      const moy = autresNotes.reduce((a, b) => a + b, 0) / autresNotes.length;
      if (Math.abs(v.note - moy) >= 2.3) actifs.add("ecartMoyenne");
    }

    const extreme = v.note <= 1.5 || v.note >= 4.8;
    if (extreme && (v.texte ?? "").trim().length < 15) actifs.add("extremeVide");
    if (extreme && v.experience === "contact") actifs.add("sansExperience");

    const signaux = SIGNAUX.filter((s) => actifs.has(s.id));
    const probabilite = sigmoide(BIAIS + signaux.reduce((s, x) => s + x.poids, 0));
    return { avis: v, probabilite, signaux };
  });
}

// ——— 2. Prévision (Holt) ———

export type Prevision = { prevue: number[]; bas: number[]; haut: number[]; alpha: number; beta: number; tendance: number };

export function prevoirHolt(serie: number[], horizon: number): Prevision {
  if (serie.length < 3) {
    const m = serie.length ? serie.reduce((a, b) => a + b, 0) / serie.length : 0;
    return { prevue: Array(horizon).fill(m), bas: Array(horizon).fill(m), haut: Array(horizon).fill(m), alpha: 0, beta: 0, tendance: 0 };
  }
  let meilleur = { sse: Infinity, alpha: 0.5, beta: 0.1, niveau: 0, tendance: 0, residus: [] as number[] };
  for (let a = 0.1; a <= 0.9; a += 0.1)
    for (let b = 0.05; b <= 0.5; b += 0.05) {
      let niveau = serie[0];
      let tendance = serie[1] - serie[0];
      let sse = 0;
      const residus: number[] = [];
      for (let t = 1; t < serie.length; t++) {
        const prevu = niveau + tendance;
        const e = serie[t] - prevu;
        residus.push(e);
        sse += e * e;
        const n2 = a * serie[t] + (1 - a) * (niveau + tendance);
        tendance = b * (n2 - niveau) + (1 - b) * tendance;
        niveau = n2;
      }
      if (sse < meilleur.sse) meilleur = { sse, alpha: a, beta: b, niveau, tendance, residus };
    }
  const sigma = Math.sqrt(meilleur.residus.reduce((s, e) => s + e * e, 0) / Math.max(1, meilleur.residus.length - 2));
  const prevue: number[] = [];
  const bas: number[] = [];
  const haut: number[] = [];
  for (let h = 1; h <= horizon; h++) {
    const p = Math.max(0, meilleur.niveau + h * meilleur.tendance);
    const marge = 1.96 * sigma * Math.sqrt(h);
    prevue.push(p);
    bas.push(Math.max(0, p - marge));
    haut.push(p + marge);
  }
  return { prevue, bas, haut, alpha: meilleur.alpha, beta: meilleur.beta, tendance: meilleur.tendance };
}

// ——— 3. Anomalies (écart robuste) ———

export type Anomalie = { indice: number; valeur: number; attendu: number; ecart: number; sens: "hausse" | "baisse" };

const mediane = (l: number[]) => {
  const s = [...l].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Points anormaux d'une série journalière (fenêtre de 28 jours avant chaque point). */
export function detecterAnomalies(serie: number[], seuil = 3.5, fenetre = 28): Anomalie[] {
  const res: Anomalie[] = [];
  for (let i = fenetre; i < serie.length; i++) {
    const passe = serie.slice(i - fenetre, i);
    const med = mediane(passe);
    const mad = mediane(passe.map((x) => Math.abs(x - med))) * 1.4826 || 1e-9;
    const ecart = (serie[i] - med) / mad;
    if (Math.abs(ecart) >= seuil) res.push({ indice: i, valeur: serie[i], attendu: med, ecart, sens: ecart > 0 ? "hausse" : "baisse" });
  }
  return res;
}

// ——— 4. Recommandation d'artisans ———

export type Facteur = { nom: string; poids: number; valeur: number };
export type Recommandation = { artisan: Artisan; score: number; facteurs: Facteur[]; noteBayes: number; km: number | null };

const PRIOR_NOTE = 3.8;
const PRIOR_POIDS = 5;
const DISPO = { aujourdhui: 1, semaine: 0.6, "plus-tard": 0.2 } as const;

/** « Répond en 1 h » → 1 ; « Répond en 30 min » → 0,5 ; inconnu → 24. */
function heuresDeReponse(t: string): number {
  const m = t.match(/(\d+)\s*(min|h|j)/i);
  if (!m) return 24;
  const n = Number(m[1]);
  return m[2].toLowerCase() === "min" ? n / 60 : m[2].toLowerCase() === "j" ? n * 24 : n;
}

export function recommander(artisans: Artisan[], avis: AvisDoc[], quartier: string, metier: string | null): Recommandation[] {
  const centre = CENTRES_QUARTIERS[quartier];
  return artisans
    .filter((a) => !metier || a.metier === metier)
    .map((a) => {
      const notes = avis.filter((v) => v.cibleId === a.id && v.statut === "publie").map((v) => v.note);
      const n = notes.length || a.nbAvis;
      const somme = notes.length ? notes.reduce((x, y) => x + y, 0) : a.note * a.nbAvis;
      const noteBayes = (PRIOR_NOTE * PRIOR_POIDS + somme) / (PRIOR_POIDS + n);

      const lieux = [a.quartier, ...a.zones];
      const km = lieux.includes(quartier)
        ? 0
        : centre
          ? Math.min(...lieux.map((q) => CENTRES_QUARTIERS[q]).filter(Boolean).map((c) => distanceKm(centre, c)), 99)
          : null;

      const facteurs: Facteur[] = [
        { nom: "Proximité", poids: 0.35, valeur: km === null ? 0.3 : Math.exp(-km / 4) },
        { nom: "Qualité (note bayésienne)", poids: 0.3, valeur: (noteBayes - 1) / 4 },
        { nom: "Réactivité", poids: 0.15, valeur: 1 / (1 + heuresDeReponse(a.reponse) / 4) },
        { nom: "Disponibilité", poids: 0.1, valeur: DISPO[a.disponible] },
        { nom: "Confiance (vérifications)", poids: 0.1, valeur: Math.min(1, a.badges.length / 4) },
      ];
      const score = facteurs.reduce((s, f) => s + f.poids * f.valeur, 0);
      return { artisan: a, score, facteurs, noteBayes, km: km === 99 ? null : km };
    })
    .sort((x, y) => y.score - x.score);
}
