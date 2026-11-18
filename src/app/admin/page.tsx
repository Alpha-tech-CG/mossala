import type { Metadata } from "next";
import { Backoffice } from "./Backoffice";

export const metadata: Metadata = {
  title: "Console d’administration — Artopif",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <Backoffice />;
}
