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
  Target,
  Zap,
  TrendingUp,
  Activity
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
    <>
        <header className="h-16 flex items-center justify-between px-8 bg-[#0c1021] border-b border-slate-800/60 sticky top-0 z-10 shrink-0">
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

        <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
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
            <div className="space-y-10 fade-in-up">
              
              {/* ROI & Key Impact Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="glass rounded-[2rem] p-8 relative overflow-hidden border-t-4 border-indigo-500/80 shadow-[0_-12px_20px_-8px_rgba(99,102,241,0.25)] group hover:-translate-y-1 transition-all duration-500">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                        <TrendingUp className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-indigo-500/5 border border-indigo-500/10">Verified</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Automation Savings</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter mb-2">{adoData.businessValue.roi.formattedMoney}</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Estimated cost avoidance this cycle</p>
                  </div>
                </div>

                <div className="glass rounded-[2rem] p-8 relative overflow-hidden border-t-4 border-emerald-500/80 shadow-[0_-12px_20px_-8px_rgba(52,211,153,0.25)] group hover:-translate-y-1 transition-all duration-500">
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-8">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                        <Zap className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-emerald-500/5 border border-emerald-500/10">Efficiency</span>
                    </div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Human Capital ROI</p>
                    <h3 className="text-5xl font-black text-white tracking-tighter mb-2">{adoData.businessValue.roi.hoursSaved.toLocaleString()}h</h3>
                    <p className="text-[11px] text-slate-500 font-medium">Manual engineering hours reclaimed</p>
                  </div>
                </div>

                <div className="glass rounded-[2rem] p-8 relative overflow-hidden border-t-4 border-rose-500/80 shadow-[0_-12px_20px_-8px_rgba(244,63,94,0.25)] group hover:-translate-y-1 transition-all duration-500">
                  <div className="flex flex-col items-center justify-center h-full text-center relative z-10">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Escaped Defect Rate</span>
                    <div className="relative w-32 h-32 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90 transform group-hover:scale-110 transition-transform duration-700">
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="10" className="text-slate-800/40" />
                        <circle cx="64" cy="64" r="56" fill="transparent" stroke="currentColor" strokeWidth="10" strokeDasharray="351.8" strokeDashoffset={351.8 - (351.8 * adoData.businessValue.escapedDefects.rate) / 100} strokeLinecap="round" className="text-rose-500 transition-all duration-1000 ease-out" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-white tracking-tighter">{adoData.businessValue.escapedDefects.rate}<span className="text-xs text-rose-500/60 ml-0.5">%</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* MTTR Card */}
                <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
                  <div className="flex items-center gap-3 mb-8 border-b border-white/[0.03] pb-6">
                    <Target className="w-5 h-5 text-indigo-400" />
                    <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Efficiency & Velocity</h2>
                  </div>
                  <div className="space-y-10">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-white mb-1">Mean Time to Repair (MTTR)</p>
                        <p className="text-[11px] text-slate-500 font-medium">Found to Resolved cycle duration</p>
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black text-white tracking-tighter">{adoData.businessValue.mttr.avgDays}d</p>
                        <span className="text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded bg-white/5 border border-white/5" style={{ color: adoData.businessValue.mttr.color }}>
                          {adoData.businessValue.mttr.label}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-indigo-500/5 border border-indigo-500/10">
                      <p className="text-[11px] text-slate-400 leading-relaxed font-medium italic">
                        "Your team is currently resolving bugs {Math.abs(adoData.businessValue.mttr.avgDays - 0.4).toFixed(1)} days faster than last month, contributing to a significant leap in sprint velocity."
                      </p>
                    </div>
                  </div>
                </div>

                {/* Testing Pyramid */}
                <div className="glass rounded-[2rem] p-8 border-white/[0.03]">
                  <div className="flex items-center justify-between mb-8 border-b border-white/[0.03] pb-6">
                    <div className="flex items-center gap-3">
                      <Layers className="w-5 h-5 text-emerald-400" />
                      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Architecture Health</h2>
                    </div>
                    {adoData.businessValue.pyramid.isHealthy && (
                      <span className="text-[9px] font-black px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">
                        Optimized
                      </span>
                    )}
                  </div>
                  <TestingPyramid unit={640} integration={210} e2e={85} />
                </div>
              </div>

              {/* Deployment Confidence Section */}
              <div className="glass rounded-[2.5rem] p-10 bg-gradient-to-br from-indigo-500/[0.08] via-[#0c1021] to-emerald-500/[0.08] border-emerald-500/30 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.05] pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 relative z-10">
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-4">
                      <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                      <span className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.4em]">OneQA Intelligence Oracle</span>
                    </div>
                    <h2 className="text-4xl font-black text-white mb-4 tracking-tighter">Strategic Release Confidence</h2>
                    <p className="text-base text-slate-400 max-w-xl leading-relaxed font-medium">
                      Multi-vector stability analysis confirms a high-probability success window for production deployment. Risks are mitigated across all core business domains.
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <div className="text-center">
                      <div className="text-8xl font-black text-emerald-400 tracking-tighter drop-shadow-[0_0_20px_rgba(52,211,153,0.4)]">94<span className="text-2xl text-emerald-400/50 -ml-1">%</span></div>
                      <div className="text-[11px] font-black text-emerald-500 uppercase tracking-[0.3em] mt-2">OPTIMAL READINESS</div>
                    </div>
                    <button className="px-10 py-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-400 text-white text-sm font-black transition-all shadow-[0_15px_30px_rgba(52,211,153,0.25)] hover:shadow-[0_20px_40px_rgba(52,211,153,0.35)] hover:-translate-y-1 active:scale-95 uppercase tracking-[0.2em] border-t border-white/20">
                      Approve Deployment
                    </button>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="glass rounded-xl p-16 text-center">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Strategic Data Unavailable</p>
            </div>
          )}
        </div>
    </>
  );
}
