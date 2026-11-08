import Image from "next/image";

/**
 * Mur de photos d'artisans en arrière-plan du hero, sur toute la largeur.
 * Les photos sont harmonisées (saturation, contraste et luminosité réduits,
 * légère teinte chaude) pour rester visibles sans concurrencer le texte.
 * Pur CSS ; chaque colonne est dupliquée pour une boucle sans couture.
 */

const photos = [
  "/images/jean-claude.jpg",
  "/images/patrick.jpg",
  "/images/divine.jpg",
  "/images/marcel.jpg",
  "/images/ciment.jpg",
  "/images/peinture.jpg",
];

// Ordre différent par colonne pour éviter deux photos identiques côte à côte
const rotate = (n: number) => [...photos.slice(n), ...photos.slice(0, n)];

const columns = [
  { shift: 0, duration: 60, cls: "block" },
  { shift: 3, duration: 70, reverse: true, cls: "block" },
  { shift: 1, duration: 64, cls: "block" },
  { shift: 4, duration: 74, reverse: true, cls: "hidden md:block" },
  { shift: 2, duration: 66, cls: "hidden lg:block" },
  { shift: 5, duration: 72, reverse: true, cls: "hidden xl:block" },
];

export function HeroMosaic() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-20 flex gap-3 px-3 md:gap-4 md:px-4">
      {columns.map((c, i) => (
        <div key={i} className={`min-w-0 flex-1 ${c.cls} ${i % 2 ? "-mt-40" : ""}`}>
          <div
            className="mosaic-col flex flex-col"
            style={{
              animationDuration: `${c.duration}s`,
              animationDirection: c.reverse ? "reverse" : "normal",
            }}
          >
            {[0, 1].map((copy) =>
              rotate(c.shift).map((src, j) => (
                <div key={`${copy}-${j}`} className="pb-3 md:pb-4">
                  <div className="relative aspect-[3/4] overflow-hidden rounded-2xl">
                    <Image
                      src={src}
                      alt=""
                      fill
                      sizes="(min-width: 1280px) 16vw, (min-width: 768px) 25vw, 33vw"
                      className="hero-photo object-cover"
                    />
                  </div>
                </div>
              )),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
