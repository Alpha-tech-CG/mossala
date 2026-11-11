"use client";

import { useSyncExternalStore } from "react";
import { PROFILS_SANS_COMPTE } from "./data";
import { SUPABASE_ACTIF, sb, verifier } from "./backend/supabase";
import { surSession, useSession } from "./session";
import type { Identite } from "@/components/Identite";

/**
 * Compte client : inscription, profils consultés dans le mois, Premium et favoris.
 * MAQUETTE : stocké dans le navigateur. Avec Supabase, le compte passe par l'OTP SMS
 * et le compteur + le Premium vivent côté serveur (table par utilisateur, RLS),
 * sinon un client pourrait les réinitialiser.
 */

/** Identité complète du client (+ `telephone` : son numéro principal, utilisé pour le rappel). */
export type Compte = Partial<Omit<Identite, "prenom">> & { prenom: string; telephone: string; creeLe: number };

type Etat = {
  compte: Compte | null;
  mois: string;
  /** artisans dont le profil a été ouvert ce mois-ci (revoir un profil ne compte pas deux fois) */
  consultes: string[];
  premiumJusqua: number | null;
  favoris: string[];
  /** profils ouverts avant de créer un compte (3 au maximum, sans remise à zéro) */
  vusSansCompte: string[];
};

const CLE = "artico-compte";
const moisCourant = () => new Date().toISOString().slice(0, 7);
const vide = (): Etat => ({ compte: null, mois: moisCourant(), consultes: [], premiumJusqua: null, favoris: [], vusSansCompte: [] });

let cache: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (cache) return cache;
  let e = vide();
  try {
    const brut = localStorage.getItem(CLE);
    if (brut) e = { ...e, ...(JSON.parse(brut) as Partial<Etat>) };
  } catch {
    /* stockage indisponible : on repart d'un état vide */
  }
  // Supabase : le compte vient de la base (numéro connecté), jamais d'une copie locale.
  if (SUPABASE_ACTIF) e = { ...e, compte: null };
  // nouveau mois : les profils gratuits repartent à zéro (le Premium reste valable)
  if (e.mois !== moisCourant()) e = { ...e, mois: moisCourant(), consultes: [] };
  if (e.premiumJusqua !== null && e.premiumJusqua < Date.now()) e = { ...e, premiumJusqua: null };
  cache = e;
  return e;
}

function ecrire(e: Etat) {
  cache = e;
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    /* ignoré */
  }
  abonnes.forEach((f) => f());
}

// ——— Supabase : le compte est celui du numéro connecté par SMS (table comptes) ———

type LigneCompte = {
  id: string;
  prenom: string;
  nom: string | null;
  telephone: string;
  telephones: Identite["telephones"];
  adresse: string | null;
  ville: string | null;
  quartier: string | null;
  email: string | null;
  cree_le: string;
};

const versCompte = (l: LigneCompte): Compte => ({
  prenom: l.prenom,
  nom: l.nom ?? undefined,
  telephone: l.telephone,
  telephones: l.telephones,
  adresse: l.adresse ?? undefined,
  ville: l.ville ?? undefined,
  quartier: l.quartier ?? undefined,
  email: l.email ?? undefined,
  creeLe: Date.parse(l.cree_le),
});

/** Session connectée sans compte client (pas encore inscrite, ou compte pro uniquement). */
let sessionSansCompte = false;
/** uid dont le compte a été lu dans la base (pour savoir quand `pret` est vrai). */
let compteLuPour: string | null = null;
let synchro = false;

function synchroniser() {
  if (synchro || !SUPABASE_ACTIF || typeof window === "undefined") return;
  synchro = true;
  surSession(async () => {
    const { sessionActuelle } = await import("./session");
    const s = sessionActuelle();
    if (!s) {
      sessionSansCompte = false;
      if (lire().compte) ecrire({ ...lire(), compte: null });
      return;
    }
    try {
      const ligne = verifier(await sb().from("comptes").select("*").eq("id", s.id).maybeSingle()) as LigneCompte | null;
      sessionSansCompte = !ligne;
      compteLuPour = s.id;
      ecrire({ ...lire(), compte: ligne ? versCompte(ligne) : null });
    } catch {
      /* hors ligne : on garde l'état connu */
      compteLuPour = s.id;
      abonnes.forEach((f) => f());
    }
  });
}

/** Crée (ou met à jour) le compte du numéro connecté. Supabase seulement. */
async function enregistrerCompte(i: Identite): Promise<void> {
  const { sessionActuelle } = await import("./session");
  const s = sessionActuelle();
  if (!s) throw new Error("Vérifiez d’abord votre numéro par SMS.");
  const ligne = verifier(
    await sb()
      .from("comptes")
      .upsert({
        id: s.id,
        prenom: i.prenom,
        nom: i.nom || null,
        telephone: s.telephone,
        telephones: i.telephones,
        adresse: i.adresse || null,
        ville: i.ville || null,
        quartier: i.quartier || null,
        email: i.email || null,
      })
      .select("*")
      .single(),
  ) as LigneCompte;
  sessionSansCompte = false;
  ecrire({ ...lire(), compte: versCompte(ligne) });
}

const NOMS_MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** État neutre du rendu serveur : aucune date lue pendant le pré-rendu. */
const SERVEUR: Etat = { compte: null, mois: "", consultes: [], premiumJusqua: null, favoris: [], vusSansCompte: [] };

export function useCompte() {
  const session = useSession();
  const etat = useSyncExternalStore(
    (f) => {
      synchroniser();
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    lire,
    () => null,
  );
  const e = etat ?? SERVEUR;
  const premium = e.premiumJusqua !== null;
  const vusSansCompte = e.vusSansCompte ?? [];
  const restantsSansCompte = Math.max(0, PROFILS_SANS_COMPTE - vusSansCompte.length);
  return {
    /** false pendant le rendu serveur : on ne sait pas encore qui est connecté */
    pret: etat !== null && session.pret && (!session.session || compteLuPour === session.session.id),
    compte: e.compte,
    inscrit: e.compte !== null,
    mois: e.mois ? NOMS_MOIS[Number(e.mois.slice(5, 7)) - 1] : "",
    consultes: e.consultes,
    /** visiteur sans compte : profils encore ouvrables avant de devoir s'inscrire */
    restantsSansCompte,
    premium,
    premiumJusqua: premium ? new Date(e.premiumJusqua!) : null,
    favoris: e.favoris,
    /** inscrit : tous les profils ; sans compte : 3 profils au maximum */
    peutVoir: (id: string) => e.compte !== null || vusSansCompte.includes(id) || restantsSansCompte > 0,
    /** compte un profil ouvert sans compte (rien à compter une fois inscrit) */
    consulter: (id: string) => {
      const x = lire();
      if (x.compte) return;
      const vus = x.vusSansCompte ?? [];
      if (vus.includes(id) || vus.length >= PROFILS_SANS_COMPTE) return;
      ecrire({ ...x, vusSansCompte: [...vus, id] });
    },
    /** Supabase : numéro vérifié par SMS mais pas encore de compte client. */
    sessionSansCompte: SUPABASE_ACTIF && sessionSansCompte,
    /** Crée le compte. Supabase : après vérification du numéro par SMS (enregistré dans la base). */
    inscrire: async (i: Identite): Promise<void> => {
      if (SUPABASE_ACTIF) return enregistrerCompte(i);
      ecrire({ ...lire(), compte: { ...i, telephone: i.telephones[0]?.numero ?? "", creeLe: Date.now() } });
    },
    deconnecter: async () => {
      if (SUPABASE_ACTIF) await (await import("./backend/firebase")).deconnexion();
      ecrire({ ...lire(), compte: null });
    },
    basculerFavori: (id: string) => {
      const x = lire();
      ecrire({ ...x, favoris: x.favoris.includes(id) ? x.favoris.filter((f) => f !== id) : [...x.favoris, id] });
    },
  };
}
