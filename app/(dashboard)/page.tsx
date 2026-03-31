import { db } from "@/lib/db";
import Link from "next/link";
import { Globe, FileText, Clock, CheckCircle, Plus } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { SiteCard } from "./sites/site-card";

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
          <h1 className="text-xl font-semibold text-[#0F172A]">Dashboard</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Content pipeline overview
          </p>
        </div>
        <Link
          href="/sites/new"
          className="flex items-center gap-2 px-3 py-2 bg-[#2A2944] text-white text-sm font-medium rounded-lg hover:bg-[#1e1e38] transition-colors"
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
            className="bg-white border border-[#E2E8F0] rounded-xl p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[#94A3B8]">{label}</span>
              <Icon size={14} className="text-[#CBD5E1]" />
            </div>
            <span className="text-2xl font-semibold text-[#0F172A]">{value}</span>
          </div>
        ))}
      </div>

      {/* Sites */}
      {sites.length === 0 ? (
        <div className="border border-dashed border-[#E2E8F0] rounded-xl p-12 text-center">
          <Globe size={32} className="text-[#CBD5E1] mx-auto mb-3" />
          <p className="text-[#94A3B8] text-sm">No sites yet.</p>
          <Link
            href="/sites/new"
            className="inline-block mt-4 text-sm text-[#64748B] hover:text-[#0F172A] underline underline-offset-2"
          >
            Add your first site
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {sites.map((site) => (
            <SiteCard key={site.id} site={site} />
          ))}
        </div>
      )}
    </div>
  );
}
