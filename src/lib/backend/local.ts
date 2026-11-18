import type {
  AvisDoc,
  ContactDoc,
  DemandeAnnonceurDoc,
  EntreeJournal,
  PropositionMetierDoc,
  PubDoc,
  SignalementDoc,
  StatutPro,
} from "./modele";
import { CAMPAGNES_DEMO } from "../publicites-demo";

/**
 * MAQUETTE (sans Firebase) : avis, messages de contact, signalements et décisions de l'équipe
 * sont gardés dans le navigateur, pour pouvoir essayer tout le parcours, backoffice compris.
 * En production, tout passe par Firestore.
 */
export type BaseLocale = {
  avis: AvisDoc[];
  contacts: ContactDoc[];
  signalements: SignalementDoc[];
  /** statut des pros de démonstration décidé dans le backoffice (vérifiés par défaut) */
  statutsPros: Record<string, StatutPro>;
  /** réalisations de démonstration vérifiées dans le backoffice (« proId/index ») */
  realisationsVerifiees: string[];
  demandesAnnonceurs: DemandeAnnonceurDoc[];
  propositionsMetiers: PropositionMetierDoc[];
  /** campagnes publicitaires créées dans la console */
  publicites: PubDoc[];
  journal: EntreeJournal[];
  /** maquette : comptes clients et dates d'inscription des pros (données de démonstration) */
  comptes: { id: string; prenom: string; nom: string; telephone: string; ville: string; creeLe: number }[];
  datesPros: Record<string, number>;
};

const CLE = "artopif-maquette-base";
const vide = (): BaseLocale => ({
  avis: [],
  contacts: [],
  signalements: [],
  statutsPros: {},
  realisationsVerifiees: [],
  demandesAnnonceurs: [],
  propositionsMetiers: [],
  publicites: [],
  journal: [],
  comptes: [],
  datesPros: {},
});

export function lireLocal(): BaseLocale {
  try {
    const brut = localStorage.getItem(CLE);
    const lu = brut ? (JSON.parse(brut) as Partial<BaseLocale>) : {};
    // premier passage : campagnes de démonstration (gérables dans la console comme les autres)
    return { ...vide(), publicites: CAMPAGNES_DEMO, ...lu };
  } catch {
    return vide();
  }
}

export function modifierLocal(f: (b: BaseLocale) => BaseLocale): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(f(lireLocal())));
    window.dispatchEvent(new Event(EVENEMENT_LOCAL));
  } catch {
    /* stockage indisponible : rien n'est gardé */
  }
}

/** Émis à chaque modification (les publicités du site se mettent à jour sans recharger). */
export const EVENEMENT_LOCAL = "artopif-maquette-base";

export const idLocal = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
