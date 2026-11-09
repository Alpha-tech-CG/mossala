import Link from "next/link";
import { Logo } from "./Header";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="h-20" />
          <p className="mt-4 max-w-sm text-sm text-muted-foreground">
            Les bonnes adresses, les vrais avis, les bons professionnels. Gratuit pour les particuliers et
            les professionnels dans sa version de base.
          </p>
        </div>
        <div className="text-sm">
          <p className="font-bold">Clients</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link href="/recherche">Trouver un artisan</Link></li>
            <li><Link href="/metiers">Tous les métiers</Link></li>
            <li><Link href="/messages">Mes messages</Link></li>
            <li><Link href="/quincaillerie">Quincaillerie</Link></li>
            <li><Link href="/premium">Artico Premium</Link></li>
            <li><Link href="/profil">Mon compte</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-bold">Professionnels</p>
          <ul className="mt-3 space-y-2 text-muted-foreground">
            <li><Link href="/pro/inscription">Devenir artisan partenaire</Link></li>
            <li><Link href="/pro/inscription?type=boutique">Inscrire ma boutique</Link></li>
            <li><Link href="/metiers#proposer">Proposer un métier</Link></li>
            <li><Link href="/pro/espace">Mon espace pro</Link></li>
            <li><Link href="/annonceurs">Annoncer sur Artico</Link></li>
          </ul>
        </div>
      </div>
      <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-border px-5 py-5 text-center text-xs text-muted-foreground">
        <span>© 2026 Artico · Brazzaville, République du Congo</span>
        <span aria-hidden>·</span>
        <Link href="/confidentialite" className="font-semibold underline-offset-2 hover:text-foreground hover:underline">
          Politique de confidentialité
        </Link>
      </p>
    </footer>
  );
}
