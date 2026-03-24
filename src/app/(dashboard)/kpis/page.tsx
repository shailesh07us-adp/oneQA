"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Zap,
  Target,
  AlertTriangle,
  Bug,
  Layers,
  Timer,
  Gauge,
  ShieldCheck,
  Globe,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { StatCard } from "@/components/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";

interface EnvironmentKpi {
  env: string;
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  successRate: number;
  failureDensity: number;
  avgDuration: number;
  testCount: number;
}

interface KpiData {
  projects: string[];
  summary: {
    totalRuns: number;
    passedRuns: number;
    failedRuns: number;
    successRate: number;
    avgDurationSec: number;
    overallFailureDensity: number;
    flakyRatio: number;
    defectDetectionRate: number;
    uniqueTests: number;
    maturityScore: number;
    mtbfHours: number;
    releaseTimeReduction: number;
    currentWeekRuns: number;
  };
  roi: {
    percentage: number;
    hoursSaved: number;
    costSaved: number;
    costPerBug: number;
    formattedSavings: string;
  };
  trends: {
    runRate: { week: string; count: number; avgDuration: number }[];
    releaseTimeTrend: { week: string; avgDuration: number }[];
  };
  failureDensity: {
    project: string;
    totalRuns: number;
    failedRuns: number;
    density: number;
    testCount: number;
  }[];
  environmentComparison: EnvironmentKpi[];
}

function GaugeRing({
  value,
  label,
  size = 120,
  strokeWidth = 8,
  color,
}: {
  value: number;
  label: string;
  size?: number;
  strokeWidth?: number;
  color: string;
}) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(value, 100)) / 100;
  const colorMap: Record<string, string> = {
    indigo: "text-indigo-500",
    emerald: "text-emerald-500",
    amber: "text-amber-500",
    rose: "text-rose-500",
    sky: "text-sky-500",
    purple: "text-purple-500",
  };
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full -rotate-90 transform">
          <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} className="text-slate-800/40" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="transparent" stroke="currentColor" strokeWidth={strokeWidth} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className={`${colorMap[color] || colorMap.indigo} transition-all duration-1000 ease-out`} />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-white tracking-tighter">{value}<span className="text-xs text-slate-500 ml-0.5">%</span></span>
        </div>
      </div>
      <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">{label}</span>
    </div>
  );
}

const chartTooltipStyle = {
  contentStyle: {
    background: "rgba(15,20,40,0.95)",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "12px",
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: 700,
    backdropFilter: "blur(12px)",
  },
  itemStyle: { color: "#e2e8f0", fontWeight: 700 },
};

export default function KpisPage() {
  const [data, setData] = useState<KpiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("all");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/kpis?project=${selectedProject}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selectedProject]);

  if (loading || !data) {
    return (
      <>
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
              <Gauge className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Automation KPIs</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Loading metrics…</p>
            </div>
          </div>
        </header>
        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-[2rem]" />)}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-[350px] rounded-[2rem]" />
            <Skeleton className="h-[350px] rounded-[2rem]" />
          </div>
        </div>
      </>
    );
  }

  const { summary, roi, trends, failureDensity, environmentComparison } = data;

  return (
    <>
      {/* Header */}
      <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-violet-500/10 border border-violet-500/20">
            <Gauge className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Automation KPIs</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Strategic metrics for test automation effectiveness</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="bg-[#0f1428] border border-slate-700/50 text-white text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500/50 min-w-[120px] max-w-[200px]"
          >
            <option value="all">All Projects</option>
            {data.projects?.map((proj) => (
              <option key={proj} value={proj}>{proj}</option>
            ))}
          </select>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" /> Live
          </span>
        </div>
      </header>

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

        {/* ── ROI & Efficiency Cards ────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 fade-in-up">
          <div className="glass rounded-[2rem] p-7 relative overflow-hidden border-t-4 border-emerald-500/80 shadow-[0_-12px_20px_-8px_rgba(52,211,153,0.25)] group hover:-translate-y-1 transition-all duration-500">
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 transition-transform group-hover:scale-110 duration-500">
                  <DollarSign className="w-4 h-4" />
                </div>
                <span className="text-[9px] font-black text-emerald-500/60 uppercase tracking-[0.2em]">ROI</span>
              </div>
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] block mb-2">Automation ROI</span>
              <h3 className="text-4xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">{roi.percentage}<span className="text-lg text-emerald-500/60 ml-1">%</span></h3>
              <p className="text-[10px] text-slate-600 mt-2 font-bold">{roi.formattedSavings} saved</p>
            </div>
          </div>

          <StatCard label="Hours Saved" value={`${roi.hoursSaved}h`} icon={<Clock className="w-4 h-4 text-sky-400" />} color="sky" />
          <StatCard label="Run Rate / Week" value={summary.currentWeekRuns} icon={<Zap className="w-4 h-4 text-amber-400" />} color="amber" />
          <StatCard label="Failure Density" value={`${summary.overallFailureDensity}%`} icon={<AlertTriangle className="w-4 h-4 text-rose-400" />} color="rose" />
        </div>

        {/* ── Maturity Score + Secondary Gauges ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 fade-in-up" style={{ animationDelay: "0.05s" }}>
          {/* Maturity Score */}
          <div className="lg:col-span-4 glass rounded-[2rem] p-8 border-t-4 border-violet-500/80 shadow-[0_-12px_20px_-8px_rgba(139,92,246,0.25)] relative overflow-hidden group">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Automation Maturity</h2>
              <ShieldCheck className="w-4 h-4 text-violet-400 animate-pulse" />
            </div>
            <div className="flex items-center gap-8">
              <div className="relative w-28 h-28 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <svg className="w-full h-full -rotate-90">
                  <circle cx="56" cy="56" r="48" fill="transparent" stroke="currentColor" strokeWidth="8" className="text-slate-800/40" />
                  <circle cx="56" cy="56" r="48" fill="transparent" stroke="currentColor" strokeWidth="8" strokeDasharray={301.6} strokeDashoffset={301.6 - (301.6 * summary.maturityScore) / 100} strokeLinecap="round" className="text-violet-500 transition-all duration-1000" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-white">{summary.maturityScore}</span>
                  <span className="text-[8px] font-black text-violet-400/60 uppercase">Score</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-white mb-1">
                  {summary.maturityScore >= 80 ? "Highly Optimized" : summary.maturityScore >= 60 ? "Maturing" : summary.maturityScore >= 40 ? "Growing" : "Early Stage"}
                </p>
                <p className="text-[11px] text-slate-500 leading-relaxed font-medium">Composite of pass rate, coverage, speed, and stability.</p>
              </div>
            </div>
          </div>

          {/* Gauges Row */}
          <div className="lg:col-span-8 glass rounded-[2rem] p-8 border-white/[0.03]">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-8">Quality & Efficiency Gauges</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <GaugeRing value={summary.flakyRatio} label="Flaky Ratio" color={summary.flakyRatio > 20 ? "rose" : summary.flakyRatio > 10 ? "amber" : "emerald"} />
              <GaugeRing value={summary.defectDetectionRate} label="Defect Detection" color="indigo" />
              <GaugeRing value={summary.successRate} label="Pass Rate" color="emerald" />
              <GaugeRing value={Math.min(100, Math.round(summary.releaseTimeReduction + 50))} label="Time Reduction" color="sky" />
            </div>
          </div>
        </div>

        {/* ── Trend Charts ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
          {/* Run Rate Trend */}
          <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
            <div className="flex items-center gap-3 mb-6 border-b border-white/[0.03] pb-4">
              <TrendingUp className="w-4 h-4 text-indigo-400" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Run Rate Trend</h2>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends.runRate}>
                  <defs>
                    <linearGradient id="runRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="week" tick={{ fill: "#475569", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltipStyle} />
                  <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2.5} fill="url(#runRateGrad)" name="Runs" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Release Time Reduction */}
          <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
            <div className="flex items-center gap-3 mb-6 border-b border-white/[0.03] pb-4">
              <TrendingDown className="w-4 h-4 text-emerald-400" />
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Avg Duration Trend</h2>
              {summary.releaseTimeReduction > 0 && (
                <span className="ml-auto text-[9px] font-black px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                  {summary.releaseTimeReduction}% Faster
                </span>
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trends.releaseTimeTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                  <XAxis dataKey="week" tick={{ fill: "#475569", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#475569", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} unit="s" />
                  <Tooltip {...chartTooltipStyle} />
                  <Line type="monotone" dataKey="avgDuration" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: "#10b981", stroke: "#0a0e1a", strokeWidth: 2 }} name="Avg Duration (s)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ── Environment Comparison ───────────────────────── */}
        <div className="fade-in-up" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Globe className="w-3.5 h-3.5 text-sky-400" />
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Environment Comparison</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Env cards */}
            <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {environmentComparison.map((env) => {
                const isGood = env.successRate >= 80;
                const borderColor = isGood
                  ? "border-emerald-500/40 shadow-[0_-8px_16px_-6px_rgba(52,211,153,0.15)]"
                  : env.successRate >= 50
                  ? "border-amber-500/40 shadow-[0_-8px_16px_-6px_rgba(245,158,11,0.15)]"
                  : "border-rose-500/40 shadow-[0_-8px_16px_-6px_rgba(244,63,94,0.15)]";
                return (
                  <div key={env.env} className={`glass rounded-2xl p-5 border-t-2 transition-all duration-500 group hover:-translate-y-0.5 ${borderColor}`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-900/80 px-2.5 py-1 rounded-lg border border-white/[0.03] group-hover:text-white transition-colors">{env.env}</span>
                      {isGood ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-400" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Pass Rate</p>
                        <p className={`text-lg font-black tracking-tighter ${isGood ? "text-emerald-400" : env.successRate >= 50 ? "text-amber-400" : "text-rose-400"}`}>{env.successRate}%</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Avg Time</p>
                        <p className="text-lg font-black text-white tracking-tighter">{env.avgDuration}s</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Runs</p>
                        <p className="text-sm font-bold text-slate-300">{env.totalRuns}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">Failed</p>
                        <p className="text-sm font-bold text-rose-400/80">{env.failedRuns}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {environmentComparison.length === 0 && (
                <div className="sm:col-span-2 glass rounded-2xl p-8 text-center">
                  <p className="text-slate-600 text-xs font-bold uppercase tracking-widest">No environment data</p>
                </div>
              )}
            </div>

            {/* Env bar chart */}
            <div className="lg:col-span-7 glass rounded-[2rem] p-8 border-white/[0.03]">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Pass Rate & Failure Density by Environment</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={environmentComparison} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                    <XAxis dataKey="env" tick={{ fill: "#475569", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#475569", fontSize: 10, fontWeight: 700 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip {...chartTooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: "10px", fontWeight: 700, color: "#64748b" }} iconType="circle" iconSize={8} />
                    <Bar dataKey="successRate" name="Pass Rate" fill="#10b981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="failureDensity" name="Failure Density" fill="#f43f5e" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* ── Failure Density Table ─────────────────────────── */}
        <div className="fade-in-up" style={{ animationDelay: "0.15s" }}>
          <div className="flex items-center gap-2 mb-4 px-2">
            <Target className="w-3.5 h-3.5 text-rose-400" />
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Failure Density by Project</h2>
          </div>
          <div className="glass rounded-2xl overflow-hidden border-white/[0.03]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Total Runs</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Failed</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Test Cases</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Density</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Distribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.02]">
                  {failureDensity.map((p) => {
                    const barColor = p.density > 50 ? "from-rose-500 to-red-500" : p.density > 25 ? "from-amber-500 to-orange-500" : "from-emerald-500 to-teal-500";
                    return (
                      <tr key={p.project} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{p.project}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 text-center font-medium">{p.totalRuns}</td>
                        <td className="px-6 py-4 text-sm text-rose-400/80 text-center font-bold">{p.failedRuns}</td>
                        <td className="px-6 py-4 text-sm text-slate-500 text-center font-medium">{p.testCount}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`text-xs font-black px-2 py-1 rounded-full border
                            ${p.density > 50 ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                            : p.density > 25 ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                            {p.density}%
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/[0.02]">
                            <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-1000 group-hover:brightness-125`} style={{ width: `${Math.max(p.density, 2)}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {failureDensity.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-600 text-xs font-bold uppercase tracking-widest">No project data available</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Secondary Metrics Row ────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 fade-in-up pb-10" style={{ animationDelay: "0.2s" }}>
          <MiniMetric icon={<Bug className="w-4 h-4 text-amber-400" />} label="Cost Per Bug" value={roi.costPerBug > 0 ? `$${roi.costPerBug}` : "—"} color="amber" />
          <MiniMetric icon={<Timer className="w-4 h-4 text-sky-400" />} label="MTBF" value={summary.mtbfHours > 0 ? `${summary.mtbfHours}h` : "—"} color="sky" />
          <MiniMetric icon={<Layers className="w-4 h-4 text-indigo-400" />} label="Test Coverage" value={`${summary.uniqueTests} cases`} color="indigo" />
          <MiniMetric icon={<Activity className="w-4 h-4 text-emerald-400" />} label="Avg Duration" value={`${summary.avgDurationSec}s`} color="emerald" />
          <MiniMetric icon={<TrendingDown className="w-4 h-4 text-violet-400" />} label="Time Reduction" value={`${summary.releaseTimeReduction}%`} color="violet" />
        </div>
      </div>
    </>
  );
}

function MiniMetric({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  const borderMap: Record<string, string> = {
    amber: "border-amber-500/40 hover:border-amber-500/60",
    sky: "border-sky-500/40 hover:border-sky-500/60",
    indigo: "border-indigo-500/40 hover:border-indigo-500/60",
    emerald: "border-emerald-500/40 hover:border-emerald-500/60",
    rose: "border-rose-500/40 hover:border-rose-500/60",
    violet: "border-violet-500/40 hover:border-violet-500/60",
  };
  return (
    <div className={`glass rounded-2xl p-5 border-t-2 transition-all duration-500 group hover:-translate-y-0.5 ${borderMap[color] || borderMap.indigo}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="p-1.5 rounded-lg bg-slate-900/50 border border-white/5 transition-transform group-hover:scale-110 duration-500">{icon}</div>
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{label}</p>
      <p className="text-xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">{value}</p>
    </div>
  );
}
