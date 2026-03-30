"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Zap, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColour: Record<string, string> = {
  planned: "bg-white/10 text-white/50",
  generating: "bg-blue-500/20 text-blue-400 animate-pulse",
  draft: "bg-yellow-500/20 text-yellow-400",
  published: "bg-purple-500/20 text-purple-400",
};

type Article = {
  id: string;
  title: string;
  keyword: string;
  status: string;
  category: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  updatedAt: Date;
  author: { name: string } | null;
};

export function ArticleRow({
  article,
  siteSlug,
  liveUrl,
}: {
  article: Article;
  siteSlug: string;
  liveUrl?: string | null;
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);

  async function handleGenerate(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setGenerating(true);
    await fetch(`/api/articles/${article.id}/generate`, { method: "POST" });
    router.push(`/sites/${siteSlug}/articles/${article.id}`);
  }

  return (
    <Link
      href={`/sites/${siteSlug}/articles/${article.id}`}
      className="flex items-center gap-4 px-4 py-3 bg-[#161616] border border-white/[0.06] rounded-lg hover:border-white/20 transition-colors group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">{article.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-white/30 truncate">{article.keyword}</p>
          {article.category && (
            <span className="text-xs text-white/20 shrink-0">{article.category}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {article.author && (
          <span className="text-xs text-white/25 hidden sm:block">{article.author.name}</span>
        )}
        {(article.scheduledAt || article.publishedAt) && (
          <span className="text-xs text-white/20">
            {new Date(article.scheduledAt ?? article.publishedAt!).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        )}
        <span
          className={cn(
            "text-xs px-2 py-0.5 rounded-full",
            statusColour[article.status] || "bg-white/10 text-white/40"
          )}
        >
          {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
        </span>
        {article.status === "planned" && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-white/10 hover:bg-white/20 rounded text-white/60 hover:text-white transition-colors disabled:opacity-40"
          >
            <Zap size={11} />
            {generating ? "..." : "Generate"}
          </button>
        )}
        {liveUrl && (
          <a
            href={liveUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-white/20 hover:text-white/60 transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        )}
        <ChevronRight size={14} className="text-white/20 group-hover:text-white/40 transition-colors" />
      </div>
    </Link>
  );
}
