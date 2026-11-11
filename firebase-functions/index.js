"use strict";
/**
 * Supabase lit le rôle Postgres dans le claim `role` du jeton Firebase. Sans lui, un
 * utilisateur connecté serait traité comme anonyme et les règles RLS le bloqueraient.
 * Chaque nouveau compte (connexion par SMS) reçoit donc role: "authenticated".
 *
 * Déploiement (projet mossala-6f297, formule Blaze requise pour les Cloud Functions) :
 *   cd firebase-functions && npm install && npm run deploy
 * Pour les comptes créés avant le déploiement : npm run roles-existants
 *
 * La fonction est asynchrone : le tout premier jeton n'a pas encore le claim. L'application
 * force donc le rafraîchissement du jeton juste après la connexion (getIdToken(true)).
 */
const functions = require("firebase-functions/v1");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp();

exports.roleSupabase = functions
  .region("europe-west1")
  .auth.user()
  .onCreate((user) => getAuth().setCustomUserClaims(user.uid, { role: "authenticated" }));
