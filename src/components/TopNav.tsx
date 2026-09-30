import React from 'react';
import { LabStationId } from '../types/nuclear';
import { KirLogo } from './KirLogo';
import { soundManager } from '../audio/soundEffects';

interface TopNavProps {
  currentStation: LabStationId;
  onSelectStation: (station: LabStationId) => void;
  onResetCamera: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  xp: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentStation,
  onSelectStation,
  onResetCamera,
  isMuted,
  onToggleMute,
  xp,
}) => {
  const navItems: { id: LabStationId; label: string }[] = [
    { id: 'lab', label: 'Main Lab' },
    { id: 'atom', label: 'Atom 3D' },
    { id: 'radiation', label: 'Radiasi' },
    { id: 'reactor', label: 'Reaktor' },
    { id: 'chain_reaction', label: 'Chain Reaction' },
    { id: 'decay', label: 'Peluruhan' },
    { id: 'missions', label: 'Misi Siswa' },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 md:px-6 py-2.5 bg-slate-950/85 backdrop-blur-md border-b border-cyan-500/20 select-none">
      {/* Zone 1: Brand Title with KIR Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => {
            onSelectStation('lab');
            soundManager.playUiClick();
          }}
          className="flex items-center gap-2 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 rounded-md"
        >
          <KirLogo size={36} />
          <div className="flex flex-col">
            <span className="text-base md:text-lg font-bold tracking-tight text-slate-100 font-display flex items-center gap-1.5">
              NUCLEA<span className="text-cyan-400">3D</span>
            </span>
            <span className="text-[10px] text-slate-400 tracking-wide hidden sm:block">
              KIR SMA KP BALEENDAH
            </span>
          </div>
        </button>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden lg:flex items-center gap-5 text-xs font-medium text-slate-300">
        {navItems.map((item) => {
          const isActive = currentStation === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectStation(item.id);
                soundManager.playUiClick();
              }}
              className={`transition-colors pb-0.5 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'text-cyan-400 font-semibold border-b-2 border-cyan-400'
                  : 'hover:text-slate-100'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: Primary Actions (Mute, Reset Camera, XP) */}
      <div className="flex items-center gap-2.5">
        {/* XP Counter */}
        <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900/90 border border-cyan-500/30 text-xs font-mono">
          <span className="text-amber-400 text-xs">⚡</span>
          <span className="text-slate-400 text-[11px]">XP:</span>
          <span className="text-cyan-300 font-bold">{xp}</span>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Aktifkan Suara' : 'Matikan Suara'}
          className={`p-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1 cursor-pointer ${
            isMuted
              ? 'bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50'
          }`}
        >
          <span>{isMuted ? '🔇' : '🔊'}</span>
          <span className="hidden md:inline text-[11px]">{isMuted ? 'Mute' : 'Audio On'}</span>
        </button>

        {/* Reset Camera View */}
        <button
          onClick={() => {
            onResetCamera();
            soundManager.playUiClick();
          }}
          title="Reset Sudut Pandang Kamera 3D"
          className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
        >
          <span className="text-xs">⟲</span>
          <span className="hidden sm:inline text-[11px]">Reset Kamera</span>
        </button>
      </div>
    </header>
  );
};
