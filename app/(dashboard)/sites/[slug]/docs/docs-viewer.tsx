"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, FileText, ChevronRight, Wand2, Loader2, Check, X, FolderOpen, Pencil, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { MODELS } from "@/lib/llm";

type DocFile = { path: string; name: string; label: string };
type AuditType = "seo-audit" | "content-strategy" | "content-calendar" | "implementation-roadmap";

const AUDIT_TYPES: { value: AuditType; label: string; description: string }[] = [
  { value: "seo-audit", label: "SEO Audit", description: "Technical, on-page, content & competitive analysis" },
  { value: "content-strategy", label: "Content Strategy", description: "Topical authority, keyword clusters & content pillars" },
  { value: "content-calendar", label: "Content Calendar", description: "3-month posting schedule with titles & keywords" },
  { value: "implementation-roadmap", label: "Implementation Roadmap", description: "Phased action plan with effort & impact ratings" },
];

function fileLabel(label: string): string {
  return label
    .replace(/\.md$/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function groupDocs(docs: DocFile[]) {
  const groups: Record<string, DocFile[]> = { root: [] };
  for (const doc of docs) {
    const parts = doc.label.split("/");
    if (parts.length === 1) {
      groups.root.push(doc);
    } else {
      const folder = parts.slice(0, -1).join("/");
      if (!groups[folder]) groups[folder] = [];
      groups[folder].push(doc);
    }
  }
  return groups;
}

function toggleNthCheckbox(markdown: string, n: number): string {
  let count = -1;
  return markdown.replace(/- \[([ xX])\]/g, (match, state) => {
    count++;
    if (count === n) {
      return state === " " ? "- [x]" : "- [ ]";
    }
    return match;
  });
}

export function DocsViewer({
  siteSlug,
  siteName,
  model = "claude-sonnet-4-6",
}: {
  siteSlug: string;
  siteName: string;
  model?: string;
}) {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<DocFile | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [showGenerate, setShowGenerate] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingType, setGeneratingType] = useState<AuditType | null>(null);
  const [generatedContent, setGeneratedContent] = useState("");
  const [generated, setGenerated] = useState(false);

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/sites/${siteSlug}/docs`);
    const data = await res.json();
    setDocs(data.docs ?? []);
    setLoading(false);
  }, [siteSlug]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  async function selectFile(doc: DocFile) {
    setSelectedFile(doc);
    setContent(null);
    setContentLoading(true);
    setShowGenerate(false);
    setGenerated(false);
    setGeneratedContent("");
    setEditing(false);
    const res = await fetch(`/api/sites/${siteSlug}/docs?file=${encodeURIComponent(doc.path)}`);
    const data = await res.json();
    setContent(data.content ?? "");
    setContentLoading(false);
  }

  function startEdit() {
    setEditValue(content ?? "");
    setEditing(true);
    setTimeout(() => textareaRef.current?.focus(), 50);
  }

  function cancelEdit() {
    setEditing(false);
    setEditValue("");
  }

  async function saveEdit() {
    if (!selectedFile) return;
    setSaving(true);
    try {
      await fetch(`/api/sites/${siteSlug}/docs`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file: selectedFile.path, content: editValue }),
      });
      setContent(editValue);
      setEditing(false);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCheckbox(index: number) {
    if (!selectedFile || content === null) return;
    const updated = toggleNthCheckbox(content, index);
    setContent(updated);
    fetch(`/api/sites/${siteSlug}/docs`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file: selectedFile.path, content: updated }),
    });
  }

  useEffect(() => {
    if (!editing) return;
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        saveEdit();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  async function runGenerate(type: AuditType) {
    setGenerating(true);
    setGeneratingType(type);
    setGeneratedContent("");
    setGenerated(false);

    const res = await fetch(`/api/sites/${siteSlug}/generate-audit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });

    if (!res.body) { setGenerating(false); return; }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let result = "";

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
            if (data.text) {
              result += data.text;
              setGeneratedContent(result);
            }
            if (data.done) {
              setGenerating(false);
              setGenerated(true);
              await loadDocs();
            }
            if (data.error) {
              setGenerating(false);
            }
          } catch {}
        }
      }
    }
  }

  const groups = groupDocs(docs);
  let checkboxCounter = -1;

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar */}
      <div className="w-64 shrink-0 border-r border-[#E2E8F0] flex flex-col bg-white overflow-y-auto">
        <div className="px-4 py-4 border-b border-[#E2E8F0]">
          <Link
            href={`/sites/${siteSlug}`}
            className="flex items-center gap-1.5 text-xs text-[#94A3B8] hover:text-[#475569] transition-colors mb-3"
          >
            <ArrowLeft size={12} /> {siteName}
          </Link>
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#0F172A]">Docs</h2>
            <button
              onClick={() => { setShowGenerate((v) => !v); setSelectedFile(null); setEditing(false); }}
              className={cn(
                "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                showGenerate ? "bg-purple-100 text-purple-600" : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9]"
              )}
            >
              <Wand2 size={11} /> Generate with {MODELS.find(m => m.value === model)?.label.split(" ")[0] ?? "AI"}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={16} className="animate-spin text-[#CBD5E1]" />
          </div>
        ) : docs.length === 0 ? (
          <p className="text-xs text-[#94A3B8] p-4">No docs found in cms/</p>
        ) : (
          <div className="py-2">
            {Object.entries(groups).map(([folder, files]) => (
              <div key={folder}>
                {folder !== "root" && (
                  <div className="flex items-center gap-1.5 px-4 py-1.5 mt-1">
                    <FolderOpen size={11} className="text-[#CBD5E1] shrink-0" />
                    <span className="text-[11px] text-[#94A3B8] font-medium uppercase tracking-wider">
                      {fileLabel(folder.split("/").pop() ?? folder)}
                    </span>
                  </div>
                )}
                {files.map((doc) => (
                  <button
                    key={doc.path}
                    onClick={() => selectFile(doc)}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-2 text-left transition-colors",
                      selectedFile?.path === doc.path
                        ? "bg-[#F1F5F9] text-[#0F172A]"
                        : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                    )}
                  >
                    <FileText size={12} className="shrink-0" />
                    <span className="text-xs truncate">
                      {fileLabel(doc.name)}
                    </span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto bg-[#F8FAFC]">
        {showGenerate ? (
          <div className="max-w-2xl mx-auto px-8 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-[#0F172A]">Generate a document</h2>
                <p className="text-xs text-[#64748B] mt-0.5">{MODELS.find(m => m.value === model)?.label ?? model} will generate the report and commit it to cms/audits/ in your repo</p>
              </div>
              <button onClick={() => setShowGenerate(false)} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {AUDIT_TYPES.map((at) => {
                const isRunning = generating && generatingType === at.value;
                const isDone = generated && generatingType === at.value;
                return (
                  <div
                    key={at.value}
                    className="flex items-center justify-between p-4 bg-white border border-[#E2E8F0] rounded-xl shadow-sm"
                  >
                    <div>
                      <p className="text-sm font-medium text-[#0F172A]">{at.label}</p>
                      <p className="text-xs text-[#64748B] mt-0.5">{at.description}</p>
                    </div>
                    <button
                      onClick={() => runGenerate(at.value)}
                      disabled={generating}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ml-4",
                        isDone
                          ? "bg-green-50 text-green-600 border border-green-200"
                          : isRunning
                          ? "bg-purple-50 text-purple-600 border border-purple-200"
                          : "bg-[#F1F5F9] hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] disabled:opacity-40 border border-[#E2E8F0]"
                      )}
                    >
                      {isRunning ? (
                        <><Loader2 size={11} className="animate-spin" /> Generating...</>
                      ) : isDone ? (
                        <><Check size={11} /> Done</>
                      ) : (
                        <><Wand2 size={11} /> Generate</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {generatedContent && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-[#94A3B8]">
                    {generating ? "Generating..." : "Generated — committed to repo"}
                  </p>
                  {generating && <Loader2 size={11} className="animate-spin text-purple-500" />}
                </div>
                <div className="bg-white border border-[#E2E8F0] rounded-xl p-5 max-h-96 overflow-y-auto shadow-sm">
                  <pre className="text-xs text-[#475569] font-mono whitespace-pre-wrap leading-relaxed">
                    {generatedContent}
                  </pre>
                </div>
              </div>
            )}
          </div>
        ) : selectedFile ? (
          <div className="max-w-3xl mx-auto px-8 py-8">
            {/* File breadcrumb + toolbar */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                <span>cms</span>
                {selectedFile.label.split("/").map((part, i, arr) => (
                  <span key={i} className="flex items-center gap-2">
                    <ChevronRight size={10} />
                    <span className={i === arr.length - 1 ? "text-[#475569]" : ""}>{part}</span>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {savedFlash && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check size={11} /> Saved
                  </span>
                )}
                {editing ? (
                  <>
                    <button
                      onClick={cancelEdit}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                    >
                      <X size={11} /> Cancel
                    </button>
                    <button
                      onClick={saveEdit}
                      disabled={saving}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-[#2A2944] text-white hover:bg-[#1e1e38] transition-colors disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </>
                ) : (
                  <button
                    onClick={startEdit}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] transition-colors"
                  >
                    <Pencil size={11} /> Edit
                  </button>
                )}
              </div>
            </div>

            {contentLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={20} className="animate-spin text-[#CBD5E1]" />
              </div>
            ) : editing ? (
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full min-h-[70vh] bg-white border border-[#E2E8F0] rounded-xl p-5 text-sm text-[#0F172A] font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] placeholder-[#94A3B8] shadow-sm"
                  placeholder="Start writing..."
                  spellCheck={false}
                />
                <p className="text-xs text-[#94A3B8] mt-2 text-right">⌘S to save</p>
              </div>
            ) : (
              <div className="prose prose-slate prose-sm max-w-none bg-white border border-[#E2E8F0] rounded-xl p-8 shadow-sm
                prose-headings:text-[#0F172A] prose-headings:font-semibold
                prose-h1:text-xl prose-h2:text-base prose-h2:mt-8 prose-h3:text-sm
                prose-p:text-[#475569] prose-p:leading-relaxed
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:underline
                prose-strong:text-[#0F172A]
                prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                prose-pre:bg-[#F8FAFC] prose-pre:border prose-pre:border-[#E2E8F0]
                prose-blockquote:border-[#E2E8F0] prose-blockquote:text-[#64748B]
                prose-li:text-[#475569]
                prose-table:text-sm prose-th:text-[#64748B] prose-td:text-[#475569]
                prose-hr:border-[#E2E8F0]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    input: ({ checked }) => {
                      checkboxCounter++;
                      const idx = checkboxCounter;
                      return (
                        <input
                          type="checkbox"
                          checked={!!checked}
                          onChange={() => toggleCheckbox(idx)}
                          className="mr-1.5 cursor-pointer accent-[#A7C838] relative top-[1px]"
                        />
                      );
                    },
                  }}
                >
                  {content ?? ""}
                </ReactMarkdown>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <FileText size={32} className="text-[#CBD5E1] mb-3" />
            <p className="text-sm text-[#94A3B8]">Select a document to read</p>
            <p className="text-xs text-[#CBD5E1] mt-1">or generate a new one with Claude</p>
          </div>
        )}
      </div>
    </div>
  );
}
