"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, ChevronRight, Loader2 } from "lucide-react";

type DocFile = { path: string; name: string; label: string };

function fileLabel(label: string): string {
  return label
    .replace(/\.md$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function RecentDocs({ siteSlug }: { siteSlug: string }) {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/sites/${siteSlug}/docs`)
      .then((r) => r.json())
      .then((data) => {
        // Only show audits (files inside audits/ folder), most recent first (sorted by name desc)
        const audits = (data.docs ?? [] as DocFile[]).filter((d: DocFile) =>
          d.label.startsWith("audits/")
        );
        setDocs(audits.slice(0, 4));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [siteSlug]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-white/20 text-xs mb-6">
        <Loader2 size={11} className="animate-spin" />
        Loading docs...
      </div>
    );
  }

  if (docs.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/25 font-medium uppercase tracking-wider">Recent Audits</span>
        <Link
          href={`/sites/${siteSlug}/docs`}
          className="text-xs text-white/25 hover:text-white/60 transition-colors flex items-center gap-1"
        >
          View all <ChevronRight size={11} />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {docs.map((doc) => (
          <Link
            key={doc.path}
            href={`/sites/${siteSlug}/docs`}
            className="flex items-start gap-2 p-3 bg-[#161616] border border-white/[0.06] rounded-lg hover:border-white/20 transition-colors group"
          >
            <FileText size={13} className="text-white/20 shrink-0 mt-0.5 group-hover:text-white/40 transition-colors" />
            <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors leading-snug truncate">
              {fileLabel(doc.name)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
