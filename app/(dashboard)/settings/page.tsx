import { db } from "@/lib/db";
import { SettingsForm } from "./settings-form";

export default async function SettingsPage() {
  const settings = await db.settings.findUnique({ where: { id: "global" } });

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-[#0F172A] mb-1">Settings</h1>
      <p className="text-sm text-[#64748B] mb-8">Global configuration for AI content generation.</p>

      <section>
        <h2 className="text-sm font-semibold text-[#0F172A] mb-1">Writing rules</h2>
        <p className="text-xs text-[#94A3B8] mb-3">
          These instructions are injected into every AI prompt. Use them to enforce style, tone, and language rules across all sites.
        </p>
        <SettingsForm initial={settings?.systemPrompt ?? ""} />
      </section>
    </div>
  );
}
