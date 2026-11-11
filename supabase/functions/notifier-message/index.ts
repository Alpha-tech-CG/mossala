// Edge Function Supabase (Deno) : envoie l'alerte WhatsApp/SMS au destinataire d'un message.
//
// Déclenchée par le trigger `on_message_insert` (voir migrations/0001_messages.sql).
// Déploiement : supabase functions deploy notifier-message
//
// Secrets à définir (supabase secrets set …) — jamais côté navigateur :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY        (fournis par Supabase)
//   AT_USERNAME, AT_API_KEY                        (Africa's Talking)
//   AT_SENDER_ID   (facultatif, nom d'expéditeur SMS)
//   AT_WHATSAPP_FROM  (numéro WhatsApp émetteur, ex. +242…)
//
// Africa's Talking couvre le Congo (SMS + WhatsApp). Pour Twilio, voir la variante en bas.

import { createClient } from "jsr:@supabase/supabase-js@2";

type Telephone = { numero: string; whatsapp: boolean };

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function texteAlerte(expediteur: string, texte: string): string {
  const apercu = texte.length > 80 ? `${texte.slice(0, 77)}…` : texte;
  return `Artopif : ${expediteur} vous a écrit « ${apercu} ». Répondez-lui sur artopif.`;
}

Deno.serve(async (req) => {
  try {
    const { message_id } = await req.json();

    // 1. Le message, sa conversation et l'expéditeur.
    const { data: msg, error } = await admin
      .from("messages")
      .select("texte, de, expediteur_id, conversation:conversations(client_id, artisan_id)")
      .eq("id", message_id)
      .single();
    if (error || !msg) return new Response("message introuvable", { status: 404 });

    const conv = msg.conversation as unknown as { client_id: string; artisan_id: string };
    // Le destinataire est le participant qui n'a pas écrit le message.
    const destinataireId = msg.de === "client" ? conv.artisan_id : conv.client_id;

    // 2. Nom et numéros de l'expéditeur et du destinataire.
    const { data: profils } = await admin
      .from("profils")
      .select("id, nom, telephones")
      .in("id", [msg.expediteur_id, destinataireId]);
    const expediteur = profils?.find((p) => p.id === msg.expediteur_id);
    const destinataire = profils?.find((p) => p.id === destinataireId);
    if (!destinataire) return new Response("destinataire sans profil", { status: 404 });

    const numeros = (destinataire.telephones ?? []) as Telephone[];
    const texte = texteAlerte(expediteur?.nom?.split(" ")[0] ?? "Un client", msg.texte);

    // 3. WhatsApp d'abord (numéros marqués), puis SMS sur tous les numéros.
    await Promise.allSettled([
      ...numeros.filter((t) => t.whatsapp).map((t) => envoyerWhatsApp(t.numero, texte)),
      envoyerSms(numeros.map((t) => t.numero), texte),
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
  const body = new URLSearchParams({
    username: Deno.env.get("AT_USERNAME")!,
    to: numeros.join(","),
    message,
  });
  const from = Deno.env.get("AT_SENDER_ID");
  if (from) body.set("from", from);
  await fetch("https://api.africastalking.com/version1/messaging", {
    method: "POST",
    headers: {
      apiKey: Deno.env.get("AT_API_KEY")!,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });
}

async function envoyerWhatsApp(numero: string, message: string): Promise<void> {
  // API WhatsApp d'Africa's Talking (nécessite un numéro WhatsApp validé par Meta).
  await fetch("https://chat.africastalking.com/whatsapp/message/send", {
    method: "POST",
    headers: {
      apiKey: Deno.env.get("AT_API_KEY")!,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      username: Deno.env.get("AT_USERNAME"),
      waGroupId: null,
      phoneNumber: Deno.env.get("AT_WHATSAPP_FROM"),
      body: { message, to: numero },
    }),
  });
}

// ——— Variante Twilio (si tu préfères Twilio à Africa's Talking) ———
//
// const sid = Deno.env.get("TWILIO_ACCOUNT_SID")!;
// const token = Deno.env.get("TWILIO_AUTH_TOKEN")!;
// const auth = "Basic " + btoa(`${sid}:${token}`);
// // SMS :
// await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
//   method: "POST",
//   headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
//   body: new URLSearchParams({ From: Deno.env.get("TWILIO_SMS_FROM")!, To: numero, Body: message }),
// });
// // WhatsApp : From/To préfixés par "whatsapp:" (ex. "whatsapp:+242…").
