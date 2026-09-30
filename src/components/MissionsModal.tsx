import React from 'react';
import { Mission, LabStationId } from '../types/nuclear';
import { soundManager } from '../audio/soundEffects';

interface MissionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  missions: Mission[];
  onGoToMissionStation: (station: LabStationId) => void;
  totalXp: number;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  isOpen,
  onClose,
  missions,
  onGoToMissionStation,
  totalXp,
}) => {
  if (!isOpen) return null;

  const completedCount = missions.filter((m) => m.completed).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/80 backdrop-blur-md">
      <div className="hud-glass w-full max-w-3xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-cyan-500/30">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-slate-950/90">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎖️</span>
            <div>
              <h2 className="text-base md:text-lg font-bold text-slate-100 font-display">
                NUCLEAR SCIENCE MISSIONS (SMA LAB)
              </h2>
              <p className="text-[11px] text-slate-400">
                Selesaikan 5 level kurikulum fisika inti untuk meraih lencana keahlian
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase font-mono block">Total XP</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">{totalXp} XP</span>
            </div>
            <button
              onClick={() => {
                soundManager.playUiClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="px-5 py-2.5 bg-slate-900/60 border-b border-slate-800 flex items-center gap-3">
          <span className="text-xs text-slate-300 font-mono whitespace-nowrap">
            Kemajuan Misi: {completedCount} / {missions.length}
          </span>
          <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
              style={{ width: `${(completedCount / missions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Missions List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3.5">
          {missions.map((mission) => {
            return (
              <div
                key={mission.id}
                className={`p-4 rounded-xl border transition-all ${
                  mission.completed
                    ? 'bg-emerald-950/30 border-emerald-500/40 shadow-sm'
                    : 'bg-slate-900/70 border-slate-800 hover:border-cyan-500/40'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl p-1.5 rounded-lg bg-slate-950/60 border border-slate-800">
                      {mission.badgeIcon}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          {mission.code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-100 font-display">
                          {mission.title}
                        </h3>
                        {mission.completed && (
                          <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
                            ✓ LULUS
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-400">{mission.subtitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <span className="text-xs font-mono text-amber-400 font-semibold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
                      +{mission.xpReward} XP
                    </span>
                    <button
                      onClick={() => {
                        soundManager.playUiClick();
                        onGoToMissionStation(mission.targetStation);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 rounded-lg text-xs font-semibold text-cyan-200 transition-colors cursor-pointer"
                    >
                      Buka Simulasi →
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">
                  {mission.description}
                </p>

                {/* Sub-tasks */}
                <div className="mt-3 space-y-1.5 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/60">
                  <span className="text-[11px] font-mono text-slate-400 font-semibold block mb-1">
                    Target Capaian Pembelajaran:
                  </span>
                  {mission.tasks.map((task) => (
                    <div key={task.id} className="flex items-center gap-2 text-xs">
                      <span className={task.completed ? 'text-emerald-400 font-bold' : 'text-slate-600'}>
                        {task.completed ? '☑' : '☐'}
                      </span>
                      <span className={task.completed ? 'text-slate-200 line-through' : 'text-slate-300'}>
                        {task.text}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Badge Awarded */}
                <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                  <span>
                    Lencana Penghargaan:{' '}
                    <strong className="text-cyan-300 font-semibold">{mission.badgeName}</strong>
                  </span>
                  <span>{mission.completed ? 'Sudah Dikoleksi ⭐' : 'Belum Terkunci 🔒'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
