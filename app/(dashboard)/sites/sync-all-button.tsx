"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle2, XCircle } from "lucide-react";

type SyncState = "idle" | "syncing" | "done" | "error";

export function SyncAllButton() {
  const router = useRouter();
  const [state, setState] = useState<SyncState>("idle");
  const [summary, setSummary] = useState<string | null>(null);

  async function handleSync() {
    setState("syncing");
    setSummary(null);
    try {
      const res = await fetch("/api/sites/sync-all", { method: "POST" });
      const data = await res.json() as { results: Record<string, { articlesImported?: number; existingSynced?: number; errors?: string[]; error?: string }> };
      if (!res.ok) throw new Error("Sync failed");

      const totals = Object.values(data.results).reduce(
        (acc, r) => {
          if (r.error) { acc.errors++; } else {
            acc.imported += r.articlesImported ?? 0;
            acc.synced += r.existingSynced ?? 0;
          }
          return acc;
        },
        { imported: 0, synced: 0, errors: 0 }
      );

      setSummary(
        `${totals.imported} imported · ${totals.synced} synced${totals.errors ? ` · ${totals.errors} error(s)` : ""}`
      );
      setState(totals.errors > 0 ? "error" : "done");
      router.refresh();
    } catch {
      setState("error");
      setSummary("Sync failed");
    }
  }

  return (
    <div className="flex items-center gap-2">
      {summary && (
        <span className="text-xs text-[#64748B]">{summary}</span>
      )}
      <button
        onClick={handleSync}
        disabled={state === "syncing"}
        className="flex items-center gap-1.5 px-3 py-2 border border-[#E2E8F0] bg-white text-[#475569] text-sm font-medium rounded-lg hover:bg-[#F8FAFC] hover:border-[#CBD5E1] disabled:opacity-50 transition-colors"
      >
        {state === "syncing" ? (
          <RefreshCw size={13} className="animate-spin" />
        ) : state === "done" ? (
          <CheckCircle2 size={13} className="text-green-500" />
        ) : state === "error" ? (
          <XCircle size={13} className="text-red-400" />
        ) : (
          <RefreshCw size={13} />
        )}
        {state === "syncing" ? "Syncing…" : "Sync all"}
      </button>
    </div>
  );
}
