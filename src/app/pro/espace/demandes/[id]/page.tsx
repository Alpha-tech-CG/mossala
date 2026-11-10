import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Banknote, CalendarDays, Camera, MapPin } from "lucide-react";
import { BackHeader } from "@/components/ui";
import { demandes, getDemande } from "@/lib/pro-data";
import { UrgenceChip, initialesClient } from "../../shared";
import { ActionsDemande } from "./ActionsDemande";

export const instant = false;
export const metadata: Metadata = { title: "Demande reçue — Artopif" };

export function generateStaticParams() {
  return demandes.map((d) => ({ id: d.id }));
}

export default async function DemandeDetail(props: PageProps<"/pro/espace/demandes/[id]">) {
  const d = getDemande((await props.params).id);
  if (!d) notFound();

  const infos = [
    { Icon: CalendarDays, l: "Date souhaitée", v: d.dateSouhaitee },
    { Icon: MapPin, l: "Quartier", v: d.quartier },
    ...(d.budget ? [{ Icon: Banknote, l: "Budget indicatif", v: d.budget }] : []),
    ...(d.photos.length ? [{ Icon: Camera, l: "Photos jointes", v: `${d.photos.length} photo${d.photos.length > 1 ? "s" : ""}` }] : []),
  ];

  return (
    <div className="mx-auto max-w-2xl">
      <BackHeader title="Demande reçue" href="/pro/espace/demandes" />

      <div className="mt-5 rounded-2xl bg-card p-5 shadow-sm ring-1 ring-black/[0.03]">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-lg text-primary">
            {initialesClient(d.client)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-bold">{d.client}</p>
            <p className="text-xs text-muted-foreground">
              {d.quartier} · reçue {d.recu}
            </p>
          </div>
          <UrgenceChip u={d.urgence} />
        </div>
        <p className="mt-4 font-serif text-lg leading-snug">« {d.message} »</p>

        <dl className="mt-5 divide-y divide-border border-y border-border">
          {infos.map(({ Icon, l, v }) => (
            <div key={l} className="flex items-center gap-3 py-3 text-sm">
              <Icon className="size-4 text-primary" />
              <dt className="text-muted-foreground">{l}</dt>
              <dd className="ml-auto text-right font-semibold">{v}</dd>
            </div>
          ))}
        </dl>

        {d.photos.length > 0 && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {d.photos.map((p) => (
              <Image key={p} src={p} alt="Photo jointe par le client" width={300} height={300} className="aspect-square rounded-xl object-cover" />
            ))}
          </div>
        )}
      </div>

      <ActionsDemande prenom={d.client.split(" ")[0]} telephone={d.telephone} statutInitial={d.statut} />
    </div>
  );
}
