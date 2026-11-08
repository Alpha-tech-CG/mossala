import Link from "next/link";
import { ChevronRight, MapPin } from "lucide-react";
import type { Demande, Urgence } from "@/lib/pro-data";

export const urgenceStyle: Record<Urgence, [string, string]> = {
  urgent: ["Urgent", "bg-destructive/10 text-destructive"],
  semaine: ["Cette semaine", "bg-secondary text-primary"],
  flexible: ["Flexible", "bg-muted text-muted-foreground"],
};

export function UrgenceChip({ u }: { u: Urgence }) {
  const [label, cls] = urgenceStyle[u];
  return <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${cls}`}>{label}</span>;
}

export const initialesClient = (nom: string) =>
  nom
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");

export function DemandeCard({ d }: { d: Demande }) {
  return (
    <Link
      href={`/pro/espace/demandes/${d.id}`}
      className="group block min-w-0 rounded-2xl bg-card p-4 shadow-sm ring-1 ring-black/[0.03] transition hover:shadow-md"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-secondary font-serif text-primary">
          {initialesClient(d.client)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="truncate font-bold">{d.client}</p>
            {d.statut === "nouvelle" ? (
              <UrgenceChip u={d.urgence} />
            ) : (
              <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-muted-foreground">
                {d.statut === "repondue" ? "Répondue" : "Déclinée"}
              </span>
            )}
          </div>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {d.quartier} · {d.recu}
          </p>
          <p className="mt-2 line-clamp-2 text-sm">{d.message}</p>
        </div>
      </div>
      <p className="mt-3 flex items-center justify-end gap-1 text-sm font-bold text-primary">
        {d.statut === "nouvelle" ? "Répondre" : "Voir"}
        <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
