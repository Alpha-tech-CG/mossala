import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

/**
 * Connexion à Firebase (projet mossala-6f297).
 * La configuration web est publique par conception ; la sécurité repose sur
 * les règles Firestore (firestore.rules) et les domaines autorisés de l'Auth.
 * Initialisation paresseuse : uniquement côté navigateur, au premier usage.
 */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function app(): FirebaseApp {
  return getApps()[0] ?? initializeApp(config);
}

export function firebaseAuth(): Auth {
  const auth = getAuth(app());
  auth.languageCode = "fr"; // SMS et reCAPTCHA en français
  return auth;
}

export function firestore(): Firestore {
  return getFirestore(app());
}

/** Numéro congolais saisi (« 06 612 34 56 ») → format international (+242066123456). */
export function versE164(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, "").replace(/^242/, "");
  return `+242${chiffres}`;
}

/** Messages d'erreur Firebase en français, pour l'utilisateur. */
export function messageErreur(e: unknown): string {
  const code = (e as { code?: string })?.code ?? "";
  const messages: Record<string, string> = {
    "auth/invalid-phone-number": "Ce numéro n’est pas valide. Vérifiez-le (ex. 06 612 34 56).",
    "auth/missing-phone-number": "Saisissez votre numéro de téléphone.",
    "auth/too-many-requests": "Trop de tentatives. Réessayez dans quelques minutes.",
    "auth/quota-exceeded": "Le service SMS est momentanément saturé. Réessayez plus tard.",
    "auth/invalid-verification-code": "Code incorrect. Vérifiez le SMS reçu.",
    "auth/code-expired": "Ce code a expiré. Demandez un nouveau code.",
    "auth/captcha-check-failed": "Vérification de sécurité échouée. Rechargez la page.",
    "auth/network-request-failed": "Pas de connexion internet. Réessayez.",
    "auth/operation-not-allowed": "La connexion par téléphone n’est pas encore activée (configuration Firebase).",
    "auth/unauthorized-domain": "Ce site n’est pas encore autorisé dans Firebase (domaines autorisés).",
    "permission-denied": "Enregistrement refusé par les règles de sécurité.",
    unavailable: "Service momentanément indisponible. Réessayez.",
  };
  return messages[code] ?? `Une erreur est survenue${code ? ` (${code})` : ""}. Réessayez.`;
}
