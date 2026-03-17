"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Link from "next/link";
import {
  Activity,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Zap,
  Clock,
  ArrowRight,
  BarChart3,
  AlertTriangle,
  FolderOpen,
  Key,
  Sparkles,
} from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { TestCaseTrendChart, DurationTrendChart, BuildScoreGauge } from "@/components/TrendChart";
import { TestingPyramid } from "@/components/TestingPyramid";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedKpi, setSelectedKpi] = useState<{ label: string; runs: any[] } | null>(null);

  useEffect(() => {
    fetch("/api/runs?limit=100")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedKpi(null);
    };
    if (selectedKpi) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedKpi]);

  if (loading || !data) {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center bg-[#0a0e1a]">
          <Activity className="w-6 h-6 text-indigo-400 animate-spin" />
        </main>
      </div>
    );
  }

  const runs = data.runs || [];
  const total = data.total || 0;
  const passed = runs.filter((r: any) => r.status === "passed").length;
  const failed = runs.filter((r: any) => r.status === "failed").length;
  const rate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const avgDuration = runs.length > 0 ? Math.round(runs.reduce((s: number, r: any) => s + (r.duration || 0), 0) / runs.length / 1000) : 0;
  const projects = Array.from(new Set(runs.map((r: any) => r.project)));
  const envs = Array.from(new Set(runs.map((r: any) => r.env)));

  // Build score computation
  const testResults: Record<string, { passed: number; total: number }> = {};
  runs.forEach((r: any) => r.suites?.forEach((s: any) => s.tests?.forEach((t: any) => {
    if (!testResults[t.title]) testResults[t.title] = { passed: 0, total: 0 };
    testResults[t.title].total++;
    if (t.status === "passed") testResults[t.title].passed++;
  })));

  const flakyTests = Object.entries(testResults)
    .filter(([, v]) => v.passed < v.total && v.passed > 0)
    .map(([title, v]) => ({ title, rate: Math.round((v.passed / v.total) * 100) }))
    .sort((a, b) => a.rate - b.rate);

  const flakyRatio = Object.keys(testResults).length > 0
    ? flakyTests.length / Object.keys(testResults).length
    : 0;

  const buildScore = Math.round(
    rate * 0.5 +
    (1 - flakyRatio) * 100 * 0.2 +
    Math.min(100, Math.max(0, 100 - avgDuration)) * 0.15 +
    Math.min(100, Object.keys(testResults).length * 10) * 0.15
  );

  const recentActivity = runs.slice(0, 4);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Executive Overview</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Enterprise QE health at a glance</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" /> Live
          </span>
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* KPI Row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 fade-in-up">
            <KPI label="Total Runs" value={total} icon={<Activity className="w-4 h-4" />} color="indigo" onClick={() => setSelectedKpi({ label: "Total Runs", runs })} />
            <KPI label="Success Rate" value={`${rate}%`} icon={<TrendingUp className="w-4 h-4" />} color={rate >= 80 ? "emerald" : "rose"} onClick={() => setSelectedKpi({ label: "Success Rate", runs })} />
            <KPI label="Passed" value={passed} icon={<CheckCircle2 className="w-4 h-4" />} color="emerald" onClick={() => setSelectedKpi({ label: "Passed Runs", runs: runs.filter((r: any) => r.status === "passed") })} />
            <KPI label="Failed" value={failed} icon={<XCircle className="w-4 h-4" />} color="rose" onClick={() => setSelectedKpi({ label: "Failed Runs", runs: runs.filter((r: any) => r.status === "failed") })} />
            <KPI label="Avg Duration" value={`${avgDuration}s`} icon={<Clock className="w-4 h-4" />} color="amber" onClick={() => setSelectedKpi({ label: "Run Durations", runs: [...runs].sort((a: any, b: any) => (b.duration || 0) - (a.duration || 0)) })} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
            {/* Build Score & Health */}
            <div className="lg:col-span-4 space-y-4 flex flex-col">
              <div className="glass rounded-2xl p-6 bg-gradient-to-br from-indigo-500/[0.03] to-transparent border-white/[0.02] flex-1 min-h-[160px] flex flex-col justify-center">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Build Quality Score
                </p>
                <div className="flex-1 flex flex-col justify-center">
                  <BuildScoreGauge score={buildScore} />
                </div>
                <p className="text-[11px] text-slate-500 mt-4 leading-relaxed">Composite health score based on stability, coverage, and performance velocity.</p>
              </div>
              
              <div className="glass rounded-2xl p-6 bg-gradient-to-br from-purple-500/[0.03] to-transparent border-white/[0.02] flex-1">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Critical Flakiness
                </p>
                {flakyTests.length === 0 ? (
                  <div className="flex items-center gap-2 text-emerald-400 py-2"><CheckCircle2 className="w-4 h-4" /><span className="text-sm font-bold">Stable Architecture</span></div>
                ) : (
                  <div className="space-y-3 mt-2">
                    {flakyTests.slice(0, 3).map((t) => (
                      <div key={t.title} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02] border border-white/[0.03] hover:bg-white/[0.05] transition-colors">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="text-xs text-slate-300 truncate flex-1 font-medium">{t.title}</span>
                        <span className="text-xs font-black text-amber-400">{t.rate}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Testing Pyramid */}
            <div className="lg:col-span-8">
               <div className="flex items-center justify-between mb-2 px-2">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> Testing Distribution
                  </p>
                  <Link href="/business-value" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Business Value &rarr;</Link>
               </div>
               <TestingPyramid 
                 unit={runs.filter((r: any) => r.type === 'unit').length || 450} 
                 integration={runs.filter((r: any) => r.type === 'integration').length || 180} 
                 e2e={runs.filter((r: any) => r.type === 'e2e').length || 65} 
               />
            </div>
          </div>

          {/* Trend Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="glass rounded-xl p-5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Test Case Trend (14 days)</p>
              <TestCaseTrendChart />
            </div>
            <div className="glass rounded-xl p-5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3">Duration Trend (14 days)</p>
              <DurationTrendChart />
            </div>
          </div>

          {/* Quick Links + Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 fade-in-up" style={{ animationDelay: "0.2s" }}>
            <div className="lg:col-span-2 glass rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Recent Activity</p>
                <Link href="/runs" className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"><span>View All</span><ArrowRight className="w-3 h-3" /></Link>
              </div>
              <div className="space-y-2">
                {recentActivity.map((run: any) => (
                  <div key={run.id} className="flex items-center gap-4 py-2 border-b border-slate-800/30 last:border-0">
                    {run.status === "passed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-200 font-medium truncate">{run.project}</p>
                      <p className="text-[11px] text-slate-500">{run.env} · {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}</p>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">{relativeTime(run.startTime)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <QuickLink href="/runs" icon={<CheckCircle2 className="w-5 h-5" />} label="Test Runs" desc="Execution history" color="indigo" />
              <QuickLink href="/projects" icon={<FolderOpen className="w-5 h-5" />} label="Projects" desc="Manage & API keys" color="purple" />
              <QuickLink href="/predictive" icon={<Sparkles className="w-5 h-5" />} label="Predictive Analysis" desc="ADO & forecasting" color="emerald" />
            </div>
          </div>
        </div>

        {/* KPI Details Modal */}
        {selectedKpi && (
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedKpi(null);
            }}
          >
            <div className="w-full max-w-2xl glass rounded-2xl p-6 max-h-[85vh] flex flex-col shadow-2xl shadow-black/50 fade-in-up" style={{ animationDuration: '0.2s' }}>
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-lg font-semibold text-white">Details: {selectedKpi.label}</h2>
                <button onClick={() => setSelectedKpi(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
                  <span className="sr-only">Close</span>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="overflow-y-auto pr-2 custom-scrollbar">
                {selectedKpi.runs.length === 0 ? (
                  <p className="text-sm text-slate-500 py-8 text-center bg-slate-800/20 rounded-xl border border-slate-700/30">No runs match this criteria.</p>
                ) : (
                  <div className="space-y-2">
                    {selectedKpi.runs.map((run: any) => (
                      <Link href={`/projects/${run.projectId}`} key={run.id} className="flex items-center gap-4 py-3 px-4 rounded-xl hover:bg-slate-800/40 border border-transparent hover:border-slate-700/50 transition-all group">
                        {run.status === "passed" ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <XCircle className="w-4 h-4 text-rose-400 shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200 font-medium truncate group-hover:text-indigo-400 transition-colors">{run.project}</p>
                          <p className="text-[11px] text-slate-500">{run.env} · {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}</p>
                        </div>
                        <span className="text-xs text-slate-500 shrink-0">{relativeTime(run.startTime)}</span>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 transition-colors shrink-0" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function KPI({ label, value, icon, color, onClick }: { label: string; value: string | number; icon: React.ReactNode; color: string; onClick?: () => void }) {
  const map: Record<string, string> = {
    indigo: "from-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:from-indigo-500/20",
    emerald: "from-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:from-emerald-500/20",
    rose: "from-rose-500/10 text-rose-400 border-rose-500/20 group-hover:from-rose-500/20",
    amber: "from-amber-500/10 text-amber-400 border-amber-500/20 group-hover:from-amber-500/20",
  };
  return (
    <div 
      onClick={onClick}
      className={`glass rounded-2xl p-5 group transition-all relative overflow-hidden flex flex-col justify-between border-white/[0.03] bg-gradient-to-br from-transparent to-transparent ${onClick ? "cursor-pointer hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/5 hover:to-white/[0.01]" : ""}`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg bg-gradient-to-br border shadow-sm transition-all duration-300 group-hover:scale-110 ${map[color] || map.indigo}`}>{icon}</div>
        {onClick && <ArrowRight className="w-3 h-3 text-slate-700 group-hover:text-indigo-400 transition-colors" />}
      </div>
      <div>
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block mb-1 group-hover:text-slate-400 transition-colors">{label}</span>
        <p className="text-2xl font-black text-white tracking-tighter">{value}</p>
      </div>
    </div>
  );
}

function QuickLink({ href, icon, label, desc, color }: { href: string; icon: React.ReactNode; label: string; desc: string; color: string }) {
  const map: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20 group-hover:bg-indigo-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 group-hover:bg-emerald-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20 group-hover:bg-purple-500/20",
  };
  return (
    <Link href={href} className="glass rounded-xl p-4 flex items-center gap-4 group hover:shadow-lg transition-all">
      <div className={`p-2.5 rounded-lg border transition-colors ${map[color] || map.indigo}`}>{icon}</div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white">{label}</p>
        <p className="text-[11px] text-slate-500">{desc}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
    </Link>
  );
}
