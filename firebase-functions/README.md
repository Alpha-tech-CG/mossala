# Mise en production sur Firebase

Projet : `mossala-6f297` (formule **Blaze** obligatoire pour les Cloud Functions et l'envoi de SMS).

## 1. Console Firebase

1. **Authentication → Méthode de connexion** : activer **Téléphone** (codes SMS).
   - Paramètres → **Politique de région SMS** : autoriser au moins le Congo (+242).
   - Paramètres → **Domaines autorisés** : ajouter le domaine du site (ex. `artopif.cg`).
   - La connexion par email n'utilise **pas** le fournisseur « Adresse e-mail » : le code est géré
     par les Cloud Functions (`envoyerCodeEmail` / `verifierCodeEmail`).
2. **Firestore** : créer la base en mode production, de préférence en `europe-west1` (même région
   que les Cloud Functions, sinon changer `region` dans `index.js` et
   `NEXT_PUBLIC_FIREBASE_FUNCTIONS_REGION`).
3. **Storage** : créer le bucket par défaut (photos des réalisations).
4. **IAM (Google Cloud)** : donner au compte de service des fonctions
   (`<numéro-projet>-compute@developer.gserviceaccount.com`) le rôle
   **Créateur de jetons du compte de service** (`roles/iam.serviceAccountTokenCreator`).
   Sans lui, `verifierCodeEmail` ne peut pas créer le jeton de connexion.

## 2. Secrets et paramètres

Envoi des codes par email (n'importe quel SMTP : Brevo, Resend, Gmail, OVH…) :

```bash
firebase functions:secrets:set SMTP_UTILISATEUR
firebase functions:secrets:set SMTP_MOT_DE_PASSE
```

Alertes WhatsApp/SMS (Africa's Talking) :

```bash
firebase functions:secrets:set AT_USERNAME
firebase functions:secrets:set AT_API_KEY
```

Les paramètres non secrets (`SMTP_HOTE`, `SMTP_PORT`, `SMTP_EXPEDITEUR`, `AT_SENDER_ID`,
`AT_WHATSAPP_FROM`, `SITE_URL`) sont demandés au premier déploiement et enregistrés dans
`firebase-functions/.env.mossala-6f297`.

## 3. Déployer

```bash
cd firebase-functions && npm install && cd ..
firebase deploy --only firestore,storage,functions
```

Règles Firestore (+ index et suppression automatique des codes email expirés), règles Storage
et Cloud Functions partent ensemble.

## 4. Site Next.js

Renseigner les variables `NEXT_PUBLIC_FIREBASE_*` (voir `.env.example`) dans `.env.local` et chez
l'hébergeur. Dès que `NEXT_PUBLIC_FIREBASE_API_KEY` est rempli, le site quitte le mode maquette.

## Collections Firestore

| Collection | Contenu | Accès |
|---|---|---|
| `comptes/{uid}` | compte client | le titulaire |
| `pros/{uid}` | profil public artisan / boutique | public une fois `statut: "verifie"` |
| `pros/{uid}/prive/contact` | numéros, préférences d'alerte | le pro |
| `pros/{uid}/realisations/{id}` | réalisations | publiques si le pro est vérifié |
| `conversations/{client_pro}` · `messages/{id}` | messagerie | les deux participants |
| `demandes/{id}` | demande de devis + devis envoyé | client et pro |
| `brouillons/{id}` | devis en cours | le pro |
| `otpEmail/{hash}` | codes email (hachés, 10 min) | Cloud Functions seules |
| `avis/{type_cible_auteur}` | avis clients (un par client et par pro) | publics une fois `statut: "publie"` ; l'équipe modère |
| `contacts/{id}` | formulaire « Nous contacter » | tout visiteur écrit, l'équipe lit |
| `signalements/{id}` | profils et avis signalés | tout visiteur écrit, l'équipe lit |
| `demandesAnnonceurs/{id}` | « Être recontacté » (page Nos services) | tout visiteur écrit, l'équipe lit |
| `propositionsMetiers/{id}` | métiers proposés (page Tous les métiers) | tout visiteur écrit, l'équipe décide |
| `publicites/{emplacement}` | création de chaque espace publicitaire | publique ; l'équipe la règle |
| `journal/{id}` | actions de l'équipe dans le backoffice | l'équipe lit ; ni modifiable ni supprimable |

## Backoffice `/admin`

L'équipe y contrôle tout : avis (publier, refuser avec motif, confirmer l'expérience), professionnels
(vérifier, suspendre, voir le numéro privé), réalisations (marquer vérifiées), publicités (visuel image
ou vidéo envoyé dans le Storage `publicites/`, texte, lien, dates de diffusion), demandes d'annonceurs,
messages du formulaire de contact, signalements, métiers proposés et comptes clients. Chaque action est
inscrite au journal, et chaque liste s'exporte en CSV (Excel). Les messages privés et les devis restent
invisibles.

**Donner l'accès** à un membre de l'équipe (il doit s'être connecté une fois sur le site) :

```bash
cd firebase-functions
GOOGLE_APPLICATION_CREDENTIALS=chemin/vers/cle-compte-de-service.json node donner-admin.js +242061234567
```

La clé se télécharge dans la console : Paramètres du projet → Comptes de service → Générer une
nouvelle clé privée (à garder secrète, jamais dans le dépôt). `--retirer` enlève l'accès. La personne
se reconnecte ensuite pour que l'accès soit pris en compte.

Le formulaire de contact prévient l'équipe par email : renseigner `CONTACT_EQUIPE` au déploiement.
