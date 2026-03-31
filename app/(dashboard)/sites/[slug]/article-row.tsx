"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Zap, ChevronRight, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const statusColour: Record<string, string> = {
  planned: "bg-slate-100 text-slate-500",
  generating: "bg-blue-50 text-blue-600 animate-pulse",
  draft: "bg-amber-50 text-amber-600",
  published: "bg-purple-50 text-purple-600",
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
      className="flex items-center gap-4 px-4 py-3 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#CBD5E1] hover:shadow-sm transition-all group"
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#0F172A] truncate">{article.title}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-[#94A3B8] truncate">{article.keyword}</p>
          {article.category && (
            <span className="text-xs text-[#CBD5E1] shrink-0">{article.category}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {article.author && (
          <span className="text-xs text-[#94A3B8] hidden sm:block">{article.author.name}</span>
        )}
        {(article.scheduledAt || article.publishedAt) && (
          <span className="text-xs text-[#94A3B8]">
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
            statusColour[article.status] || "bg-slate-100 text-slate-500"
          )}
        >
          {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
        </span>
        {article.status === "planned" && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-[#F1F5F9] hover:bg-[#E2E8F0] rounded text-[#64748B] hover:text-[#0F172A] transition-colors disabled:opacity-40"
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
            className="text-[#CBD5E1] hover:text-[#64748B] transition-colors"
          >
            <ExternalLink size={13} />
          </a>
        )}
        <ChevronRight size={14} className="text-[#CBD5E1] group-hover:text-[#94A3B8] transition-colors" />
      </div>
    </Link>
  );
}
