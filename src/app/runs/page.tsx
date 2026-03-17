"use client";

import { useState, useEffect, useCallback } from "react";
import Sidebar from "@/components/Sidebar";
import {
  CheckCircle2,
  XCircle,
  SkipForward,
  ChevronDown,
  ChevronRight as ChevronRightIcon,
  Search,
  Download,
  RefreshCw,
  Filter,
  X,
} from "lucide-react";
import { relativeTime, downloadCsv } from "@/lib/utils";

export default function RunsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [environments, setEnvironments] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [envFilter, setEnvFilter] = useState("all");

  // UI state
  const [collapsedSuites, setCollapsedSuites] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  const fetchRuns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        status: statusFilter,
        env: envFilter,
        sortBy: "startTime",
        sortOrder: "desc",
        page: page.toString(),
        limit: "6",
      });
      const res = await fetch(`/api/runs?${params}`);
      const data = await res.json();
      setRuns(data.runs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
      setEnvironments(data.environments || []);
    } catch (e) {
      console.error("Failed to fetch:", e);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, envFilter, page]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  useEffect(() => {
    const timer = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const toggleSuite = (suiteId: string) => {
    setCollapsedSuites((prev) => {
      const next = new Set(prev);
      if (next.has(suiteId)) next.delete(suiteId);
      else next.add(suiteId);
      return next;
    });
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRuns();
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Test Runs</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Detailed execution history with test breakdowns</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleRefresh} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-300 text-xs font-medium hover:bg-slate-700/60 hover:text-white transition-all">
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} /> Refresh
            </button>
            <button onClick={() => downloadCsv(runs, `oneqa-test-runs-${new Date().toISOString().split("T")[0]}`)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium hover:bg-indigo-500/20 transition-all">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
            <span className="text-xs text-slate-500 ml-2">{total} runs</span>
          </div>
        </header>

        <div className="p-8 space-y-4 max-w-7xl mx-auto w-full">
          {/* Toolbar */}
          <div className="flex flex-col md:flex-row items-start md:items-center gap-3 fade-in-up">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search by project..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-9 pr-8 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all"
              />
              {searchInput && (
                <button onClick={() => setSearchInput("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex items-center rounded-lg bg-slate-800/50 border border-slate-700/50 p-0.5">
              {["all", "passed", "failed"].map((s) => (
                <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${statusFilter === s ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:text-slate-200 border border-transparent"}`}>
                  {s === "all" ? "All" : s === "passed" ? "✓ Passed" : "✗ Failed"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <select value={envFilter} onChange={(e) => { setEnvFilter(e.target.value); setPage(1); }} className="px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50 appearance-none cursor-pointer">
                <option value="all">All Environments</option>
                {environments.map((env) => <option key={env} value={env}>{env}</option>)}
              </select>
            </div>
          </div>

          {/* Runs */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
            </div>
          ) : runs.length === 0 ? (
            <div className="glass rounded-2xl p-16 text-center border-white/[0.03]">
              <p className="text-slate-500 text-sm">No test runs match your filters.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {runs.map((run: any, idx: number) => {
                const totalTests = run.suites.reduce((s: number, suite: any) => s + suite.tests.length, 0);
                const passedTests = run.suites.reduce((s: number, suite: any) => s + suite.tests.filter((t: any) => t.status === "passed").length, 0);
                const failedTests = run.suites.reduce((s: number, suite: any) => s + suite.tests.filter((t: any) => t.status === "failed").length, 0);
                const isPassed = run.status === "passed";

                return (
                  <div key={run.id} className={`glass rounded-[2rem] overflow-hidden fade-in-up border-t-4 shadow-2xl transition-all duration-500 group hover:-translate-y-1 ${isPassed ? 'border-emerald-500/80 shadow-emerald-500/10' : 'border-rose-500/80 shadow-rose-500/10'}`} style={{ animationDelay: `${idx * 0.05}s` }}>
                    <div className="p-6 flex items-center justify-between relative overflow-hidden">
                      <div className="flex items-center gap-6">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-500 ${isPassed ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
                          <div className="relative">
                            {isPassed ? <CheckCircle2 className="w-7 h-7 text-emerald-400" /> : <XCircle className="w-7 h-7 text-rose-400" />}
                            <div className={`absolute -inset-2 rounded-full animate-pulse blur-md ${isPassed ? 'bg-emerald-400/20' : 'bg-rose-400/20'}`} />
                          </div>
                        </div>
                        <div>
                          <p className="text-lg font-black text-white tracking-tight">{run.project}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{relativeTime(run.startTime)}</span>
                            <span className="w-1 h-1 rounded-full bg-slate-700" />
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"} Duration</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Environment</p>
                          <span className="px-3 py-1 rounded-full text-[10px] font-black bg-slate-900/50 text-slate-300 border border-white/5 uppercase tracking-widest">{run.env}</span>
                        </div>
                        <div className="text-right border-l border-white/5 pl-8">
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em] mb-2">Outcome</p>
                          <div className="flex items-center gap-4 text-[12px] font-black">
                            <span className="flex items-center gap-2 text-emerald-400"><CheckCircle2 className="w-4 h-4" /> {passedTests}</span>
                            <span className="flex items-center gap-2 text-rose-400"><XCircle className="w-4 h-4" /> {failedTests}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.01] border-t border-white/[0.03]">
                      {run.suites.map((suite: any) => {
                        const isCollapsed = collapsedSuites.has(suite.id);
                        
                        // Suite-level analytics
                        const suiteTests = suite.tests || [];
                        const suitePassed = suiteTests.filter((t: any) => t.status === "passed").length;
                        const suiteFailed = suiteTests.filter((t: any) => t.status === "failed").length;
                        const suiteSkipped = suiteTests.length - suitePassed - suiteFailed;
                        
                        // Failures-first sorting
                        const sortedTests = [...suiteTests].sort((a, b) => {
                          if (a.status === "failed" && b.status !== "failed") return -1;
                          if (a.status !== "failed" && b.status === "failed") return 1;
                          return 0;
                        });

                        return (
                          <div key={suite.id} className="border-b border-white/[0.02] last:border-0">
                            {/* Suite Header with Health Ribbon */}
                            <div className="relative group/suite">
                              {/* Health Ribbon (Pixel Grid) */}
                              <div className="absolute top-0 left-0 w-full h-[2px] flex">
                                {suiteTests.map((t: any, i: number) => (
                                  <div 
                                    key={t.id} 
                                    className={`flex-1 h-full ${t.status === 'passed' ? 'bg-emerald-500/40' : t.status === 'failed' ? 'bg-rose-500/60' : 'bg-amber-500/40'}`}
                                    title={`${t.title}: ${t.status}`}
                                  />
                                ))}
                              </div>

                              <div className="px-6 py-4 flex items-center justify-between">
                                <button
                                  onClick={() => toggleSuite(suite.id)}
                                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                                >
                                  {isCollapsed ? <ChevronRightIcon className="w-4 h-4 text-slate-600" /> : <ChevronDown className="w-4 h-4 text-indigo-400" />}
                                  <div className="text-left">
                                    <p className="text-[11px] font-black text-slate-200 uppercase tracking-[0.15em]">
                                      {suite.title}
                                    </p>
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1">
                                      {suiteTests.length} Tests <span className="mx-1">·</span> 
                                      <span className="text-emerald-500/80">{suitePassed}P</span> <span className="mx-0.5">/</span>
                                      <span className="text-rose-500/80">{suiteFailed}F</span> <span className="mx-0.5">/</span>
                                      <span className="text-amber-500/80">{suiteSkipped}S</span>
                                    </p>
                                  </div>
                                </button>

                                <div className="flex items-center gap-4">
                                  {/* Local "Intelligence" badges */}
                                  {suiteFailed > 0 && (
                                    <span className="px-2 py-0.5 rounded bg-rose-500/10 border border-rose-500/20 text-[9px] font-black text-rose-400 uppercase tracking-widest animate-pulse">
                                      Action Required
                                    </span>
                                  )}
                                  <div className="h-4 w-px bg-white/5" />
                                  <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">
                                    {Math.round(suiteTests.reduce((acc: number, t: any) => acc + (t.duration || 0), 0) / 1000)}s Total
                                  </span>
                                </div>
                              </div>
                            </div>

                            {!isCollapsed && (
                              <div className="bg-black/20 px-4 pb-4">
                                <div className="rounded-2xl border border-white/[0.03] overflow-hidden divide-y divide-white/[0.02] bg-[#0c1021]/50">
                                  {sortedTests.map((test: any) => (
                                    <div key={test.id} className="px-6 py-2.5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group/test">
                                      <div className="flex items-center gap-4">
                                        <div className="shrink-0">
                                          {test.status === "passed" ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500/60" />
                                          ) : test.status === "failed" ? (
                                            <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                          ) : (
                                            <SkipForward className="w-3.5 h-3.5 text-amber-500/60" />
                                          )}
                                        </div>
                                        <span className={`text-[13px] font-medium transition-colors ${test.status === 'failed' ? 'text-rose-400 font-bold' : 'text-slate-400 group-hover/test:text-slate-200'}`}>
                                          {test.title}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-3">
                                        {test.status === 'failed' && (
                                          <span className="text-[8px] font-black text-rose-500/50 uppercase tracking-widest px-1.5 py-0.5 border border-rose-500/10 rounded">Regression</span>
                                        )}
                                        <span className="text-[10px] font-mono text-slate-600">{(test.duration / 1000).toFixed(2)}s</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1 pt-4">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-md text-xs font-medium transition-all ${p === page ? "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30" : "text-slate-400 hover:bg-slate-800/50 hover:text-white"}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
