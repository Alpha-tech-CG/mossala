// Tests des règles Firestore avec l'émulateur.
// Lancer : npm run test:rules
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "demo-mossala",
  firestore: { rules: readFileSync("firestore.rules", "utf8") },
});

const TEL = "+242066123456";
const alice = env.authenticatedContext("alice", { phone_number: TEL }).firestore();
const bob = env.authenticatedContext("bob", { phone_number: "+242055000000" }).firestore();
const anonyme = env.unauthenticatedContext().firestore();

const profil = (o = {}) => ({
  type: "artisan",
  nom: "Alice Test",
  metier: "plombier",
  zones: ["Bacongo"],
  numeroPublic: false,
  telephonePublic: null,
  statut: "en_verification",
  ...o,
});

let ok = 0;
let ko = 0;
async function cas(nom, promesse) {
  try {
    await promesse;
    ok++;
    console.log("  ✓", nom);
  } catch (e) {
    ko++;
    console.log("  ✗", nom, "→", e.message);
  }
}

console.log("Règles Firestore");
await cas("un anonyme ne peut pas créer de profil", assertFails(setDoc(doc(anonyme, "pros/alice"), profil())));
await cas("bob ne peut pas créer le profil d'alice", assertFails(setDoc(doc(bob, "pros/alice"), profil())));
await cas("alice ne peut pas se déclarer vérifiée", assertFails(setDoc(doc(alice, "pros/alice"), profil({ statut: "verifie" }))));
await cas(
  "numéro public : il doit être le numéro vérifié",
  assertFails(setDoc(doc(alice, "pros/alice"), profil({ numeroPublic: true, telephonePublic: "+242000000000" }))),
);
await cas(
  "numéro privé : il ne doit pas apparaître dans le profil public",
  assertFails(setDoc(doc(alice, "pros/alice"), profil({ numeroPublic: false, telephonePublic: TEL }))),
);
await cas("alice crée son profil (numéro privé)", assertSucceeds(setDoc(doc(alice, "pros/alice"), profil())));
await cas(
  "alice enregistre son numéro privé",
  assertSucceeds(setDoc(doc(alice, "pros/alice/prive/contact"), { telephone: TEL, alerteWhatsapp: true, alerteSms: true })),
);
await cas(
  "alice ne peut pas enregistrer un autre numéro que le sien",
  assertFails(setDoc(doc(alice, "pros/alice/prive/contact"), { telephone: "+242000000000" })),
);
await cas("tout le monde lit le profil public", assertSucceeds(getDoc(doc(anonyme, "pros/alice"))));
await cas("un anonyme ne lit pas le numéro privé", assertFails(getDoc(doc(anonyme, "pros/alice/prive/contact"))));
await cas("bob ne lit pas le numéro privé d'alice", assertFails(getDoc(doc(bob, "pros/alice/prive/contact"))));
await cas("alice lit son numéro privé", assertSucceeds(getDoc(doc(alice, "pros/alice/prive/contact"))));
await cas(
  "alice passe en numéro public",
  assertSucceeds(updateDoc(doc(alice, "pros/alice"), { numeroPublic: true, telephonePublic: TEL })),
);
await cas("alice ne peut pas changer son statut", assertFails(updateDoc(doc(alice, "pros/alice"), { statut: "verifie" })));
await cas("bob ne peut pas modifier le profil d'alice", assertFails(updateDoc(doc(bob, "pros/alice"), { nom: "Piraté" })));
await cas("les autres collections sont fermées", assertFails(setDoc(doc(alice, "admin/x"), { a: 1 })));

await env.cleanup();
console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
