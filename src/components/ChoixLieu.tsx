"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, MapPin } from "lucide-react";
import { VILLE_DEFAUT, getVille, lieuDepuis, villes, type Lieu } from "@/lib/data";

const CLE = "artico-lieu";

/** Ville et quartier choisis, lus dans l'URL (?ville=…&quartier=…). */
export function useLieu(): Lieu {
  const sp = useSearchParams();
  return lieuDepuis({ ville: sp.get("ville") ?? undefined, quartier: sp.get("quartier") ?? undefined });
}

/**
 * Sélecteur ville + quartier (quartier facultatif). Le choix est gardé dans l'URL, pour que
 * les liens et le partage conservent le lieu, et retenu sur l'appareil pour la visite suivante.
 */
export function ChoixLieu({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const lieu = useLieu();
  const quartiers = getVille(lieu.ville)?.quartiers ?? [];

  const aller = (l: Lieu, memoriser = true) => {
    const q = new URLSearchParams(sp.toString());
    if (l.ville === VILLE_DEFAUT) q.delete("ville");
    else q.set("ville", l.ville);
    if (l.quartier) q.set("quartier", l.quartier);
    else q.delete("quartier");
    const s = q.toString();
    router.replace(s ? `${path}?${s}` : path, { scroll: false });
    if (memoriser) {
      try {
        localStorage.setItem(CLE, JSON.stringify(l));
      } catch {}
    }
  };

  // Première visite sans lieu dans l'URL : on reprend le dernier lieu choisi sur cet appareil.
  useEffect(() => {
    if (sp.has("ville") || sp.has("quartier")) return;
    try {
      const memo = JSON.parse(localStorage.getItem(CLE) ?? "null") as Lieu | null;
      if (memo && (memo.ville !== VILLE_DEFAUT || memo.quartier)) aller(lieuDepuis(memo), false);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const select =
    "w-full appearance-none rounded-xl border border-border bg-card py-3 pr-9 pl-3 text-sm font-semibold shadow-sm focus:border-primary focus:outline-none";

  return (
    <div className={className}>
      {!compact && (
        <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
          <MapPin className="size-4 text-primary" /> Où êtes-vous ?
        </p>
      )}
      <div className="grid grid-cols-2 gap-2.5">
        <label className="relative">
          <span className="sr-only">Ville</span>
          <select
            value={lieu.ville}
            onChange={(e) => aller({ ville: e.target.value })}
            className={select}
          >
            {villes.map((v) => (
              <option key={v.nom} value={v.nom}>
                {v.nom}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </label>
        <label className="relative">
          <span className="sr-only">Quartier</span>
          <select
            value={lieu.quartier ?? ""}
            onChange={(e) => aller({ ville: lieu.ville, quartier: e.target.value || undefined })}
            disabled={!quartiers.length}
            className={`${select} disabled:opacity-60`}
          >
            <option value="">{quartiers.length ? "Tous les quartiers" : "Toute la ville"}</option>
            {quartiers.map((q) => (
              <option key={q} value={q}>
                {q}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
        </label>
      </div>
    </div>
  );
}
