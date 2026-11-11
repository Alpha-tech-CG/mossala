"use client";

import { useEffect, useId, useState } from "react";
import { KeyRound, Loader2, MessageSquareText } from "lucide-react";
import { envoyerCodeSms, messageErreur, nettoyerVerification, versE164, type VerificationTelephone } from "@/lib/backend";

const champ =
  "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

/**
 * Connexion par code SMS (Firebase). Sert à la fois à se connecter et à s'inscrire :
 * le numéro vérifié devient l'identité du compte (Supabase lit son jeton).
 */
export function ConnexionTelephone({
  onConnecte,
  intro = "Saisissez votre numéro : vous recevrez un code par SMS.",
}: {
  onConnecte: (c: { id: string; telephone: string }) => void | Promise<void>;
  intro?: string;
}) {
  const conteneur = `recaptcha-${useId().replace(/:/g, "")}`;
  const [tel, setTel] = useState("");
  const [code, setCode] = useState("");
  const [verification, setVerification] = useState<VerificationTelephone | null>(null);
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

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void executer(async () => {
          if (!verification) {
            setVerification(await envoyerCodeSms(versE164(tel), conteneur));
            setCode("");
          } else {
            await onConnecte(await verification.confirmer(code));
          }
        });
      }}
    >
      <p className="text-sm text-muted-foreground">{intro}</p>
      <div>
        <label htmlFor={`${conteneur}-tel`} className="mb-2 block text-sm font-semibold">
          Numéro de téléphone
        </label>
        <div className="flex gap-2">
          <span className="flex items-center rounded-xl border border-border bg-muted px-3 text-sm font-semibold">+242</span>
          <input
            id={`${conteneur}-tel`}
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

      {verification && (
        <div>
          <label htmlFor={`${conteneur}-code`} className="mb-2 block text-sm font-semibold">
            Code reçu par SMS
          </label>
          <input
            id={`${conteneur}-code`}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            required
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className={`${champ} text-center text-xl tracking-[0.5em]`}
          />
          <button
            type="button"
            onClick={() => {
              setVerification(null);
              nettoyerVerification();
            }}
            className="mt-2 text-xs font-semibold text-primary underline"
          >
            Changer de numéro ou renvoyer le code
          </button>
        </div>
      )}

      {erreur && <p className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">{erreur}</p>}

      <button
        type="submit"
        disabled={chargement || (!!verification && code.length !== 6)}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground disabled:opacity-50"
      >
        {chargement ? (
          <Loader2 className="size-5 animate-spin" />
        ) : verification ? (
          <KeyRound className="size-5" />
        ) : (
          <MessageSquareText className="size-5" />
        )}
        {verification ? "Valider le code" : "Recevoir le code par SMS"}
      </button>
      <div id={conteneur} />
    </form>
  );
}
