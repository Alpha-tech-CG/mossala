import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Applications iOS et Android (Capacitor).
 *
 * L'appli est une coque native qui charge le site Next.js déployé : le site
 * a besoin d'un serveur (pages dynamiques, cacheComponents), il ne peut donc
 * pas être embarqué en fichiers statiques. Avantages : une seule base de code,
 * et chaque déploiement du site met l'appli à jour sans repasser par les stores.
 *
 * L'adresse du site vient de la variable APP_URL, lue au moment de `npx cap sync` :
 *   APP_URL=https://www.exemple.cg npx cap sync
 * (ou dans .env.mobile, voir le README mobile/README.md).
 */
try {
  process.loadEnvFile(".env.mobile");
} catch {
  // pas de fichier .env.mobile : on se contente des variables d'environnement
}

const appUrl = process.env.APP_URL?.replace(/\/$/, "");

if (!appUrl) {
  console.warn(
    "\n[capacitor] APP_URL n'est pas défini : l'appli affichera la page hors ligne.\n" +
      "            Exemple : APP_URL=https://www.exemple.cg npx cap sync\n",
  );
}

const config: CapacitorConfig = {
  appId: "cg.artopif.app",
  appName: "Artopif",
  // Page locale de secours (affichée si le site ne répond pas).
  webDir: "mobile/www",
  server: appUrl
    ? {
        url: appUrl,
        // Liens vers d'autres domaines (WhatsApp, cartes…) : ouverts hors de l'appli.
        // Les liens tel: et sms: ouvrent le téléphone / la messagerie.
        errorPath: "hors-ligne.html",
        cleartext: appUrl.startsWith("http://"), // uniquement pour tester en local
      }
    : undefined,
  backgroundColor: "#14213d",
  // Permet au site de savoir qu'il tourne dans l'appli (navigator.userAgent).
  appendUserAgent: "ArtopifApp",
  ios: {
    // Le site n'utilise pas viewport-fit=cover : on laisse iOS garder le contenu
    // hors de l'encoche et de la barre d'accueil.
    contentInset: "always",
    limitsNavigationsToAppBoundDomains: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SystemBars: {
      insetsHandling: "css",
      style: "DARK",
    },
    SplashScreen: {
      launchShowDuration: 1200,
      launchAutoHide: true,
      backgroundColor: "#ffffff",
      showSpinner: false,
      androidScaleType: "CENTER_INSIDE",
    },
  },
};

export default config;
