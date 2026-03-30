"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Article = {
  id: string;
  title: string;
  status: string;
  scheduledAt: string;
  site: { slug: string; name: string; domain: string; faviconUrl: string | null };
};

type UnscheduledArticle = {
  id: string;
  title: string;
  status: string;
  site: { slug: string; name: string; domain: string; faviconUrl: string | null };
};

const statusColour: Record<string, string> = {
  planned: "bg-white/10 text-white/50",
  draft: "bg-yellow-500/20 text-yellow-400",
  ready: "bg-green-500/20 text-green-400",
  published: "bg-purple-500/20 text-purple-400",
};

const statusDot: Record<string, string> = {
  planned: "bg-white/30",
  draft: "bg-yellow-400",
  ready: "bg-green-400",
  published: "bg-purple-400",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCalendarDays(year: number, month: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Align to Monday
  const startDate = new Date(firstDay);
  const dow = firstDay.getDay(); // 0 = Sun
  startDate.setDate(startDate.getDate() - (dow === 0 ? 6 : dow - 1));

  const days: Date[] = [];
  const cur = new Date(startDate);
  while (cur <= lastDay || days.length % 7 !== 0) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
    if (days.length >= 42) break;
  }
  return days;
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function Favicon({ domain, faviconUrl }: { domain: string; faviconUrl: string | null }) {
  const src = faviconUrl || `https://www.google.com/s2/favicons?domain=${domain}&sz=16`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={12}
      height={12}
      className="rounded-sm shrink-0"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

export function ScheduleCalendar({
  articles,
  unscheduled,
}: {
  articles: Article[];
  unscheduled: UnscheduledArticle[];
}) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  function prev() {
    if (month === 0) { setMonth(11); setYear((y) => y - 1); }
    else setMonth((m) => m - 1);
  }
  function next() {
    if (month === 11) { setMonth(0); setYear((y) => y + 1); }
    else setMonth((m) => m + 1);
  }

  const days = getCalendarDays(year, month);
  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));

  const monthLabel = new Date(year, month, 1).toLocaleDateString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-white/[0.06] shrink-0">
        <h1 className="text-lg font-semibold text-white">Schedule</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={prev}
            className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-white w-36 text-center">{monthLabel}</span>
          <button
            onClick={next}
            className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-white/25 py-1.5">
              {d}
            </div>
          ))}
        </div>

        {/* Weeks */}
        <div className="border border-white/[0.06] rounded-xl overflow-hidden">
          {weeks.map((week, wi) => (
            <div
              key={wi}
              className={cn(
                "grid grid-cols-7",
                wi > 0 && "border-t border-white/[0.06]"
              )}
            >
              {week.map((day, di) => {
                const inMonth = day.getMonth() === month;
                const isToday = isSameDay(day, today);
                const dayArticles = articles.filter((a) =>
                  isSameDay(new Date(a.scheduledAt), day)
                );

                return (
                  <div
                    key={di}
                    className={cn(
                      "min-h-[100px] p-2 relative",
                      di < 6 && "border-r border-white/[0.06]",
                      !inMonth && "bg-[#0d0d0d]",
                      inMonth && "bg-[#111111]",
                      isToday && "bg-blue-950/30"
                    )}
                  >
                    {/* Date number */}
                    <div className="flex items-center justify-end mb-1.5">
                      <span
                        className={cn(
                          "text-xs w-6 h-6 flex items-center justify-center rounded-full",
                          isToday
                            ? "bg-blue-500 text-white font-semibold"
                            : inMonth
                            ? "text-white/50"
                            : "text-white/15"
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Articles */}
                    <div className="space-y-1">
                      {dayArticles.map((a) => (
                        <Link
                          key={a.id}
                          href={`/sites/${a.site.slug}/articles/${a.id}`}
                          className="flex items-center gap-1.5 px-1.5 py-1 rounded bg-white/[0.04] hover:bg-white/10 transition-colors group"
                        >
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", statusDot[a.status] ?? "bg-white/30")} />
                          <Favicon domain={a.site.domain} faviconUrl={a.site.faviconUrl} />
                          <span className="text-[11px] text-white/70 group-hover:text-white truncate leading-tight transition-colors">
                            {a.title}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Unscheduled */}
        {unscheduled.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-medium text-white/30 uppercase tracking-wider mb-3">
              Unscheduled — {unscheduled.length} article{unscheduled.length !== 1 ? "s" : ""}
            </h2>
            <div className="space-y-1">
              {unscheduled.map((a) => (
                <Link
                  key={a.id}
                  href={`/sites/${a.site.slug}/articles/${a.id}`}
                  className="flex items-center gap-3 px-4 py-2.5 bg-[#161616] border border-white/[0.06] rounded-lg hover:border-white/20 transition-colors group"
                >
                  <Favicon domain={a.site.domain} faviconUrl={a.site.faviconUrl} />
                  <span className="text-xs text-white/40">{a.site.name}</span>
                  <span className="text-sm text-white/70 group-hover:text-white flex-1 truncate transition-colors">{a.title}</span>
                  <span className={cn("text-xs px-2 py-0.5 rounded-full shrink-0", statusColour[a.status] ?? "bg-white/10 text-white/40")}>
                    {a.status.charAt(0).toUpperCase() + a.status.slice(1)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
