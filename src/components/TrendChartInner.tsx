"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface TrendData {
  date: string;
  passed: number;
  failed: number;
  total: number;
  avgDuration: number;
  successRate: number;
}

export function TestCaseTrendChart({ projectId }: { projectId?: string }) {
  const [data, setData] = useState<TrendData[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ days: "14" });
    if (projectId) params.set("projectId", projectId);
    fetch(`/api/trends?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [projectId]);

  if (data.length === 0) return <div className="w-full h-48 flex items-center justify-center text-slate-600 text-xs">No trend data yet</div>;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorPassed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorFailed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px" }}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area type="monotone" dataKey="passed" stroke="#22c55e" fill="url(#colorPassed)" strokeWidth={2} />
          <Area type="monotone" dataKey="failed" stroke="#ef4444" fill="url(#colorFailed)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DurationTrendChart({ projectId }: { projectId?: string }) {
  const [data, setData] = useState<TrendData[]>([]);

  useEffect(() => {
    const params = new URLSearchParams({ days: "14" });
    if (projectId) params.set("projectId", projectId);
    fetch(`/api/trends?${params}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {});
  }, [projectId]);

  if (data.length === 0) return <div className="w-full h-48 flex items-center justify-center text-slate-600 text-xs">No trend data yet</div>;

  return (
    <div className="w-full h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fill: "#64748b", fontSize: 10 }} unit="s" />
          <Tooltip
            contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #1e293b", borderRadius: "8px", fontSize: "12px" }}
            labelStyle={{ color: "#94a3b8" }}
            formatter={(v: any) => [`${v}s`, "Avg Duration"]}
          />
          <Bar dataKey="avgDuration" fill="#6366f1" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
