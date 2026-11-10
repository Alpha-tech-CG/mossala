import Link from "next/link";
import Image from "next/image";
import { Bell } from "lucide-react";
import { MobileMenu } from "./MobileMenu";

export function Logo({ className = "h-11 md:h-12" }: { className?: string }) {
  return (
    <Link href="/" className="flex shrink-0 items-center" aria-label="Artopif, accueil">
      <Image
        src="/images/artopif-embleme.png"
        alt="Artopif"
        width={1076}
        height={470}
        priority
        className={`w-auto ${className}`}
      />
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
