"use client";

import { useSession } from "next-auth/react";
import Sidebar from "@/components/Sidebar";
import { User, Shield, Mail } from "lucide-react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Settings</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Account preferences and platform configuration</p>
          </div>
        </header>

        <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
          {/* Profile */}
          <div className="glass rounded-xl p-6 fade-in-up">
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Profile
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {session?.user?.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U"}
                </div>
                <div>
                  <p className="text-lg font-semibold text-white">{session?.user?.name || "User"}</p>
                  <p className="text-sm text-slate-400 flex items-center gap-1"><Mail className="w-3 h-3" /> {session?.user?.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Role */}
          <div className="glass rounded-xl p-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" /> Role & Permissions
            </h2>
            <div className="flex items-center gap-3">
              <span className="inline-flex px-3 py-1 rounded-md text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                {(session?.user as any)?.role || "ADMIN"}
              </span>
              <span className="text-sm text-slate-400">Full access to all projects and settings</span>
            </div>
          </div>

          {/* Platform Info */}
          <div className="glass rounded-xl p-6 fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-base font-semibold text-white mb-4">Platform</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">Version</span><span className="text-white font-mono">1.0.0</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Database</span><span className="text-white font-mono">SQLite</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Framework</span><span className="text-white font-mono">Next.js 15 + Prisma 5</span></div>
              <div className="flex justify-between"><span className="text-slate-400">Authentication</span><span className="text-white font-mono">NextAuth v5 (JWT)</span></div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
