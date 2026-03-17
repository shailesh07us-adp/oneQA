"use client";

import dynamic from "next/dynamic";

const TestCaseTrendChartInner = dynamic(
  () => import("./TrendChartInner").then((mod) => mod.TestCaseTrendChart),
  { ssr: false, loading: () => <div className="w-full h-48 flex items-center justify-center text-slate-600 text-xs">Loading chart...</div> }
);

const DurationTrendChartInner = dynamic(
  () => import("./TrendChartInner").then((mod) => mod.DurationTrendChart),
  { ssr: false, loading: () => <div className="w-full h-48 flex items-center justify-center text-slate-600 text-xs">Loading chart...</div> }
);

export function TestCaseTrendChart({ projectId }: { projectId?: string }) {
  return <TestCaseTrendChartInner projectId={projectId} />;
}

export function DurationTrendChart({ projectId }: { projectId?: string }) {
  return <DurationTrendChartInner projectId={projectId} />;
}

export function BuildScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Excellent" : score >= 60 ? "Good" : "At Risk";

  return (
    <div className="flex items-center gap-4">
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
          <path d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1e293b" strokeWidth="3" />
          <path
            d="M18 2.0845a 15.9155 15.9155 0 0 1 0 31.831a 15.9155 15.9155 0 0 1 0 -31.831"
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeDasharray={`${score}, 100`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-bold text-white">{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color }}>{label}</p>
        <p className="text-[11px] text-slate-500">Build Score</p>
      </div>
    </div>
  );
}
