"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Bell, Camera, Check, ChevronLeft, ChevronRight, ImagePlus, MapPin, MessageCircle, Share2, Star } from "lucide-react";
import { ProfilLink } from "@/components/Acces";
import { PhotoRealisation } from "@/components/PhotoRealisation";
import { Avatar, VerifiedBadge, toApercu } from "@/components/ui";
import { partager } from "@/lib/appli";
import type { PublicationFil } from "@/lib/backend/serveur";
import { useCompte } from "@/lib/compte";
import { type Artisan, type Realisation, artisans, categories, metierLabel } from "@/lib/data";
import { ConnexionRequise, cleRealisation, noter, resume, useChargerNotes, useNotes } from "@/lib/notes-realisations";
import { activerNotifications, useEtatPush } from "@/lib/push";
import { useRealisationsDemo } from "@/lib/realisations";
import { useSession } from "@/lib/session";

type Publication = { artisan: Artisan; realisation: Realisation; index: number; cle: string; ordre: number };

const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « Octobre 2026 » → nombre croissant avec le temps (0 si inconnu). */
function ordreDate(date?: string): number {
  if (!date) return 0;
  const [mois, annee] = date.toLowerCase().split(" ");
  const m = MOIS.indexOf(mois);
  return m >= 0 && Number(annee) ? Number(annee) * 12 + m : 0;
}

export function FilAppli({ inscrites }: { inscrites: PublicationFil[] }) {
  const demo = useRealisationsDemo();
  const [filtre, setFiltre] = useState<string>("tout");

  const publications = useMemo<Publication[]>(() => {
    const deBase = inscrites.map((p) => ({
      artisan: p.artisan,
      realisation: p.realisation,
      index: p.index,
      cle: cleRealisation(p.artisan.id, p.realisation.id, p.index),
      ordre: p.creeLe,
    }));
    const deDemo = artisans.flatMap((a) =>
      (demo?.[a.id] ?? a.realisations).map((realisation, index) => ({
        artisan: a,
        realisation,
        index,
        cle: cleRealisation(a.id, undefined, index),
        ordre: ordreDate(realisation.date),
      })),
    );
    // les vraies publications d'abord (les plus récentes en tête), puis les démonstrations
    return [...deBase, ...deDemo.sort((x, y) => y.ordre - x.ordre)];
  }, [inscrites, demo]);

  const secteurs = useMemo(() => {
    const ids = new Set(publications.map((p) => metierLabel(p.artisan.metier).categorie.id));
    return categories.filter((c) => ids.has(c.id));
  }, [publications]);

  const visibles =
    filtre === "tout" ? publications : publications.filter((p) => metierLabel(p.artisan.metier).categorie.id === filtre);

  useChargerNotes(visibles.map((p) => ({ cle: p.cle, proId: p.artisan.id })));

  return (
    <div className="mx-auto max-w-xl pb-6">
      <div className="px-4 pt-4">
        <Composer />
        <BandeauNotifications />
      </div>

      <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto px-4 pb-1" role="tablist" aria-label="Secteurs">
        {[{ id: "tout", court: "Tout" }, ...secteurs].map((s) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={filtre === s.id}
            onClick={() => setFiltre(s.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
              filtre === s.id ? "bg-foreground text-white" : "bg-card text-foreground ring-1 ring-border"
            }`}
          >
            {s.court}
          </button>
        ))}
      </div>

      <div className="mt-3 space-y-3 md:px-4">
        {visibles.map((p) => (
          <CartePublication key={p.cle} p={p} />
        ))}
        {visibles.length === 0 && (
          <p className="px-4 py-16 text-center text-sm text-muted-foreground">Aucune réalisation publiée dans ce secteur.</p>
        )}
      </div>
    </div>
  );
}

/** En tête du fil, comme « Commencer un post » : devis en photo, ou publier son travail (pros). */
function Composer() {
  const { compte } = useCompte();
  return (
    <div className="rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03]">
      <div className="flex items-center gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-lg font-bold text-primary">
          {compte?.prenom?.[0]?.toUpperCase() ?? "A"}
        </span>
        <Link
          href="/appli/photo"
          className="flex-1 rounded-full px-4 py-3 text-sm font-semibold text-muted-foreground ring-1 ring-border"
        >
          Un problème à la maison ? Montrez-le en photo…
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
        <Link href="/appli/photo" className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-primary hover:bg-secondary">
          <Camera className="size-5 text-accent-ink" /> Devis en photo
        </Link>
        <Link href="/pro/espace" className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-primary hover:bg-secondary">
          <ImagePlus className="size-5 text-success" /> Publier (pros)
        </Link>
      </div>
    </div>
  );
}

function BandeauNotifications() {
  const etat = useEtatPush();
  const { session } = useSession();
  const [enCours, setEnCours] = useState(false);
  if (etat !== "a-demander" || !session) return null;
  return (
    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-foreground p-4 text-white">
      <Bell className="size-6 shrink-0 text-accent" />
      <p className="flex-1 text-sm">Soyez prévenu dès qu’un artisan vous répond ou vous envoie un devis.</p>
      <button
        type="button"
        disabled={enCours}
        onClick={async () => {
          setEnCours(true);
          await activerNotifications(session.id);
          setEnCours(false);
        }}
        className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground disabled:opacity-60"
      >
        Activer
      </button>
    </div>
  );
}

function CartePublication({ p }: { p: Publication }) {
  const { artisan: a, realisation: r } = p;
  const m = metierLabel(a.metier);
  const photos = r.photos?.length ? r.photos : [r.image];
  const [ouvert, setOuvert] = useState(false);
  const [info, setInfo] = useState("");
  const longue = r.description.length > 160;

  return (
    <article className="bg-card shadow-sm ring-1 ring-black/[0.03] md:rounded-2xl">
      <header className="flex items-start gap-3 px-4 pt-4">
        <ProfilLink a={toApercu(a)} className="shrink-0">
          <Avatar a={a} className="size-12 rounded-full" />
        </ProfilLink>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <ProfilLink a={toApercu(a)} className="truncate font-bold hover:underline">
              {a.nom}
            </ProfilLink>
            {r.verifiee && <VerifiedBadge />}
          </div>
          <p className="truncate text-xs text-muted-foreground">{m.artisan}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {r.date && <>{r.date} · </>}
            <MapPin className="size-3" />
            {r.quartier || a.quartier}
          </p>
        </div>
      </header>

      <div className="px-4 pt-3 text-[15px] leading-relaxed">
        <h2 className="font-bold">{r.titre}</h2>
        {r.description && (
          <p className={`mt-1 whitespace-pre-line ${!ouvert && longue ? "line-clamp-3" : ""}`}>{r.description}</p>
        )}
        {longue && !ouvert && (
          <button type="button" onClick={() => setOuvert(true)} className="text-sm font-semibold text-muted-foreground">
            …voir plus
          </button>
        )}
        {(r.materiaux || r.duree) && (
          <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {r.duree && <span className="rounded-full bg-muted px-2.5 py-1 font-semibold">{r.duree}</span>}
            {r.materiaux && <span className="rounded-full bg-muted px-2.5 py-1">{r.materiaux}</span>}
          </p>
        )}
      </div>

      <Photos photos={photos} titre={r.titre} />

      <Note p={p} />

      <footer className="grid grid-cols-3 border-t border-border text-sm font-semibold text-muted-foreground">
        <Link
          href={`/devis/nouveau?artisan=${a.id}&similaire=${encodeURIComponent(r.titre)}`}
          className="flex items-center justify-center gap-1.5 py-3 hover:bg-muted/50"
        >
          <MessageCircle className="size-5" /> Devis
        </Link>
        <ProfilLink a={toApercu(a)} className="flex items-center justify-center gap-1.5 py-3 hover:bg-muted/50">
          <ChevronRight className="size-5" /> Profil
        </ProfilLink>
        <button
          type="button"
          className="flex items-center justify-center gap-1.5 py-3 hover:bg-muted/50"
          onClick={async () => {
            const res = await partager({
              titre: r.titre,
              texte: `${r.titre} — ${a.nom}, ${m.artisan.toLowerCase()} sur Artopif`,
              url: `/artisans/${a.id}`,
            });
            if (res === "copie") {
              setInfo("Lien copié");
              setTimeout(() => setInfo(""), 2000);
            }
          }}
        >
          {info ? <Check className="size-5 text-success" /> : <Share2 className="size-5" />} {info || "Partager"}
        </button>
      </footer>
    </article>
  );
}

/** Photos du chantier : défilement horizontal, une à la fois. */
function Photos({ photos, titre }: { photos: string[]; titre: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="relative mt-3 bg-muted">
      <div
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setI(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {photos.map((src, k) => (
          <div key={src + k} className="aspect-[4/3] w-full shrink-0 snap-center">
            <PhotoRealisation src={src} alt={`${titre}, photo ${k + 1}`} sizes="(max-width: 640px) 100vw, 576px" className="size-full object-cover" />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <>
          <span className="absolute top-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            {i + 1}/{photos.length}
          </span>
          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
            {photos.map((_, k) => (
              <span key={k} className={`size-1.5 rounded-full ${k === i ? "bg-white" : "bg-white/50"}`} />
            ))}
          </div>
          <ChevronLeft className="pointer-events-none absolute top-1/2 left-2 hidden size-7 -translate-y-1/2 rounded-full bg-white/80 p-1 md:block" />
          <ChevronRight className="pointer-events-none absolute top-1/2 right-2 hidden size-7 -translate-y-1/2 rounded-full bg-white/80 p-1 md:block" />
        </>
      )}
    </div>
  );
}

/** Moyenne des notes et étoiles pour donner la sienne. */
function Note({ p }: { p: Publication }) {
  const notes = useNotes();
  const { moyenne, nombre, mienne } = resume(notes, p.cle, p.artisan.id);
  const [survol, setSurvol] = useState(0);
  const [message, setMessage] = useState<{ texte: string; connexion?: boolean } | null>(null);

  const donner = async (n: number) => {
    setMessage(null);
    try {
      await noter({ cle: p.cle, proId: p.artisan.id, realisationId: p.realisation.id }, n);
      setMessage({ texte: mienne ? "Note modifiée, merci !" : "Merci pour votre note !" });
      setTimeout(() => setMessage(null), 2500);
    } catch (e) {
      setMessage(
        e instanceof ConnexionRequise
          ? { texte: e.message, connexion: true }
          : { texte: "Note non enregistrée. Vérifiez votre connexion." },
      );
    }
  };

  const affichee = survol || mienne;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
        {nombre ? (
          <>
            <Star className="size-4 fill-star text-star" />
            <strong className="text-foreground">{moyenne.toLocaleString("fr-FR")}</strong>
            <span>
              · {nombre} note{nombre > 1 ? "s" : ""}
            </span>
          </>
        ) : (
          "Soyez le premier à noter ce travail"
        )}
      </p>
      <div className="flex items-center" onMouseLeave={() => setSurvol(0)} role="radiogroup" aria-label="Votre note">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={mienne === n}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onMouseEnter={() => setSurvol(n)}
            onClick={() => donner(n)}
            className="p-1 transition-transform active:scale-125"
          >
            <Star className={`size-6 ${n <= affichee ? "fill-star text-star" : "text-border"}`} />
          </button>
        ))}
      </div>
      {message && (
        <p className={`w-full text-xs font-semibold ${message.connexion ? "text-destructive" : "text-success"}`}>
          {message.texte}{" "}
          {message.connexion && (
            <Link href="/profil" className="underline">
              Se connecter
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
