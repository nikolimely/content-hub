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
    <div className="bg-[#161616] border border-white/[0.06] rounded-xl p-4">
      <div className="flex items-start gap-3">
        {author.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={author.avatar}
            alt={author.name}
            className="h-9 w-9 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-white/10 flex items-center justify-center text-sm font-semibold text-white/60 shrink-0">
            {author.name[0]}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white">{author.name}</p>
          <p className="text-xs text-white/30">{author._count.articles} articles</p>
          {author.bio && (
            <p className="text-xs text-white/40 mt-1 line-clamp-2">{author.bio}</p>
          )}
        </div>
      </div>

      {editing ? (
        <div className="mt-4 pt-4 border-t border-white/[0.06]">
          <AuthorForm siteId={author.siteId} siteSlug={siteSlug} author={author} />
          <button
            onClick={() => setEditing(false)}
            className="mt-2 text-xs text-white/30 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/[0.06]">
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-white/30 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="text-xs text-red-400/50 hover:text-red-400 transition-colors disabled:opacity-40"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
