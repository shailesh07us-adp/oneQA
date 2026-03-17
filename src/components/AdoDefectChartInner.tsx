"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";

interface DefectTrendPoint {
  date: string;
  opened: number;
  resolved: number;
  isForecast?: boolean;
}

export function AdoDefectChart({ data }: { data: DefectTrendPoint[] }) {
  // Split data into actual + forecast, adding separate keys for dashed rendering
  const chartData = data.map((d) => ({
    label: new Date(d.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    // Actual data (solid lines) — only show for non-forecast points
    opened: d.isForecast ? undefined : d.opened,
    resolved: d.isForecast ? undefined : d.resolved,
    // Forecast data (dashed lines) — only show for forecast points + last actual point for continuity
    openedForecast: d.isForecast ? d.opened : undefined,
    resolvedForecast: d.isForecast ? d.resolved : undefined,
    isForecast: d.isForecast,
  }));

  // Connect the last actual point to the first forecast point
  const lastActualIdx = chartData.findLastIndex((d) => !d.isForecast);
  if (lastActualIdx >= 0 && lastActualIdx < chartData.length - 1) {
    const lastActual = data[lastActualIdx];
    chartData[lastActualIdx].openedForecast = lastActual.opened;
    chartData[lastActualIdx].resolvedForecast = lastActual.resolved;
  }

  // Find the forecast boundary label for the reference line
  const forecastStartLabel = lastActualIdx >= 0 ? chartData[lastActualIdx].label : undefined;

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="colorOpened" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorOpenedForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorResolvedForecast" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
          interval={5}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "#64748b" }}
          tickLine={false}
          axisLine={{ stroke: "#1e293b" }}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: "#0f172a",
            border: "1px solid rgba(99, 102, 241, 0.2)",
            borderRadius: "12px",
            fontSize: "12px",
            color: "#f8fafc",
          }}
          labelStyle={{ color: "#94a3b8" }}
          formatter={((value: any, name?: string) => {
            if (value === undefined || value === null) return [null, null];
            const labels: Record<string, string> = {
              opened: "Bugs Opened",
              resolved: "Bugs Resolved",
              openedForecast: "Opened (Predicted)",
              resolvedForecast: "Resolved (Predicted)",
            };
            return [value, labels[name || ""] || name];
          }) as any}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: "11px", color: "#94a3b8", paddingTop: "8px" }}
          formatter={(value: string) => {
            const labels: Record<string, string> = {
              opened: "Bugs Opened",
              resolved: "Bugs Resolved",
              openedForecast: "Opened (Forecast)",
              resolvedForecast: "Resolved (Forecast)",
            };
            return labels[value] || value;
          }}
        />

        {/* Forecast boundary line */}
        {forecastStartLabel && (
          <ReferenceLine
            x={forecastStartLabel}
            stroke="#6366f1"
            strokeDasharray="4 4"
            strokeOpacity={0.5}
            label={{
              value: "Forecast →",
              position: "top",
              fill: "#6366f1",
              fontSize: 10,
              fontWeight: 600,
            }}
          />
        )}

        {/* Actual data lines (solid) */}
        <Area
          type="monotone"
          dataKey="opened"
          name="opened"
          stroke="#f43f5e"
          fill="url(#colorOpened)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: "#f43f5e", strokeWidth: 2, fill: "#0f172a" }}
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="resolved"
          name="resolved"
          stroke="#22c55e"
          fill="url(#colorResolved)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, stroke: "#22c55e", strokeWidth: 2, fill: "#0f172a" }}
          connectNulls={false}
        />

        {/* Forecast lines (dashed) */}
        <Area
          type="monotone"
          dataKey="openedForecast"
          name="openedForecast"
          stroke="#f43f5e"
          fill="url(#colorOpenedForecast)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          activeDot={{ r: 4, stroke: "#f43f5e", strokeWidth: 2, fill: "#0f172a" }}
          connectNulls={false}
        />
        <Area
          type="monotone"
          dataKey="resolvedForecast"
          name="resolvedForecast"
          stroke="#22c55e"
          fill="url(#colorResolvedForecast)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          activeDot={{ r: 4, stroke: "#22c55e", strokeWidth: 2, fill: "#0f172a" }}
          connectNulls={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
