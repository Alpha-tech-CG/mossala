import type { Metadata, Viewport } from "next";
import { Figtree, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { AccesModal } from "@/components/Acces";
import { SplashLoader } from "@/components/Loader";
import { Footer } from "@/components/Footer";

const figtree = Figtree({ variable: "--font-figtree", subsets: ["latin"] });
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Artico — Artisans de confiance et quincaillerie à Brazzaville",
  description:
    "Contactez des artisans de confiance par appel ou message et réservez vos matériaux au prix affiché.",
};

export const viewport: Viewport = { themeColor: "#14213d" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${figtree.variable} ${playfair.variable} antialiased`}>
      <body className="flex min-h-screen flex-col font-sans">
        <noscript>
          <style>{`.reveal{opacity:1;transform:none}.splash{display:none}`}</style>
        </noscript>
        <SplashLoader />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <AccesModal />
      </body>
    </html>
  );
}
