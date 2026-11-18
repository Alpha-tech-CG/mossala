# Mossala — artisans et quincaillerie à Brazzaville

Plateforme de mise en relation entre les habitants de Brazzaville et des artisans vérifiés
(141 métiers en 11 secteurs), avec un annuaire de quincailleries partenaires à prix affichés.

## Fonctionnement

- **Contactez** : appel direct ou WhatsApp si l'artisan a rendu son numéro public ;
  sinon message sur la plateforme, l'artisan est prévenu par WhatsApp et SMS.
- **Quota client** : 5 messages gratuits par mois, puis accès illimité à 500 FCFA pour 30 jours.
- **Quincaillerie** : catalogue à prix fixe, réservation avec code de retrait, paiement au retrait.
- Aucune commission sur les prestations des artisans.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind CSS 4 · lucide-react.

**Backend de production : Firebase** (projet `mossala-6f297`) :

- **Connexion par code à usage unique**, au choix **par SMS** (Firebase Authentication) ou **par email**
  (Cloud Functions + SMTP) ;
- **Firestore** : comptes, profils pros, réalisations, messagerie, devis (temps réel) ;
- **Storage** : photos des réalisations ;
- **Cloud Functions** : code email et alertes WhatsApp/SMS (Africa's Talking).

Sans clés Firebase dans `.env.local`, le site tourne en **maquette** (données dans le navigateur).
Mise en production pas à pas : [`firebase-functions/README.md`](firebase-functions/README.md).
Les pages passent par `src/lib/backend/`.

## Démarrer

```bash
npm install
npm run dev
```

Puis ouvrir http://localhost:3000.

## Où modifier quoi

| Fichier | Contenu |
|---|---|
| `src/lib/metiers.ts` | Catalogue des secteurs et métiers (ajouter un métier ici) |
| `src/lib/metierIcons.ts` | Icône de chaque métier |
| `src/lib/data.ts` | Données de démonstration (artisans, boutiques, produits) et règles du quota |
| `src/lib/devis.ts` | Demandes de devis en langage naturel, devis en rubriques/lignes, calculs (maquette navigateur) |
| `src/components/devis/` | Éditeur de devis (artisan et boutique) et affichage imprimable du devis |
| `src/lib/realisations.ts` | Réalisations publiées par les artisans (onglet « Réalisations » du profil) |
| `src/lib/backend/actif.ts` | Interrupteur maquette / production (`BACKEND_ACTIF`) et configuration Firebase |
| `src/lib/backend/firebase.ts` | Connexion par code SMS ou email, accès Firestore et Storage |
| `src/lib/backend/modele.ts` | Collections Firestore et conversions |
| `src/components/ConnexionCode.tsx` | Formulaire de connexion par code (onglets SMS / email) |
| `firebase-functions/` | Cloud Functions : code email, alertes WhatsApp/SMS — mode d’emploi dans son README |
| `firestore.rules` · `storage.rules` | Règles de sécurité — tests : `npm run test:rules` |
| `src/lib/session.ts` · `src/lib/pro-connecte.ts` | Compte connecté, et pro dont on affiche l’espace |
| `src/lib/quota.ts` | Compteur de messages (maquette navigateur, à déplacer côté serveur) |
| `src/components/Hero.tsx` | Hero de l'accueil et mur de photos |

## À brancher

- Quota de messages et paiement Mobile Money (MTN MoMo, Airtel Money) côté serveur.
- Back-office : métiers, propositions de métiers, modération des avis.

## Applications mobiles

Versions iOS et Android (Capacitor) qui affichent le site déployé : voir [`mobile/README.md`](mobile/README.md).
