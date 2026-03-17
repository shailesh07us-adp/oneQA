"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  Sparkles, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  Database, 
  Bug, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight,
  Target
} from "lucide-react";
import { calculateConfidenceScore, ConfidenceMetrics, classifyFailures } from "@/lib/intelligence";

export default function CommandCenterPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<ConfidenceMetrics | null>(null);
  const [failureBreakdown, setFailureBreakdown] = useState<any>(null);

  useEffect(() => {
    fetch("/api/runs?limit=200")
      .then(res => res.json())
      .then(data => {
        const allRuns = data.runs || [];
        setRuns(allRuns);
        setMetrics(calculateConfidenceScore(allRuns));
        setFailureBreakdown(classifyFailures(allRuns));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading || !metrics) {
    return (
      <div className="flex h-screen w-full overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex items-center justify-center bg-[#0a0e1a]">
          <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        </main>
      </div>
    );
  }

  const isSafe = metrics.score >= 80;

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Quality Command Center</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold italic">Predictive Intelligence & Readiness Engine</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800">
              <div className={`w-2 h-2 rounded-full ${isSafe ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                {isSafe ? 'Safe to Deploy' : 'Caution Required'}
              </span>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
          {/* Top Row: Confidence Oracle */}
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 glass rounded-3xl p-8 relative overflow-hidden flex flex-col items-center justify-center text-center group border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
              <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                <Target className="w-3.5 h-3.5" /> Release Readiness
              </p>
              
              <div className="relative mt-4">
                <svg className="w-48 h-48 transform -rotate-90">
                  <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" />
                  <circle 
                    cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="10" 
                    fill="transparent" strokeDasharray="552.9" 
                    strokeDashoffset={552.9 - (552.9 * metrics.score) / 100} 
                    strokeLinecap="round"
                    className={`transition-all duration-1000 ease-out ${isSafe ? 'text-indigo-500' : 'text-rose-500'}`} 
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl font-black text-white">{metrics.score}<span className="text-lg text-slate-500 font-medium">%</span></span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isSafe ? 'text-indigo-400' : 'text-rose-400'}`}>Confidence</span>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                {metrics.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> : metrics.trend === 'down' ? <TrendingDown className="w-3.5 h-3.5 text-rose-400" /> : <div className="w-3 h-0.5 bg-slate-500" />}
                <span className="text-[11px] text-slate-300 font-medium">Trend: <span className="capitalize">{metrics.trend}</span></span>
              </div>
            </div>

            <div className="lg:col-span-8 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <IntelligenceCard 
                  label="Stability Score" 
                  value={`${Math.round(metrics.stability)}%`} 
                  desc="Recent execution pass rate" 
                  icon={<ShieldCheck className="w-5 h-5" />} 
                  color="indigo"
                />
                <IntelligenceCard 
                  label="Surface Coverage" 
                  value={`${Math.round(metrics.coverage)}%`} 
                  desc="Regression scope footprint" 
                  icon={<Database className="w-5 h-5" />} 
                  color="purple"
                />
                <IntelligenceCard 
                  label="Delivery Velocity" 
                  value={`${Math.round(metrics.velocity)}%`} 
                  desc="Execution speed vs baseline" 
                  icon={<Zap className="w-5 h-5" />} 
                  color="amber"
                />
              </div>

              <div className="glass rounded-2xl p-6 bg-gradient-to-br from-indigo-500/[0.03] to-purple-500/[0.03] border-white/[0.02] flex-1">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" /> AI Insights Preview
                  </h3>
                  <button className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors">Generate Detailed Analysis</button>
                </div>
                <div className="space-y-3">
                  {isSafe ? (
                    <div className="flex gap-4 p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-white">High Confidence:</strong> Stability is trending up across all core projects. Infrastructure is healthy and no timeouts were detected in the last 50 runs.
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-4 p-4 rounded-xl bg-rose-500/5 border border-rose-500/10">
                      <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        <strong className="text-white">Risk Detected:</strong> Drastic drop in execution velocity. failures appear to be code regressions in critical modules.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Middle Row: Failure Fingerprinting & Risk Map */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">AI Failure Fingerprinting</h3>
              <div className="space-y-6">
                <FingerprintRow label="System/Infrastructure" count={failureBreakdown?.infrastructure} total={failureBreakdown?.infrastructure + failureBreakdown?.bug + failureBreakdown?.flaky} color="indigo" icon={<Database className="w-3.5 h-3.5" />} />
                <FingerprintRow label="Confirmed Regressions" count={failureBreakdown?.bug} total={failureBreakdown?.infrastructure + failureBreakdown?.bug + failureBreakdown?.flaky} color="rose" icon={<Bug className="w-3.5 h-3.5" />} />
                <FingerprintRow label="Flaky & Environmental" count={failureBreakdown?.flaky} total={failureBreakdown?.infrastructure + failureBreakdown?.bug + failureBreakdown?.flaky} color="amber" icon={<RefreshCw className="w-3.5 h-3.5 text-amber-500" />} />
              </div>
            </div>

            <div className="glass rounded-2xl p-6 relative overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Risk Heatmap</h3>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-[10px] text-slate-400 uppercase font-bold">Stable</span></div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-[10px] text-slate-400 uppercase font-bold">High Risk</span></div>
                  </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                  <HeatmapCell label="Authentication" status="critical" />
                  <HeatmapCell label="Reporting Engine" status="stable" />
                  <HeatmapCell label="Billing Integration" status="warning" />
                  <HeatmapCell label="Mobile SDK" status="stable" />
                  <HeatmapCell label="Partner APIs" status="stable" />
                  <HeatmapCell label="Legacy Console" status="critical" />
               </div>
               <div className="absolute bottom-0 right-0 p-4">
                 <Info className="w-4 h-4 text-slate-700" />
               </div>
            </div>
          </section>

          {/* Bottom Row: CI Optimization */}
          <section className="glass rounded-2xl p-8 bg-gradient-to-r from-indigo-500/[0.02] to-transparent border-indigo-500/10">
            <div className="flex items-center justify-between flex-wrap gap-6 text-center md:text-left">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2 justify-center md:justify-start">
                  <Zap className="w-5 h-5 text-amber-400" /> CI Resource Optimizer
                </h3>
                <p className="text-sm text-slate-400 mt-1 max-w-sm">Automatically identifying redundant test runs to reduce infrastructure costs.</p>
              </div>
              <div className="flex gap-12">
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Compute Waste</p>
                    <p className="text-2xl font-black text-white">124h <span className="text-xs text-rose-500 font-bold ml-1">/mo</span></p>
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Potential Savings</p>
                    <p className="text-2xl font-black text-emerald-400">$3,420 <span className="text-xs text-slate-400 font-bold ml-1">USD</span></p>
                 </div>
                 <button className="px-6 py-3 rounded-xl bg-white text-[#0a0e1a] font-bold text-sm hover:bg-slate-200 transition-all flex items-center gap-2 shadow-xl shadow-white/10 active:scale-95">
                    Start Optimization <ChevronRight className="w-4 h-4" />
                 </button>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function IntelligenceCard({ label, value, desc, icon, color }: any) {
  const colors: any = {
    indigo: "from-indigo-500/20 text-indigo-400 border-indigo-500/30",
    purple: "from-purple-500/20 text-purple-400 border-purple-500/30",
    amber: "from-amber-500/20 text-amber-400 border-amber-500/30",
  };
  return (
    <div className="glass rounded-2xl p-5 flex flex-col justify-between group hover:shadow-lg transition-all border-white/[0.03] min-h-[160px]">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[color]} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}>
        {icon}
      </div>
      <div>
        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</h4>
        <p className="text-2xl font-black text-white mt-0.5">{value}</p>
        <p className="text-[11px] text-slate-500 mt-1">{desc}</p>
      </div>
    </div>
  );
}

function FingerprintRow({ label, count, total, color, icon }: any) {
  const perc = total > 0 ? (count / total) * 100 : 0;
  const colors: any = {
    indigo: "bg-indigo-500 shadow-indigo-500/20",
    rose: "bg-rose-500 shadow-rose-500/20",
    amber: "bg-amber-500 shadow-amber-500/20",
  };
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-bold text-white uppercase tracking-wider">
        <span className="flex items-center gap-2 text-slate-300 tracking-normal">{icon} {label}</span>
        <span>{Math.round(perc)}%</span>
      </div>
      <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800/50">
        <div 
          className={`h-full rounded-full transition-all duration-1000 shadow-lg ${colors[color]}`} 
          style={{ width: `${perc}%` }} 
        />
      </div>
    </div>
  );
}

function HeatmapCell({ label, status }: any) {
  const isCritical = status === 'critical';
  const isWarning = status === 'warning';
  return (
    <div className={`p-4 rounded-xl border flex items-center justify-between transition-all hover:translate-x-1 ${
      isCritical ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 
      isWarning ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 
      'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    }`}>
      <span className="text-xs font-bold truncate pr-2">{label}</span>
      {isCritical ? <ShieldAlert className="w-3.5 h-3.5 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
    </div>
  );
}
