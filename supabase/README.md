# Artopif — base de données Supabase

Ce dossier contient la base de données de production : comptes clients, profils des
artisans et boutiques, réalisations, messagerie et devis, avec leurs règles d'accès (RLS),
et la fonction serveur qui envoie les alertes **WhatsApp** et **SMS**.

## Comment ça s'articule

- **Connexion par code SMS : Firebase Authentication** (projet `mossala-6f297`).
- **Données : Supabase.** Supabase accepte le jeton Firebase (« Third-party auth »).
  L'identifiant d'un utilisateur est son **uid Firebase** (un texte) : les règles RLS
  utilisent `public.moi()` et le numéro vérifié `public.mon_telephone()`.
- **Interrupteur automatique** : tant que `NEXT_PUBLIC_SUPABASE_URL` et
  `NEXT_PUBLIC_SUPABASE_ANON_KEY` sont vides, le site reste en **maquette** (tout est gardé
  dans le navigateur). Dès qu'ils sont renseignés, les comptes, les inscriptions pro, la
  messagerie, les devis et les réalisations passent par la base.
- Les **artisans et boutiques de démonstration** (`src/lib/data.ts`) n'existent pas dans la
  base : les échanges avec eux restent en maquette, même en production. Les vrais pros
  apparaissent dans la recherche et ont leur profil public une fois **vérifiés** par l'équipe.

## Ce qu'il y a ici

| Fichier | Contenu |
|---|---|
| `migrations/0001_socle.sql` | `comptes`, `pros`, `pros_prive`, `realisations`, bucket photos `realisations` |
| `migrations/0002_messagerie.sql` | `conversations`, `messages`, temps réel, déclencheur d'alerte |
| `migrations/0003_devis.sql` | `demandes_devis`, `devis`, transitions de statut, alertes |
| `functions/notifier/` | Envoi WhatsApp puis SMS (Africa's Talking, variante Twilio) |
| `../firebase-functions/` | Ajoute `role: "authenticated"` au jeton Firebase (requis par Supabase) |

## Mise en route (une fois pour toutes)

1. **Créer le projet Supabase** (offre gratuite pour commencer). Récupérer, dans
   *Project Settings → API* : l'URL du projet et la clé **anon** (publique).
2. **Relier Firebase** : *Authentication → Sign In / Providers → Third-party auth →
   Firebase*, avec l'identifiant de projet `mossala-6f297`.
3. **Appliquer le schéma** : `supabase db push`, ou coller dans le *SQL Editor* les fichiers
   `0001`, `0002` puis `0003`, dans l'ordre.
4. **Déployer la Cloud Function Firebase** qui pose le rôle (formule Blaze requise) :
   ```bash
   cd firebase-functions
   npm install
   npm run deploy
   ```
   Pour les comptes déjà créés : `npm run roles-existants` (avec une clé de compte de service).
5. **Côté application**, copier `.env.example` en `.env.local` et renseigner les clés Firebase
   et Supabase. En ligne, mettre les mêmes variables chez l'hébergeur.
6. **Vérifier les pros** : un nouveau pro est créé avec `statut = 'en_verification'`. Après
   contrôle de son identité, l'équipe passe son statut à `verifie` (*Table Editor → pros*) ;
   il apparaît alors dans la recherche (sous 5 minutes environ, le temps du cache).

## Alertes WhatsApp / SMS (facultatif au départ)

Sans cette partie, tout fonctionne mais personne n'est prévenu par SMS.

1. **Ouvrir un compte chez un fournisseur d'envoi** qui couvre le Congo :
   **Africa's Talking** (recommandé : SMS + WhatsApp) ou **Twilio**.
2. **Secrets du déclencheur** : *Project Settings → Vault*, créer
   - `functions_url` = `https://<project-ref>.functions.supabase.co`
   - `service_role_key` = la clé **service_role** (secrète, jamais côté navigateur).
3. **Déployer la fonction** et ses secrets :
   ```bash
   supabase functions deploy notifier --no-verify-jwt
   supabase secrets set AT_USERNAME=... AT_API_KEY=... AT_WHATSAPP_FROM=+242... AT_SENDER_ID=ARTOPIF SITE_URL=https://...
   ```

## Pourquoi l'envoi part du serveur

On n'appelle jamais le fournisseur SMS depuis le navigateur : sa clé secrète serait visible.
L'application écrit le message ou la demande dans Supabase ; un déclencheur appelle la
fonction `notifier`, qui contacte le fournisseur côté serveur.

## Pas encore dans la base

- Avis clients, signalements, favoris, quota de messages et paiement Mobile Money.
- Catalogue, stock et ventes des boutiques (l'espace boutique reste une démonstration,
  sauf l'onglet Devis) et la liste publique des boutiques inscrites.
- Back-office : la vérification des pros se fait pour l'instant dans le Table Editor.
