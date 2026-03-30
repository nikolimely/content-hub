"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Zap } from "lucide-react";

type Site = { id: string; name: string; slug: string };
type Article = { id: string; title: string; keyword: string; status: string };

export default function GeneratePage() {
  const router = useRouter();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteId, setSiteId] = useState("");
  const [articles, setArticles] = useState<Article[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/sites").then((r) => r.json()).then(setSites);
  }, []);

  useEffect(() => {
    if (!siteId) return;
    fetch(`/api/articles?siteId=${siteId}`)
      .then((r) => r.json())
      .then((data: Article[]) => setArticles(data.filter((a) => a.status === "planned")));
    setSelected([]);
  }, [siteId]);

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleGenerate() {
    setLoading(true);
    const site = sites.find((s) => s.id === siteId);
    if (selected.length === 1) {
      router.push(`/sites/${site?.slug}/articles/${selected[0]}`);
    } else {
      for (const id of selected) {
        await fetch(`/api/articles/${id}/generate`, { method: "POST" });
      }
      router.push(`/sites/${site?.slug}`);
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-semibold text-white mb-6">Generate</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-xs text-white/40 mb-1.5">Site</label>
          <select
            value={siteId}
            onChange={(e) => setSiteId(e.target.value)}
            className="w-full bg-[#1a1a1a] border border-white/[0.08] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          >
            <option value="">Select a site...</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        {articles.length > 0 && (
          <div>
            <label className="block text-xs text-white/40 mb-1.5">
              Planned articles ({articles.length})
            </label>
            <div className="space-y-1">
              {articles.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-3 px-3 py-2.5 bg-[#161616] border border-white/[0.06] rounded-lg cursor-pointer hover:border-white/20 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(a.id)}
                    onChange={() => toggle(a.id)}
                    className="accent-white"
                  />
                  <div>
                    <p className="text-sm text-white">{a.title}</p>
                    <p className="text-xs text-white/30">{a.keyword}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {siteId && articles.length === 0 && (
          <p className="text-sm text-white/30">No planned articles for this site.</p>
        )}

        {selected.length > 0 && (
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-medium rounded-md hover:bg-white/90 disabled:opacity-50 transition-colors"
          >
            <Zap size={14} />
            Generate {selected.length} article{selected.length > 1 ? "s" : ""}
          </button>
        )}
      </div>
    </div>
  );
}
