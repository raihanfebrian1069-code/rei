import React from 'react';
import {
  LabStationId,
  ParticleInfo,
  ReactorComponentData,
  ReactorState,
  RadiationType,
  ShieldMaterial,
  RadiationScenario,
} from '../types/nuclear';
import {
  ATOM_ELEMENTS,
  RADIATION_TYPES,
  SHIELD_MATERIALS,
  REACTOR_COMPONENTS,
  ISOTOPES_DECAY_DATA,
  SUBATOMIC_PARTICLES,
} from '../data/elementsData';
import { ReactorControlsHud } from './ReactorControlsHud';
import { DecayGraph } from './DecayGraph';
import { RadiationScenarioCustomizer } from './RadiationScenarioCustomizer';
import { soundManager } from '../audio/soundEffects';

interface HudOverlayProps {
  station: LabStationId;
  onSelectStation: (st: LabStationId) => void;
  // Atom station
  activeElementId: string;
  onSelectElement: (id: string) => void;
  selectedParticle: ParticleInfo | null;
  onCloseParticleModal: () => void;
  // Radiation station
  activeRadiationType: RadiationType;
  onSelectRadiationType: (r: RadiationType) => void;
  activeShieldMaterial: ShieldMaterial;
  onSelectShieldMaterial: (s: ShieldMaterial) => void;
  selectedShields: ShieldMaterial[];
  onToggleShield: (s: ShieldMaterial) => void;
  simulatorDistanceCm: number;
  onChangeSimulatorDistance: (d: number) => void;
  onApplyScenario: (sc: RadiationScenario) => void;
  // Detector station
  detectorCpm: number;
  detectorDistanceCm: number;
  detectorSampleName: string;
  onMoveProbeToSample: (sampleId: string) => void;
  // Reactor station
  reactorState: ReactorState;
  onControlRodChange: (val: number) => void;
  selectedReactorComponent: ReactorComponentData | null;
  onCloseReactorComponentModal: () => void;
  // Chain reaction station
  chainReactionRunning: boolean;
  chainReactionScore: number;
  chainReactionFissions: number;
  onStartChainReaction: () => void;
  onResetChainReaction: () => void;
  // Decay station
  decayElapsedTime: number;
  decayIsotopeId: string;
  onSelectDecayIsotope: (id: string) => void;
  decayIsPlaying: boolean;
  onToggleDecayPlay: () => void;
  onResetDecay: () => void;
  decayRemainingAtoms: number;
  // Modals
  onOpenPeriodicModal: () => void;
  onOpenMissionsModal: () => void;
  xp: number;
}

export const HudOverlay: React.FC<HudOverlayProps> = ({
  station,
  onSelectStation,
  activeElementId,
  onSelectElement,
  selectedParticle,
  onCloseParticleModal,
  activeRadiationType,
  onSelectRadiationType,
  activeShieldMaterial,
  onSelectShieldMaterial,
  selectedShields,
  onToggleShield,
  simulatorDistanceCm,
  onChangeSimulatorDistance,
  onApplyScenario,
  detectorCpm,
  detectorDistanceCm,
  detectorSampleName,
  onMoveProbeToSample,
  reactorState,
  onControlRodChange,
  selectedReactorComponent,
  onCloseReactorComponentModal,
  chainReactionRunning,
  chainReactionScore,
  chainReactionFissions,
  onStartChainReaction,
  onResetChainReaction,
  decayElapsedTime,
  decayIsotopeId,
  onSelectDecayIsotope,
  decayIsPlaying,
  onToggleDecayPlay,
  onResetDecay,
  decayRemainingAtoms,
  onOpenPeriodicModal,
  onOpenMissionsModal,
  xp,
}) => {
  const currentElement =
    ATOM_ELEMENTS.find((e) => e.id === activeElementId) || ATOM_ELEMENTS[0];
  const currentRadInfo = RADIATION_TYPES[activeRadiationType];
  const currentShieldInfo = SHIELD_MATERIALS[activeShieldMaterial];
  const currentDecayIso =
    ISOTOPES_DECAY_DATA.find((i) => i.id === decayIsotopeId) || ISOTOPES_DECAY_DATA[0];

  // Calculate radiation transmission bar
  const transmissionPercent =
    currentRadInfo.attenuationByShield[
      activeShieldMaterial as keyof typeof currentRadInfo.attenuationByShield
    ] ?? 100;
  const blocksCount = Math.round((transmissionPercent / 100) * 10);
  const barText = '█'.repeat(blocksCount) + '░'.repeat(10 - blocksCount);

  return (
    <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden flex flex-col justify-between pt-14 pb-3 px-3 md:px-6">
      {/* TOP FLOATING STATUS BAR & STATION TITLE */}
      <div className="flex items-start justify-between gap-3">
        {/* Left Badge: Current Station Breadcrumb */}
        <div className="pointer-events-auto hud-glass px-3.5 py-2 rounded-xl flex items-center gap-3">
          <div className="flex flex-col">
            <span className="text-[10px] text-cyan-400 font-mono tracking-wider uppercase font-semibold">
              Virtual Nuclear Lab
            </span>
            <span className="text-sm font-bold font-display text-slate-100 uppercase tracking-wide">
              {station === 'lab' && 'Main Laboratory Overview'}
              {station === 'atom' && '3D Atom Explorer'}
              {station === 'nucleus' && 'Enter The Nucleus (Deep Dive)'}
              {station === 'radiation' && 'Radiation & Shielding Simulator'}
              {station === 'detector' && '3D Geiger-Müller Detector'}
              {station === 'reactor' && '3D Nuclear Reactor (Cutaway)'}
              {station === 'flow' && 'Reactor Thermodynamic Flow'}
              {station === 'chain_reaction' && '3D Chain Reaction Mini-Game'}
              {station === 'decay' && 'Radioactive Decay Lab (Half-Life)'}
            </span>
          </div>
          {station !== 'lab' && (
            <button
              onClick={() => {
                onSelectStation('lab');
                soundManager.playUiClick();
              }}
              className="text-xs px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition-colors"
            >
              ← Kembali ke Lab
            </button>
          )}
        </div>

        {/* Right Action Buttons: Missions & Periodic Table */}
        <div className="pointer-events-auto flex items-center gap-2">
          <button
            onClick={() => {
              onOpenMissionsModal();
              soundManager.playUiClick();
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-300 hover:text-amber-200 hover:bg-slate-900/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>🎖️</span>
            <span className="hidden sm:inline">Misi Siswa</span>
            <span className="font-mono text-cyan-400 font-bold ml-1">({xp} XP)</span>
          </button>

          <button
            onClick={() => {
              onOpenPeriodicModal();
              soundManager.playUiClick();
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-semibold text-cyan-300 hover:text-cyan-200 hover:bg-slate-900/90 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <span>📊</span>
            <span className="hidden sm:inline">Tabel Isotop</span>
          </button>
        </div>
      </div>

      {/* CENTER HUD: STATION-SPECIFIC OVERLAYS */}
      <div className="flex-1 flex items-center justify-between pointer-events-none my-2">
        {/* ================= STATION: LAB OVERVIEW ================= */}
        {station === 'lab' && (
          <div className="pointer-events-auto w-full max-w-lg mx-auto hud-glass p-5 rounded-2xl flex flex-col gap-4 text-center shadow-2xl">
            <div className="flex flex-col items-center">
              <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest">
                KIR SMA KP BALEENDAH
              </span>
              <h1 className="text-xl md:text-2xl font-bold font-display text-slate-100 mt-0.5">
                VIRTUAL NUCLEAR SCIENCE LAB
              </h1>
              <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                Jelajahi struktur atom, karakteristik radiasi (α, β, γ), model reaktor nuklir,
                dan waktu paruh dalam laboratorium 3D interaktif.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-left pt-1">
              <button
                onClick={() => {
                  onSelectStation('atom');
                  soundManager.playUiClick();
                }}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="text-lg">⚛️</div>
                <div className="text-xs font-bold text-slate-100 font-display mt-0.5">Atom Explorer</div>
                <div className="text-[10px] text-slate-400">Proton, Neutron & Elektron</div>
              </button>

              <button
                onClick={() => {
                  onSelectStation('radiation');
                  soundManager.playUiClick();
                }}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="text-lg">🛡️</div>
                <div className="text-xs font-bold text-slate-100 font-display mt-0.5">Simulasi Radiasi</div>
                <div className="text-[10px] text-slate-400">Alfa, Beta & Gamma</div>
              </button>

              <button
                onClick={() => {
                  onSelectStation('reactor');
                  soundManager.playUiClick();
                }}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="text-lg">⚡</div>
                <div className="text-xs font-bold text-slate-100 font-display mt-0.5">Reaktor Nuklir</div>
                <div className="text-[10px] text-slate-400">Cutaway & Batang Kendali</div>
              </button>

              <button
                onClick={() => {
                  onSelectStation('chain_reaction');
                  soundManager.playUiClick();
                }}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="text-lg">💥</div>
                <div className="text-xs font-bold text-slate-100 font-display mt-0.5">Chain Reaction</div>
                <div className="text-[10px] text-slate-400">Game Fisi Berantai U-235</div>
              </button>

              <button
                onClick={() => {
                  onSelectStation('decay');
                  soundManager.playUiClick();
                }}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="text-lg">⏳</div>
                <div className="text-xs font-bold text-slate-100 font-display mt-0.5">Peluruhan Waktu Paruh</div>
                <div className="text-[10px] text-slate-400">Kurva C-14, I-131, Cs-137</div>
              </button>

              <button
                onClick={() => {
                  onSelectStation('detector');
                  soundManager.playUiClick();
                }}
                className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-cyan-950/60 border border-slate-800 hover:border-cyan-500/50 transition-all cursor-pointer"
              >
                <div className="text-lg">📻</div>
                <div className="text-xs font-bold text-slate-100 font-display mt-0.5">Detektor Geiger</div>
                <div className="text-[10px] text-slate-400">Pengujian Sampel Riil</div>
              </button>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-cyan-500/20 text-[11px] font-mono text-slate-400">
              <span>Radiasi Latar: 0.12 μSv/h</span>
              <span className="text-cyan-300">Gunakan mouse/touch untuk memutar 3D</span>
            </div>
          </div>
        )}

        {/* ================= STATION: ATOM EXPLORER ================= */}
        {station === 'atom' && (
          <div className="pointer-events-auto flex flex-col gap-3 max-w-xs">
            <div className="hud-glass p-3 rounded-xl flex flex-col gap-2.5">
              <span className="text-xs font-bold font-display text-cyan-300">
                PILIH ATOM ELEMEN:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {ATOM_ELEMENTS.map((el) => {
                  const isSel = el.id === activeElementId;
                  return (
                    <button
                      key={el.id}
                      onClick={() => {
                        onSelectElement(el.id);
                        soundManager.playUiClick();
                      }}
                      className={`p-2 rounded-lg border text-left transition-colors cursor-pointer ${
                        isSel
                          ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <div className="font-display font-bold text-sm text-slate-100">
                        {el.symbol}
                      </div>
                      <div className="text-[11px] truncate">{el.name.split(' ')[0]}</div>
                    </button>
                  );
                })}
              </div>

              {/* Enter Nucleus CTA */}
              <button
                onClick={() => {
                  onSelectStation('nucleus');
                  soundManager.playUiClick();
                }}
                className="mt-1 py-2 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 rounded-lg text-xs font-bold font-display text-white transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>🔬</span>
                <span>ENTER THE NUCLEUS</span>
              </button>

              <div className="text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                Petunjuk: Klik bola Proton (merah), Neutron (abu-abu), atau Elektron (biru) pada model 3D untuk melihat info spesifik.
              </div>
            </div>
          </div>
        )}

        {/* ================= STATION: NUCLEUS DEEP DIVE ================= */}
        {station === 'nucleus' && (
          <div className="pointer-events-auto flex flex-col gap-3 max-w-xs">
            <div className="hud-glass p-3.5 rounded-xl flex flex-col gap-2">
              <span className="text-xs font-bold font-display text-cyan-300">
                GAYA INTI KUAT (STRONG FORCE)
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">
                Di dalam inti atom, proton bermuatan positif saling menolak melalui gaya elektrostatik Coulomb.
                Neutron bersama proton diikat oleh <strong>Gaya Inti Kuat</strong> yang bekerja pada jarak sangat pendek (~1 femtometer).
              </p>
              <div className="bg-slate-900/80 p-2 rounded-lg text-[11px] font-mono text-slate-300 space-y-1">
                <div>• Proton (p⁺): uud quark, +1e</div>
                <div>• Neutron (n⁰): udd quark, 0e</div>
                <div>• Lem Nuklir: Gluon & Gaya Yukawa</div>
              </div>
              <button
                onClick={() => {
                  onSelectStation('atom');
                  soundManager.playUiClick();
                }}
                className="mt-1 py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 rounded-lg"
              >
                ← Kembali ke Model Kulit Elektron
              </button>
            </div>
          </div>
        )}

        {/* ================= STATION: RADIATION SIMULATOR ================= */}
        {station === 'radiation' && (
          <div className="pointer-events-auto flex flex-col gap-3">
            <RadiationScenarioCustomizer
              radiationType={activeRadiationType}
              onSelectRadiationType={onSelectRadiationType}
              selectedShields={selectedShields}
              onToggleShield={onToggleShield}
              distanceCm={simulatorDistanceCm}
              onChangeDistance={onChangeSimulatorDistance}
              onApplyScenario={onApplyScenario}
            />
          </div>
        )}

        {/* ================= STATION: DETECTOR ================= */}
        {station === 'detector' && (
          <div className="pointer-events-auto flex flex-col gap-3 max-w-xs">
            <div className="hud-glass p-4 rounded-xl flex flex-col gap-2.5 select-none">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="text-xs font-bold font-display text-cyan-300">
                  GEIGER-MÜLLER COUNTER
                </span>
                <span className="text-[10px] font-mono text-amber-400 animate-pulse">
                  ● DETECTING
                </span>
              </div>

              {/* Digital Readout */}
              <div className="bg-black/80 border border-cyan-500/40 p-3 rounded-lg flex flex-col items-center">
                <span className="text-[10px] font-mono text-slate-400 uppercase">Counts Per Minute</span>
                <span className="text-2xl md:text-3xl font-bold font-mono text-cyan-300 tracking-wider">
                  {detectorCpm.toLocaleString()} <span className="text-xs font-normal text-slate-400">CPM</span>
                </span>
                <div className="flex items-center gap-3 text-xs font-mono text-slate-400 mt-1">
                  <span>Dosis: {(detectorCpm * 0.0057).toFixed(2)} μSv/h</span>
                  <span>Jarak: {detectorDistanceCm} cm</span>
                </div>
              </div>

              {/* Specimen Switcher */}
              <span className="text-[11px] font-medium text-slate-300">Arahkan probe ke sampel:</span>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => onMoveProbeToSample('sample_banana')}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-400/50 text-[11px] text-left text-amber-300 cursor-pointer"
                >
                  🍌 Pisang (K-40)
                </button>
                <button
                  onClick={() => onMoveProbeToSample('sample_smoke')}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-cyan-400/50 text-[11px] text-left text-cyan-300 cursor-pointer"
                >
                  🚨 Asap (Am-241)
                </button>
                <button
                  onClick={() => onMoveProbeToSample('sample_uranium')}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-emerald-400/50 text-[11px] text-left text-emerald-300 cursor-pointer"
                >
                  🪨 Pitchblende (U)
                </button>
                <button
                  onClick={() => onMoveProbeToSample('sample_medical')}
                  className="p-1.5 rounded bg-slate-900 border border-slate-800 hover:border-rose-400/50 text-[11px] text-left text-rose-300 cursor-pointer"
                >
                  💉 Kobalt-60
                </button>
              </div>

              <div className="text-[10px] text-slate-500 italic text-center pt-1 border-t border-slate-800">
                Educational simulation — values are fictional.
              </div>
            </div>
          </div>
        )}

        {/* ================= STATION: REACTOR & FLOW ================= */}
        {(station === 'reactor' || station === 'flow') && (
          <div className="pointer-events-auto flex flex-col gap-3">
            <ReactorControlsHud
              reactorState={reactorState}
              onControlRodChange={onControlRodChange}
            />
          </div>
        )}

        {/* ================= STATION: CHAIN REACTION ================= */}
        {station === 'chain_reaction' && (
          <div className="pointer-events-auto flex flex-col gap-3 max-w-sm">
            <div className="hud-glass p-4 rounded-xl flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
                <span className="font-display text-sm font-bold text-cyan-300">
                  CHAIN REACTION MINI-GAME
                </span>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded border border-amber-500/30">
                  SKOR: {chainReactionScore}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Total Inti Terbelah:</span>
                  <span className="text-cyan-300 font-bold text-base">{chainReactionFissions}</span>
                </div>
                <div className="bg-slate-900/80 p-2 rounded border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Status Multiplikasi (k):</span>
                  <span className="text-emerald-400 font-bold text-base">
                    {reactorState.chainReactionMulti.toFixed(2)}x
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onStartChainReaction();
                    soundManager.playUiClick();
                  }}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white rounded-lg text-xs font-bold font-display shadow cursor-pointer transition-all"
                >
                  🚀 LUNCURKAN NEUTRON
                </button>
                <button
                  onClick={() => {
                    onResetChainReaction();
                    soundManager.playUiClick();
                  }}
                  className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono cursor-pointer"
                >
                  RESET
                </button>
              </div>

              {/* Inline compact control rod slider coupling */}
              <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Peredam Batang Kendali:</span>
                  <span className="text-amber-300 font-bold">
                    {reactorState.controlRodInsertion.toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={reactorState.controlRodInsertion}
                  onChange={(e) => onControlRodChange(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400 h-2 bg-slate-800 rounded"
                />
                <span className="text-[10px] text-slate-400">
                  *Menurunkan batang kendali menyerap neutron bebas dan menghentikan reaksi rantai!
                </span>
              </div>
            </div>
          </div>
        )}

        {/* ================= STATION: DECAY ================= */}
        {station === 'decay' && (
          <div className="pointer-events-auto flex flex-col gap-3">
            <DecayGraph
              initialAtoms={100}
              remainingAtoms={decayRemainingAtoms}
              elapsedTime={decayElapsedTime}
              halfLife={currentDecayIso.halfLifeSeconds}
              isotopeName={currentDecayIso.name}
              realHalfLife={currentDecayIso.realHalfLife}
            />

            {/* Decay Controls Box */}
            <div className="hud-glass p-3 rounded-xl flex flex-col gap-2.5 max-w-[280px]">
              <span className="text-xs font-bold text-slate-200">PILIH ISOTOP:</span>
              <div className="grid grid-cols-2 gap-1.5">
                {ISOTOPES_DECAY_DATA.map((iso) => (
                  <button
                    key={iso.id}
                    onClick={() => {
                      onSelectDecayIsotope(iso.id);
                      soundManager.playUiClick();
                    }}
                    className={`p-1.5 rounded border text-left text-xs transition-colors cursor-pointer ${
                      iso.id === decayIsotopeId
                        ? 'bg-cyan-950/70 border-cyan-400 text-cyan-200 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="truncate">{iso.name.split(' ')[0]}</div>
                    <div className="text-[10px] font-mono text-slate-500">{iso.realHalfLife}</div>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    onToggleDecayPlay();
                    soundManager.playUiClick();
                  }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                    decayIsPlaying
                      ? 'bg-amber-600/40 border border-amber-500 text-amber-200'
                      : 'bg-emerald-600/40 border border-emerald-500 text-emerald-200'
                  }`}
                >
                  {decayIsPlaying ? '⏸ PAUSE' : '▶ MULAI'}
                </button>
                <button
                  onClick={() => {
                    onResetDecay();
                    soundManager.playUiClick();
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-mono cursor-pointer"
                >
                  RESET
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BOTTOM QUICK STATION SWITCHER BAR */}
      <div className="pointer-events-auto mx-auto hud-glass px-2 md:px-3 py-1.5 rounded-2xl flex items-center gap-1 md:gap-2 shadow-lg overflow-x-auto max-w-full">
        {[
          { id: 'lab', label: 'Main Lab', icon: '🏛️' },
          { id: 'atom', label: 'Atom', icon: '⚛️' },
          { id: 'radiation', label: 'Radiasi', icon: '🛡️' },
          { id: 'detector', label: 'Geiger', icon: '📻' },
          { id: 'reactor', label: 'Reaktor', icon: '⚡' },
          { id: 'chain_reaction', label: 'Chain Reaction', icon: '💥' },
          { id: 'decay', label: 'Peluruhan', icon: '⏳' },
        ].map((item) => {
          const isAct = station === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                onSelectStation(item.id as LabStationId);
                soundManager.playUiClick();
              }}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all whitespace-nowrap flex items-center gap-1 cursor-pointer ${
                isAct
                  ? 'bg-cyan-500/25 border border-cyan-400 text-cyan-200 shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <span>{item.icon}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* POPUP MODAL: SUBATOMIC PARTICLE CLICKED */}
      {selectedParticle && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="hud-glass p-5 rounded-2xl max-w-md w-full flex flex-col gap-3.5 border border-cyan-400/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {selectedParticle.type === 'proton'
                    ? '🔴'
                    : selectedParticle.type === 'neutron'
                    ? '⚪'
                    : '🔵'}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-100 font-display">
                    {selectedParticle.name.toUpperCase()}
                  </h3>
                  <span className="text-xs font-mono text-cyan-400">
                    Simbol: {selectedParticle.symbol}
                  </span>
                </div>
              </div>
              <button
                onClick={onCloseParticleModal}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <div>
                <span className="text-slate-400 block text-[10px]">Muatan Listrik:</span>
                <strong className="text-cyan-300">{selectedParticle.charge}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Massa Diam:</span>
                <strong className="text-amber-300">{selectedParticle.mass}</strong>
              </div>
              {selectedParticle.quarkComposition && (
                <div className="col-span-2 pt-1 border-t border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Struktur Quark:</span>
                  <span className="text-slate-200">{selectedParticle.quarkComposition}</span>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              {selectedParticle.description}
            </p>

            <button
              onClick={onCloseParticleModal}
              className="py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-display transition-colors cursor-pointer"
            >
              TUTUP INSPEKSI
            </button>
          </div>
        </div>
      )}

      {/* POPUP MODAL: REACTOR COMPONENT CLICKED */}
      {selectedReactorComponent && (
        <div className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="hud-glass p-5 rounded-2xl max-w-md w-full flex flex-col gap-3.5 border border-cyan-400/40 shadow-2xl">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                  Komponen Reaktor Nuklir
                </span>
                <h3 className="text-base font-bold text-slate-100 font-display">
                  {selectedReactorComponent.indonesianName}
                </h3>
              </div>
              <button
                onClick={onCloseReactorComponentModal}
                className="p-1 rounded text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-cyan-400 font-semibold block text-[11px] mb-0.5">Fungsi Utama:</span>
                <p className="text-slate-300">{selectedReactorComponent.role}</p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-amber-400 font-semibold block text-[11px] mb-0.5">Material & Komposisi:</span>
                <p className="text-slate-300">{selectedReactorComponent.material}</p>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-emerald-400 font-semibold block text-[11px] mb-0.5">Prinsip Fisika SMA:</span>
                <p className="text-slate-300">{selectedReactorComponent.physicsPrinciple}</p>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 bg-amber-950/30 border border-amber-500/30 p-2 rounded leading-relaxed">
              <strong>Catatan Keselamatan: </strong> {selectedReactorComponent.safetyNote}
            </div>

            <button
              onClick={onCloseReactorComponentModal}
              className="py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold rounded-lg text-xs font-display transition-colors cursor-pointer"
            >
              SELESAI MEMBACA
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
