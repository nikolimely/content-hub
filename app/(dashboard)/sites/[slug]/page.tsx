import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import { ArrowLeft, ExternalLink, Users, FileText } from "lucide-react";
import { ArticleRow } from "./article-row";
import { AddArticleForm } from "./add-article-form";
import { SyncButton } from "./sync-button";
import { FilterBar } from "./filter-bar";
import { SiteStats } from "./site-stats";
import { RecentDocs } from "./recent-docs";

export default async function SitePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ status?: string; category?: string; author?: string; q?: string }>;
}) {
  const { slug } = await params;
  const { status: filterStatus, category: filterCategory, author: filterAuthor, q: filterQ } = await searchParams;

  const site = await db.site.findUnique({
    where: { slug },
    include: {
      articles: {
        include: { author: true },
        orderBy: { createdAt: "desc" },
      },
      authors: { orderBy: { name: "asc" } },
    },
  });

  if (!site) notFound();

  const statuses = ["planned", "generating", "draft", "published"];
  const counts = statuses.reduce(
    (acc, s) => {
      acc[s] = site.articles.filter((a) => a.status === s).length;
      return acc;
    },
    {} as Record<string, number>
  );

  const now = new Date();
  const isLive = (a: { status: string; scheduledAt: Date | null }) =>
    a.status === "published" && (!a.scheduledAt || new Date(a.scheduledAt) <= now);
  const isScheduled = (a: { status: string; scheduledAt: Date | null }) =>
    a.status === "published" && a.scheduledAt != null && new Date(a.scheduledAt) > now;
  const scheduledCount = site.articles.filter(isScheduled).length;
  counts["published"] = site.articles.filter(isLive).length;

  const categories = Array.from(
    new Set(site.articles.map((a) => a.category).filter(Boolean))
  ) as string[];

  type ContentType = { path: string; url?: string };
  let contentTypeMap: ContentType[] = [];
  if (site.contentTypes) {
    try { contentTypeMap = JSON.parse(site.contentTypes); } catch { /* ignore */ }
  }
  const siteDomain = site.domain;
  function getLiveUrl(articleSlug: string): string | null {
    const match = contentTypeMap.find((ct) => ct.url);
    if (!match?.url) return null;
    return `https://${siteDomain}${match.url}/${articleSlug}`;
  }

  const q = filterQ?.toLowerCase().trim();
  const filterCategories = filterCategory?.split(",").filter(Boolean) ?? [];
  const filtered = site.articles.filter((a) => {
    if (filterStatus === "scheduled") {
      if (!isScheduled(a)) return false;
    } else if (filterStatus === "published") {
      if (!isLive(a)) return false;
    } else if (filterStatus) {
      if (a.status !== filterStatus) return false;
    }
    if (filterCategories.length > 0 && (!a.category || !filterCategories.includes(a.category))) return false;
    if (filterAuthor && a.authorId !== filterAuthor) return false;
    if (q && !a.title.toLowerCase().includes(q) && !a.keyword.toLowerCase().includes(q)) return false;
    return true;
  }).sort((a, b) => {
    if (filterStatus === "scheduled") {
      return new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime();
    }
    if (filterStatus === "published") {
      return new Date(b.scheduledAt ?? b.publishedAt ?? b.createdAt).getTime() -
             new Date(a.scheduledAt ?? a.publishedAt ?? a.createdAt).getTime();
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="p-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Dashboard
      </Link>

      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          {site.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={site.logo}
              alt={site.name}
              className="h-12 w-auto max-w-[160px] rounded-lg object-contain shrink-0"
            />
          )}
          <div>
            <h1 className="text-xl font-semibold text-[#0F172A]">{site.name}</h1>
            <a
              href={`https://${site.domain}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-[#94A3B8] hover:text-[#64748B] mt-0.5 transition-colors"
            >
              {site.domain} <ExternalLink size={10} />
            </a>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href={`/sites/${slug}/docs`}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            <FileText size={13} /> Docs
          </Link>
          <Link
            href={`/sites/${slug}/authors`}
            className="inline-flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            <Users size={13} />
            {site.authors.length > 0 ? `${site.authors.length} authors` : "Authors"}
          </Link>
          <SyncButton siteSlug={slug} />
          <Link
            href={`/sites/${slug}/settings`}
            className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            Settings
          </Link>
        </div>
      </div>

      <SiteStats counts={counts} scheduledCount={scheduledCount} />

      <RecentDocs siteSlug={slug} />

      <Suspense fallback={null}>
        <FilterBar categories={categories} authors={site.authors} />
      </Suspense>

      {/* Add article */}
      <AddArticleForm siteId={site.id} siteSlug={slug} authors={site.authors} />

      {/* Articles list */}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <div className="border border-dashed border-[#E2E8F0] rounded-xl p-10 text-center">
            <p className="text-sm text-[#94A3B8]">
              {site.articles.length === 0
                ? "No articles yet. Add one above or sync from the repo."
                : "No articles match the current filters."}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filtered.map((article) => (
              <ArticleRow
                key={article.id}
                article={article}
                siteSlug={slug}
                liveUrl={article.status === "published" ? getLiveUrl(article.slug) : null}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
