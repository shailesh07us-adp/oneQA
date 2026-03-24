import prisma from "@/lib/db";
import { Clock, Zap, TrendingDown, Timer, ArrowDown, ArrowUp } from "lucide-react";

export const dynamic = "force-dynamic";

interface PerformanceTest {
  id: string;
  title: string;
  duration: number;
}

interface PerformanceSuite {
  id: string;
  tests: PerformanceTest[];
}

interface PerformanceRun {
  project: string;
  env: string;
  duration: number | null;
  suites: PerformanceSuite[];
}

export default async function PerformancePage() {
  const runs = (await prisma.testRun.findMany({
    orderBy: { startTime: "desc" },
    include: { suites: { include: { tests: true } } },
  })) as unknown as PerformanceRun[];

  if (runs.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-slate-500">No performance data available yet.</p>
      </div>
    );
  }

  // Global duration stats
  const durations = runs.map((r: PerformanceRun) => r.duration || 0);
  const avgDuration = Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length / 1000);
  const maxDuration = Math.round(Math.max(...durations) / 1000);
  const minDuration = Math.round(Math.min(...durations) / 1000);
  const medianDuration = Math.round(durations.sort((a: number, b: number) => a - b)[Math.floor(durations.length / 2)] / 1000);

  // Per-project avg duration
  const projectDurations: Record<string, { total: number; count: number; runs: number[] }> = {};
  runs.forEach((r: PerformanceRun) => {
    if (!projectDurations[r.project]) projectDurations[r.project] = { total: 0, count: 0, runs: [] };
    projectDurations[r.project].total += r.duration || 0;
    projectDurations[r.project].count++;
    projectDurations[r.project].runs.push(r.duration || 0);
  });

  const projectStats = Object.entries(projectDurations)
    .map(([project, d]) => ({
      project,
      avg: Math.round(d.total / d.count / 1000),
      max: Math.round(Math.max(...d.runs) / 1000),
      min: Math.round(Math.min(...d.runs) / 1000),
      runs: d.count,
    }))
    .sort((a, b) => b.avg - a.avg);

  // Slowest individual test cases
  const testDurations: Record<string, { total: number; count: number; max: number }> = {};
  runs.forEach((r: PerformanceRun) => r.suites?.forEach((s: PerformanceSuite) => s.tests?.forEach((t: PerformanceTest) => {
    if (!testDurations[t.title]) testDurations[t.title] = { total: 0, count: 0, max: 0 };
    testDurations[t.title].total += t.duration;
    testDurations[t.title].count++;
    testDurations[t.title].max = Math.max(testDurations[t.title].max, t.duration);
  })));

  const slowestTests = Object.entries(testDurations)
    .map(([title, d]) => ({ title, avg: Math.round(d.total / d.count), max: d.max, runs: d.count }))
    .sort((a, b) => b.avg - a.avg);

  // Per-environment avg duration
  const envDurations: Record<string, { total: number; count: number }> = {};
  runs.forEach((r: PerformanceRun) => {
    if (!envDurations[r.env]) envDurations[r.env] = { total: 0, count: 0 };
    envDurations[r.env].total += r.duration || 0;
    envDurations[r.env].count++;
  });

  return (
    <>
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Execution Performance</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Duration metrics, bottlenecks, and speed benchmarks</p>
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Automation KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in-up">
            <DurationCard label="Average" value={`${avgDuration}s`} icon={<Clock className="w-4 h-4" />} color="sky" />
            <DurationCard label="Median" value={`${medianDuration}s`} icon={<Timer className="w-4 h-4" />} color="amber" />
            <DurationCard label="Fastest" value={`${minDuration}s`} icon={<ArrowDown className="w-4 h-4" />} color="emerald" />
            <DurationCard label="Slowest" value={`${maxDuration}s`} icon={<ArrowUp className="w-4 h-4" />} color="rose" />
          </div>

          {/* Duration by Project */}
          <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center justify-between mb-4 px-2">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-amber-500" /> Duration by Project
              </h2>
            </div>
            <div className="glass rounded-2xl overflow-hidden border-white/[0.03]">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/[0.03] bg-white/[0.01]">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Project</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Runs</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Avg</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Fastest</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Slowest</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Relative Speed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.02]">
                    {projectStats.map((p) => {
                      const pct = avgDuration > 0 ? Math.min(100, Math.round((p.avg / maxDuration) * 100)) : 0;
                      return (
                        <tr key={p.project} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 text-sm font-bold text-slate-200 group-hover:text-white transition-colors">{p.project}</td>
                          <td className="px-6 py-4 text-sm text-slate-500 text-center font-medium">{p.runs}</td>
                          <td className="px-6 py-4 text-sm text-white text-center font-black">{p.avg}s</td>
                          <td className="px-6 py-4 text-sm text-emerald-400/80 text-center font-bold tracking-tight">{p.min}s</td>
                          <td className="px-6 py-4 text-sm text-rose-400/80 text-center font-bold tracking-tight">{p.max}s</td>
                          <td className="px-6 py-4">
                            <div className="w-48 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-white/[0.02]">
                              <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 group-hover:brightness-125" style={{ width: `${pct}%` }} />
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Slowest Test Cases */}
            <div className="fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
                <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Slowest Test Cases
              </h2>
              <div className="glass rounded-2xl p-6 space-y-4 border-white/[0.03]">
                {slowestTests.slice(0, 6).map((t, i) => (
                  <div key={t.title} className="flex items-center gap-4 group/item transition-all hover:translate-x-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 group-hover/item:bg-rose-500/20 group-hover/item:text-rose-400 transition-colors border border-white/[0.03]">{i + 1}</span>
                    <span className="text-sm font-bold text-slate-300 flex-1 truncate group-hover/item:text-white">{t.title}</span>
                    <div className="flex items-center gap-3 text-[10px] shrink-0 font-black uppercase tracking-widest">
                      <span className="text-slate-600">Avg</span>
                      <span className="text-white">{(t.avg / 1000).toFixed(1)}s</span>
                      <span className="w-1 h-1 rounded-full bg-slate-800" />
                      <span className="text-slate-600">Max</span>
                      <span className="text-rose-500">{(t.max / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration by Environment */}
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2 px-2">
                <Clock className="w-3.5 h-3.5 text-indigo-400" /> Duration by Environment
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(envDurations).map(([env, d]) => {
                  const avg = Math.round(d.total / d.count / 1000);
                  return (
                    <div key={env} className="glass rounded-2xl p-6 text-center border-white/[0.03] bg-gradient-to-br from-indigo-500/[0.02] to-transparent group hover:-translate-y-1 transition-all">
                      <span className="inline-flex px-3 py-1 rounded-full text-[10px] font-black bg-slate-900/80 text-slate-400 border border-white/[0.03] mb-4 uppercase tracking-widest group-hover:text-indigo-400 transition-colors">{env}</span>
                      <p className="text-3xl font-black text-white group-hover:scale-110 transition-transform">{avg}s</p>
                      <p className="text-[10px] font-black text-slate-600 mt-2 uppercase tracking-widest">{d.count} Historical Runs</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
    </>
  );
}

function DurationCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: 'emerald' | 'rose' | 'sky' | 'amber' }) {
  const map = {
    emerald: "border-emerald-500/80 shadow-[0_-12px_20px_-8px_rgba(52,211,153,0.25)]",
    rose: "border-rose-500/80 shadow-[0_-12px_20px_-8px_rgba(244,63,94,0.25)]",
    sky: "border-sky-500/80 shadow-[0_-12px_20px_-8px_rgba(14,165,233,0.25)]",
    amber: "border-amber-500/80 shadow-[0_-12px_20px_-8px_rgba(245,158,11,0.25)]",
  };

  return (
    <div className={`glass rounded-2xl p-5 border-t-2 transition-all duration-500 group hover:-translate-y-0.5 ${map[color]}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="p-2 rounded-xl bg-slate-900/50 border border-white/5 transition-transform group-hover:scale-110 duration-500">
          {icon}
        </div>
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Detailed</span>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em] mb-0.5">{label}</p>
        <p className="text-2xl font-black text-white tracking-tighter group-hover:scale-105 transition-transform origin-left duration-500">{value}</p>
      </div>
    </div>
  );
}
