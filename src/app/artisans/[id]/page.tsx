import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Award, BellRing, CheckCircle2, Clock, FileText, Lock, MapPin, MessageCircle, Phone, PenLine, Star } from "lucide-react";
import { ProfilVerrou } from "@/components/Acces";
import { ContactButton } from "@/components/Contact";
import { FavoriButton, Signaler } from "@/components/Engagement";
import { Avatar, BackHeader, Rating, toContact } from "@/components/ui";
import { artisans, badgesReputation, getArtisan, metierLabel } from "@/lib/data";
import { artisanInscrit } from "@/lib/backend/serveur";
import { OngletsProfil } from "./OngletsProfil";

// Toutes les fiches sont pré-générées : la navigation peut attendre le rendu.
export const instant = false;

export function generateStaticParams() {
  return artisans.map((a) => ({ id: a.id }));
}

export async function generateMetadata(props: PageProps<"/artisans/[id]">) {
  const id = (await props.params).id;
  const a = getArtisan(id) ?? (await artisanInscrit(id));
  return { title: a ? `${a.nom} — Artopif` : "Artisan introuvable" };
}

export default async function ArtisanPage(props: PageProps<"/artisans/[id]">) {
  const id = (await props.params).id;
  // Artisan de démonstration, sinon artisan vérifié inscrit sur la plateforme (base Supabase)
  const a = getArtisan(id) ?? (await artisanInscrit(id));
  if (!a) notFound();
  const m = metierLabel(a.metier);
  // Couverture = une réalisation différente de la photo de profil
  const cover = a.realisations.find((r) => r.image !== a.image)?.image;

  return (
    <div className="mx-auto max-w-4xl px-5 pt-4 pb-24 md:pt-8 md:pb-16">
      <BackHeader title="Profil artisan" href="/recherche" />

      <ProfilVerrou
        a={{ id: a.id, nom: a.nom, metier: m.artisan, quartier: a.quartier, image: a.image, note: a.note, nbAvis: a.nbAvis }}
      >

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
            {badgesReputation(a).map((b) => (
              <li
                key={b}
                title="Attribué automatiquement à partir des avis clients"
                className="flex items-center gap-1 rounded-full bg-accent/20 px-2.5 py-1 text-xs font-bold text-accent-ink"
              >
                <Award className="size-3.5" /> {b}
              </li>
            ))}
            {a.badges.map((b) => (
              <li
                key={b}
                className="flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary"
              >
                <CheckCircle2 className="size-3.5" /> {b}
              </li>
            ))}
          </ul>
          <FavoriButton id={a.id} className="mt-4" />
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

      <OngletsProfil
        artisanId={a.id}
        realisations={a.realisations}
        nbAvis={a.nbAvis}
        avis={
          <>
            <p className="flex items-center gap-1 text-sm font-bold">
              <Star className="size-4 fill-star text-star" /> {a.note.toString().replace(".", ",")} · {a.nbAvis} avis
            </p>
            <div className="mt-4 space-y-3">
              {a.avis.length ? (
                a.avis.map((v) => (
                  <article key={v.auteur} className="rounded-2xl bg-card p-4 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-x-3">
                      <p className="flex flex-wrap items-center gap-2 font-bold">
                        {v.auteur}
                        {v.experience === "prestation" ? (
                          <span className="rounded-full bg-success/10 px-2 py-0.5 text-[11px] text-success">
                            Prestation confirmée
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                            Avis non vérifié
                          </span>
                        )}
                      </p>
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
                    <Signaler cible="avis" label="Signaler cet avis" />
                  </article>
                ))
              ) : (
                <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">
                  Aucun avis pour l’instant.
                </p>
              )}
            </div>
            <Link
              href={`/artisans/${a.id}/evaluer`}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-primary py-3 text-sm font-bold text-primary"
            >
              <PenLine className="size-4" /> Évaluer {a.nom.split(" ")[0]}
            </Link>
            <Signaler cible="profil" label="Signaler ce profil" />
          </>
        }
      />

      {/* Bouton fixe orange */}
      <div className="fixed inset-x-0 bottom-4 z-40 px-5 md:static md:mt-8 md:px-0">
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <Link
            href={`/devis/nouveau?artisan=${a.id}`}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-base font-bold text-primary-foreground shadow-lg md:px-6 md:shadow-none"
          >
            <FileText className="size-5" /> Devis
          </Link>
          <ContactButton
            artisan={toContact(a)}
            label={`Contactez ${a.nom.split(" ")[0]}`}
            className="block w-full rounded-xl bg-accent py-4 text-center text-base font-bold text-accent-foreground shadow-lg md:shadow-none"
          />
        </div>
      </div>
      </ProfilVerrou>
    </div>
  );
}
