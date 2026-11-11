"use client";

import { useSyncExternalStore } from "react";
import { ARTISAN_DEMO_ID } from "./pro-data";
import { notifierNouveauMessage } from "./backend";

/**
 * Messagerie client ↔ artisan sur la plateforme.
 * MAQUETTE : les conversations sont gardées dans le navigateur. Avec Supabase : tables
 * conversations et messages (RLS : chaque partie ne voit que ses échanges), Realtime pour
 * l'arrivée des messages, et une notification WhatsApp/SMS à l'artisan à chaque nouveau message.
 */

export type Cote = "client" | "artisan";

export type Message = { id: string; de: Cote; texte: string; date: number };

export type Conversation = {
  /** une conversation par artisan pour un client */
  id: string;
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
    abonnes.forEach((f) => f());
  });
}

const abonner = (f: () => void) => {
  abonnes.add(f);
  return () => abonnes.delete(f);
};

const nouvelId = () => Math.random().toString(36).slice(2, 10);

export function envoyerMessage(
  conv: Pick<Conversation, "artisan" | "client">,
  de: Cote,
  texte: string,
) {
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
  return maj;
}

export function marquerLu(id: string, cote: Cote) {
  const liste = lire();
  const c = liste.find((x) => x.id === id);
  if (!c) return;
  const dernier = c.messages[c.messages.length - 1]?.date ?? 0;
  if (c.lu[cote] >= dernier) return;
  ecrire(liste.map((x) => (x.id === id ? { ...x, lu: { ...x.lu, [cote]: dernier } } : x)));
}

export const nonLus = (c: Conversation, cote: Cote) =>
  c.messages.filter((m) => m.de !== cote && m.date > c.lu[cote]).length;

/** Conversations vues par le client (toutes) ou par un artisan (les siennes). */
export function useConversations(artisanId?: string): Conversation[] | null {
  const toutes = useSyncExternalStore(abonner, lire, () => null);
  if (!toutes) return null;
  return artisanId ? toutes.filter((c) => c.artisan.id === artisanId) : toutes;
}

