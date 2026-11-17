"use client";

import { useSyncExternalStore } from "react";
import { ARTISAN_DEMO_ID } from "./pro-data";
import { notifierNouveauMessage } from "./backend";
import {
  type Timestamp,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { BACKEND_ACTIF, estDemo } from "./backend/actif";
import { db } from "./backend/firebase";
import { proPublic } from "./backend/pros";
import { getMetier, metierLabel } from "./data";
import { sessionActuelle, surSession } from "./session";

/**
 * Messagerie client ↔ artisan sur la plateforme.
 *  - Artisans inscrits (production) : Firestore conversations et messages (règles : chaque
 *    partie ne voit que ses échanges), en temps réel ; l'alerte WhatsApp/SMS part d'une
 *    Cloud Function déclenchée par chaque nouveau message.
 *  - Artisans de démonstration (ou maquette) : conversations gardées dans le navigateur.
 */

export type Cote = "client" | "artisan";

export type Message = { id: string; de: Cote; texte: string; date: number };

export type Conversation = {
  /** maquette : l'id de l'artisan (une conversation par artisan) ; base : l'id de la conversation */
  id: string;
  /** conversation enregistrée en base : le côté de l'utilisateur connecté */
  moi?: Cote;
  artisan: { id: string; nom: string; metier: string; image?: string; telephone: string; numeroPublic: boolean };
  client: { prenom: string; telephone: string };
  messages: Message[];
  /** date du dernier message lu par chaque partie */
  lu: Record<Cote, number>;
};

const CLE = "artico-messages";

let cache: Conversation[] | null = null;
const abonnes = new Set<() => void>();

function lire(): Conversation[] {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(CLE) ?? "[]") as Conversation[];
  } catch {
    cache = [];
  }
  return cache;
}

function ecrire(c: Conversation[]) {
  cache = c;
  combinees = null;
  try {
    localStorage.setItem(CLE, JSON.stringify(c));
  } catch {
    /* ignoré */
  }
  abonnes.forEach((f) => f());
}

// Un autre onglet (ex. l'espace pro ouvert à côté) écrit dans la messagerie : on se met à jour.
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key !== CLE) return;
    cache = null;
    combinees = null;
    abonnes.forEach((f) => f());
  });
}

// ——— Production (Firestore) ———
// conversations/{clientUid_proUid} et messages/{id} (avec conversationId et participants),
// suivis en temps réel. L'alerte WhatsApp/SMS part de la Cloud Function « alerteMessage ».

type DocConversation = {
  clientId: string;
  proId: string;
  participants: string[];
  client: { prenom: string; telephone: string };
  pro: { nom: string; metier: string | null; image: string | null; telephonePublic: string | null; numeroPublic: boolean };
  luClient: Timestamp | null;
  luPro: Timestamp | null;
};

type DocMessage = { conversationId: string; de: "client" | "pro"; texte: string; envoyeLe: Timestamp | null };

let docsConversations = new Map<string, DocConversation>();
let docsMessages = new Map<string, DocMessage & { id: string }>();
let distantes: Conversation[] = [];
let combinees: Conversation[] | null = null;
let ecoute = false;

const libelleMetier = (m: string | null) => (m && getMetier(m) ? metierLabel(m).artisan : (m ?? ""));

function versConversation(id: string, l: DocConversation, messages: (DocMessage & { id: string })[], moi: string): Conversation {
  return {
    id,
    moi: l.proId === moi ? "artisan" : "client",
    artisan: {
      id: l.proId,
      nom: l.pro?.nom ?? "Artisan",
      metier: libelleMetier(l.pro?.metier ?? null),
      image: l.pro?.image ?? undefined,
      telephone: l.pro?.telephonePublic ?? "",
      numeroPublic: l.pro?.numeroPublic ?? false,
    },
    client: { prenom: l.client?.prenom ?? "Client", telephone: l.client?.telephone ?? "" },
    messages: messages
      .map((m) => ({ id: m.id, de: (m.de === "pro" ? "artisan" : "client") as Cote, texte: m.texte, date: m.envoyeLe?.toMillis() ?? Date.now() }))
      .sort((x, y) => x.date - y.date),
    lu: { client: l.luClient?.toMillis() ?? 0, artisan: l.luPro?.toMillis() ?? 0 },
  };
}

const prevenir = () => {
  combinees = null;
  abonnes.forEach((f) => f());
};

function recalculer() {
  const s = sessionActuelle();
  if (!s) {
    distantes = [];
    return prevenir();
  }
  const parConv = new Map<string, (DocMessage & { id: string })[]>();
  for (const m of docsMessages.values()) parConv.set(m.conversationId, [...(parConv.get(m.conversationId) ?? []), m]);
  distantes = [...docsConversations]
    .map(([id, c]) => versConversation(id, c, parConv.get(id) ?? [], s.id))
    .filter((c) => c.messages.length)
    .sort((a, b) => (b.messages.at(-1)?.date ?? 0) - (a.messages.at(-1)?.date ?? 0));
  prevenir();
}

function ecouterBase() {
  if (ecoute || !BACKEND_ACTIF || typeof window === "undefined") return;
  ecoute = true;
  let arreter: (() => void)[] = [];
  surSession(() => {
    arreter.forEach((f) => f());
    arreter = [];
    docsConversations = new Map();
    docsMessages = new Map();
    const s = sessionActuelle();
    if (!s) return recalculer();
    const lecture = { serverTimestamps: "estimate" } as const;
    arreter = [
      onSnapshot(
        query(collection(db(), "conversations"), where("participants", "array-contains", s.id)),
        (snap) => {
          docsConversations = new Map(snap.docs.map((d) => [d.id, d.data(lecture) as DocConversation]));
          recalculer();
        },
        () => {
          /* hors ligne ou refusé : on garde les dernières conversations connues */
        },
      ),
      onSnapshot(
        query(collection(db(), "messages"), where("participants", "array-contains", s.id)),
        (snap) => {
          docsMessages = new Map(snap.docs.map((d) => [d.id, { id: d.id, ...(d.data(lecture) as DocMessage) }]));
          recalculer();
        },
        () => {},
      ),
    ];
  });
}

function toutes(): Conversation[] {
  combinees ??= [...distantes, ...lire()];
  return combinees;
}

const abonner = (f: () => void) => {
  ecouterBase();
  abonnes.add(f);
  return () => abonnes.delete(f);
};

const nouvelId = () => Math.random().toString(36).slice(2, 10);

// ——— Actions ———

/** Envoie un message. Base : la conversation est créée au premier message du client. */
export async function envoyerMessage(conv: Pick<Conversation, "artisan" | "client"> & { id?: string }, de: Cote, texte: string): Promise<void> {
  if (!estDemo(conv.artisan.id)) {
    const s = sessionActuelle();
    if (!s) throw new Error("Connectez-vous pour écrire à cet artisan.");
    const base = db();
    let id = conv.id && docsConversations.has(conv.id) ? conv.id : undefined;
    if (!id) {
      // une conversation par couple client / pro : identifiant déterministe
      id = `${s.id}_${conv.artisan.id}`;
      const ref = doc(base, "conversations", id);
      if (!docsConversations.has(id) && !(await getDoc(ref)).exists()) {
        const pro = await proPublic(conv.artisan.id);
        if (!pro) throw new Error("Cet artisan n’est pas encore disponible.");
        await setDoc(ref, {
          clientId: s.id,
          proId: pro.id,
          participants: [s.id, pro.id],
          client: { prenom: conv.client.prenom, telephone: conv.client.telephone },
          pro: { nom: pro.nom, metier: pro.metier, image: pro.image, telephonePublic: pro.telephonePublic, numeroPublic: pro.numeroPublic },
          luClient: null,
          luPro: null,
          creeLe: serverTimestamp(),
        });
      }
    }
    const participants = docsConversations.get(id)?.participants ?? [s.id, conv.artisan.id];
    const lot = writeBatch(base);
    lot.set(doc(collection(base, "messages")), {
      conversationId: id,
      participants,
      de: de === "artisan" ? "pro" : "client",
      texte: texte.trim(),
      envoyeLe: serverTimestamp(),
    });
    lot.update(doc(base, "conversations", id), de === "client" ? { luClient: serverTimestamp() } : { luPro: serverTimestamp() });
    await lot.commit();
    return;
  }

  const maintenant = Date.now();
  const msg: Message = { id: nouvelId(), de, texte: texte.trim(), date: maintenant };
  const liste = lire();
  const existante = liste.find((c) => c.id === conv.artisan.id);
  const maj: Conversation = existante
    ? { ...existante, client: conv.client, messages: [...existante.messages, msg], lu: { ...existante.lu, [de]: maintenant } }
    : { id: conv.artisan.id, artisan: conv.artisan, client: conv.client, messages: [msg], lu: { client: 0, artisan: 0, [de]: maintenant } };
  ecrire([maj, ...liste.filter((c) => c.id !== maj.id)]);

  // Prévenir le destinataire par WhatsApp/SMS (le côté opposé à l'expéditeur).
  // MAQUETTE : notifierNouveauMessage ne fait rien ; c'est le point de branchement du backend.
  const dest =
    de === "client"
      ? { nom: maj.artisan.nom, telephones: [{ numero: maj.artisan.telephone, whatsapp: true }] }
      : { nom: maj.client.prenom, telephones: [{ numero: maj.client.telephone, whatsapp: true }] };
  void notifierNouveauMessage({
    conversationId: maj.id,
    de,
    texte: msg.texte,
    expediteur: de === "client" ? maj.client.prenom : maj.artisan.nom.split(" ")[0],
    destinataire: dest,
  });

  // MAQUETTE : sans backend, les artisans de démo (sauf celui de l'espace pro) répondent tout seuls
  // au premier message, pour que l'on puisse voir une conversation vivante.
  if (de === "client" && !existante && conv.artisan.id !== ARTISAN_DEMO_ID) {
    const prenomArtisan = conv.artisan.nom.split(" ")[0];
    setTimeout(() => {
      const c = lire().find((x) => x.id === conv.artisan.id);
      if (!c) return;
      const reponse: Message = {
        id: nouvelId(),
        de: "artisan",
        texte: `Bonjour ${conv.client.prenom}, c’est ${prenomArtisan}. Bien reçu, merci ! Pouvez-vous me dire quand je peux passer voir le travail ?`,
        date: Date.now(),
      };
      ecrire([{ ...c, messages: [...c.messages, reponse] }, ...lire().filter((x) => x.id !== c.id)]);
    }, 2500);
  }
}

export async function marquerLu(id: string, cote: Cote): Promise<void> {
  const distante = distantes.find((x) => x.id === id);
  if (distante) {
    const dernier = distante.messages.at(-1)?.date ?? 0;
    if (distante.lu[cote] >= dernier && dernier) return;
    // mise à jour immédiate à l'écran, puis dans la base
    distantes = distantes.map((x) => (x.id === id ? { ...x, lu: { ...x.lu, [cote]: Date.now() } } : x));
    prevenir();
    await updateDoc(doc(db(), "conversations", id), cote === "client" ? { luClient: serverTimestamp() } : { luPro: serverTimestamp() });
    return;
  }
  const liste = lire();
  const c = liste.find((x) => x.id === id);
  if (!c) return;
  const dernier = c.messages[c.messages.length - 1]?.date ?? 0;
  if (c.lu[cote] >= dernier) return;
  ecrire(liste.map((x) => (x.id === id ? { ...x, lu: { ...x.lu, [cote]: dernier } } : x)));
}

export const nonLus = (c: Conversation, cote: Cote) =>
  c.messages.filter((m) => m.de !== cote && m.date > c.lu[cote]).length;

/** Conversations vues par le client (les siennes) ou par un artisan (celles qu'il a reçues). */
export function useConversations(artisanId?: string): Conversation[] | null {
  const liste = useSyncExternalStore(abonner, toutes, () => null);
  if (!liste) return null;
  return artisanId ? liste.filter((c) => c.artisan.id === artisanId) : liste.filter((c) => c.moi !== "artisan");
}
