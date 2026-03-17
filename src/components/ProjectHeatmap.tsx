"use client";

import { Bug, ShieldCheck, AlertTriangle, Flame } from "lucide-react";

interface ProjectHealthItem {
  project: string;
  passRate: number;
  activeBugs: number;
  health: "green" | "yellow" | "red";
}

const healthConfig = {
  green: {
    bg: "bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10",
    dot: "bg-emerald-400",
    label: "Healthy",
    labelCls: "text-emerald-400",
    icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
  },
  yellow: {
    bg: "bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10",
    dot: "bg-amber-400",
    label: "At Risk",
    labelCls: "text-amber-400",
    icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  },
  red: {
    bg: "bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10",
    dot: "bg-rose-400",
    label: "Critical",
    labelCls: "text-rose-400",
    icon: <Flame className="w-4 h-4 text-rose-400" />,
  },
};

export function ProjectHeatmap({ data }: { data: ProjectHealthItem[] }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {data.map((item) => {
        const cfg = healthConfig[item.health];
        return (
          <div
            key={item.project}
            className={`rounded-xl p-4 border transition-all ${cfg.bg}`}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className={`w-2 h-2 rounded-full ${cfg.dot}`} />
              <span className="text-sm font-semibold text-white truncate">
                {item.project}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Pass Rate
                </span>
                <span
                  className={`text-sm font-bold ${
                    item.passRate >= 90
                      ? "text-emerald-400"
                      : item.passRate >= 75
                      ? "text-amber-400"
                      : "text-rose-400"
                  }`}
                >
                  {item.passRate}%
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                  Active Bugs
                </span>
                <span className="text-sm font-bold text-white flex items-center gap-1">
                  <Bug className="w-3 h-3 text-slate-500" />
                  {item.activeBugs}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-1">
                {cfg.icon}
                <span className={`text-[10px] font-semibold ${cfg.labelCls}`}>
                  {cfg.label}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
