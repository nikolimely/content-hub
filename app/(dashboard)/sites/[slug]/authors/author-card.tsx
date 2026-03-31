"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthorForm } from "./author-form";

type Author = {
  id: string;
  siteId: string;
  name: string;
  slug: string;
  bio: string | null;
  avatar: string | null;
  _count: { articles: number };
};

export function AuthorCard({
  author,
  siteSlug,
}: {
  author: Author;
  siteSlug: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!confirm(`Delete ${author.name}? This won't delete their articles.`)) return;
    setDeleting(true);
    await fetch(`/api/authors/${author.id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm">
      <div className="flex items-start gap-3">
        {author.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatar}
            alt={author.name}
            className="h-9 w-9 rounded object-cover shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-[#F1F5F9] flex items-center justify-center text-sm font-semibold text-[#64748B] shrink-0">
            {author.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[#0F172A]">{author.name}</p>
          <p className="text-xs text-[#94A3B8]">{author._count.articles} articles</p>
          {author.bio && (
            <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{author.bio}</p>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 pt-4 border-t border-[#E2E8F0]">
          <AuthorForm siteId={author.siteId} siteSlug={siteSlug} author={author} />
          <button
            onClick={() => setEditing(false)}
            className="mt-2 text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#E2E8F0]">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-[#64748B] hover:text-[#0F172A] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
