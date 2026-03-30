"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitBranch, ShoppingBag, Globe, Webhook, Check, Lock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Destination = "github" | "shopify" | "wordpress" | "webhook";

const DESTINATIONS: {
  id: Destination;
  label: string;
  description: string;
  icon: React.ReactNode;
  available: boolean;
}[] = [
  {
    id: "github",
    label: "GitHub",
    description: "Commit MDX/Markdown directly to a repo",
    icon: <GitBranch size={18} />,
    available: true,
  },
  {
    id: "shopify",
    label: "Shopify",
    description: "Publish articles to a Shopify blog",
    icon: <ShoppingBag size={18} />,
    available: false,
  },
  {
    id: "wordpress",
    label: "WordPress",
    description: "Publish posts via the WordPress REST API",
    icon: <Globe size={18} />,
    available: false,
  },
  {
    id: "webhook",
    label: "Webhook",
    description: "POST finished articles to any endpoint",
    icon: <Webhook size={18} />,
    available: false,
  },
];

export default function NewSitePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [destination, setDestination] = useState<Destination>("github");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(fd.entries());

    const res = await fetch("/api/sites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      const site = await res.json();
      router.push(`/sites/${site.slug}`);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-white/40 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <h1 className="text-xl font-semibold text-white mb-1">Add New Site</h1>
      <p className="text-sm text-white/30 mb-6">Choose how content will be published</p>

      {/* Destination picker */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        {DESTINATIONS.map((d) => (
          <button
            key={d.id}
            type="button"
            disabled={!d.available}
            onClick={() => d.available && setDestination(d.id)}
            className={cn(
              "relative flex flex-col items-start gap-2 p-4 rounded-xl border text-left transition-all",
              d.available
                ? destination === d.id
                  ? "bg-white/10 border-white/25 text-white"
                  : "bg-[#161616] border-white/[0.06] text-white/50 hover:border-white/20 hover:text-white/80"
                : "bg-[#111] border-white/[0.04] text-white/20 cursor-not-allowed"
            )}
          >
            {!d.available && (
              <span className="absolute top-2.5 right-2.5">
                <Lock size={10} className="text-white/20" />
              </span>
            )}
            {destination === d.id && d.available && (
              <span className="absolute top-2.5 right-2.5">
                <Check size={11} className="text-white/60" />
              </span>
            )}
            <span className={cn(destination === d.id && d.available ? "text-white" : "")}>{d.icon}</span>
            <div>
              <p className="text-xs font-medium leading-none mb-1">{d.label}</p>
              <p className="text-[11px] text-white/30 leading-snug">{d.description}</p>
            </div>
            {!d.available && (
              <span className="text-[10px] text-white/20 font-medium">Coming soon</span>
            )}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Common fields */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Site Name" name="name" placeholder="Furra" required />
          <Field label="Slug" name="slug" placeholder="furra" required />
        </div>
        <Field label="Domain" name="domain" placeholder="furra.co.uk" required />

        <hr className="border-white/[0.06]" />

        {/* GitHub-specific fields */}
        {destination === "github" && (
          <>
            <div>
              <p className="text-xs font-medium text-white/50 mb-3 flex items-center gap-1.5">
                <GitBranch size={12} /> GitHub settings
              </p>
              <div className="space-y-4">
                <Field
                  label="GitHub Repo"
                  name="githubRepo"
                  placeholder="yourusername/furra"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Branch" name="repoBranch" placeholder="main" />
                  <Field label="Content Path" name="contentPath" placeholder="content/blog" />
                </div>
                <Field label="Assets Path" name="assetsPath" placeholder="public/images/blog" />
              </div>
            </div>
            <hr className="border-white/[0.06]" />
          </>
        )}

        {/* Writing / AI */}
        <div>
          <p className="text-xs font-medium text-white/50 mb-3">Writing & AI</p>
          <div className="space-y-4">
            <TextareaField
              label="Brand Voice"
              name="brandVoice"
              placeholder="Friendly, knowledgeable, passionate about pets..."
              rows={3}
            />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tone" name="tone" placeholder="Conversational, warm" />
              <Field label="Target Audience" name="targetAudience" placeholder="UK pet owners" />
            </div>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-white/90 disabled:opacity-50 transition-colors"
        >
          {loading ? "Creating..." : "Create Site"}
        </button>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  placeholder,
  required,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
      />
    </div>
  );
}

function TextareaField({
  label,
  name,
  placeholder,
  rows = 3,
}: {
  label: string;
  name: string;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="block text-xs text-white/50 mb-1.5">{label}</label>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors resize-none"
      />
    </div>
  );
}
