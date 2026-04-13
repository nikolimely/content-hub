"use client";

import { useRouter } from "next/navigation";
import { ExternalLink } from "lucide-react";

const statusColour: Record<string, string> = {
  planned: "bg-slate-100 text-slate-500",
  generating: "bg-blue-50 text-blue-600",
  draft: "bg-amber-50 text-amber-600",
  ready: "bg-green-50 text-green-600",
  published: "bg-purple-50 text-purple-600",
};

type SiteCardProps = {
  site: {
    id: string;
    slug: string;
    name: string;
    domain: string;
    description: string | null;
    logo: string | null;
    articles: { status: string; scheduledAt: Date | null }[];
  };
};

export function SiteCard({ site }: SiteCardProps) {
  const router = useRouter();

  const byStatus = site.articles.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const now = new Date();
  const scheduled = site.articles.filter(
    (a) => a.status === "published" && a.scheduledAt && a.scheduledAt > now
  );
  const lastScheduled = scheduled.length
    ? new Date(Math.max(...scheduled.map((a) => a.scheduledAt!.getTime())))
    : null;

  return (
    <div
      onClick={() => router.push(`/sites/${site.slug}`)}
      className="bg-white border border-[#E2E8F0] rounded-xl p-5 hover:shadow-md hover:border-[#CBD5E1] transition-all group flex flex-col gap-4 shadow-sm cursor-pointer"
    >
      {/* Logo + domain */}
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={site.logo || `https://geticon.dev/?url=${encodeURIComponent(site.domain)}`}
          alt={site.name}
          className="h-[22px] w-auto object-contain"
        />
        <a
          href={`https://${site.domain}`}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="text-[#CBD5E1] hover:text-[#64748B] transition-colors"
        >
          <ExternalLink size={13} />
        </a>
      </div>

      {/* Name + description */}
      <div>
        <p className="text-sm font-medium text-[#0F172A]">{site.name}</p>
        {site.description ? (
          <p className="text-xs text-[#94A3B8] mt-1 leading-relaxed line-clamp-2">
            {site.description}
          </p>
        ) : (
          <p className="text-xs text-[#94A3B8] mt-0.5">{site.domain}</p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#E2E8F0]">
        <div className="flex flex-wrap gap-1.5">
          {(Object.entries(byStatus) as [string, number][])
            .filter(([s]) => s !== "published")
            .map(([s, count]) => (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${statusColour[s] || "bg-slate-100 text-slate-500"}`}>
                {count} {s}
              </span>
            ))}
          {scheduled.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-50 text-sky-600">
              {scheduled.length} scheduled{lastScheduled && ` · last ${lastScheduled.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
            </span>
          )}
        </div>
        <div className="text-right shrink-0">
          <span className="text-xs text-[#94A3B8] block">
            {byStatus["published"] ?? 0} published
          </span>
        </div>
      </div>
    </div>
  );
}
