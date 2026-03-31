"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Author = { id: string; name: string };

type Article = {
  id: string;
  status: string;
  scheduledAt: Date | null;
  authorId: string | null;
  content: string | null;
};

const statusOptions = ["planned", "draft", "scheduled", "published"] as const;

const statusColour: Record<string, string> = {
  planned: "bg-slate-100 text-slate-600",
  draft: "bg-amber-50 text-amber-600",
  ready: "bg-green-50 text-green-600",
  scheduled: "bg-sky-50 text-sky-600",
  published: "bg-purple-50 text-purple-600",
};

export function SchedulePanel({
  article,
  authors,
  onStatusChange,
}: {
  article: Article;
  authors: Author[];
  onStatusChange: (status: string) => void;
}) {
  const router = useRouter();

  // Fall back to the frontmatter `date` field if scheduledAt isn't set in DB
  function getInitialDate() {
    if (article.scheduledAt) return new Date(article.scheduledAt).toISOString().split("T")[0];
    if (article.content) {
      const match = article.content.match(/^date:\s*["']?(\d{4}-\d{2}-\d{2})/m);
      if (match) return match[1];
    }
    return "";
  }

  const [scheduledAt, setScheduledAt] = useState(getInitialDate);
  const [authorId, setAuthorId] = useState(article.authorId ?? "");

  function getInitialStatus() {
    const date = getInitialDate();
    if (article.status === "published" && date && new Date(date) > new Date()) return "scheduled";
    return article.status;
  }

  const [status, setStatus] = useState(getInitialStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
        authorId: authorId || null,
        status,
      }),
    });
    onStatusChange(status);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  return (
    <div className="p-5 space-y-5">
      <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Publish</h2>

      <div className="space-y-5">
        {/* Status */}
        <div>
          <label className="block text-xs text-[#64748B] mb-2">Status</label>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all",
                  status === s
                    ? `${statusColour[s]} border-transparent`
                    : "bg-transparent text-[#94A3B8] border-[#E2E8F0] hover:border-[#CBD5E1] hover:text-[#64748B]"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled date */}
        <div>
          <label className="block text-xs text-[#64748B] mb-1.5">Scheduled Date</label>
          <input
            type="date"
            value={scheduledAt}
            onChange={(e) => {
            const val = e.target.value;
            setScheduledAt(val);
            if (val && new Date(val) > new Date()) {
              setStatus("scheduled");
            }
          }}
            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
          />
          {scheduledAt && (
            <p className="text-xs text-[#94A3B8] mt-1">
              {new Date(scheduledAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Author */}
        {authors.length > 0 && (
          <div>
            <label className="block text-xs text-[#64748B] mb-1.5">Author</label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
            >
              <option value="">— unassigned —</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2944] hover:bg-[#1e1e38] text-white text-xs rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? (
            <><Loader2 size={12} className="animate-spin" /> Saving...</>
          ) : saved ? (
            <><Check size={12} className="text-green-400" /> Saved</>
          ) : (
            "Save"
          )}
        </button>
      </div>
    </div>
  );
}
