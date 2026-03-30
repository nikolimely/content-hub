"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

type Article = {
  id: string;
  slug: string;
  title: string;
  status: string;
  site: { domain: string; contentTypes: string | null };
};

function charCount(val: string, min: number, max: number) {
  const n = val.length;
  if (n === 0) return { label: `0 / ${max}`, colour: "text-white/20" };
  if (n < min) return { label: `${n} / ${max} — too short`, colour: "text-yellow-400/70" };
  if (n > max) return { label: `${n} / ${max} — too long`, colour: "text-red-400/70" };
  return { label: `${n} / ${max}`, colour: "text-green-400/70" };
}

function extractField(raw: string, field: string): string {
  const match = raw.match(new RegExp(`^${field}:\\s*["']?(.+?)["']?\\s*$`, "m"));
  return match?.[1] ?? "";
}

function upsertField(raw: string, field: string, value: string): string {
  const re = new RegExp(`^(${field}:).*$`, "m");
  if (re.test(raw)) return raw.replace(re, `$1 "${value}"`);
  return raw.replace(/^(---[\s\S]*?)(---)/, `$1${field}: "${value}"\n$2`);
}

function getLiveUrlPrefix(contentTypes: string | null): string {
  if (!contentTypes) return "/blog";
  try {
    const types = JSON.parse(contentTypes) as { url?: string }[];
    return types[0]?.url ?? "/blog";
  } catch { return "/blog"; }
}

export function SeoPanel({
  article,
  content,
  onContentChange,
}: {
  article: Article;
  content: string;
  onContentChange: (c: string) => void;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(article.slug);
  const [metaTitle, setMetaTitle] = useState(extractField(content, "title") || article.title);
  const [metaDescription, setMetaDescription] = useState(extractField(content, "description"));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  // Keep fields in sync if content changes externally
  useEffect(() => {
    setMetaTitle(extractField(content, "title") || article.title);
    setMetaDescription(extractField(content, "description"));
  }, [article.id]); // only on article switch

  const slugChanged = slug !== article.slug;
  const isPublished = article.status === "published";
  const urlPrefix = getLiveUrlPrefix(article.site.contentTypes);

  async function handleSave() {
    setSaving(true);

    if (slugChanged && isPublished) {
      setRedirecting(true);
      const res = await fetch(`/api/articles/${article.id}/rename-slug`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSlug: slug }),
      });
      setRedirecting(false);
      if (!res.ok) {
        const err = await res.json();
        alert(`Slug rename failed: ${err.error}`);
        setSaving(false);
        return;
      }
    }

    // Update frontmatter in content
    let newContent = content;
    if (metaTitle) newContent = upsertField(newContent, "title", metaTitle);
    if (metaDescription !== undefined) newContent = upsertField(newContent, "description", metaDescription);
    onContentChange(newContent);

    await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...(slugChanged ? { slug } : {}),
        content: newContent,
      }),
    });

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
  }

  const titleCount = charCount(metaTitle, 40, 60);
  const descCount = charCount(metaDescription, 120, 160);

  return (
    <div className="p-5 space-y-5">
      <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">SEO</h2>
      <div className="space-y-5">
          {/* Slug */}
          <div>
            <label className="block text-xs text-white/40 mb-1.5">Slug</label>
            <div className="flex items-center gap-0">
              <span className="text-xs text-white/20 bg-white/[0.04] border border-r-0 border-white/[0.08] rounded-l px-3 py-1.5 font-mono shrink-0">
                {urlPrefix}/
              </span>
              <input
                value={slug}
                onChange={(e) =>
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/--+/g, "-"))
                }
                className="flex-1 bg-[#161616] border border-white/[0.08] rounded-r px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-white/20"
              />
            </div>
            {slugChanged && (
              <p className={cn("text-xs mt-1.5 flex items-center gap-1", isPublished ? "text-yellow-400/80" : "text-white/30")}>
                <AlertTriangle size={11} />
                {isPublished
                  ? "Published article — a redirect will be created automatically."
                  : "Slug will be updated on save."}
              </p>
            )}
          </div>

          {/* Meta title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/40">Meta Title</label>
              <span className={cn("text-xs", titleCount.colour)}>{titleCount.label}</span>
            </div>
            <input
              value={metaTitle}
              onChange={(e) => setMetaTitle(e.target.value)}
              placeholder="SEO page title..."
              className="w-full bg-[#161616] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20"
            />
          </div>

          {/* Meta description */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs text-white/40">Meta Description</label>
              <span className={cn("text-xs", descCount.colour)}>{descCount.label}</span>
            </div>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              rows={3}
              placeholder="SEO meta description..."
              className="w-full bg-[#161616] border border-white/[0.08] rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-white/20 resize-none leading-relaxed"
            />
          </div>

          {/* SERP preview */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
            <p className="text-[10px] text-white/20 mb-2.5 uppercase tracking-wider">SERP Preview</p>
            <p className="text-[15px] text-blue-400 leading-snug mb-0.5 truncate">
              {metaTitle || article.title}
            </p>
            <p className="text-xs text-green-600/70 mb-1">
              https://{article.site.domain}{urlPrefix}/{slug}
            </p>
            <p className="text-xs text-white/40 leading-relaxed line-clamp-2">
              {metaDescription || <span className="text-white/20 italic">No meta description.</span>}
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs rounded transition-colors disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 size={12} className="animate-spin" />{redirecting ? "Renaming..." : "Saving..."}</>
            ) : saved ? (
              <><Check size={12} className="text-green-400" />Saved</>
            ) : (
              "Save SEO"
            )}
          </button>
      </div>
    </div>
  );
}
