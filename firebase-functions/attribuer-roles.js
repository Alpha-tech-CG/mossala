"use strict";
// Donne role: "authenticated" à tous les comptes Firebase existants (à lancer une fois).
// Nécessite des identifiants admin : GOOGLE_APPLICATION_CREDENTIALS=<clé de compte de service>.
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");

initializeApp({ projectId: "mossala-6f297" });

(async () => {
  let page;
  let n = 0;
  do {
    const res = await getAuth().listUsers(1000, page);
    page = res.pageToken;
    for (const u of res.users) {
      if (u.customClaims?.role === "authenticated") continue;
      await getAuth().setCustomUserClaims(u.uid, { ...u.customClaims, role: "authenticated" });
      n++;
    }
  } while (page);
  console.log(`${n} compte(s) mis à jour.`);
})();
