import type { Metadata } from "next";
import { Backoffice } from "./Backoffice";

export const metadata: Metadata = {
  title: "Backoffice — Artopif",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pt-4 pb-16 md:pt-8">
      <Backoffice />
    </div>
  );
}
