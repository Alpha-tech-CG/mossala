"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { type MessageContact, SUJETS_CONTACT, envoyerMessageContact, messageErreur } from "@/lib/backend";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

const MESSAGE_MIN = 10;
const MESSAGE_MAX = 2000;

export function FormulaireContact() {
  const [etat, setEtat] = useState<"saisie" | "envoi" | "envoye">("saisie");
  const [erreur, setErreur] = useState("");
  const [message, setMessage] = useState("");

  if (etat === "envoye")
    return (
      <div className="py-8 text-center" role="status">
        <CheckCircle2 className="mx-auto size-12 text-success" />
        <p className="mt-3 font-serif text-2xl">Message envoyé</p>
        <p className="mt-1 text-sm text-muted-foreground">Merci ! Notre équipe vous recontacte rapidement.</p>
        <button
          type="button"
          onClick={() => {
            setMessage("");
            setEtat("saisie");
          }}
          className="mt-5 text-sm font-semibold text-primary underline-offset-2 hover:underline"
        >
          Envoyer un autre message
        </button>
      </div>
    );

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const val = (k: string) => String(f.get(k) ?? "").trim();
        const telephone = val("telephone") || null;
        const email = val("email") || null;
        if (!telephone && !email) {
          setErreur("Indiquez un téléphone ou un email pour que nous puissions vous répondre.");
          return;
        }
        setErreur("");
        setEtat("envoi");
        try {
          await envoyerMessageContact({
            nom: val("nom"),
            telephone,
            email,
            sujet: val("sujet") as MessageContact["sujet"],
            message: message.trim(),
          });
          setEtat("envoye");
        } catch (err) {
          setErreur(messageErreur(err));
          setEtat("saisie");
        }
      }}
      className="space-y-3"
    >
      <p className="font-serif text-2xl">Écrivez-nous</p>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Votre nom</span>
        <input name="nom" required minLength={2} maxLength={80} autoComplete="name" placeholder="Prénom et nom" className={field} />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Téléphone ou WhatsApp</span>
          <input name="telephone" type="tel" maxLength={20} autoComplete="tel" placeholder="06 612 34 56" className={field} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-semibold">Email</span>
          <input name="email" type="email" maxLength={254} autoComplete="email" placeholder="vous@exemple.com" className={field} />
        </label>
      </div>
      <p className="-mt-1 text-xs text-muted-foreground">Au moins l’un des deux, pour vous répondre.</p>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Sujet</span>
        <select name="sujet" required defaultValue="" className={field}>
          <option value="" disabled>
            Choisissez un sujet…
          </option>
          {SUJETS_CONTACT.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-semibold">Votre message</span>
        <textarea
          name="message"
          required
          minLength={MESSAGE_MIN}
          maxLength={MESSAGE_MAX}
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Expliquez-nous votre demande…"
          className={`${field} resize-y`}
        />
        <span className="mt-1 block text-right text-xs text-muted-foreground">
          {message.length}/{MESSAGE_MAX}
        </span>
      </label>

      {erreur && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={etat === "envoi"}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground transition hover:brightness-95 disabled:opacity-60"
      >
        {etat === "envoi" && <Loader2 className="size-4 animate-spin" />}
        Envoyer mon message
      </button>
      <p className="text-[11px] text-muted-foreground">
        Vos coordonnées servent uniquement à vous répondre.{" "}
        <Link href="/confidentialite" className="underline">
          En savoir plus
        </Link>
      </p>
    </form>
  );
}
