"use client";

import { useSyncExternalStore } from "react";
import { ARTISAN_DEMO_ID } from "./pro-data";
import { notifierNouveauMessage } from "./backend";
import { SUPABASE_ACTIF, estDemo, sb, verifier } from "./backend/supabase";
import { metierLabel } from "./data";
import { sessionActuelle, surSession } from "./session";

/**
 * Messagerie client ↔ artisan sur la plateforme.
 *  - Artisans inscrits (Supabase actif) : tables conversations et messages (RLS : chaque partie
 *    ne voit que ses échanges), temps réel pour l'arrivée des messages ; l'alerte WhatsApp/SMS
 *    part de la base (trigger → Edge Function « notifier »).
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

// ——— Supabase ———

type LigneConversation = {
  id: string;
  client_id: string;
  pro_id: string;
  lu_client: string;
  lu_pro: string;
  pro: { nom: string; metier: string | null; image: string | null; telephone_public: string | null; numero_public: boolean } | null;
  client: { prenom: string; telephone: string } | null;
  messages: { id: string; de: "client" | "pro"; texte: string; envoye_le: string }[];
};

let distantes: Conversation[] = [];
let combinees: Conversation[] | null = null;
let ecoute = false;

function versConversation(l: LigneConversation, moi: string): Conversation {
  const messages = [...l.messages]
    .sort((a, b) => a.envoye_le.localeCompare(b.envoye_le))
    .map((m) => ({ id: m.id, de: (m.de === "pro" ? "artisan" : "client") as Cote, texte: m.texte, date: Date.parse(m.envoye_le) }));
  return {
    id: l.id,
    moi: l.pro_id === moi ? "artisan" : "client",
    artisan: {
      id: l.pro_id,
      nom: l.pro?.nom ?? "Artisan",
      metier: l.pro?.metier ? metierLabel(l.pro.metier).artisan : "",
      image: l.pro?.image ?? undefined,
      telephone: l.pro?.telephone_public ?? "",
      numeroPublic: l.pro?.numero_public ?? false,
    },
    client: { prenom: l.client?.prenom ?? "Client", telephone: l.client?.telephone ?? "" },
    messages,
    lu: { client: Date.parse(l.lu_client), artisan: Date.parse(l.lu_pro) },
  };
}

const prevenir = () => {
  combinees = null;
  abonnes.forEach((f) => f());
};

async function chargerDistantes() {
  const s = sessionActuelle();
  if (!s) {
    distantes = [];
    return prevenir();
  }
  try {
    const lignes = verifier(
      await sb()
        .from("conversations")
        .select(
          "*, pro:pros(nom, metier, image, telephone_public, numero_public), client:comptes(prenom, telephone), messages(id, de, texte, envoye_le)",
        ),
    ) as LigneConversation[];
    distantes = lignes
      .map((l) => versConversation(l, s.id))
      .filter((c) => c.messages.length)
      .sort((a, b) => (b.messages.at(-1)?.date ?? 0) - (a.messages.at(-1)?.date ?? 0));
    prevenir();
  } catch {
    /* hors ligne : on garde les dernières conversations connues */
  }
}

let rechargement: ReturnType<typeof setTimeout> | null = null;
const rechargerBientot = () => {
  if (rechargement) clearTimeout(rechargement);
  rechargement = setTimeout(() => void chargerDistantes(), 150);
};

function ecouterSupabase() {
  if (ecoute || !SUPABASE_ACTIF || typeof window === "undefined") return;
  ecoute = true;
  let canal: ReturnType<ReturnType<typeof sb>["channel"]> | null = null;
  surSession(() => {
    void chargerDistantes();
    if (canal) void sb().removeChannel(canal);
    canal = sessionActuelle()
      ? sb()
          .channel("messagerie")
          .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, rechargerBientot)
          .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, rechargerBientot)
          .subscribe()
      : null;
  });
}

function toutes(): Conversation[] {
  combinees ??= [...distantes, ...lire()];
  return combinees;
}

const abonner = (f: () => void) => {
  ecouterSupabase();
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
    let id = conv.id && distantes.some((c) => c.id === conv.id) ? conv.id : undefined;
    if (!id) {
      const existante = distantes.find((c) => c.artisan.id === conv.artisan.id && c.moi === "client");
      id =
        existante?.id ??
        (
          verifier(
            await sb()
              .from("conversations")
              .upsert({ client_id: s.id, pro_id: conv.artisan.id }, { onConflict: "client_id,pro_id" })
              .select("id")
              .single(),
          ) as { id: string }
        ).id;
    }
    verifier(await sb().from("messages").insert({ conversation_id: id, de: de === "artisan" ? "pro" : "client", texte: texte.trim() }));
    await marquerLu(id, de);
    return chargerDistantes();
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
    await sb()
      .from("conversations")
      .update(cote === "client" ? { lu_client: new Date().toISOString() } : { lu_pro: new Date().toISOString() })
      .eq("id", id);
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
