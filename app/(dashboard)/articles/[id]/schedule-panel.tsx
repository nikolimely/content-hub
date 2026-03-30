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
  planned: "bg-white/10 text-white/50",
  draft: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-green-500/20 text-green-400",
  scheduled: "bg-blue-500/20 text-blue-400",
  published: "bg-purple-500/20 text-purple-400",
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
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Publish</h2>

      <div className="space-y-5">
        {/* Status */}
        <div>
          <label className="block text-xs text-white/40 mb-2">Status</label>
          <div className="flex flex-wrap gap-1.5">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  "text-xs px-2.5 py-1 rounded-full border transition-all",
                  status === s
                    ? `${statusColour[s]} border-white/20`
                    : "bg-transparent text-white/30 border-white/[0.08] hover:border-white/20 hover:text-white/50"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Scheduled date */}
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Scheduled Date</label>
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
            className="w-full bg-[#161616] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20"
            style={{ colorScheme: "dark" }}
          />
          {scheduledAt && (
            <p className="text-xs text-white/25 mt-1">
              {new Date(scheduledAt).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}
        </div>

        {/* Author */}
        {authors.length > 0 && (
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Author</label>
            <select
              value={authorId}
              onChange={(e) => setAuthorId(e.target.value)}
              className="w-full bg-[#161616] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20"
              style={{ colorScheme: "dark" }}
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
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors disabled:opacity-50"
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
