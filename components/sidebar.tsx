"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
  FileText,
  Calendar,
  Settings,
  Zap,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Sites", href: "/sites", icon: Globe },
  { label: "Schedule", href: "/schedule", icon: Calendar },
  { label: "Generate", href: "/generate", icon: Zap },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ email }: { email?: string }) {
  const pathname = usePathname();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="w-56 shrink-0 bg-[#161616] border-r border-white/[0.06] flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-white/[0.06]">
        <span className="text-sm font-semibold tracking-tight text-white">
          Content Hub
        </span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5">
        {nav.map(({ label, href, icon: Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/50 hover:text-white hover:bg-white/[0.05]"
              )}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 py-3 border-t border-white/[0.06]">
        {email && (
          <p className="px-3 text-[11px] text-white/20 truncate mb-1">{email}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm text-white/30 hover:text-white hover:bg-white/[0.05] transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
