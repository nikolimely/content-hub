import { db } from "@/lib/db";
import Link from "next/link";
import { Globe, FileText, Clock, CheckCircle, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const statusColour: Record<string, string> = {
  planned: "bg-white/10 text-white/60",
  generating: "bg-blue-500/20 text-blue-400",
  draft: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-green-500/20 text-green-400",
  published: "bg-purple-500/20 text-purple-400",
};

export default async function DashboardPage() {
  const sites = await db.site.findMany({
    include: {
      articles: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const totalArticles = sites.reduce((acc, s) => acc + s.articles.length, 0);
  const readyToPublish = sites.reduce(
    (acc, s) => acc + s.articles.filter((a) => a.status === "ready").length,
    0
  );
  const published = sites.reduce(
    (acc, s) => acc + s.articles.filter((a) => a.status === "published").length,
    0
  );
  const drafts = sites.reduce(
    (acc, s) => acc + s.articles.filter((a) => a.status === "draft").length,
    0
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-white">Dashboard</h1>
          <p className="text-sm text-white/40 mt-0.5">
            Content pipeline overview
          </p>
        </div>
        <Link
          href="/sites/new"
          className="flex items-center gap-2 px-3 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-white/90 transition-colors"
        >
          <Plus size={14} />
          Add Site
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {([
          { label: "Total Sites", value: sites.length, icon: Globe },
          { label: "Total Articles", value: totalArticles, icon: FileText },
          { label: "Ready to Publish", value: readyToPublish, icon: CheckCircle },
          { label: "Drafts", value: drafts, icon: Clock },
        ] as { label: string; value: number; icon: LucideIcon }[]).map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="bg-[#161616] border border-white/[0.06] rounded-lg p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/40">{label}</span>
              <Icon size={14} className="text-white/20" />
            </div>
            <span className="text-2xl font-semibold text-white">{value}</span>
          </div>
        ))}
      </div>

      {/* Sites */}
      {sites.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-lg p-12 text-center">
          <Globe size={32} className="text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No sites yet.</p>
          <Link
            href="/sites/new"
            className="inline-block mt-4 text-sm text-white/60 hover:text-white underline underline-offset-2"
          >
            Add your first site
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {sites.map((site) => {
            const byStatus = site.articles.reduce(
              (acc, a) => {
                acc[a.status] = (acc[a.status] || 0) + 1;
                return acc;
              },
              {} as Record<string, number>
            );

            return (
              <Link
                key={site.id}
                href={`/sites/${site.slug}`}
                className="bg-[#161616] border border-white/[0.06] rounded-lg p-5 hover:border-white/20 transition-colors group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-medium text-white group-hover:text-white/90">
                      {site.name}
                    </h2>
                    <span className="text-xs text-white/30">{site.domain}</span>
                  </div>
                  <span className="text-xs bg-white/[0.06] px-2 py-0.5 rounded text-white/40">
                    {site.articles.length} articles
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {(Object.entries(byStatus) as [string, number][]).map(([status, count]) => (
                    <span
                      key={status}
                      className={`text-xs px-2 py-0.5 rounded-full ${statusColour[status] || "bg-white/10 text-white/40"}`}
                    >
                      {count} {status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                  ))}
                  {site.articles.length === 0 && (
                    <span className="text-xs text-white/20">No articles yet</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
