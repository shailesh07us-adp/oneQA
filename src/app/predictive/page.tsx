"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import {
  Bug,
  FlaskConical,
  Cog,
  TrendingUp,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { AdoDefectChart } from "@/components/AdoDefectChart";
import { ProjectHeatmap } from "@/components/ProjectHeatmap";
import { ReleaseReadinessGauge } from "@/components/ReleaseReadinessGauge";
import { ExecutiveGauge } from "@/components/ExecutiveGauge";
import { Skeleton } from "@/components/ui/skeleton";

export default function PredictiveAnalysisPage() {
  const [adoData, setAdoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ado")
      .then((r) => r.json())
      .then((d) => {
        setAdoData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Predictive Analysis</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">AI-powered forecasting & release readiness</p>
            </div>
          </div>
          {adoData && !adoData.isLive && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              DEMO MODE
            </span>
          )}
        </header>

        <div className="p-8 space-y-4 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="space-y-4">
              <div className="glass rounded-xl p-6 flex justify-center">
                <Skeleton className="w-40 h-24 rounded-xl" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-40 rounded-xl" />
                ))}
              </div>
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="glass rounded-xl p-4">
                    <Skeleton className="w-20 h-3 mb-2" />
                    <Skeleton className="w-12 h-7" />
                  </div>
                ))}
              </div>
            </div>
          ) : adoData ? (
            <div className="space-y-4 fade-in-up">

              {/* Row 1: Primary Release Readiness Gauge */}
              <div className="glass rounded-xl p-6 flex flex-col items-center">
                <ReleaseReadinessGauge
                  score={adoData.releaseReadiness.score}
                  label={adoData.releaseReadiness.label}
                  color={adoData.releaseReadiness.color}
                  breakdown={adoData.releaseReadiness.breakdown}
                  horizontal={true}
                />
              </div>

              {/* Row 2: Secondary Executive Gauges */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <ExecutiveGauge
                  title="Test Stability Index"
                  description="Trust score for automated suites"
                  score={adoData.stability.score}
                  label={adoData.stability.label}
                  color={adoData.stability.color}
                />
                <ExecutiveGauge
                  title="Resolution Efficiency"
                  description="Resolved vs New (Last 30d)"
                  score={adoData.efficiency.score}
                  label={adoData.efficiency.label}
                  color={adoData.efficiency.color}
                />
                <ExecutiveGauge
                  title="Risk Exposure Level"
                  description="Composite threat probability"
                  score={adoData.threatLevel.score}
                  label={adoData.threatLevel.label}
                  color={adoData.threatLevel.color}
                  suffix=""
                  invertColor={true}
                />
              </div>

              {/* Row 3: Severity KPIs — single horizontal row */}
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                <SeverityCard label="P1 Critical" value={adoData.defects.p1} color="rose" />
                <SeverityCard label="P2 High" value={adoData.defects.p2} color="amber" />
                <SeverityCard label="P3 Medium" value={adoData.defects.p3} color="sky" />
                <SeverityCard label="P4 Low" value={adoData.defects.p4} color="slate" />
                <SeverityCard label="Active Defects" value={adoData.defects.activeCount} color="white" />
                <SeverityCard label="Resolved (7d)" value={adoData.defects.resolvedLast7Days} color="emerald" />
              </div>

              {/* Row 2: Defect Forecast + Project Risk Heatmap */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" style={{ animationDelay: "0.1s" }}>
                <div className="glass rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      Defect Trend + 7-Day Forecast
                    </p>
                  </div>
                  <AdoDefectChart data={adoData.defects.trend} />
                </div>
                <div className="glass rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                      Project Risk Heatmap
                    </p>
                  </div>
                  <ProjectHeatmap data={adoData.projectHealth} />
                </div>
              </div>

              {/* Row 3: ADO Test Plans */}
              <div className="glass rounded-xl p-5 fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center gap-2 mb-4">
                  <FlaskConical className="w-4 h-4 text-purple-400" />
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    ADO Test Plans
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {adoData.testPlans.map((plan: any) => (
                    <div
                      key={plan.name}
                      className="rounded-xl bg-slate-800/30 border border-slate-700/30 p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white truncate">
                          {plan.name}
                        </p>
                        <span
                          className={`text-xs font-bold ${
                            plan.passedPercent >= 90
                              ? "text-emerald-400"
                              : plan.passedPercent >= 75
                              ? "text-amber-400"
                              : "text-rose-400"
                          }`}
                        >
                          {plan.passedPercent}%
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-3">{plan.project}</p>
                      <div className="w-full h-2 rounded-full bg-slate-700/50 overflow-hidden mb-2">
                        <div
                          className={`h-full rounded-full transition-all ${
                            plan.passedPercent >= 90
                              ? "bg-emerald-500"
                              : plan.passedPercent >= 75
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                          style={{ width: `${plan.passedPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{plan.totalTests} tests</span>
                        <span className="flex items-center gap-2">
                          <span className="flex items-center gap-1">
                            <Cog className="w-2.5 h-2.5" /> {plan.automated} auto
                          </span>
                          <span>· {plan.manual} manual</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass rounded-xl p-16 text-center">
              <p className="text-slate-400">Failed to load ADO data. Check your connection.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SeverityCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    rose: "text-rose-400",
    amber: "text-amber-400",
    sky: "text-sky-400",
    slate: "text-slate-400",
    white: "text-white",
    emerald: "text-emerald-400",
  };

  return (
    <div className="glass rounded-xl p-4">
      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${colorMap[color] || "text-white"}`}>
        {value}
      </p>
    </div>
  );
}
