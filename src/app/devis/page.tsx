import type { Metadata } from "next";
import Link from "next/link";
import { Check, X } from "lucide-react";
import { Avatar, BackHeader, Rating, VerifiedBadge } from "@/components/ui";
import { fcfa, getArtisan, metierLabel } from "@/lib/data";

export const metadata: Metadata = { title: "Devis reçus — ArtisanBrazza" };

const devis = [
  { artisan: "jean-claude-mbemba", total: 45000, delai: "Sous 24 h", duree: "½ journée", materiaux: true, paiement: "50 % à l’arrivée", recommande: true },
  { artisan: "armel-bikouta", total: 52000, delai: "Sous 48 h", duree: "½ journée", materiaux: true, paiement: "À la fin des travaux" },
  { artisan: "rostand-ondongo", total: 38000, delai: "Sous 3 jours", duree: "1 journée", materiaux: false, paiement: "À la fin des travaux" },
];

export default function DevisRecus() {
  return (
    <div className="mx-auto max-w-5xl px-5 pt-4 pb-10 md:pt-8">
      <BackHeader title="Devis reçus" />
      <p className="mt-3 text-sm text-muted-foreground">
        3 artisans ont répondu à votre demande · Fuite d’eau, Bacongo
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        {devis.map((d) => {
          const a = getArtisan(d.artisan)!;
          return (
            <article
              key={d.artisan}
              className={`flex flex-col rounded-2xl bg-card p-5 shadow-sm ${d.recommande ? "ring-2 ring-primary" : ""}`}
            >
              {d.recommande && (
                <span className="mb-3 w-fit rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">
                  Recommandé
                </span>
              )}
              <div className="flex items-center gap-3">
                <Avatar a={a} className="size-14 shrink-0 rounded-full" />
                <div className="min-w-0">
                  <Link href={`/artisans/${a.id}`} className="block truncate font-bold hover:underline">
                    {a.nom}
                  </Link>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {metierLabel(a.metier).artisan} · <Rating value={a.note} />
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <VerifiedBadge />
              </div>
              <dl className="mt-4 divide-y divide-border border-y border-border text-sm">
                {[
                  ["Total du devis", <span key="t" className="text-lg font-bold text-primary">{fcfa(d.total)}</span>],
                  ["Délai d’intervention", d.delai],
                  ["Durée estimée", d.duree],
                  [
                    "Matériaux inclus",
                    d.materiaux ? (
                      <span key="m" className="flex items-center gap-1 font-semibold text-success"><Check className="size-4" /> Oui</span>
                    ) : (
                      <span key="m" className="flex items-center gap-1 font-semibold text-destructive"><X className="size-4" /> Non</span>
                    ),
                  ],
                  ["Paiement", d.paiement],
                ].map(([k, v]) => (
                  <div key={k as string} className="flex items-center justify-between gap-2 py-2.5">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-auto pt-4">
                <button className="w-full rounded-xl border border-border py-3 text-sm font-bold">
                  Voir le détail
                </button>
                <button className="mt-2 w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground">
                  Accepter ce devis
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Les prix sont fixés librement par chaque artisan. Toute modification créera une nouvelle
        version que vous devrez accepter.
      </p>
    </div>
  );
}
