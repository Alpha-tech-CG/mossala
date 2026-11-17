"use strict";
// Donne (ou retire) l'accès au backoffice /admin à un compte Artopif existant.
//
//   node donner-admin.js +242061234567            → donne l'accès (numéro vérifié par SMS)
//   node donner-admin.js equipe@artopif.cg        → donne l'accès (compte connecté par email)
//   node donner-admin.js +242061234567 --retirer  → retire l'accès
//
// La personne doit s'être connectée au moins une fois sur le site. Elle se reconnecte ensuite
// (ou attend une heure) pour que l'accès soit pris en compte.
// Identifiants admin requis : GOOGLE_APPLICATION_CREDENTIALS=<clé de compte de service>
// (console Firebase → Paramètres du projet → Comptes de service → Générer une clé privée).
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp({ projectId: "mossala-6f297" });

const [qui, option] = process.argv.slice(2);
if (!qui) {
  console.error("Usage : node donner-admin.js <téléphone +242… ou email> [--retirer]");
  process.exit(1);
}

(async () => {
  const auth = getAuth();
  const u = qui.includes("@") ? await auth.getUserByEmail(qui.trim().toLowerCase()) : await auth.getUserByPhoneNumber(qui.replace(/\s/g, ""));
  const claims = { ...u.customClaims };
  if (option === "--retirer") delete claims.admin;
  else claims.admin = true;
  await auth.setCustomUserClaims(u.uid, claims);
  console.log(`${u.phoneNumber ?? u.email} (${u.uid}) : accès au backoffice ${option === "--retirer" ? "retiré" : "donné"}.`);
})().catch((e) => {
  console.error(e.code === "auth/user-not-found" ? "Aucun compte avec ce numéro ou cet email : connectez-vous d'abord sur le site." : e);
  process.exit(1);
});
