import Link from "next/link";
import { BackHeader } from "./ui";

export function Bientot({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-2xl px-5 pt-4 pb-10 md:pt-8">
      <BackHeader title={title} />
      <div className="mt-6 rounded-2xl bg-card p-8 text-center shadow-sm">
        <p className="font-bold">Bientôt disponible</p>
        <p className="mt-2 text-sm text-muted-foreground">{text}</p>
        <Link
          href="/recherche"
          className="mt-5 inline-block rounded-xl bg-accent px-5 py-3 text-sm font-bold text-accent-foreground"
        >
          Trouver un artisan
        </Link>
      </div>
    </div>
  );
}
