import React from 'react';

interface KirLogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export const KirLogo: React.FC<KirLogoProps> = ({
  className = '',
  size = 48,
  showText = false,
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 220"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md transition-transform hover:scale-105 duration-200"
      >
        {/* Hexagonal Shield Background */}
        <path
          d="M 100 10 L 175 48 L 175 152 L 100 195 L 25 152 L 25 48 Z"
          fill="#0c1d38"
          stroke="#f8fafc"
          strokeWidth="9"
          strokeLinejoin="round"
        />

        {/* Atom Orbits & Center Lightbulb */}
        <g transform="translate(100, 68)">
          {/* Orbital ellipse 1 */}
          <ellipse
            cx="0"
            cy="0"
            rx="34"
            ry="14"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="3.2"
            transform="rotate(-28)"
          />
          {/* Orbital ellipse 2 */}
          <ellipse
            cx="0"
            cy="0"
            rx="34"
            ry="14"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="3.2"
            transform="rotate(28)"
          />
          {/* Orbital ellipse 3 (Vertical) */}
          <ellipse
            cx="0"
            cy="0"
            rx="14"
            ry="36"
            fill="none"
            stroke="#f8fafc"
            strokeWidth="2.8"
          />

          {/* Yellow Lightbulb */}
          {/* Bulb glow circle / body */}
          <path
            d="M -11 -4 C -16 -12 -8 -22 0 -22 C 8 -22 16 -12 11 -4 C 8 2 6 6 6 10 L -6 10 C -6 6 -8 2 -11 -4 Z"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="2"
          />
          {/* Bulb base */}
          <rect x="-5" y="10" width="10" height="4" rx="1.5" fill="#f8fafc" />
          <rect x="-4" y="15" width="8" height="3" rx="1" fill="#cbd5e1" />
        </g>

        {/* Left Green Leaves / Plant */}
        <g transform="translate(42, 108)">
          {/* Stem */}
          <path
            d="M 12 36 C 8 24 6 10 2 0"
            stroke="#16a34a"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Top Leaf */}
          <path
            d="M 2 0 C 14 -12 24 -10 22 2 C 16 8 8 6 2 0 Z"
            fill="#22c55e"
          />
          {/* Middle Leaf */}
          <path
            d="M 5 15 C -8 10 -12 22 -2 25 C 4 23 8 18 5 15 Z"
            fill="#16a34a"
          />
          {/* Bottom Leaf */}
          <path
            d="M 9 28 C 22 24 24 38 12 40 C 8 36 9 30 9 28 Z"
            fill="#22c55e"
          />
        </g>

        {/* Right Green Gear & Yellow Bar Chart */}
        <g transform="translate(142, 92)">
          {/* Gear (Cog) */}
          <g transform="translate(0, 0)">
            <circle cx="0" cy="0" r="14" fill="#16a34a" />
            <circle cx="0" cy="0" r="6" fill="#0c1d38" />
            {/* Cog teeth */}
            <rect x="-3" y="-18" width="6" height="4" rx="1" fill="#16a34a" />
            <rect x="-3" y="14" width="6" height="4" rx="1" fill="#16a34a" />
            <rect x="-18" y="-3" width="4" height="6" rx="1" fill="#16a34a" />
            <rect x="14" y="-3" width="4" height="6" rx="1" fill="#16a34a" />
            <rect x="-13" y="-13" width="5" height="5" rx="1" fill="#16a34a" transform="rotate(45)" />
            <rect x="8" y="8" width="5" height="5" rx="1" fill="#16a34a" transform="rotate(45)" />
            <rect x="-13" y="8" width="5" height="5" rx="1" fill="#16a34a" transform="rotate(-45)" />
            <rect x="8" y="-13" width="5" height="5" rx="1" fill="#16a34a" transform="rotate(-45)" />
          </g>

          {/* Bar Chart */}
          <g transform="translate(-10, 24)">
            <rect x="0" y="14" width="5" height="12" rx="1" fill="#eab308" />
            <rect x="7" y="7" width="5" height="19" rx="1" fill="#eab308" />
            <rect x="14" y="0" width="5" height="26" rx="1" fill="#eab308" />
          </g>
        </g>

        {/* Center Open Book */}
        <g transform="translate(100, 126)">
          {/* Book Left Page */}
          <path
            d="M -2 14 C -14 10 -30 11 -35 4 L -35 -14 C -30 -9 -14 -10 -2 -6 Z"
            fill="#f8fafc"
            stroke="#0c1d38"
            strokeWidth="1.5"
          />
          {/* Book Right Page */}
          <path
            d="M 2 14 C 14 10 30 11 35 4 L 35 -14 C 30 -9 14 -10 2 -6 Z"
            fill="#f8fafc"
            stroke="#0c1d38"
            strokeWidth="1.5"
          />
          {/* Book Spine */}
          <path d="M 0 -6 L 0 16" stroke="#cbd5e1" strokeWidth="2.5" />
        </g>

        {/* KIR Typography */}
        <text
          x="100"
          y="178"
          fill="#f8fafc"
          fontFamily="'Chakra Petch', 'Arial Black', sans-serif"
          fontWeight="800"
          fontSize="36"
          letterSpacing="2"
          textAnchor="middle"
        >
          KIR
        </text>
      </svg>

      {showText && (
        <div className="flex flex-col leading-tight">
          <span className="font-display text-sm font-bold text-slate-100 tracking-wide">
            KIR SMA KP
          </span>
          <span className="text-[11px] text-cyan-400 font-medium">
            Baleendah
          </span>
        </div>
      )}
    </div>
  );
};
