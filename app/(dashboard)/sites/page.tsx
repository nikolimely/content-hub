import { db } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { SyncAllButton } from "./sync-all-button";
import { SiteCard } from "./site-card";

export default async function SitesPage() {
  const sites = await db.site.findMany({
    include: { articles: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[#0F172A]">Sites</h1>
        <div className="flex items-center gap-2">
          <SyncAllButton />
          <Link
            href="/sites/new"
            className="flex items-center gap-2 px-3 py-2 bg-[#2A2944] text-white text-sm font-medium rounded-lg hover:bg-[#1e1e38] transition-colors"
          >
            <Plus size={14} /> Add Site
          </Link>
        </div>
      </div>

      {sites.length === 0 ? (
        <p className="text-sm text-[#94A3B8]">No sites yet.</p>
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
