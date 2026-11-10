"use client";

import { BoiteMessages } from "@/components/Messagerie";
import { MessagesQuota } from "./MessagesQuota";

/** Messagerie côté client : ses conversations, ou l'invitation à contacter un artisan. */
export function BoiteClient() {
  return <BoiteMessages cote="client" vide={<MessagesQuota />} />;
}
