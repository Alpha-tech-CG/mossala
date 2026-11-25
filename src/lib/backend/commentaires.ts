import { addDoc, collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import { sessionActuelle } from "../session";
import { BACKEND_ACTIF, estDemo } from "./actif";
import { db } from "./firebase";
import { idLocal, lireLocal, modifierLocal } from "./local";
import { type CommentaireDoc, cibleRealisation, versCommentaire } from "./modele";

/**
 * Commentaires publics sous une réalisation (fil façon réseau social).
 * Publiés aussitôt (pas de modération a priori) ; l'équipe peut masquer, chacun signale.
 * Les professionnels de démonstration (src/lib/data.ts) restent dans le navigateur, même en
 * production — comme les avis — car ils n'existent pas dans la base.
 */

export type NouveauCommentaire = {
  proId: string;
  realisationId: string;
  texte: string;
  /** null = commentaire racine ; sinon id du commentaire auquel on répond */
  parentId: string | null;
  /** nom affiché de l'auteur (« Grâce N. ») */
  auteurNom: string;
};

const local = (proId: string) => !BACKEND_ACTIF || estDemo(proId);

/** Commentaires visibles d'une réalisation, les plus anciens d'abord. */
export async function lireCommentaires(proId: string, realisationId: string): Promise<CommentaireDoc[]> {
  const cibleId = cibleRealisation(proId, realisationId);
  if (local(proId)) {
    return lireLocal()
      .commentaires.filter((c) => c.cibleId === cibleId && c.statut === "visible")
      .sort((a, b) => a.creeLe - b.creeLe);
  }
  const snap = await getDocs(
    query(
      collection(db(), "commentaires"),
      where("cibleId", "==", cibleId),
      where("statut", "==", "visible"),
      orderBy("creeLe", "asc"),
      limit(300),
    ),
  );
  return snap.docs.map((d) => versCommentaire(d.id, d.data()));
}

/** Publie un commentaire (ou une réponse) : visible immédiatement. */
export async function publierCommentaire(n: NouveauCommentaire): Promise<void> {
  const texte = n.texte.trim();
  if (!texte) return;
  const cibleId = cibleRealisation(n.proId, n.realisationId);
  const session = sessionActuelle();

  if (local(n.proId)) {
    const commentaire: CommentaireDoc = {
      id: idLocal(),
      cibleId,
      proId: n.proId,
      realisationId: n.realisationId,
      auteurId: session?.id ?? "maquette",
      auteurNom: n.auteurNom,
      estPro: Boolean(session && session.id === n.proId),
      parentId: n.parentId,
      texte,
      statut: "visible",
      creeLe: Date.now(),
    };
    modifierLocal((b) => ({ ...b, commentaires: [...b.commentaires, commentaire] }));
    return;
  }

  if (!session) throw Object.assign(new Error("non connecté"), { code: "permission-denied" });
  await addDoc(collection(db(), "commentaires"), {
    cibleId,
    proId: n.proId,
    realisationId: n.realisationId,
    auteurId: session.id,
    auteurNom: n.auteurNom,
    estPro: session.id === n.proId,
    parentId: n.parentId,
    texte,
    statut: "visible",
    creeLe: serverTimestamp(),
  });
}

/** L'auteur retire son propre commentaire (et, en maquette, ses réponses). */
export async function retirerCommentaire(c: CommentaireDoc): Promise<void> {
  if (local(c.proId)) {
    modifierLocal((b) => ({ ...b, commentaires: b.commentaires.filter((x) => x.id !== c.id && x.parentId !== c.id) }));
    return;
  }
  await deleteDoc(doc(db(), "commentaires", c.id));
}

/** Peut-on retirer ce commentaire (son auteur) ? */
export function estMonCommentaire(c: CommentaireDoc): boolean {
  if (!BACKEND_ACTIF) return c.auteurId === "maquette";
  return c.auteurId === (sessionActuelle()?.id ?? "");
}
