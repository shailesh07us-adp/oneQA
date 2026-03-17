"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  AlertTriangle, 
  Terminal, 
  Sparkles, 
  Zap, 
  Clock, 
  User, 
  MessageSquare,
  ArrowRight,
  ShieldAlert, // ArrowRight removed as per instruction
  Search,
  CheckCircle2,
  XCircle,
  SkipForward,
  Filter,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
  Info,
  Copy, // Added as per instruction
  Settings2,
  Trash2,
  AlertOctagon,
  X
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";


import { clusterFailures } from "@/lib/intelligence";

export default function TriagePage() {
  const [clusters, setClusters] = useState<any[]>([]);
  const [selectedCluster, setSelectedCluster] = useState<any | null>(null);
  const [selectedFailure, setSelectedFailure] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [triageStatus, setTriageStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadExpertTriage() {
      try {
        const [runsRes, patternsRes] = await Promise.all([
          fetch("/api/runs?limit=100&status=failed"),
          fetch("/api/triage/patterns")
        ]);
        
        const runsData = await runsRes.json();
        const patternsData = await patternsRes.json();
        setPatterns(patternsData.patterns || []);
        
        const activeClusters = clusterFailures(runsData.runs || []);
        
        // Auto-match patterns
        activeClusters.forEach(cluster => {
          const match = patternsData.patterns?.find((p: any) => p.fingerprint === cluster.fingerprint);
          if (match) {
            cluster.historicalMatch = match;
            cluster.predictedStatus = match.resolvedStatus;
          }
        });

        setClusters(activeClusters);
        if (activeClusters.length > 0) {
          setSelectedCluster(activeClusters[0]);
          setSelectedFailure(activeClusters[0].failures[0]);
        }
      } catch (err) {
        console.error("Expert triage load failed", err);
      } finally {
        setLoading(false);
      }
    }
    
    loadExpertTriage();
  }, []);

  const [showKBManager, setShowKBManager] = useState(false);
  const [conflict, setConflict] = useState<{ predicted: string, incoming: string } | null>(null);
  const [patterns, setPatterns] = useState<any[]>([]);

  const handleTriageAll = async (status: string, override = false) => {
    if (!selectedCluster) return;

    // Conflict Detection
    if (!override && selectedCluster.predictedStatus && selectedCluster.predictedStatus !== status) {
      setConflict({ predicted: selectedCluster.predictedStatus, incoming: status });
      return;
    }
    
    setConflict(null);
    setTriageStatus('triaging...');
    const testIds = selectedCluster.failures.map((f: any) => f.id);
    
    try {
      const res = await fetch("/api/triage/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          testIds, 
          status,
          fingerprint: selectedCluster.fingerprint,
          error: selectedCluster.failures[0].error
        })
      });
      
      if (res.ok) {
        setTriageStatus('Learned & Applied');
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (e) {
      setTriageStatus('Error');
    }
  };

  const [searchQuery, setSearchQuery] = useState("");

  const [copied, setCopied] = useState(false);

  const handleCopyTrace = () => {
    if (selectedFailure?.stack) {
      navigator.clipboard.writeText(selectedFailure.stack);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const filteredClusters = clusters.filter(cluster => 
    cluster.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cluster.failures.some((f: any) => f.title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleArchiveAll = () => {
    setClusters([]);
    setTriageStatus('All Archived');
  };

  const handleDeletePattern = async (id: string) => {
    try {
      const res = await fetch(`/api/triage/patterns/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPatterns(patterns.filter(p => p.id !== id));
        setTriageStatus('Pattern Removed');
        setTimeout(() => setTriageStatus(null), 2000);
      }
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#0a0e1a]">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        </main>
      </div>
    );
  }

  if (clusters.length === 0) {
    return (
      <div className="flex h-screen w-full overflow-hidden bg-[#0a0e1a]">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-20 relative overflow-hidden">
          {/* Background Ambient Effects */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_70%)]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-500/5 blur-[120px] rounded-full opacity-20" />
          
          {/* Radar Scanning Core */}
          <div className="relative mb-12">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping opacity-25" />
            <div className="relative w-32 h-32 rounded-full border-2 border-emerald-500/30 flex items-center justify-center bg-black/40 backdrop-blur-xl group">
              <div className="absolute inset-0 rounded-full border border-emerald-500/20 animate-[spin_4s_linear_infinite]" 
                   style={{ background: 'conic-gradient(from 0deg, transparent 0% 80%, rgba(16,185,129,0.3) 100%)' }} />
              <ShieldCheck className="w-12 h-12 text-emerald-400 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
            </div>
          </div>

          <div className="text-center relative z-10">
            <h2 className="text-5xl font-black text-white tracking-tighter mb-4 flex items-center justify-center gap-4">
              All Clear
              <div className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center h-fit">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-widest leading-none">Oracle Verified</span>
              </div>
            </h2>
            <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed mb-12 font-medium">
              Zero regressions detected across all monitored pipelines. Your systems are currently <span className="text-emerald-400 font-bold">100% Stable</span>.
            </p>

            <div className="flex items-center gap-4 justify-center">
              <div className="px-8 py-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Incidents</p>
                 <p className="text-2xl font-black text-emerald-400">0</p>
              </div>
              <div className="px-8 py-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Stability Threshold</p>
                 <p className="text-2xl font-black text-white underline decoration-emerald-500/50 decoration-2 underline-offset-4">NOMINAL</p>
              </div>
              <div className="px-8 py-4 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-sm">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System Health</p>
                 <p className="text-2xl font-black text-indigo-400 flex items-center gap-2">
                   100%
                   <Zap className="w-4 h-4" />
                 </p>
              </div>
            </div>

            <button 
              onClick={() => window.location.reload()}
              className="mt-12 flex items-center gap-2 mx-auto text-[10px] font-black text-slate-600 uppercase tracking-widest hover:text-white transition-colors group"
            >
              <RefreshCw className="w-3 h-3 group-hover:rotate-180 transition-transform duration-500" />
              Force Refresh Scan
            </button>
          </div>
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
               style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#0a0e1a]">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-white/[0.03] sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Expert Triage Oracle</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold flex items-center gap-2">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                </span>
                {clusters.reduce((acc, c) => acc + c.count, 0)} Regressions • {clusters.filter(c => c.predictedStatus).length} Known Patterns
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
             <button 
               onClick={() => setShowKBManager(true)}
               className="p-2 rounded-lg bg-slate-900 border border-white/5 text-slate-400 hover:text-white transition-all flex items-center gap-2 group"
               title="Manage Learned Patterns"
             >
               <Settings2 className="w-4 h-4 group-hover:rotate-90 transition-transform duration-500" />
               <span className="text-[10px] font-bold uppercase tracking-widest hidden md:inline">Knowledge Oracle</span>
             </button>
             <div className="flex items-center gap-4 px-4 py-1.5 rounded-full bg-slate-900 border border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-rose-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Prod</span>
                </div>
                <div className="flex items-center gap-2 border-l border-white/10 pl-4">
                  <div className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Staging</span>
                </div>
             </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          {/* Left: Cluster Inbox */}
          <div className="w-96 border-r border-white/5 flex flex-col bg-[#0b0f1d] overflow-y-auto">
            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Search clusters..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-lg py-2 pl-9 pr-4 text-[11px] text-white focus:outline-none focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all"
                    />
                </div>
                <button 
                  onClick={handleArchiveAll}
                  className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all border border-white/5 flex items-center gap-2 group"
                  title="Archive all active regressions"
                >
                  <SkipForward className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-tighter">Archive</span>
                </button>
            </div>
            <div className="flex-1">
              {filteredClusters.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No matching clusters</p>
                </div>
              ) : filteredClusters.map((cluster) => (
                <button
                  key={cluster.id}
                  onClick={() => {
                    setSelectedCluster(cluster);
                    setSelectedFailure(cluster.failures[0]);
                  }}
                  className={`w-full text-left p-6 border-b border-white/[0.03] transition-all relative group ${selectedCluster?.id === cluster.id ? 'bg-indigo-500/[0.05] border-l-2 border-l-indigo-500' : 'hover:bg-white/[0.02]'}`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest 
                      ${cluster.severity === 'CRITICAL' ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                        cluster.severity === 'HIGH' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 
                        'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}
                    >
                      {cluster.severity} Impact
                    </span>
                    <span className="text-[10px] font-mono text-slate-600">{cluster.count} failures</span>
                  </div>
                  <h3 className={`text-sm font-bold tracking-tight mb-2 truncate ${selectedCluster?.id === cluster.id ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>{cluster.title}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    {cluster.envList.map((env: string) => (
                      <span key={env} className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${env === 'PRODUCTION' ? 'border-rose-500/40 text-rose-500' : 'border-amber-500/40 text-amber-500'}`}>{env}</span>
                    ))}
                  </div>
                  {cluster.predictedStatus && (
                    <div className="mt-3 flex items-center gap-2 p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-tighter">Recognized: {cluster.predictedStatus}</span>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Expert Workspace */}
          <div className="flex-1 overflow-y-auto p-10 bg-[#0a0e1a] relative">
            <div className="max-w-5xl mx-auto space-y-10 pb-20">
              
              {/* Workspace Header */}
              {selectedFailure && (
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                     <div className="flex items-center gap-3 mb-4">
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Expert Analysis System</span>
                        <div className="h-px w-12 bg-indigo-500/30" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Fingerprint: {selectedCluster?.fingerprint.substring(0, 16)}...</span>
                     </div>
                     <h2 className="text-4xl font-black text-white tracking-tighter mb-4 leading-tight">{selectedFailure.title}</h2>
                     <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-xs text-slate-400">Suite: <span className="text-white font-medium">{selectedFailure.suite}</span></span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span className="text-xs text-slate-400">Environment: <span className={`font-bold ${selectedFailure.env === 'PRODUCTION' ? 'text-rose-400' : 'text-amber-400'}`}>{selectedFailure.env}</span></span>
                        </div>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-3 shrink-0">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => handleTriageAll('fixed')}
                        className="px-6 py-4 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-2xl shadow-indigo-900/40 flex items-center gap-3 group"
                      >
                        <ShieldCheck className="w-4 h-4 group-hover:scale-125 transition-transform" />
                        Learn & Triage as Fixed
                      </button>
                      <button 
                        onClick={() => handleTriageAll('flaky')}
                        className="px-6 py-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
                      >
                        Flag as Flaky
                      </button>
                    </div>
                    {triageStatus && (
                      <span className="text-[10px] font-bold text-indigo-400 uppercase animate-pulse flex items-center gap-2">
                        <RefreshCw className="w-3 h-3 animate-spin" /> {triageStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Expert Insight Panel */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 glass rounded-[2.5rem] p-10 bg-gradient-to-br from-indigo-500/[0.08] to-transparent border-white/[0.03] relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-32 h-32 text-indigo-400" />
                  </div>
                  
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-indigo-500/20 border border-indigo-500/30">
                      <Zap className="w-6 h-6 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white tracking-tight">Intelligence Forecast</h3>
                      <p className="text-xs text-indigo-400/80 font-bold uppercase tracking-widest">Self-Healing Diagnostic</p>
                    </div>
                  </div>

                  {selectedCluster?.predictedStatus ? (
                    <div className="space-y-6">
                      <p className="text-base text-slate-300 leading-relaxed max-w-lg">
                        This pattern was previously encountered and triaged as <span className="text-indigo-400 font-bold underline underline-offset-4">{selectedCluster.predictedStatus}</span>. 
                        The Knowledge Base indicates this is a <span className="text-white font-bold">recurring regression</span>.
                      </p>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wide">Confidence Score: 98% (Historical Match)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <p className="text-base text-slate-300 leading-relaxed max-w-lg">
                        This is a <span className="text-rose-400 font-bold">New Failure Pattern</span>. No historical matches found. 
                        Impact is highest in <span className="text-white font-bold">{selectedCluster?.envList.join(' and ')}</span> environments.
                      </p>
                      <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <Info className="w-5 h-5 text-slate-500" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Ready for Knowledge Base Ingestion</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="glass rounded-[2.5rem] p-10 bg-black/40 border-white/[0.03] flex flex-col justify-between">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Environment Impact</h4>
                    <div className="space-y-4">
                      {['PRODUCTION', 'STAGING', 'DEV'].map(env => {
                        const isAffected = selectedCluster?.envList.includes(env);
                        return (
                          <div key={env} className={`flex items-center justify-between p-4 rounded-2xl border ${isAffected ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-white/[0.02] border-white/[0.02] text-slate-700 opacity-40'}`}>
                            <span className="text-xs font-black tracking-widest">{env}</span>
                            {isAffected ? <ShieldAlert className="w-4 h-4" /> : <div className="w-4 h-4 rounded-full border border-slate-800" />}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                  <div className="mt-8 pt-8 border-t border-white/5">
                    <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest text-center">Calculated Priority: {selectedCluster?.severity}</p>
                  </div>
                </div>
              </div>

              {/* Technical Blueprint */}
              <div className="glass rounded-[2.5rem] p-10 border-t-8 border-indigo-500/50 shadow-2xl bg-black/40">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-3">
                     <Terminal className="w-6 h-6 text-slate-400" />
                     <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">Atomic Execution Blueprint</h3>
                  </div>
                  <button 
                    onClick={handleCopyTrace}
                    className={`text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 group ${copied ? 'text-emerald-400' : 'text-indigo-400 hover:text-indigo-300'}`}
                  >
                    {copied ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 animate-in zoom-in duration-300" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        Copy Trace
                      </>
                    )}
                  </button>
                </div>
                <div className="p-8 rounded-3xl bg-[#05070a] border border-white/5 font-mono text-sm leading-relaxed overflow-x-auto min-h-[250px] shadow-inner">
                   {selectedFailure?.error ? (
                     <div className="space-y-4">
                        <p className="text-rose-400 font-bold p-3 rounded-lg bg-rose-500/5 border border-rose-500/10 mb-6">
                          {selectedFailure.error}
                        </p>
                        <div className="space-y-1">
                          {selectedFailure.stack?.split('\n').map((line: string, i: number) => (
                            <p key={i} className={`text-xs ${line.includes('at') ? 'text-slate-500' : 'text-slate-300'}`}>
                              {line.split(' ').map((word, j) => (
                                <span key={j} className={word.includes('/') || word.includes('.') ? 'text-indigo-300/60' : ''}>{word} </span>
                              ))}
                            </p>
                          ))}
                        </div>
                     </div>
                   ) : (
                     <p className="text-slate-800 italic flex items-center justify-center h-full">Selection terminal offline.</p>
                   )}
                </div>
              </div>

              {/* Cluster Membership Grid */}
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                    <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Blast Radius Context ({selectedCluster?.count} Atomic Failures)</h3>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600">Normalization: Normalized HASH-X</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCluster?.failures.map((f: any) => (
                    <button 
                      key={f.id}
                      onClick={() => setSelectedFailure(f)}
                      className={`group flex items-center justify-between p-6 rounded-[2rem] border transition-all duration-300 ${selectedFailure.id === f.id ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/[0.02] border-white/[0.02] hover:bg-white/[0.05]'}`}
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-3 h-3 rounded-full transition-all duration-500 ${selectedFailure.id === f.id ? 'bg-indigo-400 scale-125 shadow-lg shadow-indigo-500/40' : 'bg-rose-500/40 group-hover:bg-rose-500'}`} />
                        <div className="text-left">
                          <p className="text-sm font-bold text-white group-hover:translate-x-1 transition-transform">{f.title}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{f.suite} • {f.time}</p>
                        </div>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-all ${selectedFailure.id === f.id ? 'text-indigo-400 translate-x-0' : 'text-slate-800 -translate-x-2'}`} />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Conflict Resolution Modal */}
      {conflict && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="w-full max-w-md glass rounded-[2.5rem] p-10 bg-gradient-to-br from-rose-500/10 to-transparent border-rose-500/20 shadow-2xl shadow-rose-900/20">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 rounded-2xl bg-rose-500/20 border border-rose-500/30">
                <AlertOctagon className="w-8 h-8 text-rose-500 animate-pulse" />
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">Knowledge Conflict</h3>
            </div>
            
            <p className="text-slate-300 leading-relaxed mb-8">
              The Oracle previously learned this pattern as <span className="text-indigo-400 font-bold underline underline-offset-4">{conflict.predicted}</span>. 
              You are triaging it as <span className="text-rose-400 font-bold underline underline-offset-4">{conflict.incoming}</span>. 
              Which decision should the Knowledge Base keep?
            </p>

            <div className="space-y-3">
              <button 
                onClick={() => handleTriageAll(conflict.incoming, true)}
                className="w-full py-4 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/40"
              >
                Overwrite KB with New Decision
              </button>
              <button 
                onClick={() => setConflict(null)}
                className="w-full py-4 rounded-xl bg-slate-800 text-slate-300 text-xs font-black uppercase tracking-widest hover:bg-slate-700 transition-all border border-white/5"
              >
                Cancel Triage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KB Management Slide-over */}
      {showKBManager && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div 
            onClick={() => setShowKBManager(false)}
            className="flex-1 cursor-pointer" 
          />
          <div className="w-full max-w-2xl bg-[#0b0f1d] border-l border-white/5 shadow-2xl animate-in slide-in-from-right duration-500 flex flex-col">
            <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
              <div>
                <h3 className="text-xl font-black text-white tracking-tight">Knowledge Oracle Brain</h3>
                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-1">Manage learned failure patterns</p>
              </div>
              <button 
                onClick={() => setShowKBManager(false)}
                className="p-2 rounded-lg hover:bg-white/5 text-slate-500 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4">
              {patterns.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <Sparkles className="w-12 h-12 text-slate-800 mb-4" />
                  <p className="text-slate-600 font-bold uppercase tracking-widest text-xs">Knowledge Base is Empty</p>
                </div>
              ) : (
                patterns.map((pattern: any) => (
                  <div key={pattern.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 transition-all group relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${pattern.resolvedStatus === 'fixed' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'}`}>
                          {pattern.resolvedStatus}
                        </span>
                        <span className="text-[10px] font-mono text-slate-600">Fingerprint: {pattern.fingerprint.substring(0, 12)}...</span>
                      </div>
                      <button 
                        onClick={() => handleDeletePattern(pattern.id)}
                        className="p-2 rounded-lg text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                        title="Forget this pattern"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm font-bold text-white mb-2 line-clamp-1">{pattern.comment || "Automated triage learning"}</p>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      <span>Seen {pattern.occurrenceCount} times</span>
                      <span>•</span>
                      <span>Last: {new Date(pattern.lastSeen).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
            
            <div className="p-8 border-t border-white/5 bg-black/20">
              <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest leading-relaxed text-center">
                Deletions are permanent. Removing a pattern resets the Oracle's prediction for similar regressions.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
