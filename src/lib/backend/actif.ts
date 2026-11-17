import { artisans, boutiques } from "../data";

/**
 * Interrupteur maquette / production. Aucun import du SDK Firebase ici : ce module est lu
 * partout (pages, rendu serveur) sans alourdir le navigateur.
 *
 * Tant que NEXT_PUBLIC_FIREBASE_API_KEY et NEXT_PUBLIC_FIREBASE_PROJECT_ID ne sont pas
 * renseignés (.env.local en local, variables d'environnement de l'hébergeur en ligne),
 * l'application reste en MAQUETTE : tout est gardé dans le navigateur.
 */
export const configFirebase = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

/** Région des Cloud Functions (firebase-functions/index.js). */
export const REGION_FONCTIONS = process.env.NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION || "europe-west1";

export const BACKEND_ACTIF = Boolean(configFirebase.apiKey && configFirebase.projectId);

/**
 * Les artisans et boutiques de démonstration (src/lib/data.ts) n'existent pas dans la base :
 * les échanges avec eux restent dans le navigateur, même en production.
 */
const IDS_DEMO = new Set([...artisans.map((a) => a.id), ...boutiques.map((b) => b.id)]);
export const estDemo = (id: string) => !BACKEND_ACTIF || IDS_DEMO.has(id);
