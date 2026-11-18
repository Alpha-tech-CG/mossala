"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { estNatif } from "./appli";
import { BACKEND_ACTIF } from "./backend/actif";
import { useSession } from "./session";

/**
 * Notifications push de l'application mobile (Firebase Cloud Messaging, Android et iOS).
 *
 * 1. Le client touche « Activer les notifications » : le téléphone demande l'autorisation.
 * 2. Le jeton de l'appareil est rangé dans Firestore : appareils/{jeton} = { uid, plateforme }.
 * 3. Les Cloud Functions (alerteMessage, alerteDemande, alerteDevis) envoient la notification
 *    à tous les appareils du destinataire, en plus du SMS / WhatsApp.
 * 4. Toucher la notification ouvre la bonne page (champ `lien` des données).
 *
 * Hors de l'appli native (site, aperçu), tout ceci ne fait rien.
 */

export type EtatPush = "indisponible" | "a-demander" | "active" | "refusee";

let etat: EtatPush = "indisponible";
const abonnes = new Set<() => void>();
const changer = (e: EtatPush) => {
  etat = e;
  abonnes.forEach((f) => f());
};

const messagerie = () => import("@capacitor-firebase/messaging").then((m) => m.FirebaseMessaging);

async function enregistrerJeton(uid: string) {
  const { token } = await (await messagerie()).getToken();
  if (!token) return;
  const [{ doc, serverTimestamp, setDoc }, { db }] = await Promise.all([
    import("firebase/firestore"),
    import("./backend/firebase"),
  ]);
  const plateforme = /iPhone|iPad|iPod/.test(navigator.userAgent) ? "ios" : "android";
  await setDoc(doc(db(), "appareils", token), { uid, plateforme, majLe: serverTimestamp() });
}

/** Demande l'autorisation puis enregistre l'appareil. Renvoie le nouvel état. */
export async function activerNotifications(uid: string | null): Promise<EtatPush> {
  if (!estNatif() || !BACKEND_ACTIF) return "indisponible";
  try {
    const { receive } = await (await messagerie()).requestPermissions();
    if (receive !== "granted") {
      changer("refusee");
      return "refusee";
    }
    if (uid) await enregistrerJeton(uid);
    changer("active");
    return "active";
  } catch (e) {
    console.error("notifications", e);
    changer("indisponible");
    return "indisponible";
  }
}

export function useEtatPush(): EtatPush {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => abonnes.delete(f);
    },
    () => etat,
    () => "indisponible",
  );
}

/**
 * Monté une fois (barre d'onglets) : lit l'autorisation, réenregistre le jeton à chaque
 * connexion et ouvre la page visée quand on touche une notification.
 */
export function useNotificationsPush(appli: boolean) {
  const router = useRouter();
  const { session } = useSession();
  const uid = session?.id ?? null;

  useEffect(() => {
    if (!appli || !estNatif() || !BACKEND_ACTIF) return;
    let actif = true;
    const nettoyage: (() => void)[] = [];
    void (async () => {
      try {
        const fm = await messagerie();
        const { receive } = await fm.checkPermissions();
        if (!actif) return;
        changer(receive === "granted" ? "active" : receive === "denied" ? "refusee" : "a-demander");
        if (receive === "granted" && uid) await enregistrerJeton(uid);
        const h = await fm.addListener("notificationActionPerformed", (ev) => {
          const lien = (ev.notification.data as { lien?: unknown } | undefined)?.lien;
          if (typeof lien === "string" && lien.startsWith("/")) router.push(lien);
        });
        nettoyage.push(() => void h.remove());
      } catch (e) {
        // google-services.json / GoogleService-Info.plist absents : pas de notifications
        console.warn("notifications indisponibles", e);
      }
    })();
    return () => {
      actif = false;
      nettoyage.forEach((f) => f());
    };
  }, [appli, uid, router]);
}
