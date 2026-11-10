import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

/**
 * Logo Artopif : le castor, et sous lui le nom en capitales Playfair espacées,
 * encadré de deux filets dorés (à la place de l'ancien « ARTICO » du logo).
 */
export function Logo({ grand = false }: { grand?: boolean }) {
  return (
    <Link href="/" className="flex w-fit shrink-0 flex-col items-center" aria-label="Artopif, accueil">
      <Image
        src="/images/artopif-embleme.png"
        alt=""
        width={1076}
        height={470}
        priority
        className={`w-auto ${grand ? "h-16" : "h-8 md:h-9"}`}
      />
      <span
        className={`flex items-center text-foreground ${grand ? "mt-1.5 gap-2.5" : "mt-0.5 gap-1.5"}`}
      >
        <span aria-hidden className={`h-px bg-accent ${grand ? "w-6" : "w-3"}`} />
        <span
          className={`font-serif leading-none font-bold uppercase ${
            grand ? "mr-[-0.3em] text-2xl tracking-[0.3em]" : "mr-[-0.26em] text-[13px] tracking-[0.26em] md:text-sm"
          }`}
        >
          Artopif
        </span>
        <span aria-hidden className={`h-px bg-accent ${grand ? "w-6" : "w-3"}`} />
      </span>
    </Link>
  );
}

const links = [
  { href: "/", label: "Accueil" },
  { href: "/recherche", label: "Trouver un artisan" },
  { href: "/quincaillerie", label: "Quincaillerie" },
  { href: "/messages", label: "Mes messages" },
  { href: "/services", label: "Nos services" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Logo />
        <nav className="hidden items-center gap-7 text-sm font-semibold whitespace-nowrap lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="relative text-muted-foreground transition-colors after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:bg-accent after:transition-all hover:text-foreground hover:after:w-full"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <button
            className="flex size-10 items-center justify-center rounded-full bg-card shadow-sm"
            aria-label="Notifications"
          >
            <Bell className="size-5" />
          </button>
          <Link
            href="/recherche"
            className="hidden rounded-full bg-accent px-5 py-2.5 text-sm font-bold whitespace-nowrap text-accent-foreground hover:brightness-95 lg:block"
          >
            Contactez un artisan
          </Link>
          <MobileMenu />
        </div>
      </div>
    </header>
  );
}
