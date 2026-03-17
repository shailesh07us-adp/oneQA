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
  const gap = 8;
  
  const uH = 65;
  const iH = 55;
  const eH = 45;
  
  const totalH = uH + iH + eH + (gap * 2);
  const centerX = 160; 
  const slope = 1.0;   

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

  const labelX = 380; 

  return (
    <div className="glass rounded-3xl p-8 border-white/[0.03] bg-gradient-to-br from-indigo-500/[0.02] to-transparent relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
        <svg width="120" height="120" viewBox="0 0 100 100" className="text-indigo-500">
           <path d="M50 10 L90 90 L100 90 L50 0 Z" fill="currentColor" fillOpacity="0.1" />
           <path d="M50 20 L80 80 L90 80 L50 10 Z" fill="currentColor" fillOpacity="0.1" />
        </svg>
      </div>

      <div className="flex flex-col items-center w-full">
        <div className="relative w-full max-w-[460px]">
          <svg viewBox={`0 0 ${width} ${totalH}`} className="w-full h-auto overflow-visible filter drop-shadow-[0_0_20px_rgba(0,0,0,0.6)]">
            <defs>
              <linearGradient id="grad-e2e" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fb7185" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="grad-int" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
              <linearGradient id="grad-unit" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
            </defs>

            {/* E2E Segment */}
            <path
              d={`M ${centerX} ${eStepYTop} 
                 L ${centerX + eWidthBottom} ${eStepYBottom} 
                 L ${centerX - eWidthBottom} ${eStepYBottom} Z`}
              fill="url(#grad-e2e)"
              fillOpacity="0.9"
              className="transition-all duration-700 hover:fill-opacity-100 cursor-help"
            />
            <text x={centerX} y={eStepYBottom - 8} textAnchor="middle" className="text-[12px] font-black fill-white pointer-events-none tracking-tight">
              {Math.round(e2ePerc)}%
            </text>
            <line x1={centerX + eWidthBottom/2} y1={eStepYBottom/2} x2={labelX} y2={eStepYBottom/2} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.4" />
            <text x={labelX + 12} y={eStepYBottom/2 + 4} className="text-[10px] font-black fill-rose-400 uppercase tracking-[0.2em]">
              E2E
            </text>

            {/* Integration Segment */}
            <path
              d={`M ${centerX - iWidthTop} ${iStepYTop} 
                 L ${centerX + iWidthTop} ${iStepYTop} 
                 L ${centerX + iWidthBottom} ${iStepYBottom} 
                 L ${centerX - iWidthBottom} ${iStepYBottom} Z`}
              fill="url(#grad-int)"
              fillOpacity="0.9"
              className="transition-all duration-700 hover:fill-opacity-100 cursor-help"
            />
            <text x={centerX} y={iStepYBottom - 18} textAnchor="middle" className="text-[14px] font-black fill-white pointer-events-none tracking-tight">
              {Math.round(integrationPerc)}%
            </text>
            <line x1={centerX + iWidthBottom/1.2} y1={iStepYTop + iH/2} x2={labelX} y2={iStepYTop + iH/2} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.4" />
            <text x={labelX + 12} y={iStepYTop + iH/2 + 4} className="text-[10px] font-black fill-amber-400 uppercase tracking-[0.15em]">
              INTEGRATION
            </text>

            {/* Unit Segment */}
            <path
              d={`M ${centerX - uWidthTop} ${uStepYTop} 
                 L ${centerX + uWidthTop} ${uStepYTop} 
                 L ${centerX + uWidthBottom} ${uStepYBottom} 
                 L ${centerX - uWidthBottom} ${uStepYBottom} Z`}
              fill="url(#grad-unit)"
              fillOpacity="0.9"
              className="transition-all duration-700 hover:fill-opacity-100 cursor-help"
            />
            <text x={centerX} y={uStepYBottom - 25} textAnchor="middle" className="text-[16px] font-black fill-white pointer-events-none tracking-tight">
              {Math.round(unitPerc)}%
            </text>
            <line x1={centerX + uWidthBottom/1.2} y1={uStepYTop + uH/2} x2={labelX} y2={uStepYTop + uH/2} stroke="#10b981" strokeWidth="1.5" strokeDasharray="3 3" strokeOpacity="0.4" />
            <text x={labelX + 12} y={uStepYTop + uH/2 + 4} className="text-[10px] font-black fill-emerald-400 uppercase tracking-[0.1em]">
              UNIT
            </text>
          </svg>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-8 w-full border-t border-white/[0.05] pt-8">
          <div className="text-center group/item">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-black group-hover/item:text-emerald-400 transition-colors">Unit</p>
            <p className="text-2xl font-black text-white">{unit}</p>
          </div>
          <div className="text-center border-x border-white/[0.05] group/item">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-black group-hover/item:text-amber-400 transition-colors">Integration</p>
            <p className="text-2xl font-black text-white">{integration}</p>
          </div>
          <div className="text-center group/item">
            <p className="text-[10px] text-slate-500 uppercase tracking-widest mb-1.5 font-black group-hover/item:text-rose-400 transition-colors">E2E</p>
            <p className="text-2xl font-black text-white">{e2e}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
