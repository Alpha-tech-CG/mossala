/**
 * Implémentation Firebase du backend — UTILISÉE POUR LA DÉMO SEULEMENT.
 * La production ira sur Supabase ou Neon : il suffira d'écrire une autre
 * implémentation avec les mêmes fonctions et de la brancher dans ./index.ts.
 *
 * Projet : mossala-6f297. La configuration web est publique par conception ;
 * la sécurité repose sur firestore.rules et les domaines autorisés de l'Auth.
 */
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, RecaptchaVerifier, getAuth, signInWithPhoneNumber } from "firebase/auth";
import { type Firestore, doc, getFirestore, serverTimestamp, writeBatch } from "firebase/firestore";
import type { NouveauProfilPro, VerificationTelephone } from "./types";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialisation paresseuse : uniquement côté navigateur, au premier usage.
const app = (): FirebaseApp => getApps()[0] ?? initializeApp(config);
const auth = (): Auth => {
  const a = getAuth(app());
  a.languageCode = "fr"; // SMS et reCAPTCHA en français
  return a;
};
const db = (): Firestore => getFirestore(app());

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
export async function envoyerCodeSms(telephone: string, conteneurId: string): Promise<VerificationTelephone> {
  nettoyerVerification();
  verificateur = new RecaptchaVerifier(auth(), conteneurId, { size: "invisible" });
  try {
    const res = await signInWithPhoneNumber(auth(), telephone, verificateur);
    return {
      async confirmer(code: string) {
        const { user } = await res.confirm(code);
        return { id: user.uid, telephone: user.phoneNumber ?? telephone };
      },
    };
  } catch (e) {
    nettoyerVerification();
    throw e;
  }
}

// ——— Profils professionnels ———

/**
 * Crée le profil d'un professionnel.
 * pros/{id} : public · pros/{id}/prive/contact : numéro (lisible par le propriétaire seul)
 */
export async function creerProfilPro(id: string, p: NouveauProfilPro): Promise<void> {
  const base = db();
  const lot = writeBatch(base);
  lot.set(doc(base, "pros", id), {
    type: p.type,
    nom: p.nom,
    ville: p.ville,
    quartier: p.quartier,
    ...(p.type === "boutique" ? { adresse: p.adresse } : { metier: p.metier, zones: p.zones }),
    numeroPublic: p.numeroPublic,
    telephonePublic: p.numeroPublic ? p.telephone : null,
    statut: "en_verification",
    creeLe: serverTimestamp(),
  });
  lot.set(doc(base, "pros", id, "prive", "contact"), {
    telephone: p.telephone,
    telephones: p.telephones,
    responsable: p.responsable,
    adresse: p.adresse,
    alerteWhatsapp: true,
    alerteSms: true,
  });
  await lot.commit();
}

// ——— Erreurs ———

/** Messages d'erreur Firebase traduits pour l'utilisateur. */
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
    "auth/operation-not-allowed": "La connexion par téléphone n’est pas encore activée (configuration du service).",
    "auth/unauthorized-domain": "Ce site n’est pas encore autorisé par le service de connexion.",
    "permission-denied": "Enregistrement refusé par les règles de sécurité.",
    unavailable: "Service momentanément indisponible. Réessayez.",
  };
  return messages[code] ?? `Une erreur est survenue${code ? ` (${code})` : ""}. Réessayez.`;
}
