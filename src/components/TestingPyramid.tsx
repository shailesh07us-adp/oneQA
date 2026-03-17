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
  const width = 440;
  const height = 200;
  const gap = 6; // Separation between layers
  
  // Weights for heights (Unit should be largest)
  const uH = 65;
  const iH = 55;
  const eH = 45;
  
  const totalH = uH + iH + eH + (gap * 2);
  const centerX = width / 2;
  const slope = (width / 2) / totalH;

  // Calculate points for each layer ensuring consistent slope
  // Layer 1 (E2E - Top)
  const eStepYTop = 0;
  const eStepYBottom = eH;
  const eWidthBottom = eStepYBottom * slope;

  // Layer 2 (INT - Middle)
  const iStepYTop = eH + gap;
  const iStepYBottom = eH + gap + iH;
  const iWidthTop = iStepYTop * slope;
  const iWidthBottom = iStepYBottom * slope;

  // Layer 3 (UNIT - Bottom)
  const uStepYTop = eH + gap + iH + gap;
  const uStepYBottom = eH + gap + iH + gap + uH;
  const uWidthTop = uStepYTop * slope;
  const uWidthBottom = uStepYBottom * slope;

  return (
    <div className="flex flex-col items-center w-full py-4">
      <div className="relative w-full max-w-[400px]">
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
          <text x={centerX} y={eStepYBottom - 12} textAnchor="middle" className="text-[12px] font-black fill-white pointer-events-none uppercase tracking-tighter">
            E2E ({Math.round(e2ePerc)}%)
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
          <text x={centerX} y={iStepYBottom - 15} textAnchor="middle" className="text-[12px] font-black fill-white pointer-events-none uppercase tracking-tighter">
            Integration ({Math.round(integrationPerc)}%)
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
          <text x={centerX} y={uStepYBottom - 20} textAnchor="middle" className="text-[14px] font-black fill-white pointer-events-none uppercase tracking-tighter">
            Unit Tests ({Math.round(unitPerc)}%)
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
