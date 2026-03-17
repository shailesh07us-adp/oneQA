"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { 
  DollarSign, 
  Clock, 
  ShieldCheck, 
  Layers, 
  TrendingDown, 
  ArrowRight,
  Sparkles,
  Target
} from "lucide-react";
import { TestingPyramid } from "@/components/TestingPyramid";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessValuePage() {
  const [adoData, setAdoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/ado")
      .then((r) => r.json())
      .then((d) => {
        setAdoData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-[#0a0e1a]">
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">Business Value</h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Measuring the ROI and strategic impact of QE</p>
            </div>
          </div>
          {adoData && !adoData.isLive && (
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-medium">
              DEMO MODE
            </span>
          )}
        </header>

        <div className="p-8 space-y-6 max-w-7xl mx-auto w-full">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-[400px] rounded-xl" />
                <Skeleton className="h-[400px] rounded-xl" />
              </div>
            </div>
          ) : adoData ? (
            <div className="space-y-6 fade-in-up">
              
              {/* ROI & Key Impact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="glass rounded-xl p-5 border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Automation Savings</p>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{adoData.businessValue.roi.formattedMoney}</h3>
                  <p className="text-xs text-slate-400 mt-1">Est. cost savings this cycle</p>
                </div>

                <div className="glass rounded-xl p-5 border-l-4 border-emerald-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-emerald-300">Human Capital ROI</p>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10">
                      <Clock className="w-4 h-4 text-emerald-400" />
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold text-white">{adoData.businessValue.roi.hoursSaved.toLocaleString()}h</h3>
                  <p className="text-xs text-slate-400 mt-1">Manual testing hours reclaimed</p>
                </div>

                <div className="glass rounded-xl p-5 border-l-4 border-sky-500">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-sky-300">Escaped Defect Rate</p>
                    <div className="p-1.5 rounded-lg bg-sky-500/10">
                      <ShieldCheck className="w-4 h-4 text-sky-400" />
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl font-bold text-white">{adoData.businessValue.escapedDefects.rate}%</h3>
                    <span 
                      className="text-[11px] font-bold" 
                      style={{ color: adoData.businessValue.escapedDefects.color }}
                    >
                      {adoData.businessValue.escapedDefects.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{adoData.businessValue.escapedDefects.prodCount} Prod bugs / {adoData.businessValue.escapedDefects.qaCount} QA bugs</p>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left: MTTR & Cycle Time */}
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                    <Target className="w-4 h-4 text-indigo-400" />
                    <h2 className="text-sm font-semibold text-white">Efficiency & Velocity</h2>
                  </div>
                  
                  <div className="space-y-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-slate-300">Mean Time to Repair (MTTR)</p>
                        <p className="text-xs text-slate-500 mt-1">Found to Resolved duration</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-white">{adoData.businessValue.mttr.avgDays}d</p>
                        <span className="text-[11px] font-bold" style={{ color: adoData.businessValue.mttr.color }}>
                          {adoData.businessValue.mttr.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Resolution Speed (Trend)</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" /> -12% faster
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div className="h-full bg-emerald-500 w-3/4 rounded-full" />
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                      <p className="text-xs text-slate-400 leading-relaxed italic">
                        "Your team is currently resolving bugs 0.4 days faster than last quarter, contributing to a 5% increase in sprint velocity."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Right: Testing Pyramid Strategy */}
                <div className="glass rounded-xl p-6">
                  <div className="flex items-center justify-between mb-6 border-b border-slate-800 pb-4">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-purple-400" />
                      <h2 className="text-sm font-semibold text-white">Testing Pyramid Health</h2>
                    </div>
                    {adoData.businessValue.pyramid.isHealthy && (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold uppercase tracking-tighter">
                        Shift-Left Optimized
                      </span>
                    )}
                  </div>

                  <TestingPyramid 
                    unit={640} 
                    integration={210} 
                    e2e={85} 
                  />

                  <div className="mt-6 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
                    <div className="flex items-center gap-2 mb-2">
                      <ArrowRight className="w-3 h-3 text-purple-400" />
                      <p className="text-[11px] font-bold text-slate-300">Strategic Recommendation</p>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {adoData.businessValue.pyramid.recommendation} Your current distribution minimizes infrastructure costs and provides fast feedback for developers.
                    </p>
                  </div>
                </div>
              </div>

              {/* Deployment Confidence Section */}
              <div className="glass rounded-xl p-6 bg-gradient-to-br from-slate-900 via-[#0c1021] to-slate-900 border border-emerald-500/20">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-2">Deployment Confidence Score</h2>
                    <p className="text-sm text-slate-400 max-w-xl">
                      An AI-aggregated indicator based on escaped defects, regression stability, and requirement coverage. Use this to inform your Go/No-Go decisions.
                    </p>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-4xl font-black text-emerald-400 tracking-tighter">94<span className="text-lg">%</span></div>
                      <div className="text-[10px] font-bold text-emerald-500/80 uppercase">READY TO SHIP</div>
                    </div>
                    <button className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold transition-all shadow-lg shadow-emerald-900/40 border border-emerald-400/20">
                      Approve Release
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass rounded-xl p-16 text-center">
              <p className="text-slate-400">Failed to load business value data.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
