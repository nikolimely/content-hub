"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AuthorForm({
  siteId,
  siteSlug,
  author,
}: {
  siteId: string;
  siteSlug: string;
  author?: { id: string; name: string; bio: string | null; avatar: string | null };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const body: Record<string, string> = {};
    fd.forEach((v, k) => { if (v) body[k] = v as string; });

    const url = author ? `/api/authors/${author.id}` : "/api/authors";
    const method = author ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, siteId }),
    });

    if (res.ok) {
      router.refresh();
      if (!author) (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 max-w-lg">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-[#64748B] mb-1 font-medium">Name</label>
          <input
            name="name"
            required
            defaultValue={author?.name}
            placeholder="Jane Smith"
            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs text-[#64748B] mb-1 font-medium">Avatar URL (optional)</label>
          <input
            name="avatar"
            defaultValue={author?.avatar ?? ""}
            placeholder="https://..."
            className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-[#64748B] mb-1 font-medium">Bio (optional)</label>
        <textarea
          name="bio"
          defaultValue={author?.bio ?? ""}
          rows={2}
          placeholder="Short author bio..."
          className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-3 py-1.5 bg-[#2A2944] text-white text-sm font-medium rounded-lg hover:bg-[#1e1e38] disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : author ? "Save" : "Add Author"}
      </button>
    </form>
  );
}
