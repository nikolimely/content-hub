"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

export function AuthorForm({
  siteId,
  siteSlug,
  author,
  onSaved,
}: {
  siteId: string;
  siteSlug: string;
  author?: { id: string; name: string; bio: string | null; avatar: string | null };
  onSaved?: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(author?.avatar ?? "");
  const bioRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (bioRef.current) {
      bioRef.current.style.height = "auto";
      bioRef.current.style.height = `${bioRef.current.scrollHeight}px`;
    }
  }, []);

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
      if (!author) {
        (e.target as HTMLFormElement).reset();
        setAvatarPreview("");
      } else {
        setSaved(true);
        setTimeout(() => { setSaved(false); onSaved?.(); }, 1000);
      }
    }
    setLoading(false);
  }

  const inputCls = "w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-[#64748B] mb-1.5 font-medium">Name</label>
        <input
          name="name"
          required
          defaultValue={author?.name}
          placeholder="Jane Smith"
          className={inputCls}
        />
      </div>

      <div>
        <label className="block text-xs text-[#64748B] mb-1.5 font-medium">Avatar URL</label>
        <div className="flex items-center gap-3">
          {avatarPreview && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarPreview}
              alt="Preview"
              className="w-10 rounded object-contain shrink-0"
            />
          )}
          <input
            name="avatar"
            defaultValue={author?.avatar ?? ""}
            placeholder="https://..."
            className={inputCls}
            onChange={(e) => setAvatarPreview(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs text-[#64748B] mb-1.5 font-medium">Bio</label>
        <textarea
          ref={bioRef}
          name="bio"
          defaultValue={author?.bio ?? ""}
          rows={3}
          placeholder="Short author bio..."
          className={`${inputCls} resize-none overflow-hidden`}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${el.scrollHeight}px`;
          }}
        />
      </div>

      <button
        type="submit"
        disabled={loading || saved}
        className="flex items-center gap-1.5 px-4 py-2 bg-[#2A2944] text-white text-sm font-medium rounded-lg hover:bg-[#1e1e38] disabled:opacity-50 transition-colors"
      >
        {saved ? <><Check size={13} /> Saved</> : loading ? "Saving..." : author ? "Save changes" : "Add Author"}
      </button>
    </form>
  );
}
