import { cacheLife, cacheTag } from "next/cache";
import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { collection, doc, getDoc, getDocs, getFirestore, limit, orderBy, query, where } from "firebase/firestore/lite";
import { getMetier, metiers, type Artisan, type Avis, type Realisation } from "../data";
import { BACKEND_ACTIF, configFirebase } from "./actif";
import { type AvisDoc, type Pro, moisLisible, versAvis, versPro, versRealisation } from "./modele";

/**
 * Lectures publiques côté serveur (pros vérifiés et leurs réalisations), mises en cache
 * quelques minutes. Firestore « lite » (REST, sans compte) : les règles n'autorisent que les
 * profils vérifiés. Sans Firebase configuré, elles renvoient des listes vides : le site
 * n'affiche alors que les artisans de démonstration.
 * Invalidation immédiate possible avec revalidateTag("pros").
 */

const appServeur = (): FirebaseApp => getApps().find((a) => a.name === "serveur") ?? initializeApp(configFirebase, "serveur");
const db = () => getFirestore(appServeur());

/** Un pro vérifié de la base, présenté comme les artisans de la vitrine. */
function versArtisan(p: Pro, realisations: Realisation[] = []): Artisan {
  return {
    id: p.id,
    nom: p.nom,
    metier: p.metier && getMetier(p.metier) ? p.metier : metiers[0].id,
    ville: p.ville,
    quartier: p.quartier,
    zones: p.zones.length ? p.zones : [p.quartier],
    note: 0,
    nbAvis: 0,
    reponse: "Nouveau sur Artopif",
    disponible: "semaine",
    image: p.image ?? undefined,
    badges: ["Téléphone vérifié", "Identité vérifiée"],
    description: p.description,
    telephone: p.telephonePublic ?? "",
    numeroPublic: p.numeroPublic,
    realisations,
    avis: [],
  };
}

/** Artisans vérifiés inscrits sur la plateforme (sans leurs réalisations). */
export async function artisansInscrits(): Promise<Artisan[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pros");
  if (!BACKEND_ACTIF) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db(), "pros"),
        where("type", "==", "artisan"),
        where("statut", "==", "verifie"),
        orderBy("creeLe", "desc"),
        limit(500),
      ),
    );
    return snap.docs.map((d) => versArtisan(versPro(d.id, d.data())));
  } catch (e) {
    console.error("artisansInscrits", e);
    return [];
  }
}

/** Fiche complète d'un artisan inscrit (avec ses réalisations), ou null. */
export async function artisanInscrit(id: string): Promise<Artisan | null> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pros", `pro-${id}`);
  if (!BACKEND_ACTIF) return null;
  try {
    const snap = await getDoc(doc(db(), "pros", id));
    if (!snap.exists()) return null;
    const pro = versPro(snap.id, snap.data());
    if (pro.type !== "artisan" || pro.statut !== "verifie") return null;
    const reals = await getDocs(query(collection(db(), "pros", id, "realisations"), orderBy("creeLe", "desc")));
    const avis = await avisPublies(id);
    return {
      ...versArtisan(
        pro,
        reals.docs.map((r) => versRealisation(r.id, r.data())),
      ),
      ...resumeAvis(avis),
      avis,
    };
  } catch {
    return null; // inexistant ou non vérifié : refusé par les règles
  }
}

/**
 * Avis publiés (validés par l'équipe) sur un artisan ou un magasin, les plus récents d'abord.
 * Invalidation immédiate possible avec revalidateTag(`avis-${cibleId}`).
 */
export async function avisPublies(cibleId: string): Promise<Avis[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("avis", `avis-${cibleId}`);
  if (!BACKEND_ACTIF) return [];
  try {
    const snap = await getDocs(
      query(
        collection(db(), "avis"),
        where("cibleId", "==", cibleId),
        where("statut", "==", "publie"),
        orderBy("creeLe", "desc"),
        limit(100),
      ),
    );
    return snap.docs.map((d) => versAvisPublic(versAvis(d.id, d.data())));
  } catch (e) {
    console.error("avisPublies", e);
    return [];
  }
}

/** Avis de la base → avis affiché : seule une expérience confirmée par l'équipe porte le badge. */
function versAvisPublic(v: AvisDoc): Avis {
  return {
    id: v.id,
    auteur: v.auteur,
    note: Math.round(v.note),
    date: moisLisible(v.date, v.creeLe),
    texte: v.texte,
    experience: v.verifie ? (v.cibleType === "magasin" ? "achat" : "prestation") : undefined,
  };
}

/** Note moyenne et nombre d'avis à partir des avis publiés. */
export const resumeAvis = (avis: Avis[]) => ({
  note: avis.length ? Math.round((avis.reduce((s, v) => s + v.note, 0) / avis.length) * 10) / 10 : 0,
  nbAvis: avis.length,
});

/** Une réalisation du fil de l'application, avec son artisan. */
export type PublicationFil = { artisan: Artisan; realisation: Realisation; index: number; creeLe: number };

/**
 * Fil de l'application : dernières réalisations des artisans vérifiés inscrits
 * (les 5 plus récentes de chacun des 40 derniers inscrits), les plus récentes d'abord.
 */
export async function filRealisations(): Promise<PublicationFil[]> {
  "use cache";
  cacheLife("minutes");
  cacheTag("pros", "fil");
  if (!BACKEND_ACTIF) return [];
  try {
    const pros = (await artisansInscrits()).slice(0, 40);
    const parPro = await Promise.all(
      pros.map(async (artisan) => {
        const snap = await getDocs(
          query(collection(db(), "pros", artisan.id, "realisations"), orderBy("creeLe", "desc"), limit(5)),
        ).catch(() => null);
        return (snap?.docs ?? []).map((d, index) => ({
          artisan,
          realisation: versRealisation(d.id, d.data()),
          index,
          creeLe: (d.data().creeLe as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0,
        }));
      }),
    );
    return parPro.flat().sort((a, b) => b.creeLe - a.creeLe);
  } catch (e) {
    console.error("filRealisations", e);
    return [];
  }
}
