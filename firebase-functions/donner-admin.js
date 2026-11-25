"use strict";
// Désigne (ou retire) le RESPONSABLE de la console /admin pour un compte Artopif existant.
//
//   node donner-admin.js +242061234567            → responsable (owner : accès complet + gestion de l'équipe)
//   node donner-admin.js equipe@artopif.cg        → responsable (compte connecté par email)
//   node donner-admin.js +242061234567 --retirer  → retire l'accès responsable
//
// Le responsable gère ensuite les autres membres de l'équipe directement depuis la console
// (section « Équipe ») : ce script ne sert qu'à désigner le premier responsable (bootstrap).
//
// La personne doit s'être connectée au moins une fois sur le site. Elle se reconnecte ensuite
// (ou attend une heure) pour que l'accès soit pris en compte.
// Identifiants admin requis : GOOGLE_APPLICATION_CREDENTIALS=<clé de compte de service>
// (console Firebase → Paramètres du projet → Comptes de service → Générer une clé privée).
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp({ projectId: "mossala-6f297" });

const [qui, option] = process.argv.slice(2);
if (!qui) {
  console.error("Usage : node donner-admin.js <téléphone +242… ou email> [--retirer]");
  process.exit(1);
}

(async () => {
  const auth = getAuth();
  const db = getFirestore();
  const u = qui.includes("@") ? await auth.getUserByEmail(qui.trim().toLowerCase()) : await auth.getUserByPhoneNumber(qui.replace(/\s/g, ""));
  const claims = { ...u.customClaims };
  if (option === "--retirer") {
    delete claims.admin;
    delete claims.owner;
    await auth.setCustomUserClaims(u.uid, claims);
    await db.doc(`equipe/${u.uid}`).delete();
  } else {
    claims.admin = true;
    claims.owner = true;
    await auth.setCustomUserClaims(u.uid, claims);
    // Fiche d'équipe du responsable (role owner : accès complet, non modifiable depuis la console).
    await db.doc(`equipe/${u.uid}`).set(
      {
        nom: u.displayName || u.phoneNumber || u.email || "Responsable",
        identifiant: u.phoneNumber ?? u.email ?? u.uid,
        role: "owner",
        permissions: [],
        actif: true,
        parId: u.uid,
        creeLe: FieldValue.serverTimestamp(),
        majLe: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }
  console.log(`${u.phoneNumber ?? u.email} (${u.uid}) : responsable de la console ${option === "--retirer" ? "retiré" : "désigné"}.`);
})().catch((e) => {
  console.error(e.code === "auth/user-not-found" ? "Aucun compte avec ce numéro ou cet email : connectez-vous d'abord sur le site." : e);
  process.exit(1);
});
