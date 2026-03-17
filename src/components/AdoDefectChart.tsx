"use client";

import dynamic from "next/dynamic";
import type { DefectTrendPoint } from "@/lib/ado";

const AdoDefectChartInner = dynamic(
  () =>
    import("./AdoDefectChartInner").then((mod) => mod.AdoDefectChart),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-[220px] flex items-center justify-center text-slate-600 text-xs">
        Loading chart...
      </div>
    ),
  }
);

export function AdoDefectChart({ data }: { data: DefectTrendPoint[] }) {
  return <AdoDefectChartInner data={data} />;
}
