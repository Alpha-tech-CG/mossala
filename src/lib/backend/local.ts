import type { AvisDoc, ContactDoc, SignalementDoc, StatutPro } from "./modele";

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
};

const CLE = "artopif-maquette-base";
const vide = (): BaseLocale => ({ avis: [], contacts: [], signalements: [], statutsPros: {}, realisationsVerifiees: [] });

export function lireLocal(): BaseLocale {
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...vide(), ...(JSON.parse(brut) as Partial<BaseLocale>) } : vide();
  } catch {
    return vide();
  }
}

export function modifierLocal(f: (b: BaseLocale) => BaseLocale): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(f(lireLocal())));
  } catch {
    /* stockage indisponible : rien n'est gardé */
  }
}

export const idLocal = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
