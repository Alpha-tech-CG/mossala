"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Camera, Home, MapPin, MessagesSquare, UserRound } from "lucide-react";
import { useAppli } from "@/lib/appli";
import { useNotificationsPush } from "@/lib/push";

const onglets = [
  { href: "/appli", label: "Accueil", Icon: Home, actif: (p: string) => p === "/appli" },
  { href: "/appli/proches", label: "Près de moi", Icon: MapPin, actif: (p: string) => p.startsWith("/appli/proches") },
  { href: "/appli/photo", label: "Devis photo", Icon: Camera, actif: (p: string) => p.startsWith("/appli/photo"), centre: true },
  { href: "/messages", label: "Messages", Icon: MessagesSquare, actif: (p: string) => p.startsWith("/messages") },
  { href: "/profil", label: "Compte", Icon: UserRound, actif: (p: string) => p.startsWith("/profil") },
];

/**
 * Barre d'onglets de l'application mobile. Toujours rendue, mais visible seulement dans
 * l'appli (CSS [data-appli] .barre-appli) : pas de clignotement au chargement.
 * Dans l'appli, l'accueil du site (/) laisse la place au fil des réalisations (/appli).
 */
export function BarreAppli() {
  const path = usePathname();
  const router = useRouter();
  const appli = useAppli();
  useNotificationsPush(appli);

  useEffect(() => {
    if (appli && path === "/") router.replace("/appli");
  }, [appli, path, router]);

  return (
    <nav
      aria-label="Navigation de l'application"
      className="barre-appli fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md"
    >
      <ul className="mx-auto flex w-full max-w-lg items-end justify-around px-1">
        {onglets.map(({ href, label, Icon, actif, centre }) => {
          const on = actif(path);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={on ? "page" : undefined}
                className={`flex flex-col items-center gap-0.5 pt-2 pb-2 text-[11px] font-semibold transition-colors ${
                  on ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {centre ? (
                  <span className="-mt-6 mb-0.5 flex size-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg ring-4 ring-card">
                    <Icon className="size-6" />
                  </span>
                ) : (
                  <Icon className={`size-6 ${on ? "stroke-[2.4]" : ""}`} />
                )}
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
