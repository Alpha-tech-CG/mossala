"use client";

/**
 * Mesure d'audience de la plateforme (pages vues, sessions, appareils).
 *
 * MAQUETTE : chaque page vue dans ce navigateur est notée ici (localStorage) et s'ajoute aux
 * données de démonstration de la console (section Audience). Rien ne part ailleurs.
 * PRODUCTION : brancher un outil d'analyse (Vercel Web Analytics, PostHog…) à la place,
 * avec le consentement du visiteur ; la console lira alors ses chiffres.
 */

export type PageVue = { chemin: string; ts: number; session: string; appareil: "mobile" | "ordinateur" | "appli" };

const CLE = "artopif-audience";
const CLE_SESSION = "artopif-audience-session";
const MAX = 2000;

/** Regroupe les adresses par page type : /artisans/jean-claude → /artisans/[id]. */
export function pageType(chemin: string): string {
  const p = chemin.split("?")[0].replace(/\/$/, "") || "/";
  const motifs: [RegExp, string][] = [
    [/^\/artisans\/[^/]+$/, "/artisans/[id]"],
    [/^\/artisans\/[^/]+\/evaluer$/, "/artisans/[id]/evaluer"],
    [/^\/quincaillerie\/boutique\/[^/]+$/, "/quincaillerie/boutique/[id]"],
    [/^\/quincaillerie\/(?!boutique)[^/]+$/, "/quincaillerie/[produit]"],
  ];
  for (const [re, nom] of motifs) if (re.test(p)) return nom;
  return p;
}

function session(): string {
  try {
    let s = sessionStorage.getItem(CLE_SESSION);
    if (!s) {
      s = Math.random().toString(36).slice(2, 10);
      sessionStorage.setItem(CLE_SESSION, s);
    }
    return s;
  } catch {
    return "inconnue";
  }
}

export function noterPageVue(chemin: string) {
  if (chemin.startsWith("/admin")) return; // la console ne compte pas
  try {
    const appareil: PageVue["appareil"] =
      document.documentElement.getAttribute("data-appli") === "1"
        ? "appli"
        : matchMedia("(max-width: 767px)").matches
          ? "mobile"
          : "ordinateur";
    const liste = lirePagesVues();
    liste.push({ chemin, ts: Date.now(), session: session(), appareil });
    localStorage.setItem(CLE, JSON.stringify(liste.slice(-MAX)));
  } catch {
    /* stockage indisponible : la visite n'est pas comptée */
  }
}

export function lirePagesVues(): PageVue[] {
  try {
    const l = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(l) ? (l as PageVue[]) : [];
  } catch {
    return [];
  }
}
