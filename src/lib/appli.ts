"use client";

import { useSyncExternalStore } from "react";

/** data-appli est posé sur <html> par SCRIPT_DETECTION (./appli-script.ts). */
function lire(): boolean {
  return document.documentElement.getAttribute("data-appli") === "1";
}

/** Vrai dans l'application mobile (ou son aperçu). Toujours faux au rendu serveur. */
export function useAppli(): boolean {
  return useSyncExternalStore(
    () => () => {},
    lire,
    () => false,
  );
}

/** Vrai seulement dans la vraie coque native (plugins Capacitor disponibles). */
export function estNatif(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

/** Partage natif (feuille de partage du téléphone), sinon copie du lien. */
export async function partager(d: { titre: string; texte: string; url: string }): Promise<"partage" | "copie" | "annule"> {
  const url = new URL(d.url, location.origin).toString();
  // La WebView Android n'a pas navigator.share : on passe par le plugin natif.
  if (estNatif()) {
    try {
      const { Share } = await import("@capacitor/share");
      await Share.share({ title: d.titre, text: d.texte, url, dialogTitle: "Partager" });
      return "partage";
    } catch {
      return "annule";
    }
  }
  if (navigator.share) {
    try {
      await navigator.share({ title: d.titre, text: d.texte, url });
      return "partage";
    } catch {
      return "annule";
    }
  }
  try {
    await navigator.clipboard.writeText(`${d.texte} ${url}`);
    return "copie";
  } catch {
    return "annule";
  }
}
