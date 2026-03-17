"use client";

interface ExecutiveGaugeProps {
  score: number;
  label: string;
  color: string;
  title: string;
  description: string;
  prefix?: string;
  suffix?: string;
  invertColor?: boolean; // If true, lower is better (e.g. Risk)
}

export function ExecutiveGauge({
  score,
  label,
  color,
  title,
  description,
  prefix = "",
  suffix = "%",
  invertColor = false,
}: ExecutiveGaugeProps) {
  // SVG arc gauge
  const radius = 45;
  const circumference = Math.PI * radius; // half circle
  const progress = Math.min((score / 100) * circumference, circumference);

  return (
    <div className="glass rounded-xl p-4 flex flex-col items-center">
      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-3 self-start">
        {title}
      </p>
      
      {/* Gauge */}
      <div className="relative w-32 h-20 mb-2">
        <svg className="w-32 h-20" viewBox="0 0 110 65">
          {/* Background arc */}
          <path
            d="M 10 55 A 45 45 0 0 1 100 55"
            fill="none"
            stroke="#1e293b"
            strokeWidth="8"
            strokeLinecap="round"
          />
          {/* Progress arc */}
          <path
            d="M 10 55 A 45 45 0 0 1 100 55"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${progress} ${circumference}`}
            style={{
              transition: "stroke-dasharray 1s ease-out",
              filter: `drop-shadow(0 0 6px ${color}30)`,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-xl font-bold text-white">
            {prefix}{score}{suffix}
          </span>
        </div>
      </div>

      <div className="text-center">
        <div className="text-[11px] font-bold mb-0.5" style={{ color }}>
          {label}
        </div>
        <p className="text-[10px] text-slate-500">{description}</p>
      </div>
    </div>
  );
}
