"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  BellRing,
  CheckCircle2,
  Infinity as InfinityIcon,
  Lock,
  MessageCircle,
  Phone,
  Send,
  X,
} from "lucide-react";
import {
  DUREE_ILLIMITE_JOURS,
  QUOTA_ACTIF,
  MESSAGES_GRATUITS_PAR_MOIS,
  PRIX_ILLIMITE_FCFA,
  fcfa,
} from "@/lib/data";
import { useCompte } from "@/lib/compte";
import { useQuota } from "@/lib/quota";
import { useRouter } from "next/navigation";

export type ContactArtisan = {
  id: string;
  nom: string;
  metier: string;
  image?: string;
  telephone: string;
  numeroPublic: boolean;
};

type Etape = "choix" | "message" | "paiement" | "envoye";

const field =
  "w-full rounded-xl border border-border bg-white px-4 py-3.5 text-base outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring";

/** Bouton « Contactez » + fenêtre de mise en relation. */
export function ContactButton({
  artisan,
  className = "",
  label = "Contactez",
}: {
  artisan: ContactArtisan;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const compte = useCompte();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
  return (
    <>
      <button
        type="button"
        onClick={() => {
          // Contacter = accéder au profil : sans compte ou sans profil restant, on passe par la fiche
          if (!compte.peutVoir(artisan.id)) return router.push(`/artisans/${artisan.id}`);
          compte.consulter(artisan.id);
          setOpen(true);
        }}
        className={className}
      >
        {label}
      </button>
      {mounted && open && createPortal(<ContactSheet a={artisan} onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}

function ContactSheet({ a, onClose }: { a: ContactArtisan; onClose: () => void }) {
  const q = useQuota();
  const [etape, setEtape] = useState<Etape>(a.numeroPublic ? "choix" : "message");
  const [texte, setTexte] = useState("");
  const [tel, setTel] = useState("");
  const [operateur, setOperateur] = useState<"MTN MoMo" | "Airtel Money">("MTN MoMo");
  const [paiementEnCours, setPaiementEnCours] = useState(false);
  const prenom = a.nom.split(" ")[0];
  const mois = q.mois;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  const envoyer = (e: React.FormEvent) => {
    e.preventDefault();
    if (QUOTA_ACTIF && !q.peutEnvoyer) return setEtape("paiement");
    // TODO backend : insérer le message + déclencher les notifications WhatsApp et SMS
    if (QUOTA_ACTIF) q.consommer();
    setEtape("envoye");
  };

  const payer = () => {
    setPaiementEnCours(true);
    // MAQUETTE : simulation du paiement Mobile Money
    setTimeout(() => {
      q.activerIllimite();
      setPaiementEnCours(false);
      setEtape("message");
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center md:items-center md:p-6">
      <div onClick={onClose} aria-hidden className="absolute inset-0 bg-foreground/45 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Contacter ${a.nom}`}
        className="sheet-in relative max-h-[92vh] w-full overflow-y-auto rounded-t-[28px] bg-background shadow-2xl md:max-w-md md:rounded-[28px]"
      >
        {/* En-tête artisan */}
        <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-background/95 px-5 py-4 backdrop-blur">
          {a.image ? (
            <Image src={a.image} alt="" width={48} height={48} className="size-12 rounded-full object-cover" />
          ) : (
            <span className="flex size-12 items-center justify-center rounded-full bg-primary font-serif text-lg text-white">
              {a.nom[0]}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-bold">{a.nom}</p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              {a.metier} ·
              {a.numeroPublic ? (
                <span className="flex items-center gap-1 font-semibold text-success">
                  <Phone className="size-3" /> Appel direct
                </span>
              ) : (
                <span className="flex items-center gap-1 font-semibold">
                  <Lock className="size-3" /> Numéro privé
                </span>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="p-5">
          {etape === "choix" && (
            <div className="space-y-3">
              <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
                Contactez {prenom}
              </p>
              <a
                href={`tel:${a.telephone.replace(/\s/g, "")}`}
                className="flex items-center justify-between rounded-2xl bg-accent px-5 py-4 text-accent-foreground shadow-sm transition hover:brightness-95"
              >
                <span className="flex items-center gap-3">
                  <Phone className="size-5" />
                  <span>
                    <span className="block font-bold">Appeler</span>
                    <span className="block text-sm opacity-90">{a.telephone}</span>
                  </span>
                </span>
                <span className="text-xs font-semibold opacity-90">Gratuit</span>
              </a>
              <a
                href={`https://wa.me/${a.telephone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 rounded-2xl bg-[#25D366] px-5 py-4 font-bold text-white shadow-sm transition hover:brightness-95"
              >
                <MessageCircle className="size-5" /> Écrire sur WhatsApp
              </a>
              <div className="flex items-center gap-3 py-1 text-xs text-muted-foreground">
                <span className="h-px flex-1 bg-border" /> ou <span className="h-px flex-1 bg-border" />
              </div>
              <button
                onClick={() => setEtape("message")}
                className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-left font-bold transition hover:border-primary"
              >
                <Send className="size-5 text-primary" /> Laisser un message sur la plateforme
              </button>
            </div>
          )}

          {etape === "message" && (
            <form onSubmit={envoyer} className="space-y-4">
              {!a.numeroPublic && (
                <p className="flex gap-3 rounded-2xl bg-secondary p-4 text-sm text-primary">
                  <BellRing className="mt-0.5 size-5 shrink-0" />
                  <span>
                    {prenom} garde son numéro privé. Laissez-lui un message : il est prévenu
                    immédiatement par <strong>WhatsApp et SMS</strong> et vous rappelle.
                  </span>
                </p>
              )}
              <div>
                <label htmlFor="msg" className="mb-2 block text-sm font-semibold">
                  Votre message
                </label>
                <textarea
                  id="msg"
                  required
                  rows={4}
                  maxLength={500}
                  value={texte}
                  onChange={(e) => setTexte(e.target.value)}
                  placeholder={`Bonjour ${prenom}, j’ai besoin de…`}
                  className={`${field} resize-none`}
                />
              </div>
              <div>
                <label htmlFor="rappel" className="mb-2 block text-sm font-semibold">
                  Votre numéro pour être rappelé
                </label>
                <input
                  id="rappel"
                  type="tel"
                  required
                  value={tel}
                  onChange={(e) => setTel(e.target.value)}
                  placeholder="06 000 00 00"
                  className={field}
                />
              </div>

              {QUOTA_ACTIF && (
                <QuotaLine illimite={q.illimite} restants={q.restants} jusqua={q.illimiteJusqua} mois={mois} />
              )}
              <p className="text-[11px] leading-snug text-muted-foreground">
                Votre message et votre numéro sont transmis à {prenom} pour qu’il vous rappelle, puis conservés 12
                mois.{" "}
                <Link href="/confidentialite" target="_blank" className="underline">
                  En savoir plus
                </Link>
              </p>

              <button
                type="submit"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground transition hover:brightness-95 active:scale-[0.98]"
              >
                <Send className="size-5" />
                {!QUOTA_ACTIF || q.peutEnvoyer ? "Envoyer le message" : `Débloquer pour ${fcfa(PRIX_ILLIMITE_FCFA)}`}
              </button>
              {a.numeroPublic && (
                <button
                  type="button"
                  onClick={() => setEtape("choix")}
                  className="w-full text-center text-sm font-semibold text-muted-foreground"
                >
                  Préférez-vous appeler ?
                </button>
              )}
            </form>
          )}

          {etape === "paiement" && (
            <div>
              <div className="rounded-2xl bg-foreground p-5 text-white">
                <p className="flex items-center gap-2 text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
                  <InfinityIcon className="size-4" /> Messages illimités
                </p>
                <p className="mt-2 font-serif text-4xl">{fcfa(PRIX_ILLIMITE_FCFA)}</p>
                <p className="mt-1 text-sm text-white/75">
                  Contactez autant d’artisans que vous voulez pendant {DUREE_ILLIMITE_JOURS} jours.
                </p>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Vous avez utilisé vos {MESSAGES_GRATUITS_PAR_MOIS} messages gratuits de {mois}. Les
                appels directs restent toujours gratuits.
              </p>
              <p className="mt-5 mb-2 text-sm font-semibold">Payer avec</p>
              <div className="grid grid-cols-2 gap-3">
                {(["MTN MoMo", "Airtel Money"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    aria-pressed={operateur === o}
                    onClick={() => setOperateur(o)}
                    className={`rounded-xl border-2 py-3 text-sm font-bold ${
                      operateur === o ? "border-primary bg-secondary text-primary" : "border-border bg-card"
                    }`}
                  >
                    {o}
                  </button>
                ))}
              </div>
              <button
                onClick={payer}
                disabled={paiementEnCours}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground disabled:opacity-70"
              >
                {paiementEnCours ? "Confirmation sur votre téléphone…" : `Payer ${fcfa(PRIX_ILLIMITE_FCFA)} avec ${operateur}`}
              </button>
              <button
                onClick={() => setEtape("message")}
                className="mt-3 w-full text-center text-sm font-semibold text-muted-foreground"
              >
                Retour
              </button>
            </div>
          )}

          {etape === "envoye" && (
            <div className="py-4 text-center">
              <CheckCircle2 className="mx-auto size-14 text-success" />
              <p className="mt-3 font-serif text-2xl">Message envoyé</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {prenom} vient d’être prévenu par WhatsApp et SMS. Il vous rappellera au{" "}
                <strong className="text-foreground">{tel}</strong>.
              </p>
              {QUOTA_ACTIF && (
                <div className="mt-5">
                  <QuotaLine illimite={q.illimite} restants={q.restants} jusqua={q.illimiteJusqua} mois={mois} />
                </div>
              )}
              <button
                onClick={onClose}
                className="mt-5 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function QuotaLine({
  illimite,
  restants,
  jusqua,
  mois,
}: {
  illimite: boolean;
  restants: number;
  jusqua: Date | null;
  mois: string;
}) {
  if (illimite)
    return (
      <p className="flex items-center justify-center gap-2 rounded-xl bg-success/10 px-4 py-3 text-sm font-semibold text-success">
        <InfinityIcon className="size-4" /> Messages illimités jusqu’au{" "}
        {jusqua?.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
      </p>
    );
  return (
    <div className="rounded-xl bg-card px-4 py-3 ring-1 ring-border">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Messages gratuits en {mois}</span>
        <strong className={restants ? "" : "text-destructive"}>
          {restants} / {MESSAGES_GRATUITS_PAR_MOIS}
        </strong>
      </div>
      <div className="mt-2 flex gap-1">
        {Array.from({ length: MESSAGES_GRATUITS_PAR_MOIS }, (_, i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i < restants ? "bg-accent" : "bg-muted"}`} />
        ))}
      </div>
      {!restants && (
        <p className="mt-2 text-xs text-muted-foreground">
          Ensuite : messages illimités pour {fcfa(PRIX_ILLIMITE_FCFA)}.
        </p>
      )}
    </div>
  );
}
