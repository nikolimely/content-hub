import { db } from "@/lib/db";
import Link from "next/link";
import { Plus, ExternalLink } from "lucide-react";
import { SiteLogo } from "./site-logo";

const statusColour: Record<string, string> = {
  planned: "bg-white/10 text-white/50",
  generating: "bg-blue-500/20 text-blue-400",
  draft: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-green-500/20 text-green-400",
  published: "bg-purple-500/20 text-purple-400",
};

export default async function SitesPage() {
  const sites = await db.site.findMany({
    include: { articles: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-white">Sites</h1>
        <Link
          href="/sites/new"
          className="flex items-center gap-2 px-3 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-white/90 transition-colors"
        >
          <Plus size={14} /> Add Site
        </Link>
      </div>

      {sites.length === 0 ? (
        <p className="text-sm text-white/30">No sites yet.</p>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {sites.map((site) => {
            const byStatus = site.articles.reduce((acc, a) => {
              acc[a.status] = (acc[a.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            return (
              <Link
                key={site.id}
                href={`/sites/${site.slug}`}
                className="bg-[#161616] border border-white/[0.06] rounded-xl p-5 hover:border-white/20 transition-colors group flex flex-col gap-4"
              >
                {/* Logo + domain */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <SiteLogo logo={site.logo} name={site.name} />
                  </div>
                  <a
                    href={`https://${site.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white/20 hover:text-white/60 transition-colors"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>

                {/* Name + description */}
                <div>
                  <p className="text-sm font-medium text-white">{site.name}</p>
                  {site.description ? (
                    <p className="text-xs text-white/30 mt-1 leading-relaxed line-clamp-2">
                      {site.description}
                    </p>
                  ) : (
                    <p className="text-xs text-white/20 mt-0.5">{site.domain}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
                  <div className="flex flex-wrap gap-1.5">
                    {(Object.entries(byStatus) as [string, number][])
                      .filter(([s]) => s !== "published")
                      .map(([s, count]) => (
                        <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${statusColour[s] || "bg-white/10 text-white/40"}`}>
                          {count} {s}
                        </span>
                      ))}
                  </div>
                  <span className="text-xs text-white/20 shrink-0">
                    {byStatus["published"] ?? 0} published
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
