import prisma from "@/lib/db";
import Sidebar from "@/components/Sidebar";
import { TrendingUp, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SuccessRatesPage() {
  const runs = await prisma.testRun.findMany({
    include: {
      suites: {
        include: {
          tests: true,
        },
      },
    },
  });

  // Per-project success rates
  const projectMap: Record<string, { total: number; passed: number; failed: number; totalDuration: number }> = {};
  runs.forEach((run: any) => {
    if (!projectMap[run.project]) {
      projectMap[run.project] = { total: 0, passed: 0, failed: 0, totalDuration: 0 };
    }
    projectMap[run.project].total++;
    if (run.status === "passed") projectMap[run.project].passed++;
    else projectMap[run.project].failed++;
    projectMap[run.project].totalDuration += run.duration || 0;
  });

  // Per-environment success rates
  const envMap: Record<string, { total: number; passed: number }> = {};
  runs.forEach((run: any) => {
    if (!envMap[run.env]) {
      envMap[run.env] = { total: 0, passed: 0 };
    }
    envMap[run.env].total++;
    if (run.status === "passed") envMap[run.env].passed++;
  });

  // Per-test-case pass rates
  const testMap: Record<string, { total: number; passed: number }> = {};
  runs.forEach((run: any) => {
    run.suites.forEach((suite: any) => {
      suite.tests.forEach((test: any) => {
        if (!testMap[test.title]) {
          testMap[test.title] = { total: 0, passed: 0 };
        }
        testMap[test.title].total++;
        if (test.status === "passed") testMap[test.title].passed++;
      });
    });
  });

  const sortedTests = Object.entries(testMap)
    .map(([title, stats]) => ({ title, ...stats, rate: Math.round((stats.passed / stats.total) * 100) }))
    .sort((a, b) => a.rate - b.rate);

  const overallRate = runs.length > 0 ? Math.round((runs.filter((r: any) => r.status === "passed").length / runs.length) * 100) : 0;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10">
          <div>
            <h1 className="text-lg font-semibold text-white">Success Rates</h1>
            <p className="text-xs text-slate-500">Granular pass/fail analysis by project, environment, and test case</p>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Overall rate */}
          <div className="glass rounded-xl p-6 flex items-center gap-6 fade-in-up">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <TrendingUp className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">Overall Success Rate</p>
              <p className={`text-4xl font-bold mt-1 ${overallRate >= 75 ? "text-emerald-400" : "text-rose-400"}`}>{overallRate}%</p>
            </div>
            <div className="flex-1 ml-8">
              <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${overallRate}%`,
                    background: overallRate >= 75 ? "linear-gradient(90deg, #22c55e, #10b981)" : "linear-gradient(90deg, #ef4444, #f97316)",
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1.5">{runs.filter((r: any) => r.status === "passed").length} passed out of {runs.length} total runs</p>
            </div>
          </div>

          {/* By Project */}
          <div className="fade-in-up" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" /> By Project
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(projectMap).map(([project, stats]) => {
                const rate = Math.round((stats.passed / stats.total) * 100);
                return (
                  <div key={project} className="glass rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-white">{project}</h3>
                      <span className={`text-lg font-bold ${rate >= 75 ? "text-emerald-400" : "text-rose-400"}`}>{rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                      <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${rate}%`, background: rate >= 75 ? "linear-gradient(90deg, #22c55e, #10b981)" : "linear-gradient(90deg, #ef4444, #f97316)" }} />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>{stats.total} runs</span>
                      <span className="text-emerald-400">{stats.passed} passed</span>
                      <span className="text-rose-400">{stats.failed} failed</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Environment */}
          <div className="fade-in-up" style={{ animationDelay: "0.15s" }}>
            <h2 className="text-base font-semibold text-white mb-4">By Environment</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(envMap).map(([env, stats]) => {
                const rate = Math.round((stats.passed / stats.total) * 100);
                return (
                  <div key={env} className="glass rounded-xl p-4 text-center">
                    <span className="inline-flex px-3 py-1 rounded-md text-xs font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50 mb-3">{env}</span>
                    <p className={`text-2xl font-bold ${rate >= 75 ? "text-emerald-400" : "text-rose-400"}`}>{rate}%</p>
                    <p className="text-[11px] text-slate-500 mt-1">{stats.total} runs</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* By Test Case */}
          <div className="fade-in-up" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-base font-semibold text-white mb-4">By Test Case</h2>
            <div className="glass rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-800/60">
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Test Case</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Executions</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-center">Passed</th>
                    <th className="px-6 py-3.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Success Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {sortedTests.map((test) => (
                    <tr key={test.title} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-3 text-sm text-slate-300">{test.title}</td>
                      <td className="px-6 py-3 text-sm text-slate-400 text-center">{test.total}</td>
                      <td className="px-6 py-3 text-sm text-emerald-400 text-center font-medium">{test.passed}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${test.rate}%`, background: test.rate >= 75 ? "linear-gradient(90deg, #22c55e, #10b981)" : "linear-gradient(90deg, #ef4444, #f97316)" }} />
                          </div>
                          <span className={`text-sm font-bold ${test.rate >= 75 ? "text-emerald-400" : "text-rose-400"}`}>{test.rate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
