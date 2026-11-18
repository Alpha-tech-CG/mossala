import {
  addDoc,
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
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { artisans, boutiques, metierLabel } from "../data";
import { BACKEND_ACTIF } from "./actif";
import { auth, db, estAdmin, stockage } from "./firebase";
import { idLocal, lireLocal, modifierLocal } from "./local";
import {
  type AvisDoc,
  type ContactDoc,
  type DemandeAnnonceurDoc,
  type Emplacement,
  type EntreeJournal,
  type Pro,
  type PropositionMetierDoc,
  type PubDoc,
  type StatutProposition,
  type SignalementDoc,
  type StatutAvis,
  type StatutPro,
  type StatutTraitement,
  millis,
  versAvis,
  versContact,
  versDemandeAnnonceur,
  versEntreeJournal,
  versPro,
  versPropositionMetier,
  versPubDoc,
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

// ——— Journal : chaque action de l'équipe est tracée (ni modifiable ni supprimable) ———

/** Trace une action. Ne bloque jamais l'action elle-même si l'écriture du journal échoue. */
async function noter(action: string, cible: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({
      ...b,
      journal: [{ id: idLocal(), action, cible, auteurId: "maquette", auteur: "Maquette", date: Date.now() }, ...b.journal].slice(0, MAX),
    }));
    return;
  }
  const u = auth().currentUser;
  if (!u) return;
  try {
    await addDoc(collection(db(), "journal"), {
      action,
      cible: cible.slice(0, 200),
      auteurId: u.uid,
      auteur: u.phoneNumber ?? u.email ?? u.uid,
      date: serverTimestamp(),
    });
  } catch (e) {
    console.error("journal", e);
  }
}

export async function listerJournal(): Promise<EntreeJournal[]> {
  if (!BACKEND_ACTIF) return lireLocal().journal;
  const snap = await getDocs(query(collection(db(), "journal"), orderBy("date", "desc"), limit(MAX)));
  return snap.docs.map((d) => versEntreeJournal(d.id, d.data()));
}

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
  action: string,
  libelle: string,
): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, avis: b.avis.map((v) => (v.id === id ? { ...v, ...champs, modereLe: Date.now() } : v)) }));
  } else {
    await updateDoc(doc(db(), "avis", id), { ...champs, modereLe: serverTimestamp() });
  }
  await noter(action, champs.motifRefus && champs.statut === "refuse" ? `${libelle} (motif : ${champs.motifRefus})` : libelle);
}

export async function supprimerAvis(id: string, libelle: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, avis: b.avis.filter((v) => v.id !== id) }));
  } else {
    await deleteDoc(doc(db(), "avis", id));
  }
  await noter("Avis supprimé", libelle);
}

// ——— Professionnels ———

/** Pros de démonstration (src/lib/data.ts), présentés comme ceux de la base. */
function prosDemo(): ProAdmin[] {
  const { statutsPros: statuts, datesPros } = lireLocal();
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
      creeLe: datesPros[a.id] ?? 0,
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
      creeLe: datesPros[b.id] ?? 0,
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

const ACTIONS_PRO: Record<StatutPro, string> = {
  verifie: "Pro vérifié",
  suspendu: "Pro suspendu",
  en_verification: "Pro remis en vérification",
};

export async function changerStatutPro(id: string, statut: StatutPro, nom: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, statutsPros: { ...b.statutsPros, [id]: statut } }));
  } else {
    await updateDoc(doc(db(), "pros", id), { statut });
  }
  await noter(ACTIONS_PRO[statut], nom);
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

export async function verifierRealisation(proId: string, id: string, verifiee: boolean, libelle: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    const cle = `${proId}/${id}`;
    modifierLocal((b) => ({
      ...b,
      realisationsVerifiees: verifiee ? [...new Set([...b.realisationsVerifiees, cle])] : b.realisationsVerifiees.filter((x) => x !== cle),
    }));
  } else {
    await updateDoc(doc(db(), "pros", proId, "realisations", id), { verifiee });
  }
  await noter(verifiee ? "Réalisation vérifiée" : "Vérification de réalisation retirée", libelle);
}

// ——— Messages de contact ———

export async function listerContacts(): Promise<ContactDoc[]> {
  if (!BACKEND_ACTIF) return lireLocal().contacts;
  const snap = await getDocs(query(collection(db(), "contacts"), orderBy("recuLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versContact(d.id, d.data()));
}

export async function traiterContact(id: string, statut: StatutTraitement, libelle: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, contacts: b.contacts.map((c) => (c.id === id ? { ...c, statut } : c)) }));
  } else {
    await updateDoc(doc(db(), "contacts", id), { statut });
  }
  await noter(statut === "traite" ? "Message traité" : "Message rouvert", libelle);
}

// ——— Signalements ———

export async function listerSignalements(): Promise<SignalementDoc[]> {
  if (!BACKEND_ACTIF) return lireLocal().signalements;
  const snap = await getDocs(query(collection(db(), "signalements"), orderBy("creeLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versSignalement(d.id, d.data()));
}

export async function traiterSignalement(id: string, statut: StatutTraitement, libelle: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, signalements: b.signalements.map((s) => (s.id === id ? { ...s, statut } : s)) }));
  } else {
    await updateDoc(doc(db(), "signalements", id), { statut });
  }
  await noter(statut === "traite" ? "Signalement traité" : "Signalement rouvert", libelle);
}

// ——— Demandes annonceurs ———

export async function listerDemandesAnnonceurs(): Promise<DemandeAnnonceurDoc[]> {
  if (!BACKEND_ACTIF) return lireLocal().demandesAnnonceurs;
  const snap = await getDocs(query(collection(db(), "demandesAnnonceurs"), orderBy("recuLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versDemandeAnnonceur(d.id, d.data()));
}

export async function traiterDemandeAnnonceur(id: string, statut: StatutTraitement, libelle: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, demandesAnnonceurs: b.demandesAnnonceurs.map((d) => (d.id === id ? { ...d, statut } : d)) }));
  } else {
    await updateDoc(doc(db(), "demandesAnnonceurs", id), { statut });
  }
  await noter(statut === "traite" ? "Demande annonceur traitée" : "Demande annonceur rouverte", libelle);
}

// ——— Métiers proposés ———

export async function listerPropositionsMetiers(): Promise<PropositionMetierDoc[]> {
  if (!BACKEND_ACTIF) return lireLocal().propositionsMetiers;
  const snap = await getDocs(query(collection(db(), "propositionsMetiers"), orderBy("recuLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versPropositionMetier(d.id, d.data()));
}

const ACTIONS_PROPOSITION: Record<StatutProposition, string> = {
  accepte: "Métier proposé accepté",
  refuse: "Métier proposé refusé",
  nouveau: "Métier proposé remis à l’étude",
};

export async function deciderPropositionMetier(id: string, statut: StatutProposition, nom: string): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, propositionsMetiers: b.propositionsMetiers.map((p) => (p.id === id ? { ...p, statut } : p)) }));
  } else {
    await updateDoc(doc(db(), "propositionsMetiers", id), { statut });
  }
  await noter(ACTIONS_PROPOSITION[statut], nom);
}

// ——— Publicités : campagnes créées par l'équipe ———

export async function listerPublicites(): Promise<PubDoc[]> {
  if (!BACKEND_ACTIF) return [...lireLocal().publicites].sort((a, b) => b.creeLe - a.creeLe);
  const snap = await getDocs(query(collection(db(), "publicites"), orderBy("creeLe", "desc"), limit(MAX)));
  return snap.docs.map((d) => versPubDoc(d.id, d.data()));
}

/** Contenu d'une campagne saisi dans le formulaire. */
export type CampagnePub = Omit<PubDoc, "id" | "creeLe" | "modifieLe">;

const pourBase = (c: CampagnePub) => ({
  ...c,
  poster: c.poster || null,
  texte: c.texte || null,
  debut: c.debut || null,
  fin: c.fin || null,
});
const libellePub = (c: Pick<PubDoc, "annonceur" | "titre">) => `${c.annonceur} · ${c.titre}`;

export async function creerPublicite(c: CampagnePub): Promise<void> {
  if (!BACKEND_ACTIF) {
    const maintenant = Date.now();
    modifierLocal((b) => ({ ...b, publicites: [{ ...c, id: idLocal(), creeLe: maintenant, modifieLe: maintenant }, ...b.publicites] }));
  } else {
    await addDoc(collection(db(), "publicites"), { ...pourBase(c), creeLe: serverTimestamp(), modifieLe: serverTimestamp() });
  }
  await noter("Publicité créée", libellePub(c));
}

export async function modifierPublicite(id: string, c: CampagnePub): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, publicites: b.publicites.map((p) => (p.id === id ? { ...p, ...c, modifieLe: Date.now() } : p)) }));
  } else {
    await updateDoc(doc(db(), "publicites", id), { ...pourBase(c), modifieLe: serverTimestamp() });
  }
  await noter("Publicité modifiée", libellePub(c));
}

export async function changerStatutPublicite(p: PubDoc, statut: PubDoc["statut"]): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, publicites: b.publicites.map((x) => (x.id === p.id ? { ...x, statut, modifieLe: Date.now() } : x)) }));
  } else {
    await updateDoc(doc(db(), "publicites", p.id), { statut, modifieLe: serverTimestamp() });
  }
  await noter(statut === "suspendue" ? "Publicité suspendue" : "Publicité réactivée", libellePub(p));
}

export async function supprimerPublicite(p: PubDoc): Promise<void> {
  if (!BACKEND_ACTIF) {
    modifierLocal((b) => ({ ...b, publicites: b.publicites.filter((x) => x.id !== p.id) }));
  } else {
    await deleteDoc(doc(db(), "publicites", p.id));
  }
  await noter("Publicité supprimée", libellePub(p));
}

/** Envoie une image ou une vidéo dans le Storage (publicites/…) et renvoie son adresse publique. */
export async function envoyerFichierPub(emplacement: Emplacement, fichier: File): Promise<string> {
  if (!BACKEND_ACTIF) throw new Error("En maquette, collez l’adresse d’une image (ex. /images/ciment.jpg).");
  const ext = fichier.name.split(".").pop()?.toLowerCase() || "bin";
  const r = ref(stockage(), `publicites/${emplacement}-${Date.now()}.${ext}`);
  await uploadBytes(r, fichier, { contentType: fichier.type });
  return getDownloadURL(r);
}

// ——— Clients ———

export async function listerComptes(): Promise<CompteAdmin[]> {
  if (!BACKEND_ACTIF) {
    let moi: CompteAdmin[] = [];
    try {
      const c = JSON.parse(localStorage.getItem("artico-compte") ?? "{}").compte;
      if (c) moi = [{ id: "maquette", prenom: c.prenom ?? "", nom: c.nom ?? "", telephone: c.telephone ?? "", ville: c.ville ?? "", creeLe: c.creeLe ?? 0 }];
    } catch {
      /* ignoré */
    }
    return [...moi, ...lireLocal().comptes];
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
