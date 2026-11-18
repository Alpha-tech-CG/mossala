// Tests des règles Firestore avec l'émulateur.
// Lancer : npm run test:rules
import { readFileSync } from "node:fs";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch } from "firebase/firestore";

const env = await initializeTestEnvironment({
  projectId: "demo-mossala",
  firestore: { rules: readFileSync("firestore.rules", "utf8") },
});

const TEL = "+242066123456";
// alice : artisane connectée par SMS · bob : client connecté par SMS · chloe : cliente connectée par code email
const alice = env.authenticatedContext("alice", { phone_number: TEL }).firestore();
const bob = env.authenticatedContext("bob", { phone_number: "+242055000000" }).firestore();
const chloe = env.authenticatedContext("chloe", { email: "chloe@exemple.com", email_verified: true }).firestore();
const anonyme = env.unauthenticatedContext().firestore();

const profil = (o = {}) => ({
  type: "artisan",
  nom: "Alice Test",
  metier: "plombier",
  zones: ["Bacongo"],
  ville: "brazzaville",
  quartier: "Bacongo",
  adresse: null,
  description: "",
  image: null,
  numeroPublic: false,
  telephonePublic: null,
  statut: "en_verification",
  creeLe: serverTimestamp(),
  ...o,
});
const compte = (o = {}) => ({
  prenom: "Bob",
  nom: null,
  telephone: "+242055000000",
  telephones: [{ numero: "+242055000000", whatsapp: true }],
  adresse: null,
  ville: null,
  quartier: null,
  email: null,
  creeLe: serverTimestamp(),
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

console.log("Profils professionnels");
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
await cas("alice lit son profil absent (pas encore de compte pro)", assertSucceeds(getDoc(doc(alice, "pros/alice"))));
await cas("alice crée son profil (numéro privé)", assertSucceeds(setDoc(doc(alice, "pros/alice"), profil())));
await cas(
  "alice enregistre son numéro privé",
  assertSucceeds(
    setDoc(doc(alice, "pros/alice/prive/contact"), { telephone: TEL, telephones: [{ numero: TEL, whatsapp: true }], alerteWhatsapp: true, alerteSms: true }),
  ),
);
await cas(
  "alice ne peut pas enregistrer un autre numéro que le sien",
  assertFails(setDoc(doc(alice, "pros/alice/prive/contact"), { telephone: "+242000000000", telephones: [] })),
);
await cas("un profil non vérifié n'est pas public", assertFails(getDoc(doc(anonyme, "pros/alice"))));
await cas("alice lit son profil non vérifié", assertSucceeds(getDoc(doc(alice, "pros/alice"))));
await cas("alice ne peut pas changer son statut", assertFails(updateDoc(doc(alice, "pros/alice"), { statut: "verifie" })));
await cas("bob ne peut pas modifier le profil d'alice", assertFails(updateDoc(doc(bob, "pros/alice"), { nom: "Piraté" })));

// l'équipe vérifie alice
await env.withSecurityRulesDisabled((ctx) => updateDoc(doc(ctx.firestore(), "pros/alice"), { statut: "verifie" }));
await cas("tout le monde lit un profil vérifié", assertSucceeds(getDoc(doc(anonyme, "pros/alice"))));
await cas(
  "liste publique des artisans vérifiés",
  assertSucceeds(getDocs(query(collection(anonyme, "pros"), where("type", "==", "artisan"), where("statut", "==", "verifie")))),
);
await cas("liste sans filtre de statut refusée", assertFails(getDocs(query(collection(anonyme, "pros"), where("type", "==", "artisan")))));
await cas("un anonyme ne lit pas le numéro privé", assertFails(getDoc(doc(anonyme, "pros/alice/prive/contact"))));
await cas("bob ne lit pas le numéro privé d'alice", assertFails(getDoc(doc(bob, "pros/alice/prive/contact"))));
await cas(
  "alice passe en numéro public",
  assertSucceeds(updateDoc(doc(alice, "pros/alice"), { numeroPublic: true, telephonePublic: TEL, description: "Plombière" })),
);

console.log("Réalisations");
const realisation = (o = {}) => ({
  titre: "Salle de bain",
  type: "",
  quartier: "Bacongo",
  description: "",
  materiaux: "",
  duree: "",
  date: null,
  photos: ["https://exemple/1.jpg"],
  verifiee: false,
  creeLe: serverTimestamp(),
  ...o,
});
await cas("alice ne peut pas marquer sa réalisation vérifiée", assertFails(addDoc(collection(alice, "pros/alice/realisations"), realisation({ verifiee: true }))));
await cas("bob ne publie pas chez alice", assertFails(addDoc(collection(bob, "pros/alice/realisations"), realisation())));
await cas("alice publie une réalisation", assertSucceeds(setDoc(doc(alice, "pros/alice/realisations/r1"), realisation())));
await cas("les réalisations d'un pro vérifié sont publiques", assertSucceeds(getDocs(collection(anonyme, "pros/alice/realisations"))));
await cas("alice retire sa réalisation", assertSucceeds(deleteDoc(doc(alice, "pros/alice/realisations/r1"))));

console.log("Comptes clients");
await cas("bob crée son compte (numéro vérifié)", assertSucceeds(setDoc(doc(bob, "comptes/bob"), compte())));
await cas("bob ne peut pas déclarer un autre numéro", assertFails(setDoc(doc(bob, "comptes/bob"), compte({ telephone: "+242000000000" }), { merge: true })));
await cas(
  "chloe (code email) crée son compte avec le numéro saisi",
  assertSucceeds(setDoc(doc(chloe, "comptes/chloe"), compte({ prenom: "Chloé", telephone: "+242044000000", email: "chloe@exemple.com" }))),
);
await cas("alice ne lit pas le compte de bob", assertFails(getDoc(doc(alice, "comptes/bob"))));

console.log("Messagerie");
const convBob = {
  clientId: "bob",
  proId: "alice",
  participants: ["bob", "alice"],
  client: { prenom: "Bob", telephone: "+242055000000" },
  pro: { nom: "Alice Test", metier: "plombier", image: null, telephonePublic: TEL, numeroPublic: true },
  luClient: null,
  luPro: null,
  creeLe: serverTimestamp(),
};
await cas("bob voit qu'il n'a pas encore de conversation", assertSucceeds(getDoc(doc(bob, "conversations/bob_alice"))));
await cas("bob ne peut pas usurper le nom du pro", assertFails(setDoc(doc(bob, "conversations/bob_alice"), { ...convBob, pro: { ...convBob.pro, nom: "Autre" } })));
await cas("bob ne crée pas la conversation de chloe", assertFails(setDoc(doc(bob, "conversations/chloe_alice"), { ...convBob, clientId: "chloe" })));
await cas("bob ouvre une conversation avec alice", assertSucceeds(setDoc(doc(bob, "conversations/bob_alice"), convBob)));
const message = (o = {}) => ({ conversationId: "bob_alice", participants: ["bob", "alice"], de: "client", texte: "Bonjour", envoyeLe: serverTimestamp(), ...o });
await cas(
  "bob écrit et marque lu",
  assertSucceeds(
    (() => {
      const lot = writeBatch(bob);
      lot.set(doc(collection(bob, "messages")), message());
      lot.update(doc(bob, "conversations/bob_alice"), { luClient: serverTimestamp() });
      return lot.commit();
    })(),
  ),
);
await cas("bob n'écrit pas à la place du pro", assertFails(addDoc(collection(bob, "messages"), message({ de: "pro" }))));
await cas("chloe n'écrit pas dans la conversation de bob", assertFails(addDoc(collection(chloe, "messages"), message())));
await cas("alice répond", assertSucceeds(addDoc(collection(alice, "messages"), message({ de: "pro", texte: "Je passe demain" }))));
await cas("alice lit ses messages", assertSucceeds(getDocs(query(collection(alice, "messages"), where("participants", "array-contains", "alice")))));
await cas("chloe ne lit pas les messages des autres", assertFails(getDocs(query(collection(chloe, "messages"), where("participants", "array-contains", "bob")))));
await cas("alice ne change que sa date de lecture", assertFails(updateDoc(doc(alice, "conversations/bob_alice"), { luClient: serverTimestamp() })));

console.log("Devis");
const demande = (o = {}) => ({
  clientId: "chloe",
  proId: "alice",
  participants: ["chloe", "alice"],
  client: { prenom: "Chloé", telephone: "+242044000000" },
  pro: { type: "artisan", nom: "Alice Test", sous: "Plombier", image: null, telephone: TEL },
  texte: "Réparer une fuite sous l'évier",
  quartier: "Bacongo",
  dateSouhaitee: null,
  budget: null,
  statut: "nouvelle",
  motifDeclin: null,
  devis: null,
  creeLe: serverTimestamp(),
  ...o,
});
await cas("chloe ne peut pas créer une demande déjà acceptée", assertFails(setDoc(doc(chloe, "demandes/d0"), demande({ statut: "acceptee" }))));
await cas("chloe demande un devis", assertSucceeds(setDoc(doc(chloe, "demandes/d1"), demande())));
await cas("bob ne voit pas la demande de chloe", assertFails(getDoc(doc(bob, "demandes/d1"))));
await cas("chloe ne peut pas accepter avant l'envoi", assertFails(updateDoc(doc(chloe, "demandes/d1"), { statut: "acceptee" })));
const contenu = { rubriques: [], delai: "1 jour", validite: "30 jours", materiauxInclus: true, paiement: "", note: "" };
await cas("alice enregistre un brouillon", assertSucceeds(setDoc(doc(alice, "brouillons/d1"), { proId: "alice", ...contenu, modifieLe: serverTimestamp() })));
await cas("chloe ne voit pas le brouillon", assertFails(getDoc(doc(chloe, "brouillons/d1"))));
await cas("bob ne crée pas de brouillon pour cette demande", assertFails(setDoc(doc(bob, "brouillons/d1"), { proId: "bob", ...contenu })));
await cas(
  "alice envoie le devis",
  assertSucceeds(
    (() => {
      const lot = writeBatch(alice);
      lot.update(doc(alice, "demandes/d1"), { statut: "envoyee", devis: { ...contenu, envoyeLe: serverTimestamp() } });
      lot.delete(doc(alice, "brouillons/d1"));
      return lot.commit();
    })(),
  ),
);
await cas("alice ne peut pas accepter à la place de chloe", assertFails(updateDoc(doc(alice, "demandes/d1"), { statut: "acceptee" })));
await cas("chloe ne modifie pas le devis", assertFails(updateDoc(doc(chloe, "demandes/d1"), { devis: null })));
await cas("chloe accepte le devis", assertSucceeds(updateDoc(doc(chloe, "demandes/d1"), { statut: "acceptee" })));
await cas("alice ne revient pas sur un devis accepté", assertFails(updateDoc(doc(alice, "demandes/d1"), { statut: "declinee" })));

console.log("Formulaire de contact");
const contact = (o = {}) => ({
  nom: "Grâce N.",
  telephone: "+242066000000",
  email: null,
  sujet: "Autre demande",
  message: "Bonjour, j'aimerais en savoir plus.",
  statut: "nouveau",
  recuLe: serverTimestamp(),
  ...o,
});
await cas("un visiteur anonyme envoie un message", assertSucceeds(addDoc(collection(anonyme, "contacts"), contact())));
await cas("sans téléphone ni email, refusé", assertFails(addDoc(collection(anonyme, "contacts"), contact({ telephone: null }))));
await cas("sujet inconnu refusé", assertFails(addDoc(collection(anonyme, "contacts"), contact({ sujet: "Pub" }))));
await cas("champ en trop refusé", assertFails(addDoc(collection(anonyme, "contacts"), contact({ traite: true }))));
await cas("personne ne lit les messages de contact", assertFails(getDocs(collection(bob, "contacts"))));

console.log("Avis");
const equipe = env.authenticatedContext("equipe", { phone_number: "+242050000001", admin: true }).firestore();
await env.withSecurityRulesDisabled(async (c) => {
  await setDoc(doc(c.firestore(), "pros/alice"), profil({ statut: "verifie" }));
});
const avis = (o = {}) => ({
  cibleType: "artisan",
  cibleId: "alice",
  cibleNom: "Alice Test",
  auteurId: "bob",
  auteur: "Bob N.",
  notes: { "Qualité du travail": 5, "Respect des délais": 4 },
  note: 4.5,
  recommandation: "oui",
  experience: "prestation",
  date: "2026-10",
  texte: "Travail propre.",
  statut: "a_moderer",
  verifie: false,
  motifRefus: null,
  modereLe: null,
  creeLe: serverTimestamp(),
  ...o,
});
await cas("un anonyme ne laisse pas d'avis", assertFails(setDoc(doc(anonyme, "avis/artisan_alice_bob"), avis())));
await cas("bob ne peut pas publier lui-même son avis", assertFails(setDoc(doc(bob, "avis/artisan_alice_bob"), avis({ statut: "publie" }))));
await cas("bob ne peut pas se déclarer vérifié", assertFails(setDoc(doc(bob, "avis/artisan_alice_bob"), avis({ verifie: true }))));
await cas("identifiant libre refusé (un avis par pro)", assertFails(setDoc(doc(bob, "avis/x1"), avis())));
await cas("alice ne s'évalue pas elle-même", assertFails(setDoc(doc(alice, "avis/artisan_alice_alice"), avis({ auteurId: "alice" }))));
await cas("bob laisse un avis à modérer", assertSucceeds(setDoc(doc(bob, "avis/artisan_alice_bob"), avis())));
await cas("bob ne laisse pas un deuxième avis", assertFails(setDoc(doc(bob, "avis/artisan_alice_bob"), avis({ texte: "Encore" }))));
await cas("bob relit son avis", assertSucceeds(getDoc(doc(bob, "avis/artisan_alice_bob"))));
await cas("chloe ne voit pas un avis non publié", assertFails(getDoc(doc(chloe, "avis/artisan_alice_bob"))));
await cas("alice ne modère pas l'avis la concernant", assertFails(updateDoc(doc(alice, "avis/artisan_alice_bob"), { statut: "refuse", motifRefus: "x", modereLe: serverTimestamp() })));
await cas(
  "l'équipe publie l'avis et confirme l'expérience",
  assertSucceeds(updateDoc(doc(equipe, "avis/artisan_alice_bob"), { statut: "publie", verifie: true, modereLe: serverTimestamp() })),
);
await cas("l'équipe ne réécrit pas le texte d'un avis", assertFails(updateDoc(doc(equipe, "avis/artisan_alice_bob"), { texte: "Modifié", modereLe: serverTimestamp() })));
await cas("un anonyme lit un avis publié", assertSucceeds(getDoc(doc(anonyme, "avis/artisan_alice_bob"))));
await cas(
  "un anonyme liste les avis publiés d'un pro",
  assertSucceeds(getDocs(query(collection(anonyme, "avis"), where("cibleId", "==", "alice"), where("statut", "==", "publie")))),
);
await cas("un anonyme ne liste pas tous les avis", assertFails(getDocs(collection(anonyme, "avis"))));
await cas("l'équipe liste tous les avis", assertSucceeds(getDocs(collection(equipe, "avis"))));
await cas("bob ne supprime pas son avis", assertFails(deleteDoc(doc(bob, "avis/artisan_alice_bob"))));

console.log("Signalements");
const signalement = (o = {}) => ({ cible: "avis", cibleId: "artisan_alice_bob", libelle: "Avis de Bob N.", motif: "Autre", auteurId: null, statut: "nouveau", creeLe: serverTimestamp(), ...o });
await cas("un anonyme signale un avis", assertSucceeds(addDoc(collection(anonyme, "signalements"), signalement())));
await cas("on ne signale pas au nom d'un autre", assertFails(addDoc(collection(bob, "signalements"), signalement({ auteurId: "chloe" }))));
await cas("bob ne lit pas les signalements", assertFails(getDocs(collection(bob, "signalements"))));
await cas("l'équipe lit les signalements", assertSucceeds(getDocs(collection(equipe, "signalements"))));

console.log("Équipe (backoffice)");
await cas("l'équipe lit les messages de contact", assertSucceeds(getDocs(collection(equipe, "contacts"))));
await cas("bob ne se donne pas les droits de l'équipe", assertFails(getDocs(collection(bob, "contacts"))));
await cas("l'équipe suspend un pro", assertSucceeds(updateDoc(doc(equipe, "pros/alice"), { statut: "suspendu" })));
await cas("l'équipe ne modifie pas la fiche d'un pro", assertFails(updateDoc(doc(equipe, "pros/alice"), { nom: "Autre" })));
await cas("l'équipe voit les pros non vérifiés", assertSucceeds(getDocs(collection(equipe, "pros"))));
await cas("l'équipe lit le numéro privé d'un pro", assertSucceeds(getDoc(doc(equipe, "pros/alice/prive/contact"))));
await cas("l'équipe lit les comptes clients", assertSucceeds(getDoc(doc(equipe, "comptes/bob"))));
await cas("l'équipe ne modifie pas un compte client", assertFails(updateDoc(doc(equipe, "comptes/bob"), { prenom: "X" })));
await cas("l'équipe ne lit pas les messages privés", assertFails(getDocs(collection(equipe, "messages"))));

console.log("Demandes annonceurs et métiers proposés");
const demandeAnnonceur = (o = {}) => ({ nom: "Bâtiplus", type: "Boutique / quincaillerie", telephone: "+242066000000", interets: ["Bannière sur tout le site"], statut: "nouveau", recuLe: serverTimestamp(), ...o });
await cas("un anonyme demande à être recontacté", assertSucceeds(addDoc(collection(anonyme, "demandesAnnonceurs"), demandeAnnonceur())));
await cas("demande annonceur sans téléphone refusée", assertFails(addDoc(collection(anonyme, "demandesAnnonceurs"), demandeAnnonceur({ telephone: "" }))));
await cas("bob ne lit pas les demandes annonceurs", assertFails(getDocs(collection(bob, "demandesAnnonceurs"))));
await cas("l'équipe lit les demandes annonceurs", assertSucceeds(getDocs(collection(equipe, "demandesAnnonceurs"))));
await cas("un anonyme propose un métier", assertSucceeds(addDoc(collection(anonyme, "propositionsMetiers"), { nom: "Vitrier", categorie: "batiment", statut: "nouveau", recuLe: serverTimestamp() })));
await cas("on ne propose pas un métier déjà accepté", assertFails(addDoc(collection(anonyme, "propositionsMetiers"), { nom: "Vitrier", categorie: "batiment", statut: "accepte", recuLe: serverTimestamp() })));
await cas("l'équipe lit les métiers proposés", assertSucceeds(getDocs(collection(equipe, "propositionsMetiers"))));

console.log("Publicités");
const pub = (o = {}) => ({
  emplacement: "accueil-1", type: "image", src: "https://exemple/pub.jpg", poster: null, annonceur: "Bâtiplus", titre: "Promo", texte: null,
  cta: "Voir", href: "/quincaillerie", statut: "active", debut: null, fin: "2026-12-31", creeLe: serverTimestamp(), modifieLe: serverTimestamp(), ...o,
});
await cas("bob ne crée pas de publicité", assertFails(setDoc(doc(bob, "publicites/p1"), pub())));
await cas("l'équipe crée une publicité", assertSucceeds(setDoc(doc(equipe, "publicites/p1"), pub())));
await cas("emplacement inconnu refusé", assertFails(setDoc(doc(equipe, "publicites/p2"), pub({ emplacement: "popup" }))));
await cas("publicité sans lien refusée", assertFails(setDoc(doc(equipe, "publicites/p3"), pub({ href: "" }))));
await cas("un anonyme lit les publicités actives", assertSucceeds(getDocs(query(collection(anonyme, "publicites"), where("statut", "==", "active")))));
await cas("l'équipe suspend une publicité", assertSucceeds(updateDoc(doc(equipe, "publicites/p1"), { statut: "suspendue", modifieLe: serverTimestamp() })));
await cas("un anonyme ne lit pas une publicité suspendue", assertFails(getDoc(doc(anonyme, "publicites/p1"))));
await cas("un anonyme ne liste pas toutes les publicités", assertFails(getDocs(collection(anonyme, "publicites"))));
await cas("l'équipe voit les publicités suspendues", assertSucceeds(getDocs(collection(equipe, "publicites"))));
await cas("bob ne supprime pas une publicité", assertFails(deleteDoc(doc(bob, "publicites/p1"))));
await cas("l'équipe supprime une publicité", assertSucceeds(deleteDoc(doc(equipe, "publicites/p1"))));

console.log("Journal");
const entree = (o = {}) => ({ action: "Avis publié", cible: "Avis de Bob N.", auteurId: "equipe", auteur: "+242050000001", date: serverTimestamp(), ...o });
await cas("l'équipe note une action", assertSucceeds(setDoc(doc(equipe, "journal/j1"), entree())));
await cas("on ne note pas au nom d'un autre", assertFails(setDoc(doc(equipe, "journal/j2"), entree({ auteurId: "alice" }))));
await cas("bob n'écrit pas dans le journal", assertFails(setDoc(doc(bob, "journal/j3"), entree({ auteurId: "bob" }))));
await cas("le journal ne se modifie pas", assertFails(updateDoc(doc(equipe, "journal/j1"), { action: "Rien" })));
await cas("le journal ne s'efface pas", assertFails(deleteDoc(doc(equipe, "journal/j1"))));
await cas("l'équipe lit le journal", assertSucceeds(getDocs(collection(equipe, "journal"))));

console.log("Divers");
await cas("les codes email sont inaccessibles", assertFails(getDoc(doc(chloe, "otpEmail/x"))));
await cas("les autres collections sont fermées", assertFails(setDoc(doc(alice, "admin/x"), { a: 1 })));

await env.cleanup();
console.log(`\n${ok} réussis, ${ko} échoués`);
process.exit(ko ? 1 : 0);
