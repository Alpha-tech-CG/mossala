"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  Home,
  LayoutGrid,
  Megaphone,
  MessageCircle,
  Search,
  Store,
  User,
  Wrench,
  X,
} from "lucide-react";

const liens = [
  { href: "/", label: "Accueil", Icon: Home },
  { href: "/recherche", label: "Trouver un artisan", Icon: Search },
  { href: "/metiers", label: "Tous les métiers", Icon: LayoutGrid },
  { href: "/quincaillerie", label: "Quincaillerie", Icon: Wrench },
  { href: "/messages", label: "Mes messages", Icon: MessageCircle },
  { href: "/services", label: "Nos services", Icon: Megaphone },
  { href: "/profil", label: "Mon compte", Icon: User },
];

/** Menu burger : remplace la barre de navigation du bas sur mobile. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  // true seulement côté client : le panneau est rendu dans <body> via un portail,
  // car le header (backdrop-blur) piégerait un élément en position fixe.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Fermer à chaque changement de page
  const [lastPath, setLastPath] = useState(path);
  if (path !== lastPath) {
    setLastPath(path);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Ouvrir le menu"
        aria-expanded={open}
        aria-controls="menu-mobile"
        className="flex size-10 flex-col items-center justify-center gap-[5px] rounded-full bg-card shadow-sm lg:hidden"
      >
        <span className="h-[2px] w-[18px] rounded-full bg-foreground" />
        <span className="h-[2px] w-[18px] rounded-full bg-foreground" />
        <span className="h-[2px] w-[12px] self-center rounded-full bg-foreground" />
      </button>

      {mounted &&
        createPortal(
          <>
            {/* Fond assombri */}
            <div
              onClick={() => setOpen(false)}
              aria-hidden
              className={`fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            />

            {/* Panneau */}
            <div
              id="menu-mobile"
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              inert={!open}
              className={`fixed inset-y-0 right-0 z-50 flex w-[86%] max-w-sm flex-col overflow-y-auto bg-cream shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
                open ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center justify-between px-5 pt-4">
                <p className="text-[10px] font-semibold tracking-[0.3em] text-accent-ink uppercase">
                  Menu
                </p>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Fermer le menu"
                  className="flex size-10 items-center justify-center rounded-full bg-white shadow-sm"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="mt-4 px-3">
                {liens.map(({ href, label, Icon }, i) => {
                  const active =
                    href === "/" ? path === "/" : path.startsWith(href);
                  return (
                    <Link
                      key={href}
                      href={href}
                      style={{
                        transitionDelay: open ? `${80 + i * 40}ms` : "0ms",
                      }}
                      className={`flex items-center gap-4 rounded-2xl px-3 py-3.5 transition-all duration-300 ${
                        open
                          ? "translate-x-0 opacity-100"
                          : "translate-x-6 opacity-0"
                      } ${active ? "bg-white shadow-sm" : "hover:bg-white/60"}`}
                    >
                      <span
                        className={`flex size-10 items-center justify-center rounded-full ${
                          active
                            ? "bg-primary text-white"
                            : "bg-secondary text-primary"
                        }`}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span
                        className={`font-serif text-xl ${active ? "text-primary" : ""}`}
                      >
                        {label}
                      </span>
                    </Link>
                  );
                })}
              </nav>

              <div className="mt-auto space-y-3 p-5">
                <Link
                  href="/recherche"
                  className="flex items-center justify-center gap-2 rounded-xl bg-accent py-4 font-bold text-accent-foreground"
                >
                  Contactez un artisan <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/pro"
                  className="flex items-center justify-center gap-2 rounded-xl border border-sand bg-white py-3.5 text-sm font-bold"
                >
                  <Store className="size-4" /> Espace professionnels
                </Link>
                <p className="pt-2 text-center text-xs text-muted-foreground">
                  Aucune commission · Brazzaville
                </p>
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
