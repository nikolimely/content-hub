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
          <div className="h-10 w-10 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-center shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {site.faviconUrl ? (
              <img src={site.faviconUrl} alt={site.name} className="h-5 w-5 object-contain" />
            ) : (
              <span className="text-sm font-semibold text-[#94A3B8]">{site.name[0]}</span>
            )}
          </div>
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

      {/* Articles — dashboard view when no filters, list view when filtered */}
      {filterStatus || filterCategory || filterAuthor || filterQ ? (
        <div className="mt-6">
          {filtered.length === 0 ? (
            <div className="border border-dashed border-[#E2E8F0] rounded-xl p-10 text-center">
              <p className="text-sm text-[#94A3B8]">No articles match the current filters.</p>
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
      ) : (
        <div className="mt-6 space-y-8">
          {site.articles.length === 0 && (
            <div className="border border-dashed border-[#E2E8F0] rounded-xl p-10 text-center">
              <p className="text-sm text-[#94A3B8]">No articles yet. Add one above or sync from the repo.</p>
            </div>
          )}

          {/* Recently published */}
          {(() => {
            const live = site.articles
              .filter(isLive)
              .sort((a, b) => new Date(b.scheduledAt ?? b.publishedAt ?? b.createdAt).getTime() - new Date(a.scheduledAt ?? a.publishedAt ?? a.createdAt).getTime())
              .slice(0, 5);
            if (!live.length) return null;
            return (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Recently Published</h2>
                  <button onClick={undefined} className="hidden" />
                  <Link href={`?status=published`} className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">View all</Link>
                </div>
                <div className="space-y-1">
                  {live.map((article) => (
                    <ArticleRow key={article.id} article={article} siteSlug={slug} liveUrl={getLiveUrl(article.slug)} />
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Scheduled / coming up */}
          {(() => {
            const upcoming = site.articles
              .filter(isScheduled)
              .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());
            if (!upcoming.length) return null;
            return (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Scheduled</h2>
                  <Link href={`?status=scheduled`} className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">View all</Link>
                </div>
                <div className="space-y-1">
                  {upcoming.map((article) => (
                    <ArticleRow key={article.id} article={article} siteSlug={slug} liveUrl={null} />
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Drafts */}
          {(() => {
            const drafts = site.articles
              .filter((a) => a.status === "draft")
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            if (!drafts.length) return null;
            return (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Drafts</h2>
                  <Link href={`?status=draft`} className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">View all</Link>
                </div>
                <div className="space-y-1">
                  {drafts.slice(0, 5).map((article) => (
                    <ArticleRow key={article.id} article={article} siteSlug={slug} liveUrl={null} />
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Planned */}
          {(() => {
            const planned = site.articles
              .filter((a) => a.status === "planned")
              .sort((a, b) => {
                if (a.scheduledAt && b.scheduledAt) return new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime();
                if (a.scheduledAt) return -1;
                if (b.scheduledAt) return 1;
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
              });
            if (!planned.length) return null;
            const showing = planned.slice(0, 10);
            return (
              <section>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xs font-semibold text-[#94A3B8] uppercase tracking-wider">Planned <span className="font-normal normal-case">({planned.length})</span></h2>
                  <Link href={`?status=planned`} className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">View all</Link>
                </div>
                <div className="space-y-1">
                  {showing.map((article) => (
                    <ArticleRow key={article.id} article={article} siteSlug={slug} liveUrl={null} />
                  ))}
                </div>
                {planned.length > 10 && (
                  <Link href="?status=planned" className="mt-2 inline-block text-xs text-[#94A3B8] hover:text-[#475569] transition-colors">
                    + {planned.length - 10} more planned
                  </Link>
                )}
              </section>
            );
          })()}
        </div>
      )}
    </div>
  );
}
