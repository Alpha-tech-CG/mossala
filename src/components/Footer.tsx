import Link from "next/link";
import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Contactez directement des artisans de confiance et réservez vos matériaux au prix affiché.
            Aucune commission sur les prestations.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold">Clients</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link href="/recherche">Trouver un artisan</Link></li>
            <li><Link href="/metiers">Tous les métiers</Link></li>
            <li><Link href="/messages">Mes messages</Link></li>
            <li><Link href="/quincaillerie">Quincaillerie</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-bold">Professionnels</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link href="/pro/inscription">Devenir artisan partenaire</Link></li>
            <li><Link href="/pro/inscription?type=boutique">Inscrire ma boutique</Link></li>
            <li><Link href="/metiers#proposer">Proposer un métier</Link></li>
            <li><Link href="/pro/espace">Mon espace pro</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © 2026 ArtisanBrazza · Brazzaville, République du Congo
      </p>
    </footer>
  );
}
