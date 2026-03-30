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
          <label className="block text-xs text-white/40 mb-1">Name</label>
          <input
            name="name"
            required
            defaultValue={author?.name}
            placeholder="Jane Smith"
            className="w-full bg-[#161616] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="block text-xs text-white/40 mb-1">Avatar URL (optional)</label>
          <input
            name="avatar"
            defaultValue={author?.avatar ?? ""}
            placeholder="https://..."
            className="w-full bg-[#161616] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs text-white/40 mb-1">Bio (optional)</label>
        <textarea
          name="bio"
          defaultValue={author?.bio ?? ""}
          rows={2}
          placeholder="Short author bio..."
          className="w-full bg-[#161616] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 resize-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-3 py-1.5 bg-white text-black text-sm font-medium rounded hover:bg-white/90 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving..." : author ? "Save" : "Add Author"}
      </button>
    </form>
  );
}
