"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "tiptap-markdown";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Bold, Italic, Link2, List, ListOrdered,
  Heading2, Heading3, Heading4, Heading5, Heading6, Quote, Code, Minus, ImageIcon,
  Wand2, Loader2, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ImagePicker } from "./image-picker";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={cn(
        "p-1.5 rounded transition-colors",
        active
          ? "bg-white/15 text-white"
          : "text-white/40 hover:text-white hover:bg-white/10"
      )}
    >
      {children}
    </button>
  );
}

const QUICK_ACTIONS = [
  { label: "Rewrite", instruction: "Rewrite this to be clearer and more engaging, keeping the same meaning" },
  { label: "Shorter", instruction: "Make this shorter and more concise" },
  { label: "Longer", instruction: "Expand this with more detail and depth" },
  { label: "Fix", instruction: "Fix any grammar, spelling, and clarity issues" },
];

export function WysiwygEditor({
  content,
  onChange,
  placeholder,
  articleId,
}: {
  content: string;
  onChange: (markdown: string) => void;
  placeholder?: string;
  articleId?: string;
}) {
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [bubbleMode, setBubbleMode] = useState<"idle" | "prompt" | "loading">("idle");
  const [bubblePos, setBubblePos] = useState<{ x: number; y: number } | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const savedRange = useRef<{ from: number; to: number } | null>(null);
  const promptInputRef = useRef<HTMLInputElement>(null);

  const suppressUpdate = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4, 5, 6] },
        codeBlock: { HTMLAttributes: { class: "not-prose" } },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-blue-400 underline underline-offset-2" },
      }),
      Image.configure({
        HTMLAttributes: { class: "rounded-lg max-w-full" },
      }),
      Placeholder.configure({
        placeholder: placeholder ?? "Start writing...",
        emptyNodeClass: "is-editor-empty",
      }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    immediatelyRender: false,
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-invert prose-sm max-w-none focus:outline-none min-h-[400px] px-8 py-8",
      },
    },
    onUpdate({ editor }) {
      if (suppressUpdate.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const md = (editor.storage as any).markdown.getMarkdown() as string;
      onChange(md);
    },
  });

  useEffect(() => {
    if (!editor) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const current = (editor.storage as any).markdown.getMarkdown() as string;
    if (content !== current) {
      suppressUpdate.current = true;
      editor.commands.setContent(content);
      suppressUpdate.current = false;
    }
  }, [content, editor]);

  // Focus prompt input when bubble mode switches to "prompt"
  useEffect(() => {
    if (bubbleMode === "prompt") {
      setTimeout(() => promptInputRef.current?.focus(), 50);
    }
  }, [bubbleMode]);

  // Track selection to position the floating bubble menu
  const updateBubblePos = useCallback(() => {
    if (!editor) return;
    const { selection } = editor.state;
    if (selection.empty) {
      setBubblePos(null);
      return;
    }
    const coords = editor.view.coordsAtPos(selection.from);
    setBubblePos({ x: coords.left, y: coords.top });
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const handleBlur = () => { if (bubbleMode === "idle") setBubblePos(null); };
    editor.on("selectionUpdate", updateBubblePos);
    editor.on("blur", handleBlur);
    return () => {
      editor.off("selectionUpdate", updateBubblePos);
      editor.off("blur", handleBlur);
    };
  }, [editor, updateBubblePos, bubbleMode]);

  if (!editor) return null;

  function addLink() {
    const url = window.prompt("URL");
    if (!url) return;
    editor?.chain().focus().setLink({ href: url }).run();
  }

  function handleImageInsert(path: string, alt: string, credit: string | null) {
    editor?.chain().focus().setImage({ src: path, alt }).run();
    if (credit) {
      editor?.chain().focus().insertContent(`\n*${credit}*\n`).run();
    }
  }

  async function runRewrite(instruction: string) {
    if (!editor || !articleId) return;

    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, "\n");
    if (!selectedText.trim()) return;

    savedRange.current = { from, to };
    setBubbleMode("loading");
    setCustomPrompt("");

    const res = await fetch(`/api/articles/${articleId}/ai-rewrite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedText, instruction, type: "selection" }),
    });

    if (!res.body) { setBubbleMode("idle"); return; }

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
              const range = savedRange.current;
              if (range && result) {
                editor.chain().focus().deleteRange(range).insertContentAt(range.from, result).run();
              }
              setBubbleMode("idle");
              savedRange.current = null;
            }
          } catch {}
        }
      }
    }
  }

  return (
    <>
      {showImagePicker && articleId && (
        <ImagePicker
          articleId={articleId}
          onInsert={handleImageInsert}
          onClose={() => setShowImagePicker(false)}
        />
      )}

      {/* AI selection bubble menu — portal so it floats above everything */}
      {articleId && (bubblePos || bubbleMode === "loading" || bubbleMode === "prompt") && typeof document !== "undefined" && createPortal(
        <div
          className="fixed z-50 pointer-events-auto"
          style={{
            left: bubblePos ? Math.min(bubblePos.x, window.innerWidth - 360) : 0,
            top: bubblePos ? bubblePos.y - 44 : 0,
          }}
        >
          <div className="bg-[#1a1a1a] border border-white/[0.12] rounded-lg shadow-xl overflow-hidden">
            {bubbleMode === "loading" ? (
              <div className="flex items-center gap-2 px-3 py-2 text-xs text-white/50">
                <Loader2 size={12} className="animate-spin text-purple-400" />
                <span>Rewriting...</span>
              </div>
            ) : bubbleMode === "prompt" ? (
              <div className="flex items-center gap-1 px-2 py-1.5">
                <Wand2 size={12} className="text-purple-400 shrink-0 ml-1" />
                <input
                  ref={promptInputRef}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && customPrompt.trim()) runRewrite(customPrompt.trim());
                    if (e.key === "Escape") { setBubbleMode("idle"); setCustomPrompt(""); setBubblePos(null); }
                  }}
                  placeholder="Give instructions..."
                  className="bg-transparent text-xs text-white placeholder-white/25 focus:outline-none w-48"
                />
                <button
                  onMouseDown={(e) => { e.preventDefault(); if (customPrompt.trim()) runRewrite(customPrompt.trim()); }}
                  disabled={!customPrompt.trim()}
                  className="p-1 text-white/30 hover:text-white disabled:opacity-30 transition-colors"
                >
                  <ArrowRight size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={action.label}
                    onMouseDown={(e) => { e.preventDefault(); runRewrite(action.instruction); }}
                    className={cn(
                      "px-3 py-2 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors whitespace-nowrap",
                      i > 0 && "border-l border-white/[0.08]"
                    )}
                  >
                    {action.label}
                  </button>
                ))}
                <button
                  onMouseDown={(e) => { e.preventDefault(); setBubbleMode("prompt"); }}
                  className="px-2.5 py-2 border-l border-white/[0.08] text-purple-400 hover:text-purple-300 hover:bg-white/10 transition-colors"
                  title="Custom instruction"
                >
                  <Wand2 size={12} />
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col h-full">
        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-4 py-1.5 border-b border-white/[0.06] shrink-0 flex-wrap">
          <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")} title="Bold">
            <Bold size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")} title="Italic">
            <Italic size={14} />
          </ToolbarButton>
          <span className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })} title="Heading 2">
            <Heading2 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })} title="Heading 3">
            <Heading3 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()} active={editor.isActive("heading", { level: 4 })} title="Heading 4">
            <Heading4 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 5 }).run()} active={editor.isActive("heading", { level: 5 })} title="Heading 5">
            <Heading5 size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 6 }).run()} active={editor.isActive("heading", { level: 6 })} title="Heading 6">
            <Heading6 size={14} />
          </ToolbarButton>
          <span className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")} title="Bullet list">
            <List size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")} title="Ordered list">
            <ListOrdered size={14} />
          </ToolbarButton>
          <span className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")} title="Blockquote">
            <Quote size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")} title="Inline code">
            <Code size={14} />
          </ToolbarButton>
          <ToolbarButton onClick={addLink} active={editor.isActive("link")} title="Add link">
            <Link2 size={14} />
          </ToolbarButton>
          <span className="w-px h-4 bg-white/10 mx-1" />
          <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">
            <Minus size={14} />
          </ToolbarButton>
          {articleId && (
            <>
              <span className="w-px h-4 bg-white/10 mx-1" />
              <ToolbarButton onClick={() => setShowImagePicker(true)} title="Insert image">
                <ImageIcon size={14} />
              </ToolbarButton>
            </>
          )}
        </div>

        {/* Editor area */}
        <div className="flex-1 overflow-y-auto">
          <EditorContent editor={editor} />
        </div>
      </div>
    </>
  );
}
