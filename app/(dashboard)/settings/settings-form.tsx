"use client";

import { useState } from "react";

export function SettingsForm({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");

  async function handleSave() {
    setState("saving");
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt: value }),
    });
    setState("saved");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => { setValue(e.target.value); setState("idle"); }}
        rows={8}
        placeholder={"e.g.\n- Always use British English (optimise, colour, recognise)\n- Never use em dashes — use commas or rewrite the sentence\n- Avoid starting sentences with 'Additionally' or 'Furthermore'"}
        className="w-full rounded-xl border border-[#E2E8F0] bg-white px-4 py-3 text-sm text-[#0F172A] placeholder-[#CBD5E1] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors resize-none font-mono leading-relaxed"
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#94A3B8]">Applied to every generation and AI rewrite across all sites.</p>
        <button
          onClick={handleSave}
          disabled={state === "saving"}
          className="px-4 py-2 bg-[#2A2944] text-white text-sm font-medium rounded-lg hover:bg-[#1e1e38] disabled:opacity-50 transition-colors"
        >
          {state === "saving" ? "Saving…" : state === "saved" ? "Saved ✓" : "Save"}
        </button>
      </div>
    </div>
  );
}
