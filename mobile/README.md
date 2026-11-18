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

## Ce qui est propre à l’appli

Dans l’appli (agent utilisateur « ArtopifApp »), le site change d’habillage : barre d’onglets
en bas, pas de pied de page, et l’accueil devient le fil des réalisations.

| Onglet | Page | Rôle |
|---|---|---|
| Accueil | `/appli` | Fil des réalisations des artisans, façon réseau pro : photos, notes de 1 à 5 étoiles, devis, partage |
| Près de moi | `/appli/proches` | GPS du téléphone → quartier de Brazzaville → artisans classés par distance |
| Devis photo | `/appli/photo` | Photo du problème → métier → artisan le plus proche → demande de devis avec les photos |
| Messages | `/messages` | Messagerie |
| Compte | `/profil` | Compte |

S’y ajoutent les **notifications push** : nouveau message, nouvelle demande de devis, devis reçu.

**Aperçu dans un navigateur** : ouvrir n’importe quelle page avec `?appli=1`
(par exemple http://localhost:3000/appli?appli=1, en vue téléphone) ; `?appli=0` pour revenir au site.

En base (Firestore) :
- `notesRealisations/{proId_realisationId_uid}` : la note d’un client (une par réalisation, modifiable) ;
- `statsRealisations/{proId_realisationId}` : somme et nombre des notes, tenus par la Cloud Function `statsNoteRealisation` ;
- `appareils/{jetonFCM}` : téléphones à prévenir ;
- `demandes/{id}.photos` : photos d’une demande de devis (Storage `demandes/{uid}/…`).

Après modification : `firebase deploy --only firestore:rules,storage,functions`.

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

## 3. Notifications push (Firebase Cloud Messaging)

Sans ces fichiers, l’appli fonctionne mais sans notifications push :

- **Android** : Firebase console → Paramètres du projet → ajouter une appli Android
  `cg.artopif.app` → télécharger `google-services.json` dans `android/app/`.
- **iOS** : ajouter une appli iOS `cg.artopif.app` → télécharger `GoogleService-Info.plist`
  et l’ajouter dans Xcode à la cible *App* ; dans *Signing & Capabilities*, ajouter
  *Push Notifications* ; envoyer la clé APNs (compte Apple Developer → Keys) dans
  Firebase console → Cloud Messaging.

## 4. Android

Prérequis : [Android Studio](https://developer.android.com/studio) (SDK + JDK 21).

```bash
npm run mobile:android
```

Android Studio s’ouvre : *Run* pour lancer sur un téléphone ou un émulateur.
Pour le Play Store : *Build → Generate Signed App Bundle* (fichier `.aab`), en gardant
précieusement la clé de signature. Avant chaque nouvelle version, augmenter
`versionCode` et `versionName` dans `android/app/build.gradle`.

## 5. iOS

Prérequis : un Mac avec Xcode, et un compte Apple Developer (99 $/an).

```bash
npm install
npm run mobile:ios
```

Dans Xcode : choisir l’équipe (*Signing & Capabilities*), puis *Product → Archive* et
*Distribute App* pour TestFlight / App Store. Le numéro de version se règle dans l’onglet
*General* de la cible *App*.

## 6. À savoir pour la validation Apple

Apple refuse parfois une appli qui n’est « qu’un site dans une coque » (règle 4.2). Les fonctions propres à l’appli ci-dessus (notifications push, localisation, appareil photo,
partage natif, barre d’onglets) répondent à cette règle. Mettez-les en avant dans les
captures d’écran et la description de la fiche.

## Changer l’icône

Remplacer les fichiers de `assets/` (`icon-only.png` 1024×1024, `icon-foreground.png`,
`icon-background.png`, `splash.png` 2732×2732), puis `npm run mobile:assets`.
