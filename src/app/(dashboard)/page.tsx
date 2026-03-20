"use client";

import { useState, useEffect } from "react";
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
  Sparkles,
  Layers,
  MessageSquare,
} from "lucide-react";
import { relativeTime } from "@/lib/utils";
import { TestCaseTrendChart, DurationTrendChart } from "@/components/TrendChart";
import { TestingPyramid } from "@/components/TestingPyramid";
import FeedbackModal from "@/components/FeedbackModal";

interface Test {
  title: string;
  status: string;
}

interface Suite {
  tests?: Test[];
}

interface Run {
  id: string;
  project: string;
  status: string;
  env: string;
  startTime: string;
  duration: number | null;
  suites?: Suite[];
  type?: string;
}

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
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

export default function DashboardPage() {
  const [data, setData] = useState<{ runs: Run[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    fetch("/api/runs?limit=100")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !data) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0a0e1a]">
        <Activity className="w-6 h-6 text-indigo-400 animate-spin" />
      </div>
    );
  }

  const runs = data.runs || [];
  const totalRuns = data.total || 0;
  const passedTests = runs.filter((r) => r.status === "passed").length;
  const failedTests = runs.filter((r) => r.status === "failed").length;
  const successRate = totalRuns > 0 ? Math.round((passedTests / totalRuns) * 100) : 0;
  const avgDuration = runs.length > 0 ? Math.round(runs.reduce((s: number, r) => s + (r.duration || 0), 0) / runs.length / 1000) : 0;
  const recentActivity = runs.slice(0, 4);

  // Build score computation
  const testResults: Record<string, { passed: number; total: number }> = {};
  runs.forEach((r) => r.suites?.forEach((s) => s.tests?.forEach((t) => {
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
    successRate * 0.5 +
    (1 - flakyRatio) * 100 * 0.2 +
    Math.min(100, Math.max(0, 100 - avgDuration)) * 0.15 +
    Math.min(100, Object.keys(testResults).length * 10) * 0.15
  );

  return (
    <>
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Executive Overview</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Enterprise QE health at a glance</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setShowFeedback(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold hover:bg-indigo-500/20 transition-all active:scale-95 shadow-lg shadow-indigo-500/5 group"
            >
              <MessageSquare className="w-4 h-4 text-indigo-400 transition-transform group-hover:scale-110" />
              <span>Feedback</span>
            </button>
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live
            </span>
          </div>
        </header>

        <FeedbackModal isOpen={showFeedback} onClose={() => setShowFeedback(false)} />

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-10 fade-in-up">
            <StatCard label="Total Runs" value={totalRuns} icon={<Layers className="w-4 h-4 text-indigo-400" />} color="indigo" />
            
            {/* Orbital Gauge: Success Rate */}
            <div className="lg:col-span-1 glass rounded-[2rem] p-6 relative overflow-hidden border-t-4 border-emerald-500/80 shadow-[0_-12px_20px_-8px_rgba(52,211,153,0.25)] group hover:-translate-y-1 transition-all duration-500">
              <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Release Readiness</span>
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90 transform">
                    <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800/40" />
                    <circle cx="56" cy="56" r="50" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={314.159} strokeDashoffset={314.159 - (314.159 * successRate) / 100} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-black text-white tracking-tighter">{successRate}<span className="text-xs text-emerald-500/60 ml-0.5">%</span></span>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">Confidence</span>
                  </div>
                  <div className="absolute inset-0 rounded-full bg-emerald-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                </div>
                <div className="mt-4 px-3 py-1 rounded-full bg-slate-900/50 border border-white/5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                  Trend: <span className="text-emerald-400">Stable</span>
                </div>
              </div>
            </div>

            <StatCard label="Passed" value={passedTests} icon={<CheckCircle2 className="w-4 h-4 text-emerald-400" />} color="emerald" />
            <StatCard label="Failed" value={failedTests} icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} color="rose" />
            <StatCard label="Avg Duration" value={`${avgDuration}s`} icon={<Clock className="w-4 h-4 text-sky-400" />} color="sky" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
            {/* Build Score & Health */}
            <div className="lg:col-span-4 flex flex-col gap-6">
              {/* Orbital Build Score Card */}
              <div className="glass rounded-[2rem] p-8 border-t-4 border-indigo-500 shadow-[0_-12px_20px_-8px_rgba(99,102,241,0.25)] relative overflow-hidden group">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Platform QE Score</h2>
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
                </div>
                <div className="flex items-center gap-8">
                  <div className="relative w-24 h-24 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-full h-full -rotate-90">
                      <circle cx="48" cy="48" r="42" fill="transparent" stroke="currentColor" strokeWidth="6" className="text-slate-800/40" />
                      <circle cx="48" cy="48" r="42" fill="transparent" stroke="currentColor" strokeWidth="6" strokeDasharray="264" strokeDashoffset={264 - (264 * buildScore) / 100} strokeLinecap="round" className="text-indigo-500 transition-all duration-1000" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-white">{buildScore}</span>
                      <span className="text-[8px] font-black text-indigo-400/60 uppercase">Score</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-1">Optimized Health</p>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Your platform QE maturity is trending in the top percentile.</p>
                  </div>
                </div>
              </div>

              {/* Orbital Flakiness Card */}
              <div className="glass rounded-[2rem] p-8 border-t-4 border-amber-500 shadow-[0_-12px_20px_-8px_rgba(245,158,11,0.20)] relative overflow-hidden group flex-1">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Flakiness Analysis</h2>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <div className="space-y-4">
                  {flakyTests.length > 0 ? (
                    flakyTests.slice(0, 3).map((test) => (
                      <div key={test.title} className="flex items-center justify-between group/test transition-transform hover:translate-x-1">
                        <span className="text-sm font-bold text-slate-300 group-hover/test:text-white truncate pr-4">{test.title}</span>
                        <span className="text-[10px] font-black text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{test.rate}% Stability</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">Zero flakiness detected in recent cycles.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Testing Pyramid */}
            <div className="lg:col-span-8 flex flex-col">
              <div className="flex items-center justify-between mb-4 px-2">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5" /> Testing Distribution
                </p>
                <Link href="/business-value" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Strategic Insights &rarr;</Link>
              </div>
              <div className="flex-1 min-h-[400px]">
                <TestingPyramid 
                  unit={runs.filter((r) => r.type === 'unit').length || 450} 
                  integration={runs.filter((r) => r.type === 'integration').length || 180} 
                  e2e={runs.filter((r) => r.type === 'e2e').length || 65} 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Test Case stability Trend</p>
              <div className="h-64">
                <TestCaseTrendChart />
              </div>
            </div>
            <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Performance Velocity</p>
              <div className="h-64">
                <DurationTrendChart />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in-up pb-10" style={{ animationDelay: "0.2s" }}>
            <div className="lg:col-span-2 glass rounded-[2rem] p-8 border-white/[0.03]">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Execution Stream</p>
                <Link href="/runs" className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">History &rarr;</Link>
              </div>
              <div className="divide-y divide-white/[0.03]">
                {recentActivity.map((run: Run) => (
                  <div key={run.id} className="flex items-center gap-6 py-4 group transition-all hover:bg-white/[0.01] px-2 rounded-xl">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${run.status === "passed" ? "bg-emerald-500/10" : "bg-rose-500/10"}`}>
                      {run.status === "passed" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-200 group-hover:text-white truncate">{run.project}</p>
                      <p className="text-[11px] text-slate-500 uppercase tracking-widest font-black mt-1.5">{run.env} · {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}</p>
                    </div>
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-white/5">{relativeTime(run.startTime)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <QuickLink href="/runs" icon={<CheckCircle2 className="w-5 h-5" />} label="Test Runs" desc="Detailed history" color="indigo" />
              <QuickLink href="/projects" icon={<FolderOpen className="w-5 h-5" />} label="Projects" desc="API management" color="purple" />
              <QuickLink href="/predictive" icon={<Sparkles className="w-5 h-5" />} label="Predictive AI" desc="Forecasting engine" color="emerald" />
            </div>
          </div>
        </div>
    </>
  );
}
