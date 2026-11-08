import Image from "next/image";
import { notFound } from "next/navigation";
import { BellRing, CheckCircle2, Clock, Flag, Lock, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { ContactButton } from "@/components/Contact";
import { Avatar, BackHeader, Rating, toContact } from "@/components/ui";
import { artisans, getArtisan, metierLabel } from "@/lib/data";

// Toutes les fiches sont pré-générées : la navigation peut attendre le rendu.
export const instant = false;

export function generateStaticParams() {
  return artisans.map((a) => ({ id: a.id }));
}

export async function generateMetadata(props: PageProps<"/artisans/[id]">) {
  const a = getArtisan((await props.params).id);
  return { title: a ? `${a.nom} — ArtisanBrazza` : "Artisan introuvable" };
}

export default async function ArtisanPage(props: PageProps<"/artisans/[id]">) {
  const a = getArtisan((await props.params).id);
  if (!a) notFound();
  const m = metierLabel(a.metier);
  // Couverture = une réalisation différente de la photo de profil
  const cover = a.realisations.find((r) => r.image !== a.image)?.image;

  return (
    <div className="mx-auto max-w-4xl px-5 pt-4 pb-24 md:pt-8 md:pb-16">
      <BackHeader title="Profil artisan" href="/recherche" />

      <section className="mt-5 overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-black/[0.03]">
        {/* Couverture : sa meilleure réalisation, sinon le crème du hero */}
        <div className="relative h-32 bg-gradient-to-br from-cream to-cream-2 md:h-48">
          {cover && (
            <Image
              src={cover}
              alt=""
              fill
              priority
              sizes="(min-width: 896px) 896px, 100vw"
              className="object-cover"
            />
          )}
          {cover && (
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/50 to-transparent" />
          )}
        </div>
        <div className="-mt-12 px-5 pb-5">
          <Avatar a={a} className="relative size-24 rounded-2xl shadow-md ring-4 ring-card" />
          <div className="mt-3">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
              {m.artisan}
            </p>
            <h1 className="mt-1 font-serif text-3xl">{a.nom}</h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Rating value={a.note} />
            <span className="text-muted-foreground">{a.nbAvis} avis</span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="size-4" /> {a.zones.join(", ")}
            </span>
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="size-4" /> {a.reponse}
            </span>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {a.badges.map((b) => (
              <li
                key={b}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary"
              >
                <CheckCircle2 className="size-3.5" /> {b}
              </li>
            ))}
          </ul>
          {a.numeroPublic ? (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <a
                href={`tel:${a.telephone.replace(/\s/g, "")}`}
                className="flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-bold"
              >
                <Phone className="size-4" /> {a.telephone}
              </a>
              <a
                href={`https://wa.me/${a.telephone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl bg-[#25D366] py-3 text-sm font-bold text-white"
              >
                <MessageCircle className="size-4" /> WhatsApp
              </a>
            </div>
          ) : (
            <p className="mt-5 flex gap-3 rounded-2xl bg-secondary p-4 text-sm text-primary">
              <Lock className="mt-0.5 size-4 shrink-0" />
              <span>
                Numéro privé. Laissez un message : {a.nom.split(" ")[0]} est prévenu par{" "}
                <strong>WhatsApp et SMS</strong> <BellRing className="inline size-3.5" /> et vous
                rappelle.
              </span>
            </p>
          )}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Réalisations</h2>
        {a.realisations.length ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {a.realisations.map((r) => (
              <article key={r.titre} className="overflow-hidden rounded-2xl bg-card shadow-sm">
                <Image src={r.image} alt={r.titre} width={600} height={400} className="h-44 w-full object-cover" />
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold">{r.titre}</h3>
                    {r.verifiee && (
                      <span className="shrink-0 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-bold text-success">
                        Réalisation vérifiée
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {r.type} · {r.quartier} · {r.duree}
                  </p>
                  <p className="mt-2 text-sm">{r.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Matériaux : {r.materiaux}</p>
                  <ContactButton
                    artisan={toContact(a)}
                    label="Contactez pour un travail similaire"
                    className="mt-3 block w-full rounded-xl border border-primary py-2.5 text-center text-sm font-bold text-primary"
                  />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
            Pas encore de réalisation publiée.
          </p>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between">
          <h2 className="text-xl font-bold">Avis clients</h2>
          <span className="flex items-center gap-1 text-sm font-bold">
            <Star className="size-4 fill-star text-star" /> {a.note.toString().replace(".", ",")} ·{" "}
            {a.nbAvis} avis
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {a.avis.length ? (
            a.avis.map((v) => (
              <article key={v.auteur} className="rounded-2xl bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-bold">{v.auteur}</p>
                  <span className="text-xs text-muted-foreground">{v.date}</span>
                </div>
                <p className="mt-1 flex gap-0.5" aria-label={`${v.note} sur 5`}>
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`size-4 ${i < v.note ? "fill-star text-star" : "text-border"}`} />
                  ))}
                </p>
                <p className="mt-2 text-sm">{v.texte}</p>
                {v.reponse && (
                  <p className="mt-3 border-l-2 border-primary pl-3 text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">Réponse de l’artisan : </span>
                    {v.reponse}
                  </p>
                )}
                <button className="mt-3 flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-destructive">
                  <Flag className="size-3.5" /> Signaler un avis
                </button>
              </article>
            ))
          ) : (
            <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
              Aucun avis pour l’instant.
            </p>
          )}
        </div>
      </section>

      {/* Bouton fixe orange */}
      <div className="fixed inset-x-0 bottom-4 z-40 px-5 md:static md:mt-8 md:px-0">
        <ContactButton
          artisan={toContact(a)}
          label={`Contactez ${a.nom.split(" ")[0]}`}
          className="block w-full rounded-xl bg-accent py-4 text-center text-base font-bold text-accent-foreground shadow-lg md:shadow-none"
        />
      </div>
    </div>
  );
}
