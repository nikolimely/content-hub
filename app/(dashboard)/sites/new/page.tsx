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
        className="inline-flex items-center gap-1.5 text-sm text-[#64748B] hover:text-[#0F172A] mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back
      </Link>

      <h1 className="text-xl font-semibold text-[#0F172A] mb-1">Add New Site</h1>
      <p className="text-sm text-[#64748B] mb-6">Choose how content will be published</p>

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
                  ? "bg-[#2A2944] border-[#2A2944] text-white shadow-sm"
                  : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1] hover:text-[#0F172A] shadow-sm"
                : "bg-[#F8FAFC] border-[#E2E8F0] text-[#CBD5E1] cursor-not-allowed"
            )}
          >
            {!d.available && (
              <span className="absolute top-2.5 right-2.5">
                <Lock size={10} className="text-[#CBD5E1]" />
              </span>
            )}
            {destination === d.id && d.available && (
              <span className="absolute top-2.5 right-2.5">
                <Check size={11} className="text-white/80" />
              </span>
            )}
            <span>{d.icon}</span>
            <div>
              <p className="text-xs font-medium leading-none mb-1">{d.label}</p>
              <p className={cn("text-[11px] leading-snug", destination === d.id && d.available ? "text-white/60" : "text-[#94A3B8]")}>{d.description}</p>
            </div>
            {!d.available && (
              <span className="text-[10px] text-[#CBD5E1] font-medium">Coming soon</span>
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

        <hr className="border-[#E2E8F0]" />

        {/* GitHub-specific fields */}
        {destination === "github" && (
          <>
            <div>
              <p className="text-xs font-medium text-[#64748B] mb-3 flex items-center gap-1.5">
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
            <hr className="border-[#E2E8F0]" />
          </>
        )}

        {/* Writing / AI */}
        <div>
          <p className="text-xs font-medium text-[#64748B] mb-3">Writing & AI</p>
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
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#2A2944] text-white text-sm font-medium rounded-lg hover:bg-[#1e1e38] disabled:opacity-50 transition-colors"
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
      <label className="block text-xs text-[#64748B] mb-1.5 font-medium">{label}</label>
      <input
        name={name}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors"
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
      <label className="block text-xs text-[#64748B] mb-1.5 font-medium">{label}</label>
      <textarea
        name={name}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-white border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] transition-colors resize-none"
      />
    </div>
  );
}
