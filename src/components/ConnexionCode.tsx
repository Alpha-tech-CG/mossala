"use client";

import { useEffect, useId, useState } from "react";
import { KeyRound, Loader2, Mail, MessageSquareText, Smartphone } from "lucide-react";
import {
  type Session,
  type VerificationCode,
  envoyerCodeEmail,
  envoyerCodeSms,
  messageErreur,
  nettoyerVerification,
  versE164,
} from "@/lib/backend";

const champ =
  "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

type Mode = "sms" | "email";

/**
 * Connexion par code à usage unique, au choix par SMS (Firebase Authentication) ou par email
 * (Cloud Functions). Sert à la fois à se connecter et à s'inscrire : le numéro ou l'email
 * vérifié devient l'identité du compte.
 */
export function ConnexionCode({
  onConnecte,
  intro = "Recevez un code de connexion par SMS ou par email.",
}: {
  onConnecte: (s: Session) => void | Promise<void>;
  intro?: string;
}) {
  const base = useId().replace(/:/g, "");
  const conteneur = `recaptcha-${base}`;
  const [mode, setMode] = useState<Mode>("sms");
  const [tel, setTel] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verification, setVerification] = useState<VerificationCode | null>(null);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");

  useEffect(() => nettoyerVerification, []);

  const executer = async (action: () => Promise<void>) => {
    setErreur("");
    setChargement(true);
    try {
      await action();
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  };

  const recommencer = () => {
    setVerification(null);
    setCode("");
    setErreur("");
    nettoyerVerification();
  };

  const envoyer = () =>
    executer(async () => {
      setVerification(mode === "sms" ? await envoyerCodeSms(versE164(tel), conteneur) : await envoyerCodeEmail(email));
      setCode("");
    });

  const destinataire = mode === "sms" ? versE164(tel) : email.trim().toLowerCase();

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (chargement) return;
        if (!verification) return void envoyer();
        void executer(async () => {
          await onConnecte(await verification.confirmer(code));
        });
      }}
    >
      <p className="text-sm text-muted-foreground">{intro}</p>

      <div role="tablist" aria-label="Recevoir le code par" className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            ["sms", "Par SMS", Smartphone],
            ["email", "Par email", Mail],
          ] as const
        ).map(([m, libelle, Icone]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            disabled={chargement}
            onClick={() => {
              if (mode === m) return;
              recommencer();
              setMode(m);
            }}
            className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
              mode === m ? "bg-white text-foreground shadow-sm" : "text-muted-foreground"
            }`}
          >
            <Icone className="size-4" /> {libelle}
          </button>
        ))}
      </div>

      {mode === "sms" ? (
        <div>
          <label htmlFor={`${base}-tel`} className="mb-2 block text-sm font-semibold">
            Numéro de téléphone
          </label>
          <div className="flex gap-2">
            <span className="flex items-center rounded-xl border border-border bg-muted px-3 text-sm font-semibold">+242</span>
            <input
              id={`${base}-tel`}
              type="tel"
              inputMode="tel"
              autoComplete="tel-national"
              required
              value={tel}
              disabled={!!verification}
              onChange={(e) => setTel(e.target.value)}
              placeholder="06 000 00 00"
              className={champ}
            />
          </div>
        </div>
      ) : (
        <div>
          <label htmlFor={`${base}-email`} className="mb-2 block text-sm font-semibold">
            Adresse email
          </label>
          <input
            id={`${base}-email`}
            type="email"
            inputMode="email"
            autoComplete="email"
            required
            value={email}
            disabled={!!verification}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vous@exemple.com"
            className={champ}
          />
        </div>
      )}

      {verification && (
        <div>
          <label htmlFor={`${base}-code`} className="mb-2 block text-sm font-semibold">
            Code reçu par {mode === "sms" ? "SMS" : "email"}
          </label>
          <input
            id={`${base}-code`}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className={`${champ} text-center text-xl tracking-[0.5em]`}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Code envoyé à {destinataire}
            {mode === "email" && " (pensez à regarder dans les indésirables)"}.{" "}
            <button type="button" disabled={chargement} onClick={() => void envoyer()} className="font-semibold text-primary underline">
              Renvoyer
            </button>{" "}
            ·{" "}
            <button type="button" onClick={recommencer} className="font-semibold text-primary underline">
              {mode === "sms" ? "Changer de numéro" : "Changer d’adresse"}
            </button>
          </p>
        </div>
      )}

      {erreur && (
        <p role="alert" className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={chargement || (!!verification && code.length !== 6)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground disabled:opacity-50"
      >
        {chargement ? (
          <Loader2 className="size-5 animate-spin" />
        ) : verification ? (
          <KeyRound className="size-5" />
        ) : mode === "sms" ? (
          <MessageSquareText className="size-5" />
        ) : (
          <Mail className="size-5" />
        )}
        {verification ? "Valider le code" : mode === "sms" ? "Recevoir le code par SMS" : "Recevoir le code par email"}
      </button>

      {/* reCAPTCHA invisible exigé par Firebase pour l'envoi du SMS */}
      <div id={conteneur} />
      {mode === "sms" && (
        // Mention obligatoire quand le badge reCAPTCHA est masqué (voir globals.css)
        <p className="text-[11px] leading-snug text-muted-foreground">
          Protégé par reCAPTCHA :{" "}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" className="underline">
            confidentialité
          </a>{" "}
          et{" "}
          <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer" className="underline">
            conditions
          </a>{" "}
          de Google.
        </p>
      )}
    </form>
  );
}
