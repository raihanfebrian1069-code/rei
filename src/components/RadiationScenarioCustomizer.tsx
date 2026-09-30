import React, { useState, useEffect } from 'react';
import { RadiationType, ShieldMaterial, RadiationScenario } from '../types/nuclear';
import { RADIATION_TYPES, SHIELD_MATERIALS } from '../data/elementsData';
import { soundManager } from '../audio/soundEffects';

interface RadiationScenarioCustomizerProps {
  radiationType: RadiationType;
  onSelectRadiationType: (r: RadiationType) => void;
  selectedShields: ShieldMaterial[];
  onToggleShield: (s: ShieldMaterial) => void;
  distanceCm: number;
  onChangeDistance: (d: number) => void;
  onApplyScenario: (sc: RadiationScenario) => void;
}

const DEFAULT_PRESETS: RadiationScenario[] = [
  {
    id: 'preset-1',
    name: 'Perisai Medis Gamma (Timbal 5cm)',
    radiationType: 'gamma',
    shields: ['lead'],
    distanceCm: 100,
    initialActivityCPM: 5000,
    createdAt: 'Preset Standar',
  },
  {
    id: 'preset-2',
    name: 'Pengujian Alfa di Udara Bebas',
    radiationType: 'alpha',
    shields: [],
    distanceCm: 20,
    initialActivityCPM: 3000,
    createdAt: 'Preset Standar',
  },
  {
    id: 'preset-3',
    name: 'Barier Ganda Beta (Kertas + Aluminium)',
    radiationType: 'beta',
    shields: ['paper', 'aluminium'],
    distanceCm: 45,
    initialActivityCPM: 4200,
    createdAt: 'Preset Standar',
  },
  {
    id: 'preset-4',
    name: 'Bungker Reaktor (Beton + Timbal)',
    radiationType: 'gamma',
    shields: ['concrete', 'lead'],
    distanceCm: 150,
    initialActivityCPM: 8000,
    createdAt: 'Preset Standar',
  },
];

const LOCAL_STORAGE_KEY = 'nuclea3d_saved_scenarios';

export const RadiationScenarioCustomizer: React.FC<RadiationScenarioCustomizerProps> = ({
  radiationType,
  onSelectRadiationType,
  selectedShields,
  onToggleShield,
  distanceCm,
  onChangeDistance,
  onApplyScenario,
}) => {
  const [savedScenarios, setSavedScenarios] = useState<RadiationScenario[]>([]);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [isSavingOpen, setIsSavingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'controls' | 'scenarios'>('controls');

  // Load scenarios from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setSavedScenarios(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  const saveCurrentScenario = () => {
    if (!newScenarioName.trim()) return;

    const newScenario: RadiationScenario = {
      id: `custom-${Date.now()}`,
      name: newScenarioName.trim(),
      radiationType,
      shields: [...selectedShields],
      distanceCm,
      initialActivityCPM: 4500,
      createdAt: new Date().toLocaleDateString('id-ID'),
    };

    const updated = [newScenario, ...savedScenarios];
    setSavedScenarios(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    setNewScenarioName('');
    setIsSavingOpen(false);
    soundManager.playUiClick();
  };

  const deleteScenario = (id: string) => {
    const updated = savedScenarios.filter((s) => s.id !== id);
    setSavedScenarios(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    soundManager.playUiClick();
  };

  // Compute combined physics attenuation
  const computeCombinedTransmission = () => {
    if (selectedShields.length === 0) return 1.0;

    let factor = 1.0;
    const radInfo = RADIATION_TYPES[radiationType];

    for (const shield of selectedShields) {
      const shieldTransPercent = radInfo.attenuationByShield[shield as keyof typeof radInfo.attenuationByShield] ?? 100;
      factor *= shieldTransPercent / 100;
      if (factor <= 0) break;
    }
    return factor;
  };

  // Distance inverse square factor (normalized to 20cm reference)
  const dRef = 20;
  const distanceFactor = Math.min(4, Math.max(0.01, (dRef / distanceCm) ** 2));
  const transmissionRatio = computeCombinedTransmission();
  const finalTransmissionPercent = (transmissionRatio * 100).toFixed(1);

  // Simulated base activity
  const baseCpm = 4500;
  const detectedCpm = Math.round(baseCpm * transmissionRatio * distanceFactor);
  const doseMicroSv = (detectedCpm * 0.0057).toFixed(2);

  // Visual Bar: e.g. ████████░░
  const blocks = Math.min(10, Math.round(transmissionRatio * 10));
  const barGraphic = '█'.repeat(blocks) + '░'.repeat(10 - blocks);

  return (
    <div className="hud-glass p-4 rounded-xl flex flex-col gap-3 max-w-sm select-none">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('controls')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'controls'
                ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Kustomisasi
          </button>
          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              activeTab === 'scenarios'
                ? 'bg-cyan-600/40 text-cyan-200 border border-cyan-400/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Skenario ({savedScenarios.length + DEFAULT_PRESETS.length})
          </button>
        </div>

        <button
          onClick={() => setIsSavingOpen(!isSavingOpen)}
          className="text-[11px] font-mono font-semibold px-2 py-1 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/50 cursor-pointer"
        >
          {isSavingOpen ? 'Batal' : '💾 Simpan'}
        </button>
      </div>

      {/* Save Scenario Inline Form */}
      {isSavingOpen && (
        <div className="bg-slate-900/90 border border-amber-500/40 p-2.5 rounded-lg flex flex-col gap-2">
          <span className="text-[11px] font-bold text-amber-300">Simpan Skenario Kustom Ini:</span>
          <div className="flex gap-1.5">
            <input
              type="text"
              placeholder="Contoh: Barier Beton Medis"
              value={newScenarioName}
              onChange={(e) => setNewScenarioName(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={saveCurrentScenario}
              disabled={!newScenarioName.trim()}
              className="px-3 py-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 font-bold text-xs rounded transition-colors cursor-pointer"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: PARAMETER CONTROLS */}
      {activeTab === 'controls' && (
        <div className="flex flex-col gap-3">
          {/* 1. Select Radiation Type */}
          <div>
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wide block mb-1">
              1. Jenis Radiasi:
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              {(['alpha', 'beta', 'gamma'] as RadiationType[]).map((r) => {
                const info = RADIATION_TYPES[r];
                const isSelected = radiationType === r;
                return (
                  <button
                    key={r}
                    onClick={() => {
                      onSelectRadiationType(r);
                      soundManager.playUiClick();
                    }}
                    className={`py-1.5 px-2 rounded-lg border text-center transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-950/80 border-cyan-400 text-cyan-200 font-bold ring-1 ring-cyan-400/40'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="text-sm font-display">{info.symbol.split(' ')[0]}</div>
                    <div className="text-[10px] uppercase font-mono">{r}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Choose Combination of Shielding Materials */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wide">
                2. Kombinasi Perisai:
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {selectedShields.length === 0 ? 'Tanpa Perisai (Udara)' : `${selectedShields.length} Lapisan Aktif`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(['paper', 'aluminium', 'concrete', 'lead'] as ShieldMaterial[]).map((shield) => {
                const info = SHIELD_MATERIALS[shield];
                const isChecked = selectedShields.includes(shield);
                return (
                  <button
                    key={shield}
                    onClick={() => {
                      onToggleShield(shield);
                      soundManager.playUiClick();
                    }}
                    className={`p-2 rounded-lg border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isChecked
                        ? 'bg-amber-950/50 border-amber-400 text-amber-200'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{info.name.split(' ')[0]}</div>
                      <div className="text-[10px] font-mono text-slate-500">{info.thickness}</div>
                    </div>
                    <span className="text-sm">{isChecked ? '☑' : '☐'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Set Distance from Source to Detector */}
          <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-slate-400">Jarak Sumber → Detektor:</span>
              <span className="text-cyan-300 font-bold">{distanceCm} cm</span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={distanceCm}
              onChange={(e) => onChangeDistance(parseInt(e.target.value, 10))}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>10 cm (Dekat)</span>
              <span>100 cm</span>
              <span>200 cm (Jauh)</span>
            </div>
          </div>

          {/* 4. Resulting Radiation Level on Detector */}
          <div className="bg-black/80 border border-cyan-500/40 p-3 rounded-lg flex flex-col gap-1.5 font-mono">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400">Radiasi Tertangkap Detektor:</span>
              <span className="text-amber-400 font-bold text-sm">
                {finalTransmissionPercent}%
              </span>
            </div>

            <div className="text-xs text-cyan-400 tracking-wider">
              Level: [{barGraphic}]
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Hitungan Detektor:</span>
                <span className="text-slate-100 font-bold">{detectedCpm.toLocaleString()} CPM</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Dosis Ekuivalen:</span>
                <span className="text-emerald-400 font-bold">{doseMicroSv} μSv/h</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED SCENARIOS & PRESETS */}
      {activeTab === 'scenarios' && (
        <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
          <span className="text-[11px] font-mono text-slate-400 font-semibold">
            Pilih Skenario Tersimpan:
          </span>

          {/* User Saved Scenarios */}
          {savedScenarios.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase font-mono text-amber-400 block">Koleksi Saya</span>
              {savedScenarios.map((sc) => (
                <div
                  key={sc.id}
                  className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-100">{sc.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {sc.radiationType.toUpperCase()} · {sc.shields.length > 0 ? sc.shields.join('+') : 'Tanpa Perisai'} · {sc.distanceCm}cm
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        onApplyScenario(sc);
                        soundManager.playUiClick();
                      }}
                      className="px-2 py-0.5 rounded bg-cyan-600/40 text-cyan-200 border border-cyan-400/40 hover:bg-cyan-600/60 font-mono text-[11px] cursor-pointer"
                    >
                      Terapkan
                    </button>
                    <button
                      onClick={() => deleteScenario(sc.id)}
                      className="px-1.5 py-0.5 rounded text-rose-400 hover:bg-rose-950/60 font-mono text-[11px] cursor-pointer"
                      title="Hapus"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Default Presets */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[10px] uppercase font-mono text-cyan-400 block">Skenario Rekomendasi</span>
            {DEFAULT_PRESETS.map((preset) => (
              <div
                key={preset.id}
                className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 flex items-center justify-between text-xs"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200">{preset.name}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {preset.radiationType.toUpperCase()} · {preset.shields.join('+')} · {preset.distanceCm}cm
                  </span>
                </div>
                <button
                  onClick={() => {
                    onApplyScenario(preset);
                    soundManager.playUiClick();
                  }}
                  className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-cyan-200 border border-slate-700 hover:border-cyan-400/50 font-mono text-[11px] cursor-pointer"
                >
                  Muat
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
