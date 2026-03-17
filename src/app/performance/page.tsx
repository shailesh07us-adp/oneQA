import prisma from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import { Clock, Zap, TrendingDown, Timer, ArrowDown, ArrowUp } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const runs = await prisma.testRun.findMany({
    orderBy: { startTime: "desc" },
    include: { suites: { include: { tests: true } } },
  });

  if (runs.length === 0) {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center bg-[#0a0e1a]">
          <p className="text-slate-500">No performance data available yet.</p>
        </main>
      </div>
    );
  }

  // Global duration stats
  const durations = runs.map((r: any) => r.duration || 0);
  const avgDuration = Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length / 1000);
  const maxDuration = Math.round(Math.max(...durations) / 1000);
  const minDuration = Math.round(Math.min(...durations) / 1000);
  const medianDuration = Math.round(durations.sort((a: number, b: number) => a - b)[Math.floor(durations.length / 2)] / 1000);

  // Per-project avg duration
  const projectDurations: Record<string, { total: number; count: number; runs: number[] }> = {};
  runs.forEach((r: any) => {
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
  runs.forEach((r: any) => r.suites?.forEach((s: any) => s.tests?.forEach((t: any) => {
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
  runs.forEach((r: any) => {
    if (!envDurations[r.env]) envDurations[r.env] = { total: 0, count: 0 };
    envDurations[r.env].total += r.duration || 0;
    envDurations[r.env].count++;
  });

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Execution Performance</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Duration metrics, bottlenecks, and speed benchmarks</p>
          </div>
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {/* Duration KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 fade-in-up">
            <DurationCard label="Average" value={`${avgDuration}s`} icon={<Clock className="w-4 h-4" />} color="indigo" />
            <DurationCard label="Median" value={`${medianDuration}s`} icon={<Timer className="w-4 h-4" />} color="purple" />
            <DurationCard label="Fastest" value={`${minDuration}s`} icon={<ArrowDown className="w-4 h-4" />} color="emerald" />
            <DurationCard label="Slowest" value={`${maxDuration}s`} icon={<ArrowUp className="w-4 h-4" />} color="rose" />
          </div>

          {/* Duration by Project */}
          <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Duration by Project
            </h2>
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Project</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Runs</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Avg</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Fastest</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Slowest</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Relative</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {projectStats.map((p) => {
                    const pct = avgDuration > 0 ? Math.min(100, Math.round((p.avg / maxDuration) * 100)) : 0;
                    return (
                      <tr key={p.project} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3.5 text-sm font-medium text-slate-200">{p.project}</td>
                        <td className="px-6 py-3.5 text-sm text-slate-400 text-center">{p.runs}</td>
                        <td className="px-6 py-3.5 text-sm text-white text-center font-mono font-medium">{p.avg}s</td>
                        <td className="px-6 py-3.5 text-sm text-emerald-400 text-center font-mono">{p.min}s</td>
                        <td className="px-6 py-3.5 text-sm text-rose-400 text-center font-mono">{p.max}s</td>
                        <td className="px-6 py-3.5">
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700" style={{ width: `${pct}%` }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Slowest Test Cases */}
            <div className="fade-in-up" style={{ animationDelay: "0.15s" }}>
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-rose-400" /> Slowest Test Cases
              </h2>
              <div className="glass rounded-xl p-4 space-y-3">
                {slowestTests.slice(0, 6).map((t, i) => (
                  <div key={t.title} className="flex items-center gap-3">
                    <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">{i + 1}</span>
                    <span className="text-sm text-slate-300 flex-1 truncate">{t.title}</span>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className="text-slate-500">avg</span>
                      <span className="text-white font-mono font-medium">{(t.avg / 1000).toFixed(1)}s</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-slate-500">max</span>
                      <span className="text-rose-400 font-mono">{(t.max / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Duration by Environment */}
            <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
              <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-400" /> Duration by Environment
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(envDurations).map(([env, d]) => {
                  const avg = Math.round(d.total / d.count / 1000);
                  return (
                    <div key={env} className="glass rounded-xl p-4 text-center">
                      <span className="inline-flex px-3 py-1 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 mb-3">{env}</span>
                      <p className="text-2xl font-bold text-white font-mono">{avg}s</p>
                      <p className="text-[11px] text-slate-500 mt-1">{d.count} runs · avg duration</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function DurationCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const map: Record<string, string> = {
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  };
  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className={`p-1.5 rounded-md border ${map[color]}`}>{icon}</div>
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-bold text-white font-mono">{value}</p>
    </div>
  );
}
