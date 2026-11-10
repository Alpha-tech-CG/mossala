import type { Metadata } from "next";
import Link from "next/link";
import { Eye, Inbox, MapPin, Navigation, PhoneCall, Sparkles, Wrench } from "lucide-react";
import { Avatar, SectionTitle } from "@/components/ui";
import { getArtisan } from "@/lib/data";
import { ARTISAN_DEMO_ID, JOUR_DEMO, demandes, rendezVous, statsArtisan } from "@/lib/pro-data";
import { DemandeCard } from "./shared";
import { DispoToggle } from "./widgets";

export const metadata: Metadata = { title: "Mon espace artisan — Artopif" };

export default function EspaceAccueil() {
  const a = getArtisan(ARTISAN_DEMO_ID)!;
  const nouvelles = demandes.filter((d) => d.statut === "nouvelle");
  const prochain = rendezVous.find((r) => r.jour === JOUR_DEMO && r.statut !== "confirme") ?? rendezVous[0];

  const stats = [
    { Icon: Inbox, n: nouvelles.length, l: "Nouvelles demandes", accent: true },
    { Icon: Eye, n: statsArtisan.vuesProfil, l: "Vues du profil (30 j)" },
    { Icon: a.numeroPublic ? PhoneCall : Wrench, n: a.numeroPublic ? statsArtisan.appelsRecus : statsArtisan.chantiersMois, l: a.numeroPublic ? "Appels reçus (30 j)" : "Chantiers ce mois" },
  ];

  return (
    <div className="space-y-8">
      {/* Bonjour */}
      <div className="flex items-center gap-4">
        <Avatar a={a} className="size-14 rounded-full ring-2 ring-white shadow" />
        <div>
          <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Espace artisan</p>
          <h1 className="font-serif text-3xl leading-tight">Bonjour, {a.nom.split(" ")[0].replace("-", "‑") /* trait d'union insécable */}</h1>
        </div>
      </div>

      <DispoToggle quartier={a.quartier} />

      {/* Chiffres */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ Icon, n, l, accent }) => (
          <div
            key={l}
            className={`rounded-2xl p-3 shadow-sm ring-1 sm:p-4 ${accent ? "bg-primary text-white ring-primary" : "bg-card ring-black/[0.03]"}`}
          >
            <Icon className={`size-5 ${accent ? "text-white/80" : "text-primary"}`} />
            <p className="mt-2 font-serif text-3xl leading-none">{n}</p>
            <p className={`mt-1 text-[11px] leading-tight sm:text-xs ${accent ? "text-white/80" : "text-muted-foreground"}`}>{l}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_340px]">
        <section>
          <SectionTitle eyebrow="À traiter" title="Nouvelles demandes" href="/pro/espace/demandes" />
          <div className="mt-4 space-y-3">
            {nouvelles.map((d) => (
              <DemandeCard key={d.id} d={d} />
            ))}
            {!nouvelles.length && (
              <p className="rounded-2xl bg-card p-5 text-sm text-muted-foreground shadow-sm">Aucune nouvelle demande.</p>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          {/* Prochain chantier (maquette validée) */}
          <div className="rounded-2xl bg-foreground p-5 text-white shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">Prochain chantier</p>
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold">Lun. · {prochain.heure}</span>
            </div>
            <p className="mt-3 font-serif text-2xl leading-tight">{prochain.titre}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-white/75">
              <MapPin className="size-4" /> {prochain.lieu} · {prochain.client}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prochain.lieu + ", Brazzaville")}`}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-sm font-bold text-foreground"
            >
              <Navigation className="size-4" /> Itinéraire
            </a>
          </div>

          {/* Conseil profil */}
          <Link
            href="/pro/espace/profil"
            className="block rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md"
          >
            <p className="flex items-center gap-2 font-bold">
              <Sparkles className="size-4 text-accent-ink" /> Profil complété à 80 %
            </p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-4/5 rounded-full bg-accent" />
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Ajoutez 2 réalisations en photo pour apparaître plus haut dans les résultats.
            </p>
          </Link>
        </aside>
      </div>
    </div>
  );
}
