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
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10">
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
            <div className="glass rounded-xl p-16 text-center">
              <p className="text-slate-500 text-sm">No test runs match your filters.</p>
            </div>
          ) : (
            runs.map((run: any, idx: number) => {
              const totalTests = run.suites.reduce((s: number, suite: any) => s + suite.tests.length, 0);
              const passedTests = run.suites.reduce((s: number, suite: any) => s + suite.tests.filter((t: any) => t.status === "passed").length, 0);
              const failedTests = run.suites.reduce((s: number, suite: any) => s + suite.tests.filter((t: any) => t.status === "failed").length, 0);

              return (
                <div key={run.id} className="glass rounded-xl overflow-hidden fade-in-up" style={{ animationDelay: `${idx * 0.05}s` }}>
                  <div className="p-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${run.status === "passed" ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/10 border border-rose-500/20"}`}>
                        {run.status === "passed" ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{run.project}</p>
                        <p className="text-xs text-slate-500 mt-0.5" title={new Date(run.startTime).toLocaleString()}>
                          {relativeTime(run.startTime)} · {run.duration ? `${(run.duration / 1000).toFixed(1)}s` : "—"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/50">{run.env}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-emerald-400"><CheckCircle2 className="w-3 h-3" /> {passedTests}</span>
                        <span className="flex items-center gap-1 text-rose-400"><XCircle className="w-3 h-3" /> {failedTests}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-slate-800/40">
                    {run.suites.map((suite: any) => {
                      const isCollapsed = collapsedSuites.has(suite.id);
                      return (
                        <div key={suite.id}>
                          <button
                            onClick={() => toggleSuite(suite.id)}
                            className="w-full px-5 py-2.5 bg-slate-900/30 border-b border-slate-800/30 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                          >
                            <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                              {isCollapsed ? <ChevronRightIcon className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              {suite.title}
                            </p>
                            <span className="text-[10px] text-slate-600">{suite.tests.length} tests</span>
                          </button>
                          {!isCollapsed && suite.tests.map((test: any) => (
                            <div key={test.id} className="px-5 py-2.5 flex items-center justify-between hover:bg-slate-800/20 transition-colors border-b border-slate-800/20 last:border-b-0">
                              <div className="flex items-center gap-3">
                                {test.status === "passed" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /> : test.status === "failed" ? <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" /> : <SkipForward className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                                <span className="text-sm text-slate-300">{test.title}</span>
                              </div>
                              <span className="text-xs text-slate-500 font-mono">{(test.duration / 1000).toFixed(1)}s</span>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
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
