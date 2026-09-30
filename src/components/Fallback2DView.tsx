import React, { useEffect, useRef } from 'react';
import { LabStationId, ReactorState } from '../types/nuclear';

interface Fallback2DViewProps {
  station: LabStationId;
  reactorState: ReactorState;
  activeElement: string;
  activeRadiation: string;
  activeShield: string;
}

export const Fallback2DView: React.FC<Fallback2DViewProps> = ({
  station,
  reactorState,
  activeElement,
  activeRadiation,
  activeShield,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;

    const render = () => {
      time += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      // Dark futuristic background
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, w, h);

      // Subtle grid
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.lineWidth = 1;
      const step = 30;
      for (let x = 0; x < w; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      }
      for (let y = 0; y < h; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
      }

      ctx.save();

      if (station === 'atom' || station === 'nucleus') {
        // Draw 2D Bohr Atom Model
        const cx = w / 2;
        const cy = h / 2;

        // Draw Electron Orbits
        const shells = activeElement === 'U' ? [60, 95, 130, 165] : activeElement === 'C' ? [60, 110] : [70];
        shells.forEach((radius, idx) => {
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);

          // Orbiting electrons
          const numElectrons = idx === 0 ? 2 : 4;
          for (let e = 0; e < numElectrons; e++) {
            const angle = time * (1.2 - idx * 0.25) + (e * (Math.PI * 2)) / numElectrons;
            const ex = cx + Math.cos(angle) * radius;
            const ey = cy + Math.sin(angle) * radius;

            ctx.beginPath();
            ctx.arc(ex, ey, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#38bdf8';
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        });

        // Draw Nucleus Cluster
        const numNucleons = activeElement === 'U' ? 36 : activeElement === 'C' ? 12 : 1;
        for (let i = 0; i < numNucleons; i++) {
          const r = 24 * Math.sqrt((i + 1) / numNucleons);
          const theta = i * 2.39996 + Math.sin(time + i) * 0.15; // Golden angle
          const nx = cx + Math.cos(theta) * r;
          const ny = cy + Math.sin(theta) * r;

          ctx.beginPath();
          ctx.arc(nx, ny, 6, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? '#ef4444' : '#64748b'; // Proton vs Neutron
          ctx.fill();
        }

        // Title
        ctx.fillStyle = '#e2e8f0';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`2D ATOM MODEL: [${activeElement}]`, cx, h - 30);
      } else if (station === 'radiation') {
        // Draw Source -> Shield -> Detector
        const sy = h / 2;

        // Source Box
        ctx.fillStyle = '#f59e0b';
        ctx.fillRect(50, sy - 30, 40, 60);
        ctx.fillStyle = '#030712';
        ctx.font = '10px monospace';
        ctx.fillText('SOURCE', 52, sy + 3);

        // Shield
        const shieldX = w / 2;
        ctx.fillStyle =
          activeShield === 'lead'
            ? '#334155'
            : activeShield === 'concrete'
            ? '#78716c'
            : activeShield === 'aluminium'
            ? '#94a3b8'
            : '#e2e8f0';
        ctx.fillRect(shieldX - 15, sy - 70, 30, 140);
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px monospace';
        ctx.fillText(`SHIELD: ${activeShield.toUpperCase()}`, shieldX - 45, sy - 80);

        // Detector
        const detX = w - 90;
        ctx.fillStyle = '#0284c7';
        ctx.fillRect(detX, sy - 35, 45, 70);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('DETECTOR', detX + 2, sy + 3);

        // Streaming particles
        const penetrated =
          activeShield === 'none' ||
          (activeRadiation === 'beta' && activeShield === 'paper') ||
          (activeRadiation === 'gamma' && ['paper', 'aluminium'].includes(activeShield));

        for (let p = 0; p < 8; p++) {
          const progress = ((time * 150 + p * 35) % (w - 180)) + 90;
          if (!penetrated && progress > shieldX) continue;

          ctx.beginPath();
          ctx.arc(progress, sy + Math.sin(progress * 0.1) * 15, activeRadiation === 'alpha' ? 6 : 3, 0, Math.PI * 2);
          ctx.fillStyle =
            activeRadiation === 'alpha' ? '#eab308' : activeRadiation === 'beta' ? '#38bdf8' : '#c084fc';
          ctx.fill();
        }
      } else {
        // Reactor & General Fallback schematic
        const cx = w / 2;
        const cy = h / 2;

        // Vessel outline
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 3;
        ctx.strokeRect(cx - 70, cy - 100, 140, 200);

        // Fuel Rods
        ctx.fillStyle = '#a855f7';
        for (let f = 0; f < 5; f++) {
          ctx.fillRect(cx - 50 + f * 22, cy - 40, 12, 120);
        }

        // Control Rods moving down based on insertion
        const rodY = cy - 80 + (reactorState.controlRodInsertion / 100) * 80;
        ctx.fillStyle = '#ef4444';
        for (let f = 0; f < 4; f++) {
          ctx.fillRect(cx - 39 + f * 22, rodY, 6, 80);
        }

        ctx.fillStyle = '#f1f5f9';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`2D REAKTOR SCHEMATIC - CONTROL RODS: ${reactorState.controlRodInsertion.toFixed(0)}%`, cx, 40);
        ctx.fillText(`STATUS: ${reactorState.status} | DAYA: ${reactorState.electricOutputMWe.toFixed(0)} MWe`, cx, 60);
      }

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [station, reactorState, activeElement, activeRadiation, activeShield]);

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative bg-slate-950">
      <div className="absolute top-16 left-6 z-10 px-3 py-1 bg-amber-950/80 border border-amber-500/40 text-amber-300 rounded text-xs font-mono">
        Mode Grafis 2D Edukatif Aktif
      </div>
      <canvas
        ref={canvasRef}
        width={960}
        height={600}
        className="max-w-full max-h-[80vh] border border-cyan-500/20 rounded-xl"
      />
    </div>
  );
};
