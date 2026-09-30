/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

import {
  LabStationId,
  ParticleInfo,
  ReactorComponentData,
  ReactorState,
  RadiationType,
  ShieldMaterial,
  RadiationScenario,
  SubatomicParticleType,
  Mission,
} from './types/nuclear';

import {
  ATOM_ELEMENTS,
  SUBATOMIC_PARTICLES,
  REACTOR_COMPONENTS,
  ISOTOPES_DECAY_DATA,
} from './data/elementsData';
import { INITIAL_MISSIONS } from './data/missionsData';
import { soundManager } from './audio/soundEffects';

import { ThreeCanvas } from './components/ThreeCanvas';
import { Fallback2DView } from './components/Fallback2DView';
import { TopNav } from './components/TopNav';
import { HudOverlay } from './components/HudOverlay';
import { PeriodicTableModal } from './components/PeriodicTableModal';
import { MissionsModal } from './components/MissionsModal';
import { KirLogo } from './components/KirLogo';

export default function App() {
  // App loading & entrance screen
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isSystemReady, setIsSystemReady] = useState(false);
  const [hasEnteredLab, setHasEnteredLab] = useState(false);
  const [hasWebGlError, setHasWebGlError] = useState(false);

  // Audio mute
  const [isMuted, setIsMuted] = useState(false);

  // Current Lab Station
  const [currentStation, setCurrentStation] = useState<LabStationId>('lab');

  // OrbitControls handle for camera reset
  const controlsRef = useRef<OrbitControls | null>(null);

  // 1. Atom Explorer State
  const [activeElementId, setActiveElementId] = useState<string>('U');
  const [selectedParticle, setSelectedParticle] = useState<ParticleInfo | null>(null);

  // 2. Radiation Simulator State (Multi-shield & Scenario Customizer)
  const [activeRadiationType, setActiveRadiationType] = useState<RadiationType>('gamma');
  const [activeShieldMaterial, setActiveShieldMaterial] = useState<ShieldMaterial>('lead');
  const [selectedShields, setSelectedShields] = useState<ShieldMaterial[]>(['lead']);
  const [simulatorDistanceCm, setSimulatorDistanceCm] = useState<number>(60);

  // 3. Radiation Detector State
  const [detectorCpm, setDetectorCpm] = useState<number>(45);
  const [detectorDistanceCm, setDetectorDistanceCm] = useState<number>(18);
  const [detectorSampleName, setDetectorSampleName] = useState<string>('Kalium-40 (Pisang)');

  // 4. Reactor State (Directly coupled with Control Rods slider)
  const [reactorState, setReactorState] = useState<ReactorState>({
    controlRodInsertion: 45, // 45% inserted
    coolingPumpSpeed: 85,
    thermalEnergyMW: 2450,
    steamFlowKgS: 1350,
    electricOutputMWe: 920,
    coreTempC: 324.5,
    chainReactionMulti: 1.15,
    status: 'CRITICAL (BALANCED)',
  });
  const [selectedReactorComponent, setSelectedReactorComponent] =
    useState<ReactorComponentData | null>(null);

  // 5. Chain Reaction Game State
  const [chainReactionRunning, setChainReactionRunning] = useState<boolean>(false);
  const [chainReactionScore, setChainReactionScore] = useState<number>(0);
  const [chainReactionFissions, setChainReactionFissions] = useState<number>(0);

  // 6. Half-Life Radioactive Decay State
  const [decayIsotopeId, setDecayIsotopeId] = useState<string>('C14');
  const [decayElapsedTime, setDecayElapsedTime] = useState<number>(0);
  const [decayIsPlaying, setDecayIsPlaying] = useState<boolean>(false);
  const [decayRemainingAtoms, setDecayRemainingAtoms] = useState<number>(100);

  // 7. Student Missions & Progression
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [totalXp, setTotalXp] = useState<number>(120);

  // Modals
  const [isPeriodicModalOpen, setIsPeriodicModalOpen] = useState(false);
  const [isMissionsModalOpen, setIsMissionsModalOpen] = useState(false);

  // Initial loading simulation: "LOADING NUCLEAR LAB..." -> "SYSTEM READY"
  useEffect(() => {
    const interval = window.setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSystemReady(true);
          return 100;
        }
        return prev + Math.floor(Math.random() * 15 + 8);
      });
    }, 120);

    return () => clearInterval(interval);
  }, []);

  // Half-Life clock ticker
  useEffect(() => {
    if (!decayIsPlaying) return;
    const interval = window.setInterval(() => {
      setDecayElapsedTime((t) => t + 0.25);
    }, 250);
    return () => clearInterval(interval);
  }, [decayIsPlaying]);

  // Coupled Physical Reactor Simulation:
  // Manipulating Control Rods updates reaction rate, thermal output, steam, and electric output
  const handleControlRodChange = (val: number) => {
    const clampedVal = Math.min(100, Math.max(0, val));
    // Physical relationship:
    // Withdrawing rods (insertion -> 0) increases unabsorbed neutrons, driving fission up!
    // Inserting rods (insertion -> 100) absorbs all neutrons (SCRAM shutdown).
    const powerFraction = Math.pow((100 - clampedVal) / 100, 1.35);

    const thermalMW = Math.round(powerFraction * 3200);
    const steamKgS = Math.round(powerFraction * 1800);
    const electricMWe = Math.round(powerFraction * 1100);
    const coreTemp = parseFloat((280 + powerFraction * 115).toFixed(1));
    const chainMulti = parseFloat((0.15 + powerFraction * 2.1).toFixed(2));

    let status: ReactorState['status'] = 'CRITICAL (BALANCED)';
    if (clampedVal >= 98) {
      status = 'SCRAM';
    } else if (clampedVal > 60) {
      status = 'SUBCRITICAL';
    } else if (clampedVal >= 35 && clampedVal <= 60) {
      status = 'CRITICAL (BALANCED)';
    } else if (clampedVal >= 12) {
      status = 'SUPERCRITICAL';
    } else {
      status = 'WARNING_HIGH_TEMP';
    }

    setReactorState((prev) => ({
      ...prev,
      controlRodInsertion: clampedVal,
      thermalEnergyMW: thermalMW,
      steamFlowKgS: steamKgS,
      electricOutputMWe: electricMWe,
      coreTempC: coreTemp,
      chainReactionMulti: chainMulti,
      status,
    }));

    // Check Mission 4 task
    if (clampedVal >= 20 && clampedVal <= 50) {
      markTaskCompleted(4, 't4_1');
    }
    if (electricMWe > 700) {
      markTaskCompleted(4, 't4_2');
    }
  };

  // Helper for mission task completion
  const markTaskCompleted = (missionId: number, taskId: string) => {
    setMissions((prev) => {
      return prev.map((m) => {
        if (m.id !== missionId) return m;

        const updatedTasks = m.tasks.map((t) =>
          t.id === taskId ? { ...t, completed: true } : t
        );
        const allDone = updatedTasks.every((t) => t.completed);

        if (allDone && !m.completed) {
          // Mission completed fanfare and confetti!
          soundManager.playMissionFanfare();
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
              colors: ['#06b6d4', '#10b981', '#f59e0b', '#38bdf8'],
            });
          } catch {
            // ignore
          }
          setTotalXp((xp) => xp + m.xpReward);
        }

        return {
          ...m,
          tasks: updatedTasks,
          completed: allDone,
        };
      });
    });
  };

  // Particle click handler
  const handleParticleClick = (type: SubatomicParticleType) => {
    const info = SUBATOMIC_PARTICLES[type];
    if (info) {
      setSelectedParticle(info);
      if (type === 'proton') markTaskCompleted(1, 't1_1');
      if (type === 'neutron') markTaskCompleted(1, 't1_2');
      if (type === 'electron') markTaskCompleted(1, 't1_3');
    }
  };

  // Reactor component click handler
  const handleReactorComponentClick = (compKey: string) => {
    const comp = REACTOR_COMPONENTS.find((c) => c.id === compKey);
    if (comp) {
      setSelectedReactorComponent(comp);
      if (['turbine', 'generator'].includes(compKey)) {
        markTaskCompleted(4, 't4_3');
      }
    }
  };

  // Multi-shield toggling in custom scenario
  const handleToggleShield = (shield: ShieldMaterial) => {
    setSelectedShields((prev) => {
      let next: ShieldMaterial[];
      if (prev.includes(shield)) {
        next = prev.filter((s) => s !== shield);
      } else {
        next = [...prev, shield];
      }
      // Check mission 2 tasks
      if (activeRadiationType === 'alpha' && next.includes('paper')) {
        markTaskCompleted(2, 't2_1');
      }
      if (activeRadiationType === 'beta' && next.includes('aluminium')) {
        markTaskCompleted(2, 't2_2');
      }
      if (activeRadiationType === 'gamma' && next.includes('lead')) {
        markTaskCompleted(2, 't2_3');
      }
      return next;
    });
  };

  // Apply saved/preset radiation scenario
  const handleApplyScenario = (scenario: RadiationScenario) => {
    setActiveRadiationType(scenario.radiationType);
    setSelectedShields([...scenario.shields]);
    setSimulatorDistanceCm(scenario.distanceCm);
    soundManager.playUiClick();

    if (scenario.radiationType === 'alpha' && scenario.shields.includes('paper')) {
      markTaskCompleted(2, 't2_1');
    }
    if (scenario.radiationType === 'beta' && scenario.shields.includes('aluminium')) {
      markTaskCompleted(2, 't2_2');
    }
    if (scenario.radiationType === 'gamma' && scenario.shields.includes('lead')) {
      markTaskCompleted(2, 't2_3');
    }
  };

  // Chain Reaction Game handlers
  const handleStartChainReaction = () => {
    setChainReactionRunning(true);
    markTaskCompleted(5, 't5_1');
    markTaskCompleted(5, 't5_2');
    soundManager.playUiClick();
  };

  const handleResetChainReaction = () => {
    setChainReactionRunning(false);
    setChainReactionScore(0);
    setChainReactionFissions(0);
    soundManager.playUiClick();
  };

  const handleFissionEvent = (newScore: number, totalFissions: number) => {
    setChainReactionScore(newScore);
    setChainReactionFissions(totalFissions);
    if (newScore > 300) {
      markTaskCompleted(5, 't5_3');
    }
  };

  // Reset Camera View
  const handleResetCamera = () => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = soundManager.toggleMute();
    setIsMuted(nextMuted);
  };

  // Radioactive decay handlers
  const handleSelectDecayIsotope = (id: string) => {
    setDecayIsotopeId(id);
    setDecayElapsedTime(0);
    setDecayRemainingAtoms(100);
    if (['C14', 'I131'].includes(id)) {
      markTaskCompleted(3, 't1_1');
      markTaskCompleted(3, 't3_1');
    }
  };

  const handleToggleDecayPlay = () => {
    setDecayIsPlaying(!decayIsPlaying);
    markTaskCompleted(3, 't3_2');
  };

  const handleResetDecay = () => {
    setDecayIsPlaying(false);
    setDecayElapsedTime(0);
    setDecayRemainingAtoms(100);
  };

  const handleDecayProgress = (remaining: number) => {
    setDecayRemainingAtoms(remaining);
    if (remaining < 50) {
      markTaskCompleted(3, 't3_3');
    }
  };

  // Enter lab screen action
  const handleEnterLab = () => {
    setHasEnteredLab(true);
    soundManager.playUiClick();
    // Start ambient reactor hum gently
    soundManager.updateReactorHum(0.6);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 select-none">
      {/* 1. INITIAL LOADING / ENTRANCE GATE SCREEN */}
      {!hasEnteredLab && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-slate-950/95 backdrop-blur-xl">
          {/* Subtle glowing radial background */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center max-w-md w-full text-center">
            {/* KIR SMA KP Baleendah Official Crest */}
            <div className="mb-4 transform hover:scale-105 transition-transform duration-300">
              <KirLogo size={128} />
            </div>

            <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-widest mb-1">
              KIR SMA KP BALEENDAH
            </span>

            <h1 className="text-2xl md:text-3xl font-bold font-display text-slate-100 tracking-wide mb-2">
              3D NUCLEAR & RADIATION LAB
            </h1>

            <p className="text-xs text-slate-400 leading-relaxed mb-6">
              Laboratorium virtual 3D interaktif pembelajaran Fisika Inti & Radioaktivitas SMA.
              Jelajahi struktur atom, perisai radiasi, model reaktor nuklir cutaway, dan waktu paruh.
            </p>

            {/* Loading Indicator or Enter Button */}
            {!isSystemReady ? (
              <div className="w-full flex flex-col items-center gap-2">
                <span className="text-xs font-mono text-cyan-300 tracking-wider">
                  LOADING NUCLEAR LAB... {loadingProgress}%
                </span>
                <div className="w-full bg-slate-900 border border-slate-800 h-2.5 rounded-full overflow-hidden p-0.5">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-200"
                    style={{ width: `${loadingProgress}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 w-full animate-fade-in">
                <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>SYSTEM READY — 3D GRAPHICS ONLINE</span>
                </div>

                <button
                  onClick={handleEnterLab}
                  className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-500 hover:from-cyan-400 to-blue-600 hover:to-blue-500 text-slate-950 font-bold font-display text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-2"
                >
                  <span>ENTER LAB</span>
                  <span>→</span>
                </button>

                <span className="text-[11px] text-slate-500">
                  Disertai simulasi audio prosedural Web Audio API
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. TOP BAR CONTRACT NAVIGATION */}
      <TopNav
        currentStation={currentStation}
        onSelectStation={(st) => setCurrentStation(st)}
        onResetCamera={handleResetCamera}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        xp={totalXp}
      />

      {/* 3. 3D WEBGL CANVAS (OR 2D FALLBACK IF ERROR) */}
      <main className="w-full h-full">
        {!hasWebGlError ? (
          <ThreeCanvas
            station={currentStation}
            onSelectStation={(st) => setCurrentStation(st)}
            activeElementId={activeElementId}
            activeRadiationType={activeRadiationType}
            activeShieldMaterial={activeShieldMaterial}
            activeShields={selectedShields}
            simulatorDistanceCm={simulatorDistanceCm}
            reactorState={reactorState}
            onParticleClick={handleParticleClick}
            onReactorComponentClick={handleReactorComponentClick}
            onDetectorSampleProximity={(cpm, dist, sampleName) => {
              setDetectorCpm(cpm);
              setDetectorDistanceCm(dist);
              setDetectorSampleName(sampleName);
            }}
            chainReactionRunning={chainReactionRunning}
            onChainReactionFission={handleFissionEvent}
            decayElapsedTime={decayElapsedTime}
            decayIsotopeId={decayIsotopeId}
            onDecayProgress={handleDecayProgress}
            setOrbitControlsRef={(ctrl) => {
              controlsRef.current = ctrl;
            }}
            onWebGlError={() => setHasWebGlError(true)}
          />
        ) : (
          <Fallback2DView
            station={currentStation}
            reactorState={reactorState}
            activeElement={activeElementId}
            activeRadiation={activeRadiationType}
            activeShield={activeShieldMaterial}
          />
        )}
      </main>

      {/* 4. SCIENTIFIC HUD OVERLAY */}
      <HudOverlay
        station={currentStation}
        onSelectStation={(st) => setCurrentStation(st)}
        activeElementId={activeElementId}
        onSelectElement={(id) => {
          setActiveElementId(id);
          soundManager.playUiClick();
        }}
        selectedParticle={selectedParticle}
        onCloseParticleModal={() => setSelectedParticle(null)}
        activeRadiationType={activeRadiationType}
        onSelectRadiationType={(r) => {
          setActiveRadiationType(r);
          soundManager.playUiClick();
        }}
        activeShieldMaterial={activeShieldMaterial}
        onSelectShieldMaterial={(s) => {
          setActiveShieldMaterial(s);
          soundManager.playUiClick();
        }}
        selectedShields={selectedShields}
        onToggleShield={handleToggleShield}
        simulatorDistanceCm={simulatorDistanceCm}
        onChangeSimulatorDistance={(d) => setSimulatorDistanceCm(d)}
        onApplyScenario={handleApplyScenario}
        detectorCpm={detectorCpm}
        detectorDistanceCm={detectorDistanceCm}
        detectorSampleName={detectorSampleName}
        onMoveProbeToSample={(sampleId) => {
          soundManager.playUiClick();
          // Sample proximity handled by probe in 3D
        }}
        reactorState={reactorState}
        onControlRodChange={handleControlRodChange}
        selectedReactorComponent={selectedReactorComponent}
        onCloseReactorComponentModal={() => setSelectedReactorComponent(null)}
        chainReactionRunning={chainReactionRunning}
        chainReactionScore={chainReactionScore}
        chainReactionFissions={chainReactionFissions}
        onStartChainReaction={handleStartChainReaction}
        onResetChainReaction={handleResetChainReaction}
        decayElapsedTime={decayElapsedTime}
        decayIsotopeId={decayIsotopeId}
        onSelectDecayIsotope={handleSelectDecayIsotope}
        decayIsPlaying={decayIsPlaying}
        onToggleDecayPlay={handleToggleDecayPlay}
        onResetDecay={handleResetDecay}
        decayRemainingAtoms={decayRemainingAtoms}
        onOpenPeriodicModal={() => setIsPeriodicModalOpen(true)}
        onOpenMissionsModal={() => setIsMissionsModalOpen(true)}
        xp={totalXp}
      />

      {/* 5. PERIODIC TABLE & ISOTOPE MODAL */}
      <PeriodicTableModal
        isOpen={isPeriodicModalOpen}
        onClose={() => setIsPeriodicModalOpen(false)}
        onSelectElementForAtomViewer={(symbol) => {
          setActiveElementId(symbol);
          setCurrentStation('atom');
        }}
      />

      {/* 6. STUDENT NUCLEAR MISSIONS MODAL */}
      <MissionsModal
        isOpen={isMissionsModalOpen}
        onClose={() => setIsMissionsModalOpen(false)}
        missions={missions}
        onGoToMissionStation={(target) => {
          setCurrentStation(target);
        }}
        totalXp={totalXp}
      />
    </div>
  );
}
