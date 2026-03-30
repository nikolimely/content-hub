"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Globe,
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
    <aside className="w-56 shrink-0 flex flex-col" style={{ backgroundColor: "#2A2944" }}>
      <div className="px-5 py-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://imagely.limely.co.uk/wp-content/uploads/logo.svg"
          alt="Limely"
          style={{ height: 26, width: "auto", marginBottom: 10 }}
        />
        <p className="text-white text-sm font-semibold leading-tight">Content Dashboard</p>
        <p className="text-xs mt-0.5" style={{ color: "#A7C838" }}>Schedule &amp; Manage Posts</p>
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
                  ? "text-white"
                  : "text-white/50 hover:text-white"
              )}
              style={active ? { backgroundColor: "rgba(167,200,56,0.15)", color: "#A7C838" } : undefined}
            >
              <Icon size={15} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-2 py-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        {email && (
          <p className="px-3 text-[11px] truncate mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>{email}</p>
        )}
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.7)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
