# Applications mobiles iOS et Android

Les applis sont faites avec **Capacitor 8**. Ce sont des coques natives qui affichent
le site Next.js **déployé** (le site a besoin d’un serveur, il ne peut pas être embarqué
en fichiers statiques).

- Une seule base de code : chaque déploiement du site met l’appli à jour, sans repasser par les stores.
- On ne republie sur les stores que si l’on change l’icône, le nom, les permissions ou un plugin natif.
- Sans réseau, l’appli affiche `mobile/www/hors-ligne.html`.

| Élément | Valeur |
|---|---|
| Identifiant (bundle / package) | `cg.artopif.app` — **définitif après la première publication** |
| Nom affiché | Artopif |
| Configuration | `capacitor.config.ts` |
| Projet Android | `android/` (Android Studio) |
| Projet iOS | `ios/` (Xcode, Mac obligatoire) |
| Icône et écran de démarrage | sources dans `assets/`, générés avec `npm run mobile:assets` |

## 1. Indiquer l’adresse du site

Copier `.env.mobile.example` en `.env.mobile` et mettre l’adresse de production :

```
APP_URL=https://www.votre-domaine.cg
```

Puis `npm run mobile:sync`. Sans `APP_URL`, l’appli n’affiche que la page hors ligne.

Pour tester sur un téléphone avec le serveur de dev : `APP_URL=http://<IP-du-PC>:3000`
(le téléphone et le PC sur le même Wi-Fi).

## 2. Firebase

La connexion par SMS utilise reCAPTCHA sur le domaine du site : rien à changer tant que
`APP_URL` est un domaine déjà autorisé dans
*Firebase console → Authentication → Settings → Authorized domains*.

## 3. Android

Prérequis : [Android Studio](https://developer.android.com/studio) (SDK + JDK 21).

```bash
npm run mobile:android
```

Android Studio s’ouvre : *Run* pour lancer sur un téléphone ou un émulateur.
Pour le Play Store : *Build → Generate Signed App Bundle* (fichier `.aab`), en gardant
précieusement la clé de signature. Avant chaque nouvelle version, augmenter
`versionCode` et `versionName` dans `android/app/build.gradle`.

## 4. iOS

Prérequis : un Mac avec Xcode, et un compte Apple Developer (99 $/an).

```bash
npm install
npm run mobile:ios
```

Dans Xcode : choisir l’équipe (*Signing & Capabilities*), puis *Product → Archive* et
*Distribute App* pour TestFlight / App Store. Le numéro de version se règle dans l’onglet
*General* de la cible *App*.

## 5. À savoir pour la validation Apple

Apple refuse parfois une appli qui n’est « qu’un site dans une coque » (règle 4.2).
Pour mettre toutes les chances de son côté avant de soumettre :

- les notifications push (nouveaux messages, devis) via `@capacitor/push-notifications` ;
- le partage natif d’un profil d’artisan (`@capacitor/share`) ;
- une navigation adaptée au mobile (barre d’onglets en bas quand `navigator.userAgent`
  contient `ArtopifApp`).

## Changer l’icône

Remplacer les fichiers de `assets/` (`icon-only.png` 1024×1024, `icon-foreground.png`,
`icon-background.png`, `splash.png` 2732×2732), puis `npm run mobile:assets`.
