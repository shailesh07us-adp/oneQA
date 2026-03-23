"use client";

import Sidebar from "./Sidebar";
import { useNavigation } from "./NavigationProvider";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isNavigating } = useNavigation();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a] relative">
        {/* Navigation Progress Bar */}
        {isNavigating && (
          <div className="absolute top-0 left-0 right-0 h-0.5 z-50 overflow-hidden bg-indigo-500/10">
            <div className="h-full bg-indigo-500 animate-progress shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
          </div>
        )}

        <div className={`flex-1 flex flex-col transition-all duration-300 ${isNavigating ? "opacity-40 blur-[1px] pointer-events-none" : "opacity-100 blur-0"}`}>
          {children}
        </div>

        {/* Subtle Central Loading Indicator */}
        {isNavigating && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300 delay-150">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <span className="text-xs font-medium text-indigo-400/80 tracking-widest uppercase animate-pulse">Loading</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
