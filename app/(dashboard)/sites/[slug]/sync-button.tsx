"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, CheckCircle, AlertCircle } from "lucide-react";

type SyncResult = {
  settings: boolean;
  articlesImported: number;
  articlesSkipped: number;
  existingSynced: number;
  errors: string[];
};

export function SyncButton({ siteSlug }: { siteSlug: string }) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);

  async function handleSync() {
    setSyncing(true);
    setResult(null);
    const res = await fetch(`/api/sites/${siteSlug}/sync`, { method: "POST" });
    const data = await res.json();
    setResult(data);
    setSyncing(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] rounded-lg transition-colors disabled:opacity-40 border border-[#E2E8F0]"
      >
        <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
        {syncing ? "Syncing..." : "Sync from repo"}
      </button>

      {result && (
        <div className="flex items-center gap-2 text-xs">
          {result.errors.length === 0 ? (
            <CheckCircle size={12} className="text-green-500" />
          ) : (
            <AlertCircle size={12} className="text-amber-500" />
          )}
          <span className="text-[#64748B]">
            {result.articlesImported > 0 && `${result.articlesImported} imported`}
            {result.existingSynced > 0 && ` · ${result.existingSynced} existing synced`}
            {result.articlesSkipped > 0 && ` · ${result.articlesSkipped} skipped`}
            {result.settings && " · settings updated"}
            {result.errors.length > 0 && (
              <span className="text-amber-500 ml-1">{result.errors[0]}</span>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
