"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

type Author = { id: string; name: string };

export function AddArticleForm({
  siteId,
  siteSlug,
  authors,
}: {
  siteId: string;
  siteSlug: string;
  authors: Author[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());
    // Remove empty optional fields
    if (!body.scheduledAt) delete body.scheduledAt;
    if (!body.authorId) delete body.authorId;

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, siteId }),
    });

    if (res.ok) {
      router.refresh();
      setOpen(false);
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors"
      >
        <Plus size={14} /> Add article
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-[#161616] border border-white/[0.08] rounded-lg p-4 space-y-3"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">Title</label>
          <input
            name="title"
            required
            placeholder="Best dog food for puppies"
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Focus Keyword</label>
          <input
            name="keyword"
            required
            placeholder="dog food for puppies"
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-white/40 mb-1">Scheduled Date (optional)</label>
          <input
            type="date"
            name="scheduledAt"
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>
        {authors.length > 0 && (
          <div>
            <label className="block text-xs text-white/40 mb-1">Author (optional)</label>
            <select
              name="authorId"
              className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/30"
            >
              <option value="">— unassigned —</option>
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 bg-white text-black text-sm font-medium rounded hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-sm text-white/40 hover:text-white transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
