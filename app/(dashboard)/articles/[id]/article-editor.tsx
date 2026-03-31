"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Zap, Save, Send, Loader2, Code2, BarChart2, Calendar, ExternalLink, Wand2, ArrowRight, X, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELS } from "@/lib/llm";
import { WysiwygEditor } from "./wysiwyg-editor";
import { ImagePicker } from "./image-picker";
import { SeoPanel } from "./seo-panel";
import { SchedulePanel } from "./schedule-panel";

type Author = { id: string; name: string };

type Article = {
  id: string;
  slug: string;
  title: string;
  keyword: string;
  status: string;
  content: string | null;
  heroImage: string | null;
  scheduledAt: Date | null;
  authorId: string | null;
  site: {
    name: string;
    slug: string;
    domain: string;
    model: string;
    contentTypes: string | null;
    authors: Author[];
  };
};

const statusColour: Record<string, string> = {
  planned: "bg-slate-100 text-slate-500",
  generating: "bg-blue-50 text-blue-600",
  draft: "bg-amber-50 text-amber-600",
  published: "bg-purple-50 text-purple-600",
};

function stripFrontmatter(raw: string): string {
  return raw.replace(/^---[\s\S]*?---\n?/, "").trim();
}

function removeFrontmatterField(raw: string, field: string): string {
  const fm = getFrontmatterBlock(raw);
  const body = stripFrontmatter(raw);
  if (!fm) return raw;
  const newFm = fm.replace(new RegExp(`^${field}:.*\n?`, "m"), "");
  return newFm + (body ? "\n" + body : "");
}

function setFrontmatterField(raw: string, field: string, value: string): string {
  const fm = getFrontmatterBlock(raw);
  const body = stripFrontmatter(raw);
  if (!fm) {
    return `---\n${field}: "${value}"\n---\n\n${body}`;
  }
  const fieldRegex = new RegExp(`^(${field}:\\s*).*$`, "m");
  const newFm = fieldRegex.test(fm)
    ? fm.replace(fieldRegex, `$1"${value}"`)
    : fm.replace(/\n---(\n?)$/, `\n${field}: "${value}"\n---$1`);
  return newFm + (body ? "\n" + body : "");
}

function getFrontmatterBlock(raw: string): string {
  const match = raw.match(/^(---[\s\S]*?---\n?)/);
  return match?.[1] ?? "";
}

function getFrontmatterField(raw: string, field: string): string | null {
  const match = raw.match(new RegExp(`^${field}:\\s*["']?(.+?)["']?$`, "m"));
  return match?.[1] ?? null;
}

function getLiveUrl(article: Article): string | null {
  if (article.status !== "published") return null;
  try {
    const types = JSON.parse(article.site.contentTypes ?? "[]") as { url?: string }[];
    const urlPath = types[0]?.url;
    if (!urlPath) return null;
    return `https://${article.site.domain}${urlPath}/${article.slug}`;
  } catch { return null; }
}

function getPreviewUrl(article: Article): string | null {
  if (!article.content) return null;
  return `/api/preview/enable?articleId=${article.id}`;
}

type Panel = "seo" | "schedule" | null;

export function ArticleEditor({ article }: { article: Article }) {
  const router = useRouter();
  const [content, setContent] = useState(article.content || "");
  const [status, setStatus] = useState(article.status);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [rawMode, setRawMode] = useState(false);
  const [panel, setPanel] = useState<Panel>(null);
  const [aiEditOpen, setAiEditOpen] = useState(false);
  const [aiInstruction, setAiInstruction] = useState("");
  const [aiEditing, setAiEditing] = useState(false);
  const [showFeaturedPicker, setShowFeaturedPicker] = useState(false);
  const [uploadingFeatured, setUploadingFeatured] = useState(false);

  useEffect(() => {
    if (article.status === "generating" && !article.content) startGeneration();
  }, []);

  async function startGeneration() {
    setGenerating(true);
    setStatus("generating");
    setContent("");

    const res = await fetch(`/api/articles/${article.id}/generate`, { method: "POST" });
    if (!res.body) return;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) setContent((prev) => prev + data.text);
            if (data.done) { setStatus("draft"); setGenerating(false); }
            if (data.error) { setStatus("planned"); setGenerating(false); }
          } catch {}
        }
      }
    }
  }

  async function handleSave() {
    setSaving(true);
    await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, status: status === "generating" ? "draft" : status }),
    });
    setSaving(false);
    router.refresh();
  }

  async function handlePublish() {
    setPublishing(true);
    const res = await fetch(`/api/articles/${article.id}/publish`, { method: "POST" });
    if (res.ok) setStatus("published");
    setPublishing(false);
  }

  async function handleAiEdit() {
    if (!aiInstruction.trim() || !content) return;
    setAiEditing(true);
    setAiEditOpen(false);

    const res = await fetch(`/api/articles/${article.id}/ai-rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedText: content, instruction: aiInstruction.trim(), type: "full" }),
    });

    setAiInstruction("");

    if (!res.body) { setAiEditing(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let result = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.text) result += data.text;
            if (data.done || data.error) {
              if (result) setContent(result);
              setAiEditing(false);
            }
          } catch {}
        }
      }
    }
  }

  async function handleFeaturedImageInsert(path: string, alt: string, credit: string | null) {
    setUploadingFeatured(false);
    const updated = setFrontmatterField(content, "featuredImage", path);
    const withAlt = setFrontmatterField(updated, "featuredImageAlt", alt);
    setContent(withAlt);
    // Persist to DB
    await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: withAlt }),
    });
    router.refresh();
    if (credit) {
      // credit is handled inline for body images; for featured we just ignore
    }
  }

  async function handleRemoveFeaturedImage() {
    const updated = removeFrontmatterField(content, "featuredImage");
    const withoutAlt = removeFrontmatterField(updated, "featuredImageAlt");
    setContent(withoutAlt);
    await fetch(`/api/articles/${article.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: withoutAlt }),
    });
    router.refresh();
  }

  function togglePanel(p: Panel) {
    setPanel((prev) => (prev === p ? null : p));
    setRawMode(false);
  }

  function toggleRaw() {
    setRawMode((v) => !v);
    setPanel(null);
  }

  const frontmatter = getFrontmatterBlock(content);
  const body = stripFrontmatter(content);
  function handleBodyChange(newBody: string) { setContent(frontmatter + newBody); }

  const rawHero = getFrontmatterField(content, "featuredImage") ?? article.heroImage;
  // For the live URL (preview/live links) use absolute URL; for editor display use raw path
  const heroImage = rawHero ?? null;
  const heroImageSrc = rawHero
    ? rawHero.startsWith("http")
      ? rawHero
      : `/api/articles/${article.id}/assets/proxy?path=${encodeURIComponent("public" + rawHero)}`
    : null;
  const metaDescription = getFrontmatterField(content, "description");
  const liveUrl = getLiveUrl(article);
  const previewUrl = getPreviewUrl(article);

  const panelBtn = (p: Panel, icon: React.ReactNode, label: string) => (
    <button
      onClick={() => togglePanel(p)}
      className={cn(
        "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors",
        panel === p ? "bg-[#F1F5F9] text-[#0F172A]" : "text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
      )}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-white">
      {showFeaturedPicker && (
        <ImagePicker
          articleId={article.id}
          featured
          onInsert={(path, alt, credit) => {
            setShowFeaturedPicker(false);
            setUploadingFeatured(false);
            handleFeaturedImageInsert(path, alt, credit);
          }}
          onClose={() => { setShowFeaturedPicker(false); setUploadingFeatured(false); }}
          onUploadStart={() => setUploadingFeatured(true)}
        />
      )}
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-[#E2E8F0] bg-white shrink-0 sticky top-0 z-10">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <Link href={`/sites/${article.site.slug}`} className="text-[#94A3B8] hover:text-[#0F172A] transition-colors shrink-0">
            <ArrowLeft size={16} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-sm font-medium text-[#0F172A] leading-tight truncate">{article.title}</h1>
            <p className="text-xs text-[#94A3B8]">{article.site.name} · {article.keyword}</p>
          </div>
        </div>

        {/* Right */}
        <div className="flex items-center gap-1 shrink-0 ml-4">
          <span className={cn("text-xs px-2 py-0.5 rounded-full mr-2", statusColour[status] || "bg-slate-100 text-slate-500")}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>

          {/* Panel toggles */}
          {content && (
            <>
              {panelBtn("seo", <BarChart2 size={13} />, "SEO")}
              {panelBtn("schedule", <Calendar size={13} />, "Publish")}
              <button
                onClick={() => setShowFeaturedPicker(true)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              >
                <ImageIcon size={13} /> {heroImage ? "Featured image" : "Add image"}
              </button>
              <button
                onClick={() => { setAiEditOpen((v) => !v); setPanel(null); setRawMode(false); }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors",
                  aiEditOpen || aiEditing ? "bg-purple-100 text-purple-600" : "text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
                )}
              >
                {aiEditing ? <Loader2 size={13} className="animate-spin" /> : <Wand2 size={13} />}
                {aiEditing ? "Editing..." : "AI Edit"}
              </button>
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors">
                  <ExternalLink size={13} /> Preview
                </a>
              )}
              {liveUrl && (
                <a href={liveUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors">
                  <ExternalLink size={13} /> Live
                </a>
              )}
              <button onClick={toggleRaw} title="Raw MDX"
                className={cn("p-1.5 rounded transition-colors ml-0.5",
                  rawMode ? "bg-[#F1F5F9] text-[#0F172A]" : "text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9]")}>
                <Code2 size={14} />
              </button>
              <span className="w-px h-4 bg-[#E2E8F0] mx-1" />
            </>
          )}

          {/* Action buttons */}
          {status === "planned" && (
            <button onClick={startGeneration} disabled={generating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50">
              <Zap size={12} /> Generate
            </button>
          )}
          {(status === "draft" || status === "generating") && (
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#475569] text-xs rounded-lg transition-colors border border-[#E2E8F0]">
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save
            </button>
          )}
          {status === "draft" && (
            <button onClick={handlePublish} disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2944] text-white text-xs font-medium rounded-lg hover:bg-[#1e1e38] disabled:opacity-50 transition-colors">
              {publishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {publishing ? "Publishing..." : "Publish to GitHub"}
            </button>
          )}
          {status === "published" && (
            <button onClick={async () => {
              setPublishing(true);
              await fetch(`/api/articles/${article.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content }),
              });
              await fetch(`/api/articles/${article.id}/publish`, { method: "POST" });
              setPublishing(false);
              router.refresh();
            }} disabled={publishing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2A2944] text-white text-xs font-medium rounded-lg hover:bg-[#1e1e38] disabled:opacity-50 transition-colors">
              {publishing ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
              {publishing ? "Updating..." : "Update on GitHub"}
            </button>
          )}
        </div>
      </header>

      {/* AI Edit bar */}
      {aiEditOpen && (
        <div className="flex items-center gap-2 px-4 py-2 border-b border-[#E2E8F0] bg-purple-50 shrink-0">
          <Wand2 size={13} className="text-purple-500 shrink-0" />
          <input
            autoFocus
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAiEdit();
              if (e.key === "Escape") { setAiEditOpen(false); setAiInstruction(""); }
            }}
            placeholder="Describe your edit... e.g. 'Make the tone more conversational' or 'Add a FAQ section at the end'"
            className="flex-1 bg-transparent text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
          />
          <button
            onClick={handleAiEdit}
            disabled={!aiInstruction.trim()}
            className="flex items-center gap-1 px-2.5 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs rounded-lg transition-colors"
          >
            <ArrowRight size={12} /> Edit
          </button>
          <button onClick={() => { setAiEditOpen(false); setAiInstruction(""); }} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor */}
        <div className="flex-1 overflow-hidden bg-[#F8FAFC]">
          {rawMode ? (
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              className="w-full h-full p-6 bg-white text-sm text-[#0F172A] font-mono leading-relaxed resize-none focus:outline-none" />
          ) : generating ? (
            <div className="h-full overflow-y-auto">
              <article className="max-w-2xl mx-auto px-8 py-10">
                {heroImageSrc && <div className="mb-8 rounded-lg overflow-hidden aspect-video"><img src={heroImageSrc} alt={article.title} className="w-full h-full object-cover" /></div>}
                <h1 className="text-2xl font-bold text-[#0F172A] mb-2">{article.title}</h1>
                {metaDescription && <p className="text-sm text-[#94A3B8] mb-8">{metaDescription}</p>}
                <pre className="text-sm text-[#475569] font-mono whitespace-pre-wrap leading-relaxed">{body}</pre>
              </article>
            </div>
          ) : content ? (
            <div className="h-full overflow-y-auto">
              <div className="max-w-2xl mx-auto px-8 pt-8">
                {heroImage ? (
                  <div className="relative group rounded-lg overflow-hidden aspect-video mb-2 bg-[#F1F5F9]">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemoveFeaturedImage(); }}
                      className="absolute top-2 right-2 z-10 p-1 bg-black/60 hover:bg-red-500/80 text-white rounded-md transition-colors opacity-0 group-hover:opacity-100"
                      title="Remove featured image"
                    >
                      <X size={12} />
                    </button>
                  <div className="absolute inset-0 cursor-pointer" onClick={() => setShowFeaturedPicker(true)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={heroImageSrc ?? ""} alt={article.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex flex-col items-center justify-center gap-1">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg backdrop-blur-sm">
                        {uploadingFeatured ? <Loader2 size={12} className="animate-spin" /> : <ImageIcon size={12} />}
                        {uploadingFeatured ? "Uploading..." : "Change image"}
                      </span>
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-white/60 font-mono truncate max-w-xs">{heroImage}</span>
                    </div>
                  </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowFeaturedPicker(true)}
                    className="w-full aspect-video rounded-lg border border-dashed border-[#E2E8F0] hover:border-[#CBD5E1] flex items-center justify-center gap-2 text-[#CBD5E1] hover:text-[#94A3B8] transition-colors mb-2"
                  >
                    {uploadingFeatured ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                    <span className="text-xs">{uploadingFeatured ? "Uploading..." : "Add featured image"}</span>
                  </button>
                )}
              </div>
              <div className="max-w-2xl mx-auto">
                <WysiwygEditor content={body} onChange={handleBodyChange} placeholder="Start writing..." articleId={article.id} />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-[#94A3B8] mb-4">No content yet.</p>
                <button onClick={startGeneration}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg transition-colors mx-auto">
                  <Zap size={14} /> Generate with {MODELS.find(m => m.value === article.site.model)?.label.split(" ")[0] ?? "AI"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Side panel */}
        {panel && (
          <div className="w-[430px] shrink-0 border-l border-[#E2E8F0] overflow-y-auto bg-white">
            {panel === "seo" && (
              <SeoPanel article={article} content={content} onContentChange={setContent} />
            )}
            {panel === "schedule" && (
              <SchedulePanel article={article} authors={article.site.authors} onStatusChange={setStatus} />
            )}
          </div>
        )}
      </div>

      {generating && (
        <div className="shrink-0 px-6 py-2 border-t border-[#E2E8F0] bg-blue-50">
          <p className="text-xs text-blue-600 flex items-center gap-1.5">
            <Loader2 size={11} className="animate-spin" /> Generating with {MODELS.find(m => m.value === article.site.model)?.label.split(" ")[0] ?? "AI"}...
          </p>
        </div>
      )}
    </div>
  );
}
