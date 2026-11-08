"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { type ConfirmationResult, RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, serverTimestamp, writeBatch } from "firebase/firestore";
import { AlertTriangle, ArrowLeft, Check, CheckCircle2, Loader2, Lock, Phone, Search } from "lucide-react";
import { firebaseAuth, firestore, messageErreur, versE164 } from "@/lib/firebase";
import { MetierIcon } from "@/components/ui";
import { quartiers } from "@/lib/data";
import { categories, metiers } from "@/lib/metiers";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";
const norm = (s: string) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

/**
 * Inscription d'un professionnel en 3 étapes.
 * 1. Firebase Authentication par téléphone (code SMS, reCAPTCHA invisible).
 * 2-3. Profil enregistré dans Firestore :
 *    - pros/{uid}               : informations publiques
 *    - pros/{uid}/prive/contact : numéro et préférences d'alerte (lisibles par l'artisan seul)
 */
export function Inscription() {
  const boutique = useSearchParams().get("type") === "boutique";
  const etapes = boutique ? ["Téléphone", "Ma boutique", "Contact"] : ["Téléphone", "Mon métier", "Contact"];
  const [etape, setEtape] = useState(0);
  const [fini, setFini] = useState(false);

  // étape 1
  const [tel, setTel] = useState("");
  const [code, setCode] = useState("");
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [uid, setUid] = useState<string | null>(null);
  const [telVerifie, setTelVerifie] = useState("");
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState("");
  const recaptcha = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => () => recaptcha.current?.clear(), []);

  const envoyerCode = async () => {
    setErreur("");
    setChargement(true);
    try {
      const auth = firebaseAuth();
      recaptcha.current?.clear();
      recaptcha.current = new RecaptchaVerifier(auth, "recaptcha-inscription", { size: "invisible" });
      const res = await signInWithPhoneNumber(auth, versE164(tel), recaptcha.current);
      setConfirmation(res);
      setCode("");
    } catch (e) {
      setErreur(messageErreur(e));
      recaptcha.current?.clear();
      recaptcha.current = null;
    } finally {
      setChargement(false);
    }
  };

  const verifierCode = async () => {
    if (!confirmation) return;
    setErreur("");
    setChargement(true);
    try {
      const { user } = await confirmation.confirm(code);
      setUid(user.uid);
      setTelVerifie(user.phoneNumber ?? versE164(tel));
      setEtape(1);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  };

  const creerProfil = async () => {
    if (!uid) return;
    setErreur("");
    setChargement(true);
    try {
      const db = firestore();
      const lot = writeBatch(db);
      lot.set(doc(db, "pros", uid), {
        type: boutique ? "boutique" : "artisan",
        nom: nom.trim(),
        ...(boutique ? { adresse: adresse.trim(), quartier } : { metier, zones }),
        numeroPublic,
        telephonePublic: numeroPublic ? telVerifie : null,
        statut: "en_verification",
        creeLe: serverTimestamp(),
      });
      lot.set(doc(db, "pros", uid, "prive", "contact"), {
        telephone: telVerifie,
        alerteWhatsapp: true,
        alerteSms: true,
      });
      await lot.commit();
      setFini(true);
    } catch (e) {
      setErreur(messageErreur(e));
    } finally {
      setChargement(false);
    }
  };
  // étape 2 (artisan)
  const [nom, setNom] = useState("");
  const [recherche, setRecherche] = useState("");
  const [metier, setMetier] = useState("");
  const [zones, setZones] = useState<string[]>([]);
  // étape 2 (boutique)
  const [adresse, setAdresse] = useState("");
  const [quartier, setQuartier] = useState("");
  // étape 3
  const [numeroPublic, setNumeroPublic] = useState(true);

  const metierChoisi = metiers.find((m) => m.id === metier);
  const suggestions = recherche.trim()
    ? metiers.filter((m) => norm(m.label).includes(norm(recherche.trim()))).slice(0, 8)
    : [];

  const valide =
    etape === 0
      ? !!confirmation && /^\d{6}$/.test(code)
      : etape === 1
        ? boutique
          ? nom.trim() && adresse.trim() && quartier
          : nom.trim() && metier && zones.length > 0
        : true;

  if (fini) {
    return (
      <div className="mt-8 rounded-2xl bg-card p-8 text-center shadow-sm ring-1 ring-black/[0.03]">
        <CheckCircle2 className="mx-auto size-14 text-success" />
        <h2 className="mt-4 font-serif text-3xl">Bienvenue, {nom.split(" ")[0]} !</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Votre profil est créé. Notre équipe vérifie votre identité sous 48 h ; en attendant, vous
          pouvez compléter votre profil{boutique ? " et ajouter vos produits" : " et vos réalisations"}.
        </p>
        <Link
          href={boutique ? "/pro/boutique" : "/pro/espace"}
          className="mt-6 block rounded-xl bg-accent py-4 font-bold text-accent-foreground"
        >
          Accéder à mon espace
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6">
      {/* Progression */}
      <ol className="flex gap-2">
        {etapes.map((e, i) => (
          <li key={e} className="flex-1">
            <span className={`block h-1.5 rounded-full ${i <= etape ? "bg-accent" : "bg-muted"}`} />
            <span className={`mt-2 block text-xs font-semibold ${i === etape ? "text-foreground" : "text-muted-foreground"}`}>
              {i + 1}. {e}
            </span>
          </li>
        ))}
      </ol>

      <form
        className="mt-6 space-y-5 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] md:p-7"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valide || chargement) return;
          if (etape === 0) verifierCode();
          else if (etape < etapes.length - 1) setEtape(etape + 1);
          else creerProfil();
        }}
      >
        {etape === 0 && (
          <>
            <div>
              <label htmlFor="tel" className="mb-2 block text-sm font-semibold">
                Votre numéro de téléphone
              </label>
              <div className="flex gap-2">
                <span className="flex items-center rounded-xl border border-border bg-muted px-3 text-sm font-semibold">
                  +242
                </span>
                <input
                  id="tel"
                  type="tel"
                  inputMode="tel"
                  value={tel}
                  disabled={!!confirmation}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="06 000 00 00"
                  className={field}
                />
              </div>
            </div>
            {!confirmation ? (
              <button
                type="button"
                disabled={tel.replace(/\D/g, "").length < 9 || chargement}
                onClick={envoyerCode}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-4 font-bold text-primary-foreground disabled:opacity-40"
              >
                {chargement && <Loader2 className="size-5 animate-spin" />}
                Recevoir le code par SMS
              </button>
            ) : (
              <div>
                <label htmlFor="code" className="mb-2 block text-sm font-semibold">
                  Code reçu par SMS
                </label>
                <input
                  id="code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="6 chiffres"
                  className={`${field} text-center font-mono text-2xl tracking-[0.5em]`}
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  Code envoyé au {versE164(tel)}.{" "}
                  <button type="button" disabled={chargement} onClick={envoyerCode} className="font-semibold text-primary">
                    Renvoyer le code
                  </button>{" "}
                  ·{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmation(null);
                      setCode("");
                    }}
                    className="font-semibold text-primary"
                  >
                    Changer de numéro
                  </button>
                </p>
              </div>
            )}
          </>
        )}

        {etape === 1 && !boutique && (
          <>
            <div>
              <label htmlFor="nom" className="mb-2 block text-sm font-semibold">
                Nom professionnel
              </label>
              <input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Jean-Claude Mbemba" className={field} />
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Votre métier</p>
              {metierChoisi ? (
                <div className="flex items-center gap-3 rounded-xl border-2 border-primary bg-secondary px-4 py-3 text-primary">
                  <MetierIcon id={metierChoisi.id} className="size-5" />
                  <span className="flex-1 font-semibold">{metierChoisi.label}</span>
                  <button type="button" onClick={() => setMetier("")} className="text-sm font-semibold underline">
                    Changer
                  </button>
                </div>
              ) : (
                <>
                  <label className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 focus-within:ring-2 focus-within:ring-ring">
                    <Search className="size-5 text-primary" />
                    <input
                      value={recherche}
                      onChange={(e) => setRecherche(e.target.value)}
                      placeholder="Tapez votre métier : plombier, tresseuse…"
                      className="w-full bg-transparent py-3.5 text-base outline-none"
                    />
                  </label>
                  {suggestions.length > 0 && (
                    <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {suggestions.map((m) => (
                        <li key={m.id}>
                          <button
                            type="button"
                            onClick={() => setMetier(m.id)}
                            className="flex h-full w-full flex-col items-center gap-1.5 rounded-xl bg-background px-2 py-3 text-center ring-1 ring-border hover:ring-primary"
                          >
                            <MetierIcon id={m.id} className="size-5 text-primary" />
                            <span className="text-xs font-semibold">{m.label}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                  {recherche.trim() && !suggestions.length && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Introuvable ?{" "}
                      <Link href="/metiers#proposer" className="font-semibold text-primary">
                        Proposez votre métier
                      </Link>
                    </p>
                  )}
                  {!recherche.trim() && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {metiers.length} métiers en {categories.length} secteurs.
                    </p>
                  )}
                </>
              )}
            </div>
            <fieldset>
              <legend className="mb-2 text-sm font-semibold">Quartiers où vous intervenez</legend>
              <div className="flex flex-wrap gap-2">
                {quartiers.map((q) => {
                  const on = zones.includes(q);
                  return (
                    <button
                      type="button"
                      key={q}
                      aria-pressed={on}
                      onClick={() => setZones(on ? zones.filter((z) => z !== q) : [...zones, q])}
                      className={`flex items-center gap-1 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ${
                        on ? "bg-primary text-white ring-primary" : "bg-white ring-border"
                      }`}
                    >
                      {on && <Check className="size-3.5" />} {q}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </>
        )}

        {etape === 1 && boutique && (
          <>
            <div>
              <label htmlFor="bnom" className="mb-2 block text-sm font-semibold">
                Nom de la boutique
              </label>
              <input id="bnom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex. Quincaillerie du Marché" className={field} />
            </div>
            <div>
              <label htmlFor="badr" className="mb-2 block text-sm font-semibold">
                Adresse
              </label>
              <input id="badr" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="Rue, repère connu" className={field} />
            </div>
            <div>
              <label htmlFor="bq" className="mb-2 block text-sm font-semibold">
                Quartier
              </label>
              <select id="bq" value={quartier} onChange={(e) => setQuartier(e.target.value)} className={field}>
                <option value="" disabled>
                  Choisissez
                </option>
                {quartiers.map((q) => (
                  <option key={q}>{q}</option>
                ))}
              </select>
            </div>
          </>
        )}

        {etape === 2 && (
          <fieldset>
            <legend className="mb-3 text-sm font-semibold">Comment les clients vous contactent-ils ?</legend>
            <div className="grid gap-3">
              {[
                {
                  v: true,
                  Icon: Phone,
                  t: "Numéro public",
                  d: "Votre numéro est affiché : les clients vous appellent ou vous écrivent sur WhatsApp directement.",
                },
                {
                  v: false,
                  Icon: Lock,
                  t: "Numéro privé",
                  d: "Votre numéro reste caché. Les clients vous laissent un message et vous êtes prévenu par WhatsApp et SMS.",
                },
              ].map(({ v, Icon, t, d }) => (
                <button
                  type="button"
                  key={t}
                  aria-pressed={numeroPublic === v}
                  onClick={() => setNumeroPublic(v)}
                  className={`flex gap-4 rounded-2xl border-2 p-4 text-left transition ${
                    numeroPublic === v ? "border-primary bg-secondary" : "border-border bg-white"
                  }`}
                >
                  <span
                    className={`flex size-11 shrink-0 items-center justify-center rounded-full ${
                      numeroPublic === v ? "bg-primary text-white" : "bg-muted text-foreground"
                    }`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-bold">{t}</span>
                    <span className="mt-0.5 block text-sm text-muted-foreground">{d}</span>
                  </span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Vous pourrez changer ce choix à tout moment dans votre profil.</p>
          </fieldset>
        )}

        {erreur && (
          <p role="alert" className="flex gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {erreur}
          </p>
        )}
        {/* reCAPTCHA invisible exigé par Firebase pour l'envoi du SMS */}
        <div id="recaptcha-inscription" />

        <div className="flex gap-3 pt-2">
          {etape > 1 && (
            <button
              type="button"
              onClick={() => setEtape(etape - 1)}
              aria-label="Étape précédente"
              className="flex items-center justify-center rounded-xl border border-border px-4"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <button
            type="submit"
            disabled={!valide || chargement}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground transition disabled:opacity-40"
          >
            {chargement && etape > 0 && <Loader2 className="size-5 animate-spin" />}
            {etape === 0 ? "Vérifier le code" : etape < etapes.length - 1 ? "Continuer" : "Créer mon profil"}
          </button>
        </div>
      </form>
    </div>
  );
}
