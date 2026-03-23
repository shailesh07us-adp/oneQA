import React from "react";

export function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  const map: Record<string, string> = {
    indigo: "border-indigo-500/80 shadow-[0_-12px_20px_-8px_rgba(99,102,241,0.25)]",
    emerald: "border-emerald-500/80 shadow-[0_-12px_20px_-8px_rgba(52,211,153,0.25)]",
    rose: "border-rose-500/80 shadow-[0_-12px_20px_-8px_rgba(244,63,94,0.25)]",
    sky: "border-sky-500/80 shadow-[0_-12px_20px_-8px_rgba(14,165,233,0.25)]",
    amber: "border-amber-500/80 shadow-[0_-12px_20px_-8px_rgba(245,158,11,0.25)]",
  };

  return (
    <div className={`glass rounded-[2rem] p-7 relative overflow-hidden border-t-4 transition-all duration-500 group hover:-translate-y-1 ${map[color] || map.indigo}`}>
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="p-2 rounded-xl bg-slate-900/50 border border-white/5 transition-transform group-hover:scale-110 duration-500">
            {icon}
          </div>
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-slate-400 transition-colors">Realtime</span>
        </div>
        <div>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">{label}</span>
          <h3 className="text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">{value}</h3>
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-50" />
    </div>
  );
}
