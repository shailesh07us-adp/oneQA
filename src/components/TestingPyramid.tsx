"use client";

interface TestingPyramidProps {
  unit: number;
  integration: number;
  e2e: number;
}

export function TestingPyramid({ unit, integration, e2e }: TestingPyramidProps) {
  const total = unit + integration + e2e;
  const unitPerc = total > 0 ? (unit / total) * 100 : 0;
  const integrationPerc = total > 0 ? (integration / total) * 100 : 0;
  const e2ePerc = total > 0 ? (e2e / total) * 100 : 0;

  // Pyramid dimensions
  const width = 520;
  const height = 200;
  const gap = 6;
  
  const uH = 65;
  const iH = 55;
  const eH = 45;
  
  const totalH = uH + iH + eH + (gap * 2);
  const centerX = 160; // Fixed center to have more space on right
  const slope = 1.0;   // Consistent 45-degree-ish slope

  // Y levels
  const eStepYTop = 0;
  const eStepYBottom = eH;
  const eWidthBottom = eStepYBottom * slope;

  const iStepYTop = eH + gap;
  const iStepYBottom = eH + gap + iH;
  const iWidthTop = iStepYTop * slope;
  const iWidthBottom = iStepYBottom * slope;

  const uStepYTop = eH + gap + iH + gap;
  const uStepYBottom = eH + gap + iH + gap + uH;
  const uWidthTop = uStepYTop * slope;
  const uWidthBottom = uStepYBottom * slope;

  const labelX = 360; // Well outside the widest base (160 + 177 = 337)

  return (
    <div className="flex flex-col items-center w-full py-4">
      <div className="relative w-full max-w-[420px]">
        <svg viewBox={`0 0 ${width} ${totalH}`} className="w-full h-auto overflow-visible filter drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]">
          {/* E2E Segment */}
          <path
            d={`M ${centerX} ${eStepYTop} 
               L ${centerX + eWidthBottom} ${eStepYBottom} 
               L ${centerX - eWidthBottom} ${eStepYBottom} Z`}
            fill="#f43f5e"
            fillOpacity="0.85"
            stroke="#f43f5e"
            strokeWidth="1"
            className="transition-all duration-700"
          />
          {/* E2E Percent (Inside) */}
          <text x={centerX} y={eStepYBottom - 8} textAnchor="middle" className="text-[12px] font-black fill-white pointer-events-none tracking-tight">
            {Math.round(e2ePerc)}%
          </text>
          {/* E2E Label & Line (Outside) */}
          <line x1={centerX + eWidthBottom/2} y1={eStepYBottom/2} x2={labelX} y2={eStepYBottom/2} stroke="#f43f5e" strokeWidth="1" strokeDasharray="2 2" />
          <text x={labelX + 8} y={eStepYBottom/2 + 4} className="text-[11px] font-bold fill-rose-400 uppercase tracking-wider">
            E2E
          </text>

          {/* Integration Segment */}
          <path
            d={`M ${centerX - iWidthTop} ${iStepYTop} 
               L ${centerX + iWidthTop} ${iStepYTop} 
               L ${centerX + iWidthBottom} ${iStepYBottom} 
               L ${centerX - iWidthBottom} ${iStepYBottom} Z`}
            fill="#f59e0b"
            fillOpacity="0.85"
            stroke="#f59e0b"
            strokeWidth="1"
            className="transition-all duration-700"
          />
          {/* INT Percent (Inside) */}
          <text x={centerX} y={iStepYBottom - 18} textAnchor="middle" className="text-[14px] font-black fill-white pointer-events-none tracking-tight">
            {Math.round(integrationPerc)}%
          </text>
          {/* INT Label & Line (Outside) */}
          <line x1={centerX + iWidthBottom/1.2} y1={iStepYTop + iH/2} x2={labelX} y2={iStepYTop + iH/2} stroke="#f59e0b" strokeWidth="1" strokeDasharray="2 2" />
          <text x={labelX + 8} y={iStepYTop + iH/2 + 4} className="text-[11px] font-bold fill-amber-400 uppercase tracking-wider">
            INTEGRATION
          </text>

          {/* Unit Segment */}
          <path
            d={`M ${centerX - uWidthTop} ${uStepYTop} 
               L ${centerX + uWidthTop} ${uStepYTop} 
               L ${centerX + uWidthBottom} ${uStepYBottom} 
               L ${centerX - uWidthBottom} ${uStepYBottom} Z`}
            fill="#10b981"
            fillOpacity="0.85"
            stroke="#10b981"
            strokeWidth="1"
            className="transition-all duration-700"
          />
          {/* Unit Percent (Inside) */}
          <text x={centerX} y={uStepYBottom - 25} textAnchor="middle" className="text-[16px] font-black fill-white pointer-events-none tracking-tight">
            {Math.round(unitPerc)}%
          </text>
          {/* Unit Label & Line (Outside) */}
          <line x1={centerX + uWidthBottom/1.2} y1={uStepYTop + uH/2} x2={labelX} y2={uStepYTop + uH/2} stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" />
          <text x={labelX + 8} y={uStepYTop + uH/2 + 4} className="text-[11px] font-bold fill-emerald-400 uppercase tracking-wider">
            UNIT
          </text>
        </svg>
      </div>

      <div className="mt-10 grid grid-cols-3 gap-6 w-full border-t border-slate-800/40 pt-6">
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Unit</p>
          <p className="text-xl font-black text-emerald-400">{unit}</p>
        </div>
        <div className="text-center border-x border-slate-800/60">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">Integration</p>
          <p className="text-xl font-black text-amber-400">{integration}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 font-bold">E2E</p>
          <p className="text-xl font-black text-rose-400">{e2e}</p>
        </div>
      </div>
    </div>
  );
}
