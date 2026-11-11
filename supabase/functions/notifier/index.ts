// Edge Function Supabase (Deno) : alerte WhatsApp puis SMS au destinataire.
//
// Appelée par les triggers des migrations 0002 et 0003 avec { type, id } :
//   - "message" : nouveau message → l'autre participant de la conversation ;
//   - "demande" : nouvelle demande de devis → le professionnel ;
//   - "devis"   : devis envoyé → le client.
// Déploiement : supabase functions deploy notifier --no-verify-jwt
//   (l'appel vient de la base avec la clé service_role, vérifiée ci-dessous)
//
// Secrets (supabase secrets set …) — jamais côté navigateur :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY   (fournis par Supabase)
//   AT_USERNAME, AT_API_KEY                   (Africa's Talking)
//   AT_SENDER_ID      (facultatif, nom d'expéditeur SMS)
//   AT_WHATSAPP_FROM  (numéro WhatsApp émetteur validé par Meta, ex. +242…)
//   SITE_URL          (ex. https://artopif.cg, pour le lien dans l'alerte)

import { createClient } from "jsr:@supabase/supabase-js@2";

type Telephone = { numero: string; whatsapp: boolean };
type Destinataire = { telephones: Telephone[]; whatsapp: boolean; sms: boolean };

const CLE_SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const admin = createClient(Deno.env.get("SUPABASE_URL")!, CLE_SERVICE);
const SITE = Deno.env.get("SITE_URL") ?? "artopif";

const apercu = (t: string) => (t.length > 80 ? `${t.slice(0, 77)}…` : t);
const prenom = (nom?: string | null) => nom?.split(" ")[0] ?? "Quelqu’un";

async function client(id: string): Promise<Destinataire> {
  const { data } = await admin.from("comptes").select("telephone, telephones").eq("id", id).single();
  const tels = (data?.telephones as Telephone[] | null)?.length ? (data!.telephones as Telephone[]) : [];
  return { telephones: tels.length ? tels : data ? [{ numero: data.telephone, whatsapp: true }] : [], whatsapp: true, sms: true };
}

async function pro(id: string): Promise<Destinataire> {
  const { data } = await admin
    .from("pros_prive")
    .select("telephone, telephones, alerte_whatsapp, alerte_sms")
    .eq("id", id)
    .single();
  if (!data) return { telephones: [], whatsapp: false, sms: false };
  const tels = (data.telephones as Telephone[]).length ? (data.telephones as Telephone[]) : [{ numero: data.telephone, whatsapp: true }];
  return { telephones: tels, whatsapp: data.alerte_whatsapp, sms: data.alerte_sms };
}

/** Destinataire et texte de l'alerte selon l'événement. */
async function preparer(type: string, id: string): Promise<{ dest: Destinataire; texte: string } | null> {
  if (type === "message") {
    const { data: m } = await admin
      .from("messages")
      .select("texte, de, conversation:conversations(client_id, pro_id, pro:pros(nom), client:comptes(prenom))")
      .eq("id", id)
      .single();
    if (!m) return null;
    const c = m.conversation as unknown as { client_id: string; pro_id: string; pro: { nom: string }; client: { prenom: string } };
    const versPro = m.de === "client";
    return {
      dest: versPro ? await pro(c.pro_id) : await client(c.client_id),
      texte: `Artopif : ${versPro ? c.client.prenom : prenom(c.pro.nom)} vous a écrit « ${apercu(m.texte)} ». Répondez sur ${SITE}.`,
    };
  }
  if (type === "demande" || type === "devis") {
    const { data: d } = await admin
      .from("demandes_devis")
      .select("texte, client_id, pro_id, pro:pros(nom), client:comptes(prenom)")
      .eq("id", id)
      .single();
    if (!d) return null;
    const p = d.pro as unknown as { nom: string };
    const cl = d.client as unknown as { prenom: string };
    return type === "demande"
      ? { dest: await pro(d.pro_id), texte: `Artopif : ${cl.prenom} demande un devis : « ${apercu(d.texte)} ». Répondez sur ${SITE}.` }
      : { dest: await client(d.client_id), texte: `Artopif : ${p.nom} vous a envoyé son devis. Consultez-le sur ${SITE}.` };
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.headers.get("Authorization") !== `Bearer ${CLE_SERVICE}`) return new Response("interdit", { status: 401 });
  try {
    const { type, id } = await req.json();
    const alerte = await preparer(type, id);
    if (!alerte) return new Response("introuvable", { status: 404 });
    const { dest, texte } = alerte;
    await Promise.allSettled([
      ...(dest.whatsapp ? dest.telephones.filter((t) => t.whatsapp).map((t) => envoyerWhatsApp(t.numero, texte)) : []),
      dest.sms ? envoyerSms(dest.telephones.map((t) => t.numero), texte) : Promise.resolve(),
    ]);
    return new Response("ok");
  } catch (e) {
    console.error(e);
    return new Response("erreur", { status: 500 });
  }
});

// ——— Africa's Talking ———

async function envoyerSms(numeros: string[], message: string): Promise<void> {
  if (!numeros.length) return;
  const body = new URLSearchParams({ username: Deno.env.get("AT_USERNAME")!, to: numeros.join(","), message });
  const from = Deno.env.get("AT_SENDER_ID");
  if (from) body.set("from", from);
  await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: { apiKey: Deno.env.get("AT_API_KEY")!, "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
}

async function envoyerWhatsApp(numero: string, message: string): Promise<void> {
  // API WhatsApp d'Africa's Talking (numéro WhatsApp validé par Meta).
  await fetch("https://chat.africastalking.com/whatsapp/message/send", {
    method: "POST",
    headers: { apiKey: Deno.env.get("AT_API_KEY")!, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      username: Deno.env.get("AT_USERNAME"),
      waGroupId: null,
      phoneNumber: Deno.env.get("AT_WHATSAPP_FROM"),
      body: { message, to: numero },
    }),
  });
}

// ——— Variante Twilio ———
// const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
// const auth = "Basic " + btoa(`${sid}:${Deno.env.get("TWILIO_AUTH_TOKEN")!}`);
// await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
//   method: "POST",
//   headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
//   body: new URLSearchParams({ From: Deno.env.get("TWILIO_SMS_FROM")!, To: numero, Body: message }),
// });
// WhatsApp : From/To préfixés par "whatsapp:".
