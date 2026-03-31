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
      <div className="flex items-center gap-2 text-[#94A3B8] text-xs mb-6">
        <Loader2 size={11} className="animate-spin" />
        Loading docs...
      </div>
    );
  }

  if (docs.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-[#94A3B8] font-medium uppercase tracking-wider">Recent Audits</span>
        <Link
          href={`/sites/${siteSlug}/docs`}
          className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors flex items-center gap-1"
        >
          View all <ChevronRight size={11} />
        </Link>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {docs.map((doc) => (
          <Link
            key={doc.path}
            href={`/sites/${siteSlug}/docs?file=${encodeURIComponent(doc.path)}`}
            className="flex items-start gap-2 p-3 bg-white border border-[#E2E8F0] rounded-lg hover:border-[#CBD5E1] hover:shadow-sm transition-all group shadow-sm"
          >
            <FileText size={13} className="text-[#CBD5E1] shrink-0 mt-0.5 group-hover:text-[#94A3B8] transition-colors" />
            <span className="text-xs text-[#64748B] group-hover:text-[#475569] transition-colors leading-snug truncate">
              {fileLabel(doc.name)}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
