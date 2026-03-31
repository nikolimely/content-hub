"use client";

import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";

function getPageTitle(pathname: string): { title: string; subtitle: string } {
  if (pathname === "/") return { title: "Dashboard", subtitle: "Content pipeline overview" };
  if (pathname === "/sites") return { title: "Sites", subtitle: "All connected sites" };
  if (pathname === "/schedule") return { title: "Schedule", subtitle: "Content calendar" };
  if (pathname === "/generate") return { title: "Generate", subtitle: "AI content generation" };
  if (pathname === "/settings") return { title: "Settings", subtitle: "API keys & configuration" };
  if (pathname.endsWith("/settings")) return { title: "Site Settings", subtitle: "Configure this site" };
  if (pathname.endsWith("/authors")) return { title: "Authors", subtitle: "Manage author profiles" };
  if (pathname.endsWith("/docs")) return { title: "Docs", subtitle: "CMS documents & audits" };
  if (pathname.includes("/articles/")) return { title: "Article Editor", subtitle: "Edit & publish content" };
  if (pathname.startsWith("/sites/")) return { title: "Site", subtitle: "Articles & content" };
  return { title: "Content Hub", subtitle: "" };
}

async function handleLogout() {
  await fetch("/api/auth/logout", { method: "POST" });
  window.location.href = "/login";
}

export function DashboardHeader({ email }: { email?: string }) {
  const pathname = usePathname();
  const { title, subtitle } = getPageTitle(pathname);

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 flex-shrink-0 sticky top-0 z-10">
      <div className="min-w-0">
        <p className="text-slate-800 font-semibold text-sm leading-tight truncate">{title}</p>
        {subtitle && <p className="text-slate-400 text-xs mt-0.5">{subtitle}</p>}
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all flex-shrink-0"
      >
        <LogOut className="w-4 h-4" />
        {email && <span className="hidden sm:inline text-xs">{email}</span>}
      </button>
    </header>
  );
}
