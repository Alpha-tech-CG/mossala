"use client";

import { useSyncExternalStore } from "react";
import type { Realisation } from "./data";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp } from "firebase/firestore";
import { deleteObject, getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { estDemo } from "./backend/actif";
import { messageErreur } from "./backend/erreurs";
import { db, stockage } from "./backend/firebase";
import { versRealisation } from "./backend/modele";

/**
 * Réalisations publiées par les artisans depuis leur espace (photos de chantiers).
 * MAQUETTE : gardées dans le navigateur, photos réduites en JPEG. En production : Firestore
 * pros/{uid}/realisations + photos dans Firebase Storage realisations/{uid}/… (storage.rules).
 */

const CLE = "artico-realisations";

/** Liste publiée par artisan. Absente = l'artisan n'a rien modifié : on montre ses données de départ. */
type Etat = Record<string, Realisation[]>;

let cache: Etat | null = null;
const abonnes = new Set<() => void>();

function lire(): Etat {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(CLE) ?? "{}") as Etat;
  } catch {
    cache = {};
  }
  return cache;
}

/** false si le navigateur a refusé (stockage plein : trop de photos). */
function ecrire(e: Etat): boolean {
  let ok = true;
  try {
    localStorage.setItem(CLE, JSON.stringify(e));
  } catch {
    ok = false;
  }
  if (ok) {
    cache = e;
    abonnes.forEach((f) => f());
  }
  return ok;
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== CLE) return;
    cache = null;
    abonnes.forEach((f) => f());
  });
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

// ——— Artisans inscrits (production) : la base fait foi ———

const distants: Etat = {};
const enCours = new Set<string>();

async function chargerDistant(artisanId: string) {
  if (enCours.has(artisanId)) return;
  enCours.add(artisanId);
  try {
    const snap = await getDocs(query(collection(db(), "pros", artisanId, "realisations"), orderBy("creeLe", "desc")));
    distants[artisanId] = snap.docs.map((d) => versRealisation(d.id, d.data()));
    // nouvelle référence pour que useSyncExternalStore voie le changement
    cache = { ...lire() };
    abonnes.forEach((f) => f());
  } catch {
    /* hors ligne : on garde la liste du serveur */
  } finally {
    enCours.delete(artisanId);
  }
}

/** Réalisations d'un artisan : celles qu'il a publiées, sinon `initiales`. `null` côté serveur. */
export function useRealisations(artisanId: string, initiales: Realisation[]): Realisation[] | null {
  const etat = useSyncExternalStore(abonner, lire, () => null);
  if (!etat) return null;
  if (!estDemo(artisanId)) {
    if (!(artisanId in distants)) void chargerDistant(artisanId);
    return distants[artisanId] ?? initiales;
  }
  return etat[artisanId] ?? initiales;
}

/** Remplace la liste publiée d'un artisan de démonstration. false si le navigateur a refusé. */
export function enregistrerRealisations(artisanId: string, liste: Realisation[]): boolean {
  return ecrire({ ...lire(), [artisanId]: liste });
}

/** Envoie une photo (data: URL) dans le stockage public et renvoie son URL. */
async function envoyerPhoto(artisanId: string, dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith("data:")) return dataUrl;
  const blob = await (await fetch(dataUrl)).blob();
  const fichier = ref(stockage(), `realisations/${artisanId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`);
  await uploadBytes(fichier, blob, { contentType: "image/jpeg" });
  return getDownloadURL(fichier);
}

/** Publie une réalisation (en tête de liste). Renvoie un message d'erreur, ou null si c'est fait. */
export async function ajouterRealisation(artisanId: string, r: Realisation, actuelles: Realisation[]): Promise<string | null> {
  if (estDemo(artisanId))
    return enregistrerRealisations(artisanId, [r, ...actuelles])
      ? null
      : "Enregistrement impossible : trop de photos pour la démo. Retirez-en quelques-unes.";
  try {
    const photos = await Promise.all((r.photos?.length ? r.photos : [r.image]).map((p) => envoyerPhoto(artisanId, p)));
    await addDoc(collection(db(), "pros", artisanId, "realisations"), {
      titre: r.titre,
      type: r.type,
      quartier: r.quartier,
      description: r.description,
      materiaux: r.materiaux,
      duree: r.duree,
      date: r.date ?? null,
      photos,
      verifiee: false,
      creeLe: serverTimestamp(),
    });
    await chargerDistant(artisanId);
    return null;
  } catch (e) {
    return messageErreur(e);
  }
}

/** Retire une réalisation. Renvoie un message d'erreur, ou null. */
export async function retirerRealisation(artisanId: string, r: Realisation, actuelles: Realisation[]): Promise<string | null> {
  if (estDemo(artisanId)) {
    enregistrerRealisations(artisanId, actuelles.filter((x) => x !== r));
    return null;
  }
  try {
    if (r.id) await deleteDoc(doc(db(), "pros", artisanId, "realisations", r.id));
    // photos du stockage : retirées au mieux (une photo déjà absente n'empêche rien)
    await Promise.allSettled(
      (r.photos ?? []).filter((u) => u.startsWith("https://")).map((u) => deleteObject(ref(stockage(), u))),
    );
    await chargerDistant(artisanId);
    return null;
  } catch (e) {
    return messageErreur(e);
  }
}

/** Réduit une photo (1200 px de large au plus, JPEG) pour l'enregistrer dans la maquette. */
export function compresserPhoto(fichier: File, largeurMax = 1200): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(fichier);
    const img = new Image();
    img.onload = () => {
      const echelle = Math.min(1, largeurMax / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * echelle);
      canvas.height = Math.round(img.height * echelle);
      canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.72));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Photo illisible"));
    };
    img.src = url;
  });
}

/** Listes publiées par les artisans de démonstration depuis leur espace (fil de l'appli). `null` côté serveur. */
export function useRealisationsDemo(): Record<string, Realisation[]> | null {
  return useSyncExternalStore(abonner, lire, () => null);
}
