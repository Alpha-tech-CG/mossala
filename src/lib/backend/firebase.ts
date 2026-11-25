/**
 * Backend de production : Firebase (projet mossala-6f297).
 *  - Authentication : connexion par code SMS (natif) ou par code email (Cloud Functions) ;
 *  - Firestore : comptes, profils pros, réalisations, messagerie, devis ;
 *  - Storage : photos des réalisations.
 *
 * La configuration web est publique par conception ; la sécurité repose sur firestore.rules,
 * storage.rules et les domaines autorisés de l'Auth.
 */
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import {
  type Auth,
  type User,
  RecaptchaVerifier,
  getAuth,
  onAuthStateChanged,
  signInWithCustomToken,
  signInWithPhoneNumber,
  signOut,
} from "firebase/auth";
import { type Firestore, getFirestore, initializeFirestore } from "firebase/firestore";
import { type Functions, getFunctions, httpsCallable } from "firebase/functions";
import { type FirebaseStorage, getStorage } from "firebase/storage";
import { REGION_FONCTIONS, configFirebase } from "./actif";
import type { Session, VerificationCode } from "./types";

// Initialisation paresseuse : uniquement côté navigateur, au premier usage.
const app = (): FirebaseApp => getApps().find((a) => a.name === "[DEFAULT]") ?? initializeApp(configFirebase);

export const auth = (): Auth => {
  const a = getAuth(app());
  a.languageCode = "fr"; // SMS et reCAPTCHA en français
  return a;
};

let base: Firestore | null = null;
export const db = (): Firestore => {
  if (base) return base;
  try {
    // les champs facultatifs à `undefined` (ex. fourchette de prix d'une ligne de devis) sont ignorés
    base = initializeFirestore(app(), { ignoreUndefinedProperties: true });
  } catch {
    base = getFirestore(app()); // déjà initialisée (rechargement à chaud)
  }
  return base;
};

export const stockage = (): FirebaseStorage => getStorage(app());
const fonctions = (): Functions => getFunctions(app(), REGION_FONCTIONS);

const versSession = (u: User): Session => ({ id: u.uid, telephone: u.phoneNumber ?? "", email: u.email ?? "" });

// ——— Code SMS ———

let verificateur: RecaptchaVerifier | null = null;

/** Libère la protection anti-robot (à appeler quand le formulaire disparaît). */
export function nettoyerVerification() {
  verificateur?.clear();
  verificateur = null;
}

/**
 * Envoie un code SMS au numéro (format international).
 * `conteneurId` : élément vide de la page où Firebase place son reCAPTCHA invisible.
 */
export async function envoyerCodeSms(telephone: string, conteneurId: string): Promise<VerificationCode> {
  nettoyerVerification();
  verificateur = new RecaptchaVerifier(auth(), conteneurId, { size: "invisible" });
  try {
    const res = await signInWithPhoneNumber(auth(), telephone, verificateur);
    return {
      async confirmer(code: string) {
        const { user } = await res.confirm(code);
        return versSession(user);
      },
    };
  } catch (e) {
    nettoyerVerification();
    throw e;
  }
}

// ——— Code email (Cloud Functions envoyerCodeEmail / verifierCodeEmail) ———

/** Envoie un code à 6 chiffres par email ; `confirmer` connecte avec le jeton renvoyé par le serveur. */
export async function envoyerCodeEmail(email: string): Promise<VerificationCode> {
  const adresse = email.trim().toLowerCase();
  await httpsCallable<{ email: string }, { ok: true }>(fonctions(), "envoyerCodeEmail")({ email: adresse });
  return {
    async confirmer(code: string) {
      const { data } = await httpsCallable<{ email: string; code: string }, { jeton: string }>(
        fonctions(),
        "verifierCodeEmail",
      )({ email: adresse, code });
      const { user } = await signInWithCustomToken(auth(), data.jeton);
      return versSession(user);
    },
  };
}

// ——— Session ———

/** Suit la connexion : `cb(null)` une fois déconnecté. Renvoie la fonction de désabonnement. */
export function surConnexion(cb: (u: Session | null) => void): () => void {
  return onAuthStateChanged(auth(), (u) => cb(u ? versSession(u) : null));
}

/** true si le compte connecté fait partie de l'équipe (jeton avec admin: true). */
export async function estAdmin(): Promise<boolean> {
  const u = auth().currentUser;
  if (!u) return false;
  const jeton = await u.getIdTokenResult(true); // relu à chaque fois : un accès retiré l'est aussitôt
  return jeton.claims.admin === true;
}

/** true si le compte connecté est le responsable de la console (jeton avec owner: true). */
export async function estOwner(): Promise<boolean> {
  const u = auth().currentUser;
  if (!u) return false;
  const jeton = await u.getIdTokenResult(true);
  return jeton.claims.owner === true;
}

/** Données passées à la Cloud Function gererMembre (réservée au responsable). */
export type ActionMembre =
  | { action: "inviter"; identifiant: string; nom: string; permissions: string[] }
  | { action: "modifier"; uid: string; nom?: string; permissions?: string[]; actif?: boolean }
  | { action: "revoquer"; uid: string };

/** Crée, modifie ou révoque un membre de l'équipe (côté serveur : pose les droits et la fiche). */
export async function gererMembreDistant(data: ActionMembre): Promise<{ uid: string }> {
  const { data: res } = await httpsCallable<ActionMembre, { uid: string }>(fonctions(), "gererMembre")(data);
  return res;
}

export async function deconnexion(): Promise<void> {
  await signOut(auth());
}
