import Image from "next/image";

/** Photo d'une réalisation : fichier du site, ou photo envoyée par l'artisan. */
export function PhotoRealisation({ src, alt, className, sizes }: { src: string; alt: string; className: string; sizes?: string }) {
  // Photos envoyées par l'artisan (data:, blob:, ou stockage Supabase) : affichées telles quelles.
  if (!src.startsWith("/"))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  return <Image src={src} alt={alt} width={800} height={600} sizes={sizes} className={className} />;
}
