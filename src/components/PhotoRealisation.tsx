import Image from "next/image";

/** Photo d'une réalisation : fichier du site ou photo envoyée par l'artisan (data:). */
export function PhotoRealisation({ src, alt, className, sizes }: { src: string; alt: string; className: string; sizes?: string }) {
  if (src.startsWith("data:") || src.startsWith("blob:"))
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} />;
  return <Image src={src} alt={alt} width={800} height={600} sizes={sizes} className={className} />;
}
