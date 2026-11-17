import {
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { artisans, boutiques, metierLabel } from "../data";
import { BACKEND_ACTIF } from "./actif";
import { db, estAdmin } from "./firebase";
import { lireLocal, modifierLocal } from "./local";
import {
  type AvisDoc,
  type ContactDoc,
  type Pro,
  type SignalementDoc,
  type StatutAvis,
  type StatutPro,
  type StatutTraitement,
  millis,
  versAvis,
  versContact,
  versPro,
  versSignalement,
} from "./modele";

/**
 * Backoffice /admin : tout ce que l'équipe contrôle.
 * Production : Firestore, autorisé par le jeton admin (firestore.rules). Maquette : navigateur.
 */

export type ProAdmin = Pro & { libelleMetier: string };
export type RealisationAdmin = {
  proId: string;
  proNom: string;
  id: string;
  titre: string;
  description: string;
  quartier: string;
  date: string;
  image: string | null;
  verifiee: boolean;
  creeLe: number;
};
export type CompteAdmin = { id: string; prenom: string; nom: string; telephone: string; ville: string; creeLe: number };

const MAX = 500;

// ——— Accès ———

export async function verifierAcces(): Promise<boolean> {
  if (!BACKEND_ACTIF) return true; // maquette : backoffice de démonstration
  return estAdmin();
}

// ——— Avis ———

export async function listerAvis(): Promise<AvisDoc[]> {
  if (!BACKEND_ACTIF) return lireLocal().avis;
  const snap = await getDocs(query(collection(db(), "avis"), orderBy("creeLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versAvis(d.id, d.data()));
}

export async function modererAvis(
  id: string,
  champs: { statut: StatutAvis; verifie: boolean; motifRefus: string | null },
): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, avis: b.avis.map((v) => (v.id === id ? { ...v, ...champs, modereLe: Date.now() } : v)) }));
    return;
  }
  await updateDoc(doc(db(), "avis", id), { ...champs, modereLe: serverTimestamp() });
}

export async function supprimerAvis(id: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, avis: b.avis.filter((v) => v.id !== id) }));
    return;
  }
  await deleteDoc(doc(db(), "avis", id));
}

// ——— Professionnels ———

/** Pros de démonstration (src/lib/data.ts), présentés comme ceux de la base. */
function prosDemo(): ProAdmin[] {
  const statuts = lireLocal().statutsPros;
  return [
    ...artisans.map((a) => ({
      id: a.id,
      type: "artisan" as const,
      nom: a.nom,
      metier: a.metier,
      ville: a.ville ?? "Brazzaville",
      quartier: a.quartier,
      zones: a.zones,
      adresse: null,
      description: a.description,
      numeroPublic: a.numeroPublic,
      telephonePublic: a.numeroPublic ? a.telephone : null,
      image: a.image ?? null,
      statut: statuts[a.id] ?? "verifie",
      creeLe: 0,
      libelleMetier: metierLabel(a.metier).artisan,
    })),
    ...boutiques.map((b) => ({
      id: b.id,
      type: "boutique" as const,
      nom: b.nom,
      metier: null,
      ville: b.ville,
      quartier: b.quartier,
      zones: [],
      adresse: b.adresse,
      description: "",
      numeroPublic: true,
      telephonePublic: b.telephone,
      image: b.image ?? null,
      statut: statuts[b.id] ?? "verifie",
      creeLe: 0,
      libelleMetier: "Quincaillerie",
    })),
  ];
}

export async function listerPros(): Promise<ProAdmin[]> {
  if (!BACKEND_ACTIF) return prosDemo();
  const snap = await getDocs(query(collection(db(), "pros"), orderBy("creeLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => {
    const p = versPro(d.id, d.data());
    return { ...p, libelleMetier: p.type === "boutique" ? "Boutique" : p.metier ? metierLabel(p.metier).artisan : "Artisan" };
  });
}

/** Numéro privé du pro (pour l'appeler avant de le vérifier). */
export async function telephonePrive(id: string): Promise<string | null> {
  if (!BACKEND_ACTIF) {
    return artisans.find((a) => a.id === id)?.telephone ?? boutiques.find((b) => b.id === id)?.telephone ?? null;
  }
  const snap = await getDoc(doc(db(), "pros", id, "prive", "contact"));
  return (snap.data()?.telephone as string | undefined) ?? null;
}

export async function changerStatutPro(id: string, statut: StatutPro): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, statutsPros: { ...b.statutsPros, [id]: statut } }));
    return;
  }
  await updateDoc(doc(db(), "pros", id), { statut });
}

// ——— Réalisations ———

export async function listerRealisations(): Promise<RealisationAdmin[]> {
  if (!BACKEND_ACTIF) {
    const verifiees = new Set(lireLocal().realisationsVerifiees);
    return artisans.flatMap((a) =>
      a.realisations.map((r, i) => ({
        proId: a.id,
        proNom: a.nom,
        id: String(i),
        titre: r.titre,
        description: r.description,
        quartier: r.quartier,
        date: r.date ?? "",
        image: r.image,
        verifiee: r.verifiee || verifiees.has(`${a.id}/${i}`),
        creeLe: 0,
      })),
    );
  }
  const snap = await getDocs(query(collectionGroup(db(), "realisations"), limit(MAX)));
  const noms = new Map<string, string>();
  const liste = await Promise.all(
    snap.docs.map(async (d) => {
      const proId = d.ref.parent.parent?.id ?? "";
      if (!noms.has(proId)) noms.set(proId, String((await getDoc(doc(db(), "pros", proId))).data()?.nom ?? proId));
      const r = d.data();
      const photos = (r.photos as string[] | undefined) ?? [];
      return {
        proId,
        proNom: noms.get(proId) ?? proId,
        id: d.id,
        titre: String(r.titre ?? ""),
        description: String(r.description ?? ""),
        quartier: String(r.quartier ?? ""),
        date: String(r.date ?? ""),
        image: photos[0] ?? null,
        verifiee: Boolean(r.verifiee),
        creeLe: millis(r.creeLe),
      };
    }),
  );
  return liste.sort((a, b) => b.creeLe - a.creeLe);
}

export async function verifierRealisation(proId: string, id: string, verifiee: boolean): Promise<void> {
  if (!BACKEND_ACTIF) {
    const cle = `${proId}/${id}`;
    modifierLocal((b) => ({
      ...b,
      realisationsVerifiees: verifiee ? [...new Set([...b.realisationsVerifiees, cle])] : b.realisationsVerifiees.filter((x) => x !== cle),
    }));
    return;
  }
  await updateDoc(doc(db(), "pros", proId, "realisations", id), { verifiee });
}

// ——— Messages de contact ———

export async function listerContacts(): Promise<ContactDoc[]> {
  if (!BACKEND_ACTIF) return lireLocal().contacts;
  const snap = await getDocs(query(collection(db(), "contacts"), orderBy("recuLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versContact(d.id, d.data()));
}

export async function traiterContact(id: string, statut: StatutTraitement): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, contacts: b.contacts.map((c) => (c.id === id ? { ...c, statut } : c)) }));
    return;
  }
  await updateDoc(doc(db(), "contacts", id), { statut });
}

// ——— Signalements ———

export async function listerSignalements(): Promise<SignalementDoc[]> {
  if (!BACKEND_ACTIF) return lireLocal().signalements;
  const snap = await getDocs(query(collection(db(), "signalements"), orderBy("creeLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versSignalement(d.id, d.data()));
}

export async function traiterSignalement(id: string, statut: StatutTraitement): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, signalements: b.signalements.map((s) => (s.id === id ? { ...s, statut } : s)) }));
    return;
  }
  await updateDoc(doc(db(), "signalements", id), { statut });
}

// ——— Clients ———

export async function listerComptes(): Promise<CompteAdmin[]> {
  if (!BACKEND_ACTIF) {
    try {
      const c = JSON.parse(localStorage.getItem("artico-compte") ?? "{}").compte;
      return c ? [{ id: "maquette", prenom: c.prenom ?? "", nom: c.nom ?? "", telephone: c.telephone ?? "", ville: c.ville ?? "", creeLe: c.creeLe ?? 0 }] : [];
    } catch {
      return [];
    }
  }
  const snap = await getDocs(query(collection(db(), "comptes"), orderBy("creeLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => {
    const c = d.data();
    return {
      id: d.id,
      prenom: String(c.prenom ?? ""),
      nom: String(c.nom ?? ""),
      telephone: String(c.telephone ?? ""),
      ville: String(c.ville ?? ""),
      creeLe: millis(c.creeLe),
    };
  });
}
