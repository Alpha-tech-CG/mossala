"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileText, Home, Inbox, MessagesSquare, User } from "lucide-react";
import { useDemandesDevis } from "@/lib/devis";
import { ARTISAN_DEMO_ID, demandes } from "@/lib/pro-data";
import { nonLus, useConversations } from "@/lib/messagerie";

const onglets = [
  { href: "/pro/espace", label: "Accueil", Icon: Home },
  { href: "/pro/espace/demandes", label: "Demandes", Icon: Inbox },
  { href: "/pro/espace/messages", label: "Messages", Icon: MessagesSquare },
  { href: "/pro/espace/devis", label: "Devis", Icon: FileText },
  { href: "/pro/espace/agenda", label: "Agenda", Icon: CalendarDays },
  { href: "/pro/espace/profil", label: "Profil", Icon: User },
];

/** Onglets de l'espace artisan (en haut, pas de barre en bas). */
export function ProNav() {
  const path = usePathname();
  const nouvelles = demandes.filter((d) => d.statut === "nouvelle").length;
  const conversations = useConversations(ARTISAN_DEMO_ID);
  const messages = (conversations ?? []).reduce((n, c) => n + nonLus(c, "artisan"), 0);
  const devis = (useDemandesDevis({ type: "artisan", id: ARTISAN_DEMO_ID }) ?? []).filter((d) => d.statut === "nouvelle").length;
  const badges: Record<string, number> = { Demandes: nouvelles, Messages: messages, Devis: devis };
  return (
    <nav
      aria-label="Espace artisan"
      className="sticky top-16 z-30 border-b border-border bg-background/90 backdrop-blur-md"
    >
      <div className="mx-auto grid max-w-5xl grid-cols-6 px-0.5 sm:flex sm:gap-1 sm:px-3">
        {onglets.map(({ href, label, Icon }) => {
          const actif = href === "/pro/espace" ? path === href : path.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={`relative flex flex-col items-center gap-1 px-0.5 py-2.5 text-[11px] font-semibold transition-colors sm:flex-row sm:gap-2 sm:px-3 sm:py-3.5 sm:text-sm ${
                actif ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="size-5 sm:size-4" />
              {label}
              {badges[label] > 0 && (
                <span className="absolute top-1.5 right-[calc(50%-22px)] flex size-4 items-center justify-center rounded-full bg-accent text-[9px] font-bold text-accent-foreground sm:static sm:size-5 sm:text-[10px]">
                  {badges[label]}
                </span>
              )}
              {actif && <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
