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
        className="flex items-center gap-2 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
      >
        <Plus size={14} /> Add article
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-[#E2E8F0] rounded-xl p-4 space-y-3 shadow-sm"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#64748B] mb-1 font-medium">Title</label>
          <input
            name="title"
            required
            placeholder="Best dog food for puppies"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-[#64748B] mb-1 font-medium">Focus Keyword</label>
          <input
            name="keyword"
            required
            placeholder="dog food for puppies"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#64748B] mb-1 font-medium">Scheduled Date (optional)</label>
          <input
            type="date"
            name="scheduledAt"
            className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
          />
        </div>
        {authors.length > 0 && (
          <div>
            <label className="block text-xs text-[#64748B] mb-1 font-medium">Author (optional)</label>
            <select
              name="authorId"
              className="w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
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
          className="px-3 py-1.5 bg-[#2A2944] text-white text-sm font-medium rounded-lg hover:bg-[#1e1e38] disabled:opacity-50 transition-colors"
        >
          {loading ? "Adding..." : "Add"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 py-1.5 text-sm text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
