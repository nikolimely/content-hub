"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

type Stat = {
  key: string;
  label: string;
  count: number;
  accentClass: string;
  activeClass: string;
  dotClass: string;
};

export function SiteStats({
  counts,
  scheduledCount,
}: {
  counts: Record<string, number>;
  scheduledCount: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const activeStatus = searchParams.get("status");

  const stats: Stat[] = [
    {
      key: "published",
      label: "Live",
      count: counts.published ?? 0,
      accentClass: "text-purple-600",
      activeClass: "bg-purple-50 border-purple-200 shadow-sm",
      dotClass: "bg-purple-400",
    },
    {
      key: "scheduled",
      label: "Scheduled",
      count: scheduledCount,
      accentClass: "text-blue-600",
      activeClass: "bg-blue-50 border-blue-200 shadow-sm",
      dotClass: "bg-blue-400",
    },
    {
      key: "draft",
      label: "Draft",
      count: counts.draft ?? 0,
      accentClass: "text-amber-600",
      activeClass: "bg-amber-50 border-amber-200 shadow-sm",
      dotClass: "bg-amber-400",
    },
    {
      key: "planned",
      label: "Planned",
      count: counts.planned ?? 0,
      accentClass: "text-slate-600",
      activeClass: "bg-slate-50 border-slate-300 shadow-sm",
      dotClass: "bg-slate-400",
    },
  ];

  function toggle(key: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (activeStatus === key) {
      params.delete("status");
    } else {
      params.set("status", key);
    }
    startTransition(() => router.push(`${pathname}?${params.toString()}`));
  }

  return (
    <div className="grid grid-cols-4 gap-3 mb-6">
      {stats.map((stat) => {
        const isActive = activeStatus === stat.key;
        return (
          <button
            key={stat.key}
            onClick={() => toggle(stat.key)}
            className={cn(
              "relative flex flex-col items-start p-4 rounded-xl border transition-all text-left cursor-pointer",
              isActive
                ? stat.activeClass
                : "bg-white border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] shadow-sm"
            )}
          >
            {isActive && (
              <span className={cn("absolute top-3 right-3 w-1.5 h-1.5 rounded-full", stat.dotClass)} />
            )}
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums mb-1 transition-colors",
                isActive ? stat.accentClass : "text-[#94A3B8]"
              )}
            >
              {stat.count}
            </span>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-[#475569]" : "text-[#94A3B8]"
              )}
            >
              {stat.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
