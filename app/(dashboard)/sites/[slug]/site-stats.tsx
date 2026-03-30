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
      accentClass: "text-purple-400",
      activeClass: "bg-purple-500/15 border-purple-400/50 shadow-[0_0_0_1px_rgba(168,85,247,0.3)]",
      dotClass: "bg-purple-400",
    },
    {
      key: "scheduled",
      label: "Scheduled",
      count: scheduledCount,
      accentClass: "text-blue-400",
      activeClass: "bg-blue-500/15 border-blue-400/50 shadow-[0_0_0_1px_rgba(96,165,250,0.3)]",
      dotClass: "bg-blue-400",
    },
    {
      key: "draft",
      label: "Draft",
      count: counts.draft ?? 0,
      accentClass: "text-yellow-400",
      activeClass: "bg-yellow-500/15 border-yellow-400/50 shadow-[0_0_0_1px_rgba(250,204,21,0.3)]",
      dotClass: "bg-yellow-400",
    },
    {
      key: "planned",
      label: "Planned",
      count: counts.planned ?? 0,
      accentClass: "text-white/50",
      activeClass: "bg-white/10 border-white/30 shadow-[0_0_0_1px_rgba(255,255,255,0.15)]",
      dotClass: "bg-white/60",
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
                : "bg-[#111] border-white/[0.06] hover:border-white/15 hover:bg-white/[0.03]"
            )}
          >
            {isActive && (
              <span className={cn("absolute top-3 right-3 w-1.5 h-1.5 rounded-full", stat.dotClass)} />
            )}
            <span
              className={cn(
                "text-2xl font-semibold tabular-nums mb-1 transition-colors",
                isActive ? stat.accentClass : "text-white/60"
              )}
            >
              {stat.count}
            </span>
            <span
              className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-white/70" : "text-white/30"
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
