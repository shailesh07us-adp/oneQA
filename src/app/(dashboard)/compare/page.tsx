"use client";

import { useState, useEffect } from "react";
import {
  GitCompareArrows,
  ArrowDown,
  ArrowUp,
  Plus,
  Minus,
  Equal,
  RefreshCw,
  CheckCircle2,
  XCircle,
  SkipForward,
  Clock,
  Zap,
  AlertTriangle,
  TrendingUp,
  Layers,
  ChevronDown,
} from "lucide-react";

interface RunMeta {
  id: string;
  project: string;
  env: string;
  status: string;
  startTime: string;
  duration: number | null;
  totalTests: number;
}

interface DiffEntry {
  title: string;
  suite: string;
  type: "regression" | "fixed" | "added" | "removed" | "unchanged";
  runA: { status: string; duration: number } | null;
  runB: { status: string; duration: number } | null;
  durationDelta: number | null;
}

interface CompareResult {
  runA: RunMeta;
  runB: RunMeta;
  summary: {
    total: number;
    regressions: number;
    fixed: number;
    added: number;
    removed: number;
    unchanged: number;
    durationDelta: number;
  };
  diff: DiffEntry[];
}

interface RunOption {
  id: string;
  project: string;
  env: string;
  startTime: string;
  status: string;
}

type FilterType = "all" | "regression" | "fixed" | "added" | "removed";

const STATUS_ICON: Record<string, React.ReactNode> = {
  passed: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
  failed: <XCircle className="w-3.5 h-3.5 text-rose-400" />,
  skipped: <SkipForward className="w-3.5 h-3.5 text-amber-400" />,
};

const DIFF_CONFIG: Record<
  DiffEntry["type"],
  { icon: React.ReactNode; label: string; color: string; bg: string; border: string }
> = {
  regression: {
    icon: <ArrowDown className="w-3.5 h-3.5" />,
    label: "Regression",
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
  fixed: {
    icon: <ArrowUp className="w-3.5 h-3.5" />,
    label: "Fixed",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  added: {
    icon: <Plus className="w-3.5 h-3.5" />,
    label: "Added",
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/20",
  },
  removed: {
    icon: <Minus className="w-3.5 h-3.5" />,
    label: "Removed",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  unchanged: {
    icon: <Equal className="w-3.5 h-3.5" />,
    label: "Unchanged",
    color: "text-slate-500",
    bg: "bg-slate-500/5",
    border: "border-slate-500/10",
  },
};

export default function CompareRunsPage() {
  const [runs, setRuns] = useState<RunOption[]>([]);
  const [runAId, setRunAId] = useState("");
  const [runBId, setRunBId] = useState("");
  const [result, setResult] = useState<CompareResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [runsLoading, setRunsLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [error, setError] = useState<string | null>(null);

  // Fetch available runs on mount
  useEffect(() => {
    fetch("/api/test-runs?limit=50&sortBy=startTime&sortOrder=desc")
      .then((r) => r.json())
      .then((data) => {
        setRuns(
          (data.runs || []).map((r: RunOption) => ({
            id: r.id,
            project: r.project,
            env: r.env,
            startTime: r.startTime,
            status: r.status,
          }))
        );
        setRunsLoading(false);
      })
      .catch(() => setRunsLoading(false));
  }, []);

  const handleCompare = async () => {
    if (!runAId || !runBId) return;
    if (runAId === runBId) {
      setError("Please select two different runs to compare.");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`/api/test-runs/compare?runA=${runAId}&runB=${runBId}`);
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to compare runs");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setResult(data);
      setFilter("all");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filteredDiff = result
    ? filter === "all"
      ? result.diff
      : result.diff.filter((d) => d.type === filter)
    : [];

  const formatRunLabel = (r: RunOption) => {
    const d = new Date(r.startTime);
    return `${r.project} — ${r.env} — ${d.toLocaleDateString(undefined, { month: "short", day: "numeric" })} ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  };

  return (
    <>
      <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <GitCompareArrows className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Compare Runs</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">
              Side-by-side regression diff analysis
            </p>
          </div>
        </div>
      </header>

      <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* Run Picker */}
        <div className="glass rounded-[2rem] p-8 border-white/[0.03] fade-in-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1.5 h-6 bg-purple-500 rounded-full" />
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              Select Runs to Compare
            </h2>
          </div>

          {runsLoading ? (
            <div className="flex items-center justify-center py-10">
              <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin" />
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row items-stretch lg:items-end gap-6">
              {/* Run A */}
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[9px] text-indigo-400 font-black">A</span>
                  Baseline Run
                </label>
                <div className="relative group">
                  <select
                    value={runAId}
                    onChange={(e) => setRunAId(e.target.value)}
                    className="w-full bg-[#0f1428] border border-slate-700/50 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none cursor-pointer font-medium"
                  >
                    <option value="">Select a baseline run…</option>
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.status === "passed" ? "✓" : "✗"} {formatRunLabel(r)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* VS Divider */}
              <div className="flex items-center justify-center lg:pb-1">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                  <GitCompareArrows className="w-5 h-5 text-purple-400" />
                </div>
              </div>

              {/* Run B */}
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span className="w-5 h-5 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-[9px] text-emerald-400 font-black">B</span>
                  Current Run
                </label>
                <div className="relative group">
                  <select
                    value={runBId}
                    onChange={(e) => setRunBId(e.target.value)}
                    className="w-full bg-[#0f1428] border border-slate-700/50 text-white text-xs rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none cursor-pointer font-medium"
                  >
                    <option value="">Select a current run…</option>
                    {runs.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.status === "passed" ? "✓" : "✗"} {formatRunLabel(r)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
              </div>

              {/* Compare Button */}
              <button
                onClick={handleCompare}
                disabled={!runAId || !runBId || loading}
                className="px-8 py-3 rounded-xl bg-purple-600 text-white text-xs font-black uppercase tracking-widest hover:bg-purple-500 transition-all shadow-2xl shadow-purple-900/40 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 active:scale-95 whitespace-nowrap"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <GitCompareArrows className="w-4 h-4" />
                )}
                {loading ? "Comparing…" : "Compare"}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6 fade-in-up" style={{ animationDelay: "0.1s" }}>
            {/* Run Meta Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <RunMetaCard label="A" meta={result.runA} color="indigo" />
              <RunMetaCard label="B" meta={result.runB} color="emerald" />
            </div>

            {/* Summary Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <SummaryCard label="Total Tests" value={result.summary.total} icon={<Layers className="w-4 h-4 text-slate-400" />} color="slate" />
              <SummaryCard
                label="Regressions"
                value={result.summary.regressions}
                icon={<ArrowDown className="w-4 h-4 text-rose-400" />}
                color="rose"
                highlight={result.summary.regressions > 0}
              />
              <SummaryCard
                label="Fixed"
                value={result.summary.fixed}
                icon={<ArrowUp className="w-4 h-4 text-emerald-400" />}
                color="emerald"
                highlight={result.summary.fixed > 0}
              />
              <SummaryCard label="Added" value={result.summary.added} icon={<Plus className="w-4 h-4 text-sky-400" />} color="sky" />
              <SummaryCard label="Removed" value={result.summary.removed} icon={<Minus className="w-4 h-4 text-amber-400" />} color="amber" />
              <SummaryCard
                label="Duration Δ"
                value={`${result.summary.durationDelta > 0 ? "+" : ""}${(result.summary.durationDelta / 1000).toFixed(1)}s`}
                icon={<Clock className="w-4 h-4 text-purple-400" />}
                color="purple"
              />
            </div>

            {/* Filter Tabs + Diff Table */}
            <div className="glass rounded-[2rem] overflow-hidden border-white/[0.03]">
              {/* Filter Tabs */}
              <div className="flex items-center gap-1 p-4 border-b border-white/[0.03] bg-white/[0.01]">
                {(
                  [
                    { key: "all", label: "All", count: result.diff.length },
                    { key: "regression", label: "Regressions", count: result.summary.regressions },
                    { key: "fixed", label: "Fixed", count: result.summary.fixed },
                    { key: "added", label: "Added", count: result.summary.added },
                    { key: "removed", label: "Removed", count: result.summary.removed },
                  ] as { key: FilterType; label: string; count: number }[]
                ).map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      filter === tab.key
                        ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30"
                        : "text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        filter === tab.key ? "bg-indigo-500/30 text-indigo-300" : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Diff Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                      <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest w-12">Diff</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Test</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Suite</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Run A</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Run B</th>
                      <th className="px-6 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Duration Δ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {filteredDiff.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-500">
                          No tests match this filter.
                        </td>
                      </tr>
                    ) : (
                      filteredDiff.map((entry, i) => {
                        const config = DIFF_CONFIG[entry.type];
                        return (
                          <tr
                            key={`${entry.title}-${i}`}
                            className={`group hover:bg-white/[0.02] transition-colors ${
                              entry.type === "regression" ? "bg-rose-500/[0.03]" : entry.type === "fixed" ? "bg-emerald-500/[0.03]" : ""
                            }`}
                          >
                            {/* Diff Type */}
                            <td className="px-6 py-3">
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg ${config.bg} ${config.border} border ${config.color}`}
                              >
                                {config.icon}
                              </span>
                            </td>

                            {/* Test Name */}
                            <td className="px-6 py-3">
                              <p className="text-sm font-bold text-slate-200 group-hover:text-white truncate max-w-xs">
                                {entry.title}
                              </p>
                            </td>

                            {/* Suite */}
                            <td className="px-6 py-3">
                              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[150px] block">
                                {entry.suite}
                              </span>
                            </td>

                            {/* Run A Status */}
                            <td className="px-6 py-3 text-center">
                              {entry.runA ? (
                                <div className="flex items-center justify-center gap-2">
                                  {STATUS_ICON[entry.runA.status] || (
                                    <span className="text-[10px] text-slate-500">{entry.runA.status}</span>
                                  )}
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {(entry.runA.duration / 1000).toFixed(1)}s
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-700">—</span>
                              )}
                            </td>

                            {/* Run B Status */}
                            <td className="px-6 py-3 text-center">
                              {entry.runB ? (
                                <div className="flex items-center justify-center gap-2">
                                  {STATUS_ICON[entry.runB.status] || (
                                    <span className="text-[10px] text-slate-500">{entry.runB.status}</span>
                                  )}
                                  <span className="text-[10px] font-mono text-slate-500">
                                    {(entry.runB.duration / 1000).toFixed(1)}s
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-700">—</span>
                              )}
                            </td>

                            {/* Duration Delta */}
                            <td className="px-6 py-3 text-right">
                              {entry.durationDelta !== null ? (
                                <span
                                  className={`text-xs font-black ${
                                    entry.durationDelta > 500
                                      ? "text-rose-400"
                                      : entry.durationDelta < -500
                                      ? "text-emerald-400"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {entry.durationDelta > 0 ? "+" : ""}
                                  {(entry.durationDelta / 1000).toFixed(1)}s
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-700">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center fade-in-up" style={{ animationDelay: "0.15s" }}>
            <div className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 mb-6">
              <GitCompareArrows className="w-12 h-12 text-slate-700" />
            </div>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
              Ready to Compare
            </p>
            <p className="text-xs text-slate-600 max-w-sm">
              Select a baseline and a current run above, then click Compare to see which tests
              regressed, which got fixed, and how performance shifted.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

/* ── Sub-components ── */

function RunMetaCard({
  label,
  meta,
  color,
}: {
  label: string;
  meta: RunMeta;
  color: "indigo" | "emerald";
}) {
  const colors = {
    indigo: "border-indigo-500/30 bg-indigo-500/[0.03]",
    emerald: "border-emerald-500/30 bg-emerald-500/[0.03]",
  };
  const badgeColors = {
    indigo: "bg-indigo-500/20 border-indigo-500/30 text-indigo-400",
    emerald: "bg-emerald-500/20 border-emerald-500/30 text-emerald-400",
  };

  return (
    <div className={`glass rounded-2xl p-5 border ${colors[color]} transition-all`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span
            className={`w-6 h-6 rounded-md border flex items-center justify-center text-[10px] font-black ${badgeColors[color]}`}
          >
            {label}
          </span>
          <span className="text-sm font-black text-white">{meta.project}</span>
        </div>
        <span
          className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
            meta.status === "passed"
              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
          }`}
        >
          {meta.status}
        </span>
      </div>
      <div className="flex items-center gap-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
        <span>{meta.env}</span>
        <span>·</span>
        <span>{new Date(meta.startTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        <span>·</span>
        <span>{meta.totalTests} tests</span>
        <span>·</span>
        <span>{meta.duration ? `${(meta.duration / 1000).toFixed(1)}s` : "—"}</span>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
  highlight,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  highlight?: boolean;
}) {
  const borderMap: Record<string, string> = {
    rose: "border-rose-500/40 shadow-[0_-8px_15px_-5px_rgba(244,63,94,0.25)]",
    emerald: "border-emerald-500/40 shadow-[0_-8px_15px_-5px_rgba(52,211,153,0.25)]",
    sky: "border-sky-500/30",
    amber: "border-amber-500/30",
    purple: "border-purple-500/30",
    slate: "border-slate-700/30",
  };

  return (
    <div
      className={`glass rounded-2xl p-4 border-t-2 transition-all group hover:-translate-y-0.5 ${
        highlight ? borderMap[color] || "" : borderMap[color] || "border-slate-700/30"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-1.5 rounded-lg bg-slate-900/50 border border-white/5">{icon}</div>
      </div>
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{label}</p>
      <p className={`text-xl font-black tracking-tighter ${highlight ? "text-white" : "text-slate-300"}`}>
        {value}
      </p>
    </div>
  );
}
