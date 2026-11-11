import { BandeauDemoPro } from "@/components/BandeauDemoPro";
import { ProNav } from "./ProNav";

export default function EspaceLayout({ children }: LayoutProps<"/pro/espace">) {
  return (
    <>
      <ProNav />
      <div className="mx-auto max-w-5xl px-5 pt-5 pb-14 md:pt-8">
        <BandeauDemoPro type="artisan" />
        {children}
      </div>
    </>
  );
}
