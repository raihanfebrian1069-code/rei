import React from 'react';

interface DecayGraphProps {
  initialAtoms: number;
  remainingAtoms: number;
  elapsedTime: number;
  halfLife: number;
  isotopeName: string;
  realHalfLife: string;
}

export const DecayGraph: React.FC<DecayGraphProps> = ({
  initialAtoms,
  remainingAtoms,
  elapsedTime,
  halfLife,
  isotopeName,
  realHalfLife,
}) => {
  const width = 280;
  const height = 150;
  const padding = { top: 15, right: 15, bottom: 25, left: 35 };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // Max simulation time window: 4 half-lives
  const maxTime = Math.max(elapsedTime, halfLife * 3.5);

  // Generate theoretical curve points
  const points: [number, number][] = [];
  const steps = 40;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * maxTime;
    const n = initialAtoms * Math.pow(0.5, t / halfLife);
    const x = padding.left + (t / maxTime) * plotWidth;
    const y = padding.top + plotHeight - (n / initialAtoms) * plotHeight;
    points.push([x, y]);
  }

  const pathD = points.reduce((acc, [x, y], idx) => {
    return `${acc} ${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  }, '');

  // Current point
  const currentX = padding.left + Math.min(1, elapsedTime / maxTime) * plotWidth;
  const currentY = padding.top + plotHeight - (remainingAtoms / initialAtoms) * plotHeight;

  // Half-life markers
  const tHalfX = padding.left + (halfLife / maxTime) * plotWidth;
  const tHalf2X = padding.left + ((halfLife * 2) / maxTime) * plotWidth;

  const remainingPercent = ((remainingAtoms / initialAtoms) * 100).toFixed(1);

  return (
    <div className="hud-glass p-3 rounded-xl flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs border-b border-cyan-500/20 pb-1.5">
        <span className="font-display font-semibold text-cyan-300">
          Kurva Peluruhan {isotopeName}
        </span>
        <span className="font-mono text-slate-400 text-[11px]">
          T½ = {realHalfLife}
        </span>
      </div>

      <svg width={width} height={height} className="overflow-visible select-none">
        {/* Background Grid */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + plotHeight}
          stroke="#334155"
          strokeWidth="1"
        />
        <line
          x1={padding.left}
          y1={padding.top + plotHeight}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight}
          stroke="#334155"
          strokeWidth="1"
        />

        {/* 50% line */}
        <line
          x1={padding.left}
          y1={padding.top + plotHeight * 0.5}
          x2={padding.left + plotWidth}
          y2={padding.top + plotHeight * 0.5}
          stroke="#475569"
          strokeDasharray="3 3"
          strokeWidth="1"
        />
        <text
          x={padding.left - 5}
          y={padding.top + plotHeight * 0.5 + 3}
          fill="#94a3b8"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="end"
        >
          50%
        </text>

        {/* 100% label */}
        <text
          x={padding.left - 5}
          y={padding.top + 4}
          fill="#94a3b8"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="end"
        >
          N₀
        </text>

        {/* T1/2 vertical guide */}
        {tHalfX <= padding.left + plotWidth && (
          <>
            <line
              x1={tHalfX}
              y1={padding.top}
              x2={tHalfX}
              y2={padding.top + plotHeight}
              stroke="#06b6d4"
              strokeDasharray="2 2"
              strokeWidth="1"
              strokeOpacity="0.5"
            />
            <text
              x={tHalfX}
              y={padding.top + plotHeight + 12}
              fill="#06b6d4"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              1 T½
            </text>
          </>
        )}

        {/* 2*T1/2 vertical guide */}
        {tHalf2X <= padding.left + plotWidth && (
          <>
            <line
              x1={tHalf2X}
              y1={padding.top}
              x2={tHalf2X}
              y2={padding.top + plotHeight}
              stroke="#06b6d4"
              strokeDasharray="2 2"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            <text
              x={tHalf2X}
              y={padding.top + plotHeight + 12}
              fill="#06b6d4"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="middle"
            >
              2 T½
            </text>
          </>
        )}

        {/* Theoretical Exponential Decay Curve */}
        <path
          d={pathD}
          fill="none"
          stroke="#06b6d4"
          strokeWidth="2"
          strokeLinecap="round"
        />

        {/* Current State Marker */}
        <circle
          cx={currentX}
          cy={currentY}
          r="4.5"
          fill="#f59e0b"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>

      <div className="flex items-center justify-between text-[11px] font-mono bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
        <span className="text-slate-400">
          Sisa: <strong className="text-amber-400 font-semibold">{remainingAtoms}</strong> / {initialAtoms}
        </span>
        <span className="text-cyan-300 font-semibold">
          {remainingPercent}% N₀
        </span>
      </div>
    </div>
  );
};
