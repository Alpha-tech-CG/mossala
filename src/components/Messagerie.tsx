"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MessagesSquare, Phone, Send } from "lucide-react";
import {
  envoyerMessage,
  marquerLu,
  nonLus,
  useConversations,
  type Conversation,
  type Cote,
} from "@/lib/messagerie";

const heure = (t: number) => {
  const d = new Date(t);
  const auj = new Date();
  return d.toDateString() === auj.toDateString()
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

/** Nom, photo et sous-titre de l'interlocuteur selon le côté qui lit. */
function interlocuteur(c: Conversation, cote: Cote) {
  return cote === "client"
    ? { nom: c.artisan.nom, image: c.artisan.image, sous: c.artisan.metier }
    : { nom: c.client.prenom, image: undefined, sous: c.client.telephone };
}

function Avatar({ nom, image, size = 44 }: { nom: string; image?: string; size?: number }) {
  return image ? (
    <Image src={image} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />
  ) : (
    <span
      className="flex shrink-0 items-center justify-center rounded-full bg-primary font-serif text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {nom[0]}
    </span>
  );
}

/**
 * Boîte de réception : liste des conversations + fil ouvert (?c=id).
 * Sur mobile, on voit l'une ou l'autre ; sur grand écran, les deux côte à côte.
 */
export function BoiteMessages({ cote, artisanId, vide }: { cote: Cote; artisanId?: string; vide?: React.ReactNode }) {
  const conversations = useConversations(artisanId);
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const ouverte = conversations?.find((c) => c.id === sp.get("c"));
  const ouvrir = (id?: string) => router.replace(id ? `${path}?c=${id}` : path, { scroll: false });

  if (!conversations) return <div className="mt-6 h-96 animate-pulse rounded-2xl bg-card" aria-busy />;
  if (!conversations.length) return <>{vide}</>;

  return (
    <div className="mt-6 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.04] md:grid md:h-[min(70vh,640px)] md:grid-cols-[300px_minmax(0,1fr)]">
      <ul className={`divide-y divide-border overflow-y-auto md:border-r md:border-border ${ouverte ? "hidden md:block" : ""}`}>
        {conversations.map((c) => {
          const qui = interlocuteur(c, cote);
          const dernier = c.messages[c.messages.length - 1];
          const n = nonLus(c, cote);
          return (
            <li key={c.id}>
              <button
                onClick={() => ouvrir(c.id)}
                aria-current={ouverte?.id === c.id}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-secondary/50 ${
                  ouverte?.id === c.id ? "bg-secondary/70" : ""
                }`}
              >
                <Avatar nom={qui.nom} image={qui.image} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className={`truncate ${n ? "font-bold" : "font-semibold"}`}>{qui.nom}</span>
                    <span className="shrink-0 text-[11px] text-muted-foreground">{heure(dernier.date)}</span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className={`truncate text-sm ${n ? "text-foreground" : "text-muted-foreground"}`}>
                      {dernier.de === cote ? "Vous : " : ""}
                      {dernier.texte}
                    </span>
                    {n > 0 && (
                      <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-accent-foreground">
                        {n}
                      </span>
                    )}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {ouverte ? (
        <Fil conv={ouverte} cote={cote} onRetour={() => ouvrir()} />
      ) : (
        <div className="hidden flex-col items-center justify-center gap-2 p-8 text-center text-muted-foreground md:flex">
          <MessagesSquare className="size-10" />
          <p className="text-sm">Choisissez une conversation</p>
        </div>
      )}
    </div>
  );
}

/** Fil d'une conversation, avec la zone de saisie. */
function Fil({ conv, cote, onRetour }: { conv: Conversation; cote: Cote; onRetour: () => void }) {
  const qui = interlocuteur(conv, cote);
  const [texte, setTexte] = useState("");
  const bas = useRef<HTMLDivElement>(null);
  const nb = conv.messages.length;

  // Ouvrir le fil marque les messages comme lus et descend au dernier message.
  useEffect(() => {
    marquerLu(conv.id, cote);
    bas.current?.scrollIntoView({ block: "end" });
  }, [conv.id, cote, nb]);

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texte.trim()) return;
    envoyerMessage(conv, cote, texte);
    setTexte("");
  };

  const tel = cote === "client" ? (conv.artisan.numeroPublic ? conv.artisan.telephone : null) : conv.client.telephone;

  return (
    <section aria-label={`Conversation avec ${qui.nom}`} className="flex h-[75vh] flex-col md:h-full">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button onClick={onRetour} aria-label="Retour aux conversations" className="-ml-1 flex size-9 items-center justify-center rounded-full md:hidden">
          <ArrowLeft className="size-5" />
        </button>
        <Avatar nom={qui.nom} image={qui.image} size={40} />
        <div className="min-w-0 flex-1">
          {cote === "client" ? (
            <Link href={`/artisans/${conv.artisan.id}`} className="block truncate font-bold hover:underline">
              {qui.nom}
            </Link>
          ) : (
            <p className="truncate font-bold">{qui.nom}</p>
          )}
          <p className="truncate text-xs text-muted-foreground">{qui.sous}</p>
        </div>
        {tel && (
          <a
            href={`tel:${tel.replace(/\s/g, "")}`}
            aria-label={`Appeler ${qui.nom}`}
            className="flex size-10 items-center justify-center rounded-full bg-accent text-accent-foreground"
          >
            <Phone className="size-4" />
          </a>
        )}
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto bg-background/60 px-4 py-4">
        {conv.messages.map((m) => {
          const moi = m.de === cote;
          return (
            <div key={m.id} className={`flex ${moi ? "justify-end" : "justify-start"}`}>
              <p
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm leading-snug whitespace-pre-wrap shadow-sm ${
                  moi ? "rounded-br-md bg-primary text-white" : "rounded-bl-md bg-card ring-1 ring-black/[0.04]"
                }`}
              >
                {m.texte}
                <span className={`mt-0.5 block text-right text-[10px] ${moi ? "text-white/70" : "text-muted-foreground"}`}>
                  {heure(m.date)}
                </span>
              </p>
            </div>
          );
        })}
        <div ref={bas} />
      </div>

      <form onSubmit={envoyer} className="flex items-end gap-2 border-t border-border p-3">
        <label htmlFor={`msg-${conv.id}`} className="sr-only">
          Votre message
        </label>
        <textarea
          id={`msg-${conv.id}`}
          rows={1}
          maxLength={1000}
          value={texte}
          onChange={(e) => setTexte(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              envoyer(e);
            }
          }}
          placeholder="Écrire un message…"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-border bg-white px-4 py-2.5 text-base outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          type="submit"
          disabled={!texte.trim()}
          aria-label="Envoyer"
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground disabled:opacity-50"
        >
          <Send className="size-5" />
        </button>
      </form>
    </section>
  );
}
