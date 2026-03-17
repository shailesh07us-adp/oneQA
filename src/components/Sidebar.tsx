"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  Activity,
  CheckCircle2,
  Clock,
  BarChart3,
  ChevronRight,
  FolderOpen,
  Settings,
  LogOut,
  Users,
  Loader2,
  TrendingUp,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { clusterFailures } from "@/lib/intelligence";

const dashboardItems = [
  { href: "/", label: "Overview", icon: Activity, minGlobalRole: null },
  { href: "/triage", label: "Triage Center", icon: AlertTriangle, minGlobalRole: null },
  { href: "/runs", label: "Test Runs", icon: CheckCircle2, minGlobalRole: null },
  { href: "/projects", label: "Projects", icon: FolderOpen, minGlobalRole: null },
  { href: "/performance", label: "Performance", icon: Clock, minGlobalRole: null },
];

const analyticsItems = [
  { href: "/success-rates", label: "Success Rates", icon: BarChart3, minGlobalRole: null },
  { href: "/predictive", label: "Predictive Analysis", icon: TrendingUp, minGlobalRole: null },
  { href: "/business-value", label: "Business Value", icon: Sparkles, minGlobalRole: null },
];

const adminItems = [
  { href: "/users", label: "Users", icon: Users, minGlobalRole: "ADMIN" as const },
];



export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const [triageCount, setTriageCount] = useState<number | null>(null);

  useEffect(() => {
    // Reset navigating state when pathname changes (navigation complete)
    setNavigatingTo(null);
  }, [pathname]);

  useEffect(() => {
    async function fetchTriageCount() {
      try {
        const res = await fetch("/api/runs?limit=100&status=failed");
        if (res.ok) {
          const data = await res.json();
          const clusters = clusterFailures(data.runs || []);
          setTriageCount(clusters.length);
        }
      } catch (e) {
        console.error("Sidebar triage count fetch failed", e);
      }
    }
    fetchTriageCount();
  }, [pathname]); // Refresh on navigation so badge stays in sync

  const userName = session?.user?.name || session?.user?.email || "User";
  const userRole = ((session?.user as any)?.globalRole || "USER") as string;
  const initials = userName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const roleBadge: Record<string, { label: string; cls: string }> = {
    ADMIN: { label: "Admin", cls: "text-rose-400" },
    USER: { label: "User", cls: "text-indigo-400" },
  };
  const badge = roleBadge[userRole] || roleBadge.USER;

  const canSee = (minGlobalRole: string | null) => {
    if (!minGlobalRole) return true;
    return userRole === "ADMIN" || userRole === minGlobalRole;
  };

  const renderNavItem = (item: { href: string; label: string; icon: any; minGlobalRole?: string | null; badge?: string }) => {
    if (!canSee(item.minGlobalRole || null)) return null;
    const isActive = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={(e) => {
          if (pathname !== item.href) {
            setNavigatingTo(item.href);
          }
        }}
        className={`
          group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
          ${isActive
            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 glow-indigo"
            : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent"
          }
        `}
      >
        <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className="px-1.5 py-0.5 rounded-md bg-rose-500/20 text-rose-400 text-[10px] font-black border border-rose-500/30 group-hover:scale-110 transition-transform">
            {item.badge}
          </span>
        )}
        {navigatingTo === item.href ? (
          <Loader2 className="w-3 h-3 ml-auto animate-spin text-indigo-400" />
        ) : (
          isActive && <ChevronRight className="w-3 h-3 ml-auto text-indigo-500" />
        )}
      </Link>
    );
  };

  return (
    <aside className="w-64 border-r border-slate-800/60 bg-[#0c1021] flex flex-col shrink-0">
      {/* Logo */}
      <div className="h-16 flex items-center px-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">QA</div>
          <div>
            <span className="text-base font-bold tracking-tight text-white">OneAutomation</span>
            <p className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Dashboard</p>
        {dashboardItems.map(item => {
          const badge = item.label === "Triage Center" && triageCount !== null && triageCount > 0 
            ? triageCount.toString() 
            : (item as any).badge;
          return renderNavItem({ ...item, badge });
        })}

        <div className="pt-6">
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Intelligence</p>
          {renderNavItem({ href: "/command-center", label: "Command Center", icon: Sparkles, minGlobalRole: null })}
        </div>

        <div className="pt-6">
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Analytics</p>
          {analyticsItems.map(renderNavItem)}
        </div>

        {canSee("ADMIN") && (
          <div className="pt-6">
            <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Administration</p>
            {adminItems.map(renderNavItem)}
          </div>
        )}

        <div className="pt-6">
          <p className="px-3 pb-2 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Account</p>
          {renderNavItem({ href: "/settings", label: "Settings", icon: Settings, minGlobalRole: null })}
        </div>
      </nav>

      {/* Footer — Real User */}
      <div className="p-4 border-t border-slate-800/60">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold shadow-md">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-200 truncate">{userName}</p>
            <p className={`text-[10px] font-medium ${badge.cls}`}>{badge.label}</p>
          </div>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="p-1.5 rounded-md text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors" title="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
