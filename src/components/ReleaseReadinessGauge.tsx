"use client";

interface ReleaseReadinessProps {
  score: number;
  label: string;
  color: string;
  horizontal?: boolean; // New prop for wide layout
  breakdown: {
    category: string;
    score: number;
    weight: number;
    weighted: number;
    insight: string;
  }[];
}

export function ReleaseReadinessGauge({ score, label, color, breakdown, horizontal = false }: ReleaseReadinessProps) {
  // SVG arc gauge
  const radius = 60;
  const circumference = Math.PI * radius; // half circle
  const progress = (score / 100) * circumference;

  const content = (
    <>
      {/* Gauge and Label Group */}
      <div className={`flex flex-col items-center ${horizontal ? "pr-8 border-r border-slate-800/60" : ""}`}>
        <div className="relative w-40 h-24 mb-4">
          <svg className="w-40 h-24" viewBox="0 0 140 80">
            {/* Background arc */}
            <path
              d="M 10 70 A 60 60 0 0 1 130 70"
              fill="none"
              stroke="#1e293b"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <path
              d="M 10 70 A 60 60 0 0 1 130 70"
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={`${progress} ${circumference}`}
              style={{
                transition: "stroke-dasharray 1s ease-out",
                filter: `drop-shadow(0 0 8px ${color}40)`,
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
            <span className="text-3xl font-black text-white">{score}</span>
          </div>
        </div>

        <div
          className="text-sm font-bold mb-1"
          style={{ color }}
        >
          {label}
        </div>
        <p className="text-[10px] text-slate-500 mb-4">Release Readiness Score</p>
      </div>

      {/* Breakdown Group */}
      {breakdown.length > 0 && (
        <div className={`flex-1 min-w-0 ${horizontal ? "pl-8" : "w-full space-y-2"}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <div className="space-y-2">
              {breakdown.map((b) => (
                <div key={b.category} className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-slate-400 font-medium">{b.category}</span>
                    <span className="text-[10px] font-bold text-slate-300">{Math.round(b.score)}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${b.score}%`,
                        backgroundColor:
                          b.score >= 80 ? "#22c55e" : b.score >= 55 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="pt-0 border-l border-slate-800/40 pl-6 space-y-2 hidden md:block">
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Health Insights</p>
              {breakdown.map((b) => (
                <p key={b.category} className="text-[10px] text-slate-500 leading-relaxed">
                  <span className="text-slate-400 font-medium">{b.category}:</span>{" "}
                  {b.insight}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className={`flex ${horizontal ? "flex-row items-center justify-between w-full" : "flex-col items-center"}`}>
      {content}
    </div>
  );
}
