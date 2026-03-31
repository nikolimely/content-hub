"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Save, Loader2, Check, X, GitCommit, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELS } from "@/lib/llm";

type ContentType = { label: string; path: string; url: string };

type Site = {
  slug: string;
  name: string;
  domain: string;
  description: string | null;
  logo: string | null;
  faviconUrl: string | null;
  githubRepo: string;
  repoBranch: string;
  contentPath: string;
  assetsPath: string;
  imageWidth: number;
  imageHeight: number;
  authorsPath: string | null;
  contentTypes: string | null;
  brandVoice: string | null;
  tone: string | null;
  targetAudience: string | null;
  externalLinksPath: string | null;
  deployHook: string | null;
  model: string;
};

function parseContentTypes(raw: string | null): ContentType[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#64748B] mb-1.5">{label}</label>
      {children}
      {hint && <p className="mt-1 text-[11px] text-[#94A3B8]">{hint}</p>}
    </div>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  monospace,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  monospace?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        "w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors",
        monospace && "font-mono text-xs"
      )}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors resize-none"
    />
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-sm font-semibold text-[#0F172A]">{title}</h2>
      {description && <p className="text-xs text-[#64748B] mt-0.5">{description}</p>}
    </div>
  );
}

type SaveStatus = {
  show: boolean;
  db: "idle" | "saving" | "done" | "error";
  repo: "idle" | "saving" | "done" | "error";
  commitUrl: string | null;
  commitSha: string | null;
  error: string | null;
};

export function SettingsForm({ site }: { site: Site }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>({
    show: false,
    db: "idle",
    repo: "idle",
    commitUrl: null,
    commitSha: null,
    error: null,
  });

  const [name, setName] = useState(site.name);
  const [domain, setDomain] = useState(site.domain);
  const [description, setDescription] = useState(site.description ?? "");
  const [logo, setLogo] = useState(site.logo ?? "");
  const [faviconUrl, setFaviconUrl] = useState(site.faviconUrl ?? "");

  const [githubRepo, setGithubRepo] = useState(site.githubRepo);
  const [repoBranch, setRepoBranch] = useState(site.repoBranch);
  const [contentPath, setContentPath] = useState(site.contentPath);
  const [assetsPath, setAssetsPath] = useState(site.assetsPath);
  const [imageWidth, setImageWidth] = useState(String(site.imageWidth ?? 1200));
  const [imageHeight, setImageHeight] = useState(String(site.imageHeight ?? 800));
  const [authorsPath, setAuthorsPath] = useState(site.authorsPath ?? "");

  const [contentTypes, setContentTypes] = useState<ContentType[]>(
    parseContentTypes(site.contentTypes)
  );

  const [model, setModel] = useState(site.model ?? "claude-sonnet-4-6");
  const [brandVoice, setBrandVoice] = useState(site.brandVoice ?? "");
  const [tone, setTone] = useState(site.tone ?? "");
  const [targetAudience, setTargetAudience] = useState(site.targetAudience ?? "");
  const [externalLinksPath, setExternalLinksPath] = useState(site.externalLinksPath ?? "");
  const [deployHook, setDeployHook] = useState(site.deployHook ?? "");

  function addContentType() {
    setContentTypes((prev) => [...prev, { label: "", path: "", url: "" }]);
  }

  function updateContentType(i: number, key: keyof ContentType, val: string) {
    setContentTypes((prev) =>
      prev.map((ct, idx) => (idx === i ? { ...ct, [key]: val } : ct))
    );
  }

  function removeContentType(i: number) {
    setContentTypes((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleSave() {
    setSaving(true);
    setSaveStatus({ show: true, db: "saving", repo: "idle", commitUrl: null, commitSha: null, error: null });

    const res = await fetch(`/api/sites/${site.slug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, domain, description, logo, faviconUrl,
        githubRepo, repoBranch, contentPath, assetsPath,
        imageWidth: parseInt(imageWidth) || 1200,
        imageHeight: parseInt(imageHeight) || 800,
        authorsPath,
        contentTypes: contentTypes.length > 0 ? JSON.stringify(contentTypes) : null,
        model, brandVoice, tone, targetAudience, externalLinksPath, deployHook,
      }),
    });

    setSaving(false);

    if (!res.ok) {
      setSaveStatus((s) => ({ ...s, db: "error", error: "Failed to save settings" }));
      return;
    }

    const data = await res.json();

    setSaveStatus({
      show: true,
      db: "done",
      repo: data.repoError ? "error" : "done",
      commitUrl: data.commitUrl ?? null,
      commitSha: data.commitSha ?? null,
      error: data.repoError ?? null,
    });

    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link
            href={`/sites/${site.slug}`}
            className="text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-[#0F172A]">{site.name} — Settings</h1>
            <p className="text-xs text-[#94A3B8]">{site.domain}</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#2A2944] text-white hover:bg-[#1e1e38] disabled:opacity-50 transition-colors"
        >
          {saving ? <><Loader2 size={12} className="animate-spin" /> Saving...</> : <><Save size={12} /> Save changes</>}
        </button>
      </div>

      <div className="space-y-10">
        {/* Site Details */}
        <section>
          <SectionHeader title="Site details" />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Site name">
                <Input value={name} onChange={setName} placeholder="Dynamically" />
              </Field>
              <Field label="Domain">
                <Input value={domain} onChange={setDomain} placeholder="dynamically.co.uk" />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={description} onChange={setDescription} placeholder="Short description of the site..." rows={2} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Logo URL" hint="Used in the dashboard sidebar">
                <Input value={logo} onChange={setLogo} placeholder="/logo.svg or https://..." monospace />
              </Field>
              <Field label="Favicon URL" hint="Used in the schedule calendar">
                <Input value={faviconUrl} onChange={setFaviconUrl} placeholder="/favicon.ico or https://..." monospace />
              </Field>
            </div>
          </div>
        </section>

        <hr className="border-[#E2E8F0]" />

        {/* Repository */}
        <section>
          <SectionHeader
            title="Repository"
            description="Where content and assets live in GitHub"
          />
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="GitHub repo">
                <Input value={githubRepo} onChange={setGithubRepo} placeholder="org/repo" monospace />
              </Field>
              <Field label="Branch">
                <Input value={repoBranch} onChange={setRepoBranch} placeholder="main" monospace />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Content path" hint="Where MDX files are stored">
                <Input value={contentPath} onChange={setContentPath} placeholder="src/content/blog" monospace />
              </Field>
              <Field label="Assets path" hint="Where images are committed">
                <Input value={assetsPath} onChange={setAssetsPath} placeholder="public/images/blog" monospace />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Image width (px)" hint="Featured image dimensions">
                <Input value={imageWidth} onChange={setImageWidth} placeholder="1200" monospace />
              </Field>
              <Field label="Image height (px)">
                <Input value={imageHeight} onChange={setImageHeight} placeholder="800" monospace />
              </Field>
            </div>
            <Field label="Authors path" hint="e.g. src/lib/authors.ts — used during sync to import author data">
              <Input value={authorsPath} onChange={setAuthorsPath} placeholder="src/lib/authors.ts" monospace />
            </Field>
          </div>
        </section>

        <hr className="border-[#E2E8F0]" />

        {/* Content types */}
        <section>
          <SectionHeader
            title="Content types"
            description="Maps content paths to live URLs. Used to generate preview and live links."
          />
          <div className="space-y-2">
            {contentTypes.length > 0 && (
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 mb-1">
                {["Label", "Path", "URL prefix", ""].map((h) => (
                  <p key={h} className="text-[11px] text-[#94A3B8] px-1">{h}</p>
                ))}
              </div>
            )}
            {contentTypes.map((ct, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center">
                <input
                  value={ct.label}
                  onChange={(e) => updateContentType(i, "label", e.target.value)}
                  placeholder="Posts"
                  className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] font-mono transition-colors"
                />
                <input
                  value={ct.path}
                  onChange={(e) => updateContentType(i, "path", e.target.value)}
                  placeholder="src/content/blog"
                  className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] font-mono transition-colors"
                />
                <input
                  value={ct.url}
                  onChange={(e) => updateContentType(i, "url", e.target.value)}
                  placeholder="/insights"
                  className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-xs text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] font-mono transition-colors"
                />
                <button
                  onClick={() => removeContentType(i)}
                  className="p-1.5 text-[#CBD5E1] hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
            <button
              onClick={addContentType}
              className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#0F172A] transition-colors mt-1"
            >
              <Plus size={13} /> Add content type
            </button>
          </div>
        </section>

        <hr className="border-[#E2E8F0]" />

        {/* Writing / AI */}
        <section>
          <SectionHeader
            title="Writing & AI"
            description="Model and tone settings used during content generation"
          />
          <div className="space-y-4">
            <Field label="Model" hint="Used for article generation, AI rewrites, and audit generation">
              <div className="grid grid-cols-2 gap-2">
                {MODELS.map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setModel(m.value)}
                    className={cn(
                      "flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition-colors",
                      model === m.value
                        ? "bg-[#2A2944] border-[#2A2944] text-white"
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]"
                    )}
                  >
                    <div>
                      <p className="text-xs font-medium">{m.label}</p>
                      <p className={cn("text-[11px] mt-0.5", model === m.value ? "text-white/60" : "text-[#94A3B8]")}>{m.provider === "anthropic" ? "Anthropic" : "OpenAI"}</p>
                    </div>
                    {model === m.value && <Check size={13} className="text-white shrink-0" />}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Brand voice">
              <Textarea
                value={brandVoice}
                onChange={setBrandVoice}
                placeholder="Friendly, expert, UK-focused. Avoids jargon. Uses data to back up claims..."
                rows={3}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tone">
                <Input value={tone} onChange={setTone} placeholder="Conversational, authoritative" />
              </Field>
              <Field label="Target audience">
                <Input value={targetAudience} onChange={setTargetAudience} placeholder="UK SME marketing teams" />
              </Field>
            </div>
            <Field
              label="External links path"
              hint="Path to a markdown file in the repo containing curated external links for AI to reference"
            >
              <Input value={externalLinksPath} onChange={setExternalLinksPath} placeholder="cms/external-links.md" monospace />
            </Field>
            <Field
              label="Deploy hook URL"
              hint="Vercel deploy hook — triggered automatically when a scheduled post becomes due"
            >
              <Input value={deployHook} onChange={setDeployHook} placeholder="https://api.vercel.com/v1/integrations/deploy/..." monospace />
            </Field>
          </div>
        </section>
      </div>

      {/* Bottom save */}
      <div className="mt-10 pt-6 border-t border-[#E2E8F0] flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium bg-[#2A2944] text-white hover:bg-[#1e1e38] disabled:opacity-50 transition-colors"
        >
          {saving ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><Save size={13} /> Save changes</>}
        </button>
      </div>

      {/* Save status panel */}
      {saveStatus.show && (
        <div className="fixed bottom-6 right-6 w-80 bg-white border border-[#E2E8F0] rounded-xl shadow-xl overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
            <span className="text-xs font-medium text-[#0F172A]">Save status</span>
            <button
              onClick={() => setSaveStatus((s) => ({ ...s, show: false }))}
              className="text-[#94A3B8] hover:text-[#475569] transition-colors"
            >
              <X size={13} />
            </button>
          </div>

          <div className="px-4 py-3 space-y-3">
            {/* DB step */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                saveStatus.db === "saving" ? "bg-[#F1F5F9]" :
                saveStatus.db === "done" ? "bg-green-50" : "bg-red-50"
              )}>
                {saveStatus.db === "saving" ? <Loader2 size={11} className="animate-spin text-[#94A3B8]" /> :
                 saveStatus.db === "done" ? <Check size={11} className="text-green-500" /> :
                 <AlertCircle size={11} className="text-red-500" />}
              </div>
              <div>
                <p className="text-xs text-[#0F172A]">Database</p>
                <p className="text-[11px] text-[#94A3B8]">
                  {saveStatus.db === "saving" ? "Saving settings..." :
                   saveStatus.db === "done" ? "Settings saved" : "Save failed"}
                </p>
              </div>
            </div>

            {/* Repo step */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                saveStatus.repo === "idle" ? "bg-[#F8FAFC]" :
                saveStatus.repo === "saving" ? "bg-[#F1F5F9]" :
                saveStatus.repo === "done" ? "bg-green-50" : "bg-amber-50"
              )}>
                {saveStatus.repo === "idle" ? <GitCommit size={11} className="text-[#CBD5E1]" /> :
                 saveStatus.repo === "saving" ? <Loader2 size={11} className="animate-spin text-[#94A3B8]" /> :
                 saveStatus.repo === "done" ? <Check size={11} className="text-green-500" /> :
                 <AlertCircle size={11} className="text-amber-500" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#0F172A]">GitHub — cms/settings.md</p>
                <p className="text-[11px] text-[#94A3B8] truncate">
                  {saveStatus.repo === "idle" ? "Waiting..." :
                   saveStatus.repo === "saving" ? "Committing..." :
                   saveStatus.repo === "done" && saveStatus.commitSha
                    ? `Committed ${saveStatus.commitSha.slice(0, 7)}`
                    : saveStatus.error ?? "Commit failed"}
                </p>
              </div>
              {saveStatus.repo === "done" && saveStatus.commitUrl && (
                <a
                  href={saveStatus.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#CBD5E1] hover:text-[#64748B] transition-colors shrink-0"
                >
                  <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
