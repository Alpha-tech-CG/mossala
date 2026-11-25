"use strict";
/**
 * Cloud Functions Artopif (projet mossala-6f297, formule Blaze requise).
 *
 *  1. Connexion par CODE EMAIL (Firebase n'envoie pas de code OTP par email nativement) :
 *     - envoyerCodeEmail  : génère un code à 6 chiffres, le garde haché 10 min, l'envoie par SMTP ;
 *     - verifierCodeEmail : vérifie le code et renvoie un jeton de connexion (custom token).
 *     La connexion par code SMS, elle, est native (Firebase Authentication → Téléphone).
 *
 *  2. ALERTES WhatsApp puis SMS (Africa's Talking) au destinataire :
 *     - nouveau message           → l'autre participant de la conversation ;
 *     - nouvelle demande de devis → le professionnel ;
 *     - devis envoyé              → le client.
 *
 * Déploiement :  cd firebase-functions && npm install && npm run deploy
 * Paramètres et secrets : voir firebase-functions/README.md.
 */
const crypto = require("node:crypto");
const { setGlobalOptions } = require("firebase-functions/v2");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onDocumentCreated, onDocumentUpdated, onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret, defineString, defineInt } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue, Timestamp } = require("firebase-admin/firestore");
const { getMessaging } = require("firebase-admin/messaging");
const nodemailer = require("nodemailer");

initializeApp();
const db = getFirestore();

// Même région que la base Firestore (europe-west1, ou eur3 en multi-région).
setGlobalOptions({ region: "europe-west1", maxInstances: 10 });

// ——————————————————————————————————————————————————————————————
// 1. Code de connexion par email
// ——————————————————————————————————————————————————————————————

const SMTP_HOTE = defineString("SMTP_HOTE", { description: "Serveur SMTP (ex. smtp-relay.brevo.com)" });
const SMTP_PORT = defineInt("SMTP_PORT", { default: 587, description: "465 (SSL) ou 587 (STARTTLS)" });
const SMTP_EXPEDITEUR = defineString("SMTP_EXPEDITEUR", { description: "Expéditeur, ex. Artopif <no-reply@artopif.cg>" });
const SMTP_UTILISATEUR = defineSecret("SMTP_UTILISATEUR");
const SMTP_MOT_DE_PASSE = defineSecret("SMTP_MOT_DE_PASSE");

const DUREE_CODE_MS = 10 * 60 * 1000; // validité d'un code
const DELAI_RENVOI_MS = 60 * 1000; // un envoi par minute au plus
const ENVOIS_PAR_HEURE = 5;
const ESSAIS_MAX = 5; // codes faux avant d'invalider le code

const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");
const normaliserEmail = (e) => String(e ?? "").trim().toLowerCase();
const emailValide = (e) => e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
/** Document de suivi du code d'un email (collection fermée aux navigateurs). */
const refCode = (email) => db.collection("otpEmail").doc(sha256(email));
const hacherCode = (email, code) => sha256(`${email}:${code}`);

let transport = null;
function smtp() {
  transport ??= nodemailer.createTransport({
    host: SMTP_HOTE.value(),
    port: SMTP_PORT.value(),
    secure: SMTP_PORT.value() === 465,
    auth: { user: SMTP_UTILISATEUR.value(), pass: SMTP_MOT_DE_PASSE.value() },
  });
  return transport;
}

exports.envoyerCodeEmail = onCall({ secrets: [SMTP_UTILISATEUR, SMTP_MOT_DE_PASSE] }, async (req) => {
  const email = normaliserEmail(req.data?.email);
  if (!emailValide(email)) throw new HttpsError("invalid-argument", "Cette adresse email n’est pas valide.");

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0");
  const maintenant = Date.now();

  await db.runTransaction(async (t) => {
    const snap = await t.get(refCode(email));
    const d = snap.exists ? snap.data() : null;
    if (d && maintenant - d.dernierEnvoi < DELAI_RENVOI_MS)
      throw new HttpsError("resource-exhausted", "Un code vient d’être envoyé. Patientez une minute avant d’en demander un autre.");
    const memeFenetre = d && maintenant - d.debutFenetre < 3600_000;
    const envois = memeFenetre ? d.envois + 1 : 1;
    if (envois > ENVOIS_PAR_HEURE)
      throw new HttpsError("resource-exhausted", "Trop de codes demandés pour cette adresse. Réessayez dans une heure.");
    t.set(refCode(email), {
      hash: hacherCode(email, code),
      expire: maintenant + DUREE_CODE_MS,
      essais: 0,
      dernierEnvoi: maintenant,
      debutFenetre: memeFenetre ? d.debutFenetre : maintenant,
      envois,
      // nettoyage automatique possible avec une règle TTL Firestore sur ce champ
      supprimerApres: Timestamp.fromMillis(maintenant + 24 * 3600_000),
    });
  });

  try {
    await smtp().sendMail({
      from: SMTP_EXPEDITEUR.value(),
      to: email,
      subject: `Votre code Artopif : ${code}`,
      text: `Bonjour,\n\nVotre code de connexion Artopif est : ${code}\n\nIl est valable 10 minutes. Si vous n’avez rien demandé, ignorez cet email.\n\nL’équipe Artopif`,
      html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1f2937">
  <p>Bonjour,</p>
  <p>Votre code de connexion Artopif :</p>
  <p style="font-size:32px;font-weight:bold;letter-spacing:8px;margin:24px 0">${code}</p>
  <p>Il est valable 10 minutes. Si vous n’avez rien demandé, ignorez cet email.</p>
  <p style="color:#6b7280">L’équipe Artopif</p>
</div>`,
    });
  } catch (e) {
    logger.error("envoi email", e);
    await refCode(email).delete();
    throw new HttpsError("unavailable", "L’email n’a pas pu être envoyé. Réessayez dans quelques minutes.");
  }
  return { ok: true };
});

exports.verifierCodeEmail = onCall(async (req) => {
  const email = normaliserEmail(req.data?.email);
  const code = String(req.data?.code ?? "");
  if (!emailValide(email) || !/^\d{6}$/.test(code)) throw new HttpsError("invalid-argument", "Code incorrect. Vérifiez l’email reçu.");

  const valide = await db.runTransaction(async (t) => {
    const snap = await t.get(refCode(email));
    if (!snap.exists) return "absent";
    const d = snap.data();
    if (Date.now() > d.expire || d.essais >= ESSAIS_MAX) {
      t.delete(refCode(email));
      return "expire";
    }
    const attendu = Buffer.from(d.hash, "hex");
    const recu = Buffer.from(hacherCode(email, code), "hex");
    if (!crypto.timingSafeEqual(attendu, recu)) {
      t.update(refCode(email), { essais: d.essais + 1 });
      return "faux";
    }
    t.delete(refCode(email)); // un code ne sert qu'une fois
    return "ok";
  });
  if (valide === "absent" || valide === "expire")
    throw new HttpsError("deadline-exceeded", "Ce code a expiré. Demandez un nouveau code.");
  if (valide === "faux") throw new HttpsError("permission-denied", "Code incorrect. Vérifiez l’email reçu.");

  // Le compte de cet email (créé au premier passage), marqué « email vérifié ».
  const auth = getAuth();
  let user;
  try {
    user = await auth.getUserByEmail(email);
    if (!user.emailVerified) user = await auth.updateUser(user.uid, { emailVerified: true });
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
    user = await auth.createUser({ email, emailVerified: true });
  }
  if (user.disabled) throw new HttpsError("permission-denied", "Ce compte est désactivé. Contactez l’équipe Artopif.");
  // Nécessite le rôle « Créateur de jetons du compte de service » (voir README).
  return { jeton: await auth.createCustomToken(user.uid) };
});

// ——————————————————————————————————————————————————————————————
// 1 bis. Équipe de la console : le responsable (owner) crée et gère les membres
// ——————————————————————————————————————————————————————————————

// Tâches déléguables (doit rester synchronisé avec src/lib/backend/modele.ts et firestore.rules).
const PERMISSIONS = ["avis", "signalements", "realisations", "pros", "clients", "publicites", "annonceurs", "contacts", "metiers"];
const normaliserPermissions = (x) => (Array.isArray(x) ? PERMISSIONS.filter((p) => x.includes(p)) : []);

/** Donne ou retire le claim `admin` à un compte, en gardant ses autres claims. */
async function definirAdmin(auth, uid, actif) {
  const u = await auth.getUser(uid);
  const claims = { ...(u.customClaims || {}) };
  if (actif) claims.admin = true;
  else delete claims.admin;
  await auth.setCustomUserClaims(uid, claims);
}

exports.gererMembre = onCall(async (req) => {
  if (req.auth?.token?.owner !== true) throw new HttpsError("permission-denied", "Réservé au responsable de la console.");
  const auth = getAuth();
  const action = req.data?.action;

  if (action === "inviter") {
    const nom = String(req.data?.nom ?? "").trim().slice(0, 80);
    const identifiant = String(req.data?.identifiant ?? "").trim();
    const permissions = normaliserPermissions(req.data?.permissions);
    if (!nom) throw new HttpsError("invalid-argument", "Le nom du membre est obligatoire.");
    let u;
    try {
      u = identifiant.includes("@")
        ? await auth.getUserByEmail(identifiant.toLowerCase())
        : await auth.getUserByPhoneNumber(identifiant.replace(/\s/g, ""));
    } catch (e) {
      if (e.code === "auth/user-not-found")
        throw new HttpsError("not-found", "Aucun compte avec ce numéro ou cet email. La personne doit d’abord se connecter une fois sur le site.");
      throw e;
    }
    if (u.uid === req.auth.uid) throw new HttpsError("invalid-argument", "Vous ne pouvez pas vous ajouter vous-même.");
    if (u.customClaims?.owner === true) throw new HttpsError("failed-precondition", "Ce compte est déjà responsable de la console.");
    await definirAdmin(auth, u.uid, true);
    await db.doc(`equipe/${u.uid}`).set({
      nom,
      identifiant: u.phoneNumber ?? u.email ?? identifiant,
      role: "membre",
      permissions,
      actif: true,
      parId: req.auth.uid,
      creeLe: FieldValue.serverTimestamp(),
      majLe: FieldValue.serverTimestamp(),
    });
    return { uid: u.uid };
  }

  if (action === "modifier") {
    const uid = String(req.data?.uid ?? "");
    const snap = await db.doc(`equipe/${uid}`).get();
    if (!snap.exists) throw new HttpsError("not-found", "Membre introuvable.");
    if (snap.data().role === "owner") throw new HttpsError("failed-precondition", "On ne modifie pas un responsable depuis la console.");
    const maj = { majLe: FieldValue.serverTimestamp(), parId: req.auth.uid };
    if (req.data.nom !== undefined) maj.nom = String(req.data.nom).trim().slice(0, 80);
    if (req.data.permissions !== undefined) maj.permissions = normaliserPermissions(req.data.permissions);
    if (req.data.actif !== undefined) maj.actif = Boolean(req.data.actif);
    await db.doc(`equipe/${uid}`).set(maj, { merge: true });
    // Activer / désactiver coupe ou rétablit l'accès tout de suite (claim admin).
    if (maj.actif === true || maj.actif === false) await definirAdmin(auth, uid, maj.actif);
    return { uid };
  }

  if (action === "revoquer") {
    const uid = String(req.data?.uid ?? "");
    const snap = await db.doc(`equipe/${uid}`).get();
    if (snap.exists && snap.data().role === "owner") throw new HttpsError("failed-precondition", "Impossible de révoquer un responsable.");
    const u = await auth.getUser(uid).catch(() => null);
    if (u) {
      const claims = { ...(u.customClaims || {}) };
      delete claims.admin;
      delete claims.owner;
      await auth.setCustomUserClaims(uid, claims);
    }
    await db.doc(`equipe/${uid}`).delete();
    return { uid };
  }

  throw new HttpsError("invalid-argument", "Action inconnue.");
});

// ——————————————————————————————————————————————————————————————
// 2. Alertes WhatsApp / SMS (Africa's Talking)
// ——————————————————————————————————————————————————————————————

const AT_USERNAME = defineSecret("AT_USERNAME");
const AT_API_KEY = defineSecret("AT_API_KEY");
const AT_SENDER_ID = defineString("AT_SENDER_ID", { default: "", description: "Nom d'expéditeur SMS (facultatif)" });
const AT_WHATSAPP_FROM = defineString("AT_WHATSAPP_FROM", { default: "", description: "Numéro WhatsApp émetteur validé par Meta (facultatif)" });
const SITE_URL = defineString("SITE_URL", { default: "artopif.cg", description: "Adresse du site, citée dans les alertes" });
const optionsAlerte = { secrets: [AT_USERNAME, AT_API_KEY] };

const apercu = (t) => (t.length > 80 ? `${t.slice(0, 77)}…` : t);
const prenom = (nom) => (nom ? nom.split(" ")[0] : "Quelqu’un");

/** Numéros du client (compte) : tous joignables par SMS, WhatsApp si indiqué. */
async function destClient(id) {
  const c = (await db.doc(`comptes/${id}`).get()).data();
  if (!c) return { telephones: [], whatsapp: false, sms: false };
  const tels = c.telephones?.length ? c.telephones : [{ numero: c.telephone, whatsapp: true }];
  return { telephones: tels.filter((t) => t.numero), whatsapp: true, sms: true };
}

/** Numéros privés du pro et ses préférences d'alerte. */
async function destPro(id) {
  const p = (await db.doc(`pros/${id}/prive/contact`).get()).data();
  if (!p) return { telephones: [], whatsapp: false, sms: false };
  const tels = p.telephones?.length ? p.telephones : [{ numero: p.telephone, whatsapp: true }];
  return { telephones: tels.filter((t) => t.numero), whatsapp: p.alerteWhatsapp !== false, sms: p.alerteSms !== false };
}

async function alerter(dest, texte) {
  if (!AT_USERNAME.value() || !AT_API_KEY.value()) return logger.warn("Alertes non configurées (AT_USERNAME / AT_API_KEY)");
  const resultats = await Promise.allSettled([
    ...(dest.whatsapp && AT_WHATSAPP_FROM.value() ? dest.telephones.filter((t) => t.whatsapp).map((t) => envoyerWhatsApp(t.numero, texte)) : []),
    dest.sms ? envoyerSms(dest.telephones.map((t) => t.numero), texte) : Promise.resolve(),
  ]);
  resultats.filter((r) => r.status === "rejected").forEach((r) => logger.error("alerte", r.reason));
}

/**
 * Notification push sur les téléphones (appli mobile) du compte `uid` : appareils/{jeton}.
 * `lien` : page ouverte quand on touche la notification. Les jetons périmés sont retirés.
 */
async function pousser(uid, titre, corps, lien) {
  const snap = await db.collection("appareils").where("uid", "==", uid).get();
  if (snap.empty) return;
  const jetons = snap.docs.map((d) => d.id);
  const res = await getMessaging().sendEachForMulticast({
    tokens: jetons,
    notification: { title: titre, body: corps },
    data: { lien },
    android: { priority: "high", notification: { color: "#14213d" } },
    apns: { payload: { aps: { sound: "default" } } },
  });
  await Promise.all(
    res.responses.map((r, i) =>
      !r.success &&
      ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(r.error?.code)
        ? db.doc(`appareils/${jetons[i]}`).delete()
        : null,
    ),
  );
}

/** Push puis SMS / WhatsApp : un échec de l'un n'empêche pas l'autre. */
async function prevenir(uid, push, dest, texte) {
  const r = await Promise.allSettled([pousser(uid, push.titre, push.corps, push.lien), alerter(dest, texte)]);
  r.filter((x) => x.status === "rejected").forEach((x) => logger.error("prevenir", x.reason));
}

exports.alerteMessage = onDocumentCreated({ document: "messages/{id}", ...optionsAlerte }, async (event) => {
  const m = event.data?.data();
  if (!m) return;
  const c = (await db.doc(`conversations/${m.conversationId}`).get()).data();
  if (!c) return;
  const versPro = m.de === "client";
  const auteur = versPro ? c.client.prenom : prenom(c.pro.nom);
  await prevenir(
    versPro ? c.proId : c.clientId,
    { titre: `Message de ${auteur}`, corps: apercu(m.texte), lien: versPro ? "/pro/espace" : "/messages" },
    versPro ? await destPro(c.proId) : await destClient(c.clientId),
    `Artopif : ${auteur} vous a écrit « ${apercu(m.texte)} ». Répondez sur ${SITE_URL.value()}.`,
  );
});

exports.alerteDemande = onDocumentCreated({ document: "demandes/{id}", ...optionsAlerte }, async (event) => {
  const d = event.data?.data();
  if (!d) return;
  const photo = d.photos?.length ? " (avec photo)" : "";
  await prevenir(
    d.proId,
    { titre: `Demande de devis de ${d.client.prenom}${photo}`, corps: apercu(d.texte), lien: "/pro/espace" },
    await destPro(d.proId),
    `Artopif : ${d.client.prenom} demande un devis${photo} : « ${apercu(d.texte)} ». Répondez sur ${SITE_URL.value()}.`,
  );
});

exports.alerteDevis = onDocumentUpdated({ document: "demandes/{id}", ...optionsAlerte }, async (event) => {
  const avant = event.data?.before.data();
  const apres = event.data?.after.data();
  const envoye = apres?.devis?.envoyeLe;
  if (!envoye || (avant?.devis?.envoyeLe && avant.devis.envoyeLe.isEqual(envoye))) return;
  await prevenir(
    apres.clientId,
    { titre: "Votre devis est arrivé", corps: `${apres.pro.nom} vous a envoyé son devis.`, lien: "/devis" },
    await destClient(apres.clientId),
    `Artopif : ${apres.pro.nom} vous a envoyé son devis. Consultez-le sur ${SITE_URL.value()}.`,
  );
});

async function envoyerSms(numeros, message) {
  if (!numeros.length) return;
  const body = new URLSearchParams({ username: AT_USERNAME.value(), to: numeros.join(","), message });
  if (AT_SENDER_ID.value()) body.set("from", AT_SENDER_ID.value());
  const r = await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { apiKey: AT_API_KEY.value(), "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!r.ok) throw new Error(`SMS ${r.status} ${await r.text()}`);
}

async function envoyerWhatsApp(numero, message) {
  const r = await fetch("https://chat.africastalking.com/whatsapp/message/send", {
    method: "POST",
    headers: { apiKey: AT_API_KEY.value(), "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username: AT_USERNAME.value(), waGroupId: null, phoneNumber: AT_WHATSAPP_FROM.value(), body: { message, to: numero } }),
  });
  if (!r.ok) throw new Error(`WhatsApp ${r.status} ${await r.text()}`);
}

// ——————————————————————————————————————————————————————————————
// 3. Formulaire « Nous contacter » : l'équipe est prévenue par email
// ——————————————————————————————————————————————————————————————

const CONTACT_EQUIPE = defineString("CONTACT_EQUIPE", {
  default: "",
  description: "Adresse email de l'équipe qui reçoit les messages du formulaire de contact",
});

exports.alerteContact = onDocumentCreated(
  { document: "contacts/{id}", secrets: [SMTP_UTILISATEUR, SMTP_MOT_DE_PASSE] },
  async (event) => {
    const c = event.data?.data();
    if (!c) return;
    if (!CONTACT_EQUIPE.value()) return logger.warn("CONTACT_EQUIPE non renseigné : message enregistré sans alerte", event.params.id);
    const email = normaliserEmail(c.email);
    // email en texte brut : rien de ce qu'a saisi le visiteur n'est interprété comme du HTML
    await smtp().sendMail({
      from: SMTP_EXPEDITEUR.value(),
      to: CONTACT_EQUIPE.value(),
      ...(emailValide(email) ? { replyTo: email } : {}),
      subject: `[Contact Artopif] ${c.sujet} · ${c.nom}`.slice(0, 200),
      text: [
        `Nom : ${c.nom}`,
        `Téléphone : ${c.telephone ?? "—"}`,
        `Email : ${c.email ?? "—"}`,
        `Sujet : ${c.sujet}`,
        "",
        c.message,
        "",
        `Réf. : contacts/${event.params.id}`,
      ].join("\n"),
    });
  },
);

// ——— Notes des réalisations (fil de l'appli mobile) ———

/**
 * Tient à jour statsRealisations/{proId_realisationId} = { somme, nombre } à chaque note
 * donnée, changée ou retirée dans notesRealisations/{proId_realisationId_uid}.
 */
// ——— Commentaires des réalisations : notification push (sans SMS/WhatsApp) ———

/**
 * À chaque commentaire publié : prévient le professionnel (commentaire racine) ou l'auteur
 * du commentaire auquel on répond (réponse). Pas d'alerte à soi-même.
 */
exports.alerteCommentaire = onDocumentCreated("commentaires/{id}", async (event) => {
  const c = event.data?.data();
  if (!c || c.statut !== "visible") return;
  const lien = `/artisans/${c.proId}`;
  if (c.parentId) {
    const parent = (await db.doc(`commentaires/${c.parentId}`).get()).data();
    if (parent?.auteurId && parent.auteurId !== c.auteurId)
      await pousser(parent.auteurId, "Nouvelle réponse", `${c.auteurNom} a répondu à votre commentaire.`, lien);
  } else if (c.auteurId !== c.proId) {
    await pousser(c.proId, "Nouveau commentaire", `${c.auteurNom} a commenté votre réalisation.`, lien);
  }
});

exports.statsNoteRealisation = onDocumentWritten("notesRealisations/{id}", async (event) => {
  const avant = event.data?.before.data();
  const apres = event.data?.after.data();
  const ref = apres ?? avant;
  if (!ref) return;
  const delta = (apres?.note ?? 0) - (avant?.note ?? 0);
  const compte = (apres ? 1 : 0) - (avant ? 1 : 0);
  if (!delta && !compte) return;
  await db.doc(`statsRealisations/${ref.proId}_${ref.realisationId}`).set(
    { somme: FieldValue.increment(delta), nombre: FieldValue.increment(compte), proId: ref.proId },
    { merge: true },
  );
});
