import React from 'react';
import { ReactorState } from '../types/nuclear';
import { soundManager } from '../audio/soundEffects';

interface ReactorControlsHudProps {
  reactorState: ReactorState;
  onControlRodChange: (val: number) => void;
  compact?: boolean;
}

export const ReactorControlsHud: React.FC<ReactorControlsHudProps> = ({
  reactorState,
  onControlRodChange,
  compact = false,
}) => {
  const { controlRodInsertion, thermalEnergyMW, steamFlowKgS, electricOutputMWe, coreTempC, status } =
    reactorState;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onControlRodChange(val);
    soundManager.playUiClick();
  };

  const setPreset = (val: number) => {
    onControlRodChange(val);
    soundManager.playUiClick();
  };

  // Status color badge
  const getStatusBadge = () => {
    switch (status) {
      case 'SCRAM':
        return 'bg-red-950/80 text-red-400 border-red-500/40';
      case 'SUBCRITICAL':
        return 'bg-blue-950/80 text-blue-400 border-blue-500/40';
      case 'CRITICAL (BALANCED)':
        return 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40';
      case 'SUPERCRITICAL':
        return 'bg-amber-950/80 text-amber-400 border-amber-500/40';
      case 'WARNING_HIGH_TEMP':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/60 animate-pulse';
      default:
        return 'bg-slate-900 text-slate-300 border-slate-700';
    }
  };

  if (compact) {
    return (
      <div className="hud-glass p-3 rounded-xl flex flex-col gap-2 max-w-xs">
        <div className="flex items-center justify-between text-xs">
          <span className="font-display font-bold text-cyan-300">
            Control Rods (Batang Kendali)
          </span>
          <span className="font-mono text-amber-400 font-semibold">
            {controlRodInsertion.toFixed(0)}% Disisipkan
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={controlRodInsertion}
          onChange={handleSliderChange}
          className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-400">
          <span>0% (Reaksi Maks)</span>
          <span>50% (Kritis Seimbang)</span>
          <span>100% (SCRAM)</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px] font-mono">
          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[10px]">Thermal Heat</span>
            <span className="text-cyan-300 font-bold">{thermalEnergyMW.toFixed(0)} MWth</span>
          </div>
          <div className="bg-slate-900/80 p-1.5 rounded border border-slate-800 flex flex-col">
            <span className="text-slate-400 text-[10px]">Listrik Bersih</span>
            <span className="text-emerald-400 font-bold">{electricOutputMWe.toFixed(0)} MWe</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-glass p-4 rounded-xl flex flex-col gap-3 max-w-sm select-none">
      {/* Header & Status */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex flex-col">
          <span className="font-display text-sm font-bold text-cyan-300 tracking-wide">
            KONTROL REAKSI NUKLIR
          </span>
          <span className="text-[11px] text-slate-400">
            Kopling Simultan: Reaktor & Chain Reaction
          </span>
        </div>
        <span
          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${getStatusBadge()}`}
        >
          {status}
        </span>
      </div>

      {/* Control Rod Slider */}
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-xs">
          <span className="text-slate-300 font-medium">Posisi Batang Kendali:</span>
          <span className="font-mono text-cyan-300 font-bold">
            {controlRodInsertion.toFixed(0)}% Masuk
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={controlRodInsertion}
          onChange={handleSliderChange}
          className="w-full accent-cyan-400 cursor-pointer h-2.5 bg-slate-800 rounded-lg"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span>0% (Terangkat Penuh)</span>
          <span>50% (Seimbang)</span>
          <span>100% (SCRAM Tertutup)</span>
        </div>
      </div>

      {/* Preset Quick Actions */}
      <div className="grid grid-cols-3 gap-1.5 pt-0.5">
        <button
          onClick={() => setPreset(100)}
          className={`py-1 px-2 text-[11px] font-mono font-semibold rounded border transition-colors ${
            controlRodInsertion === 100
              ? 'bg-red-500/30 border-red-500 text-red-200'
              : 'bg-slate-900 border-slate-700 text-red-400 hover:bg-red-950/40'
          }`}
        >
          SCRAM (0 MW)
        </button>
        <button
          onClick={() => setPreset(48)}
          className={`py-1 px-2 text-[11px] font-mono font-semibold rounded border transition-colors ${
            Math.abs(controlRodInsertion - 48) < 4
              ? 'bg-emerald-500/30 border-emerald-500 text-emerald-200'
              : 'bg-slate-900 border-slate-700 text-emerald-400 hover:bg-emerald-950/40'
          }`}
        >
          CRITICAL (~1 GW)
        </button>
        <button
          onClick={() => setPreset(15)}
          className={`py-1 px-2 text-[11px] font-mono font-semibold rounded border transition-colors ${
            Math.abs(controlRodInsertion - 15) < 4
              ? 'bg-amber-500/30 border-amber-500 text-amber-200'
              : 'bg-slate-900 border-slate-700 text-amber-400 hover:bg-amber-950/40'
          }`}
        >
          SUPERCRITICAL
        </button>
      </div>

      {/* Live Physical Indicators */}
      <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Thermal Energy (Kalor)</span>
          <span className="text-cyan-300 font-bold text-sm">
            {thermalEnergyMW.toFixed(0)}{' '}
            <span className="text-[10px] font-normal text-slate-400">MWth</span>
          </span>
          <div className="w-full bg-slate-800 h-1.5 rounded mt-1.5 overflow-hidden">
            <div
              className="bg-cyan-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (thermalEnergyMW / 3200) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Output Listrik Bersih</span>
          <span className="text-emerald-400 font-bold text-sm">
            {electricOutputMWe.toFixed(0)}{' '}
            <span className="text-[10px] font-normal text-slate-400">MWe</span>
          </span>
          <div className="w-full bg-slate-800 h-1.5 rounded mt-1.5 overflow-hidden">
            <div
              className="bg-emerald-400 h-full transition-all duration-300"
              style={{ width: `${Math.min(100, (electricOutputMWe / 1100) * 100)}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Laju Aliran Uap</span>
          <span className="text-amber-300 font-bold text-sm">
            {steamFlowKgS.toFixed(0)}{' '}
            <span className="text-[10px] font-normal text-slate-400">kg/s</span>
          </span>
        </div>

        <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
          <span className="text-[10px] text-slate-400 block mb-0.5">Suhu Teras Reaktor</span>
          <span
            className={`font-bold text-sm ${
              coreTempC > 360 ? 'text-rose-400' : 'text-slate-200'
            }`}
          >
            {coreTempC.toFixed(1)}°C
          </span>
        </div>
      </div>

      {/* Physics explanation disclaimer */}
      <div className="text-[11px] text-slate-400 bg-cyan-950/20 border border-cyan-500/20 p-2 rounded-lg leading-relaxed">
        <strong className="text-cyan-300">Prinsip Fisika: </strong>
        Batang kendali menyerap neutron (¹⁰B + n → ⁷Li + α). Menurunkan batang kendali memperlambat reaksi berantai dan menurunkan keluaran daya.
      </div>
    </div>
  );
};
