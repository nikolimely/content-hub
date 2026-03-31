"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition, useState, useEffect } from "react";
import { Search, X } from "lucide-react";

type Author = { id: string; name: string };

export function FilterBar({
  categories,
  authors,
}: {
  categories: string[];
  authors: Author[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeAuthor = searchParams.get("author");
  const activeCategories = searchParams.get("category")?.split(",").filter(Boolean) ?? [];
  const activeSearch = searchParams.get("q") ?? "";

  const [searchInput, setSearchInput] = useState(activeSearch);

  useEffect(() => {
    setSearchInput(searchParams.get("q") ?? "");
  }, [searchParams]);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (!value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function toggleCategory(cat: string) {
    const params = new URLSearchParams(searchParams.toString());
    const current = params.get("category")?.split(",").filter(Boolean) ?? [];
    const next = current.includes(cat)
      ? current.filter((c) => c !== cat)
      : [...current, cat];
    if (next.length === 0) {
      params.delete("category");
    } else {
      params.set("category", next.join(","));
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  function handleSearch(value: string) {
    setSearchInput(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("q", value);
    } else {
      params.delete("q");
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  const hasFilters = activeCategories.length > 0 || activeAuthor || activeSearch;

  return (
    <div className="space-y-3 mb-6">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8] pointer-events-none" />
          <input
            value={searchInput}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search..."
            className="bg-white border border-[#E2E8F0] rounded-lg pl-8 pr-7 py-1.5 text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] w-44 transition-colors"
          />
          {searchInput && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#475569]"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Author dropdown */}
        {authors.length > 0 && (
          <select
            value={activeAuthor ?? ""}
            onChange={(e) => setParam("author", e.target.value || null)}
            className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] appearance-none cursor-pointer transition-colors"
          >
            <option value="">All authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name.split(" ")[0]}
              </option>
            ))}
          </select>
        )}

        {/* Category multi-select dropdown */}
        {categories.length > 0 && (
          <div className="relative">
            <select
              multiple
              value={activeCategories}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions).map((o) => o.value);
                const params = new URLSearchParams(searchParams.toString());
                if (selected.length === 0) {
                  params.delete("category");
                } else {
                  params.set("category", selected.join(","));
                }
                startTransition(() => router.push(`${pathname}?${params.toString()}`));
              }}
              className="bg-white border border-[#E2E8F0] rounded-lg px-3 py-1.5 text-sm text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#A7C838]/40 focus:border-[#A7C838] cursor-pointer transition-colors"
              size={1}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {activeCategories.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-[#A7C838] text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center leading-none">
                {activeCategories.length}
              </span>
            )}
          </div>
        )}

        {hasFilters && (
          <button
            onClick={() => router.push(pathname)}
            className="text-xs text-[#94A3B8] hover:text-[#475569] transition-colors"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}
