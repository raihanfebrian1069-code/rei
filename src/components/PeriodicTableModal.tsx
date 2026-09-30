import React, { useState } from 'react';
import { soundManager } from '../audio/soundEffects';

interface PeriodicElement {
  number: number;
  symbol: string;
  name: string;
  mass: string;
  category: 'nonmetal' | 'noble' | 'alkali' | 'alkaline' | 'metalloid' | 'halogen' | 'transition' | 'actinide';
  stableIsotopes: string[];
  radioIsotopes: { name: string; halfLife: string; decay: string }[];
  description: string;
}

const PERIODIC_ELEMENTS: PeriodicElement[] = [
  {
    number: 1,
    symbol: 'H',
    name: 'Hidrogen',
    mass: '1.008',
    category: 'nonmetal',
    stableIsotopes: ['¹H (Protium, 99.98%)', '²H (Deuterium, 0.015%)'],
    radioIsotopes: [{ name: '³H (Tritium)', halfLife: '12.32 tahun', decay: 'Beta (β⁻)' }],
    description: 'Unsur pertama di alam semesta. Deuterium & Tritium digunakan dalam bahan bakar fusi nuklir masa depan (Tokamak/ITER).',
  },
  {
    number: 2,
    symbol: 'He',
    name: 'Helium',
    mass: '4.0026',
    category: 'noble',
    stableIsotopes: ['³He (0.0001%)', '⁴He (99.999%)'],
    radioIsotopes: [{ name: '⁶He', halfLife: '0.806 detik', decay: 'Beta (β⁻)' }],
    description: 'Inti Helium-4 identik dengan partikel radiasi Alfa (α). Gas mulia non-reaktif pengisi balon udara dan kriogenik pendingin MRI.',
  },
  {
    number: 6,
    symbol: 'C',
    name: 'Karbon',
    mass: '12.011',
    category: 'nonmetal',
    stableIsotopes: ['¹²C (98.9%)', '¹³C (1.1%)'],
    radioIsotopes: [{ name: '¹⁴C (Radiokarbon)', halfLife: '5.730 tahun', decay: 'Beta (β⁻)' }],
    description: 'Grafit digunakan sebagai moderator neutron pada beberapa desain reaktor nuklir untuk memperlambat neutron cepat.',
  },
  {
    number: 7,
    symbol: 'N',
    name: 'Nitrogen',
    mass: '14.007',
    category: 'nonmetal',
    stableIsotopes: ['¹⁴N (99.63%)', '¹⁵N (0.37%)'],
    radioIsotopes: [{ name: '¹³N', halfLife: '9.965 menit', decay: 'Positron (β⁺)' }],
    description: 'Gas penyusun 78% atmosfer Bumi. Nitrogen-13 digunakan dalam pemindaian medis PET (Positron Emission Tomography).',
  },
  {
    number: 8,
    symbol: 'O',
    name: 'Oksigen',
    mass: '15.999',
    category: 'nonmetal',
    stableIsotopes: ['¹⁶O (99.76%)', '¹⁷O (0.038%)', '¹⁸O (0.205%)'],
    radioIsotopes: [{ name: '¹⁵O', halfLife: '122.24 detik', decay: 'Positron (β⁺)' }],
    description: 'Bereaksi dengan Uranium menghasilkan pelet bahan bakar keramik UO₂ yang memiliki titik leleh sangat tinggi (>2800°C).',
  },
  {
    number: 27,
    symbol: 'Co',
    name: 'Kobalt',
    mass: '58.933',
    category: 'transition',
    stableIsotopes: ['⁵⁹Co (100% alami)'],
    radioIsotopes: [{ name: '⁶⁰Co (Kobalt-60)', halfLife: '5.27 tahun', decay: 'Beta (β⁻) & Gamma (γ)' }],
    description: 'Kobalt-60 adalah pemancar sinar gamma berintensitas tinggi, digunakan luas dalam radioterapi tumor kanker dan sterilisasi alat medis.',
  },
  {
    number: 53,
    symbol: 'I',
    name: 'Iodium',
    mass: '126.90',
    category: 'halogen',
    stableIsotopes: ['¹²⁷I (100% alami)'],
    radioIsotopes: [{ name: '¹³¹I (Iodium-131)', halfLife: '8.02 hari', decay: 'Beta (β⁻) & Gamma (γ)' }],
    description: 'Iodium-131 diserap secara selektif oleh kelenjar tiroid manusia, menjadi standar emas dalam pengobatan kanker tiroid.',
  },
  {
    number: 55,
    symbol: 'Cs',
    name: 'Sesium',
    mass: '132.91',
    category: 'alkali',
    stableIsotopes: ['¹³³Cs (100% alami, standar detik atom)'],
    radioIsotopes: [{ name: '¹³⁷Cs (Sesium-137)', halfLife: '30.17 tahun', decay: 'Beta (β⁻) & Gamma (γ)' }],
    description: 'Produk fisi sampingan dari pembelahan Uranium di reaktor daya. Sering dipakai untuk kalibrasi instrumen dosimeter radiasi.',
  },
  {
    number: 84,
    symbol: 'Po',
    name: 'Polonium',
    mass: '[209]',
    category: 'metalloid',
    stableIsotopes: [],
    radioIsotopes: [
      { name: '²¹⁰Po', halfLife: '138.4 hari', decay: 'Alpha (α)' },
      { name: '²¹⁴Po', halfLife: '164 mikrodetik', decay: 'Alpha (α)' },
    ],
    description: 'Ditemukan oleh Marie Curie pada tahun 1898. Pemancar partikel alfa murni yang sangat kuat dengan kalor jenis tinggi.',
  },
  {
    number: 92,
    symbol: 'U',
    name: 'Uranium',
    mass: '238.03',
    category: 'actinide',
    stableIsotopes: [],
    radioIsotopes: [
      { name: '²³⁵U (0.72% alami)', halfLife: '703.8 juta tahun', decay: 'Alpha (α) / Fisi Termal' },
      { name: '²³⁸U (99.27% alami)', halfLife: '4.468 miliar tahun', decay: 'Alpha (α)' },
    ],
    description: 'Bahan bakar utama PLTN komersial di seluruh dunia. Inti Uranium-235 dapat membelah (fisi) saat menangkap neutron lambat.',
  },
];

interface PeriodicTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectElementForAtomViewer?: (symbol: string) => void;
}

export const PeriodicTableModal: React.FC<PeriodicTableModalProps> = ({
  isOpen,
  onClose,
  onSelectElementForAtomViewer,
}) => {
  const [selectedEl, setSelectedEl] = useState<PeriodicElement>(PERIODIC_ELEMENTS[0]);
  const [selectedIsotope, setSelectedIsotope] = useState<string | null>(null);

  if (!isOpen) return null;

  const categoryColor = (cat: PeriodicElement['category']) => {
    switch (cat) {
      case 'actinide':
        return 'border-purple-500/50 bg-purple-950/40 text-purple-300';
      case 'transition':
        return 'border-amber-500/50 bg-amber-950/40 text-amber-300';
      case 'halogen':
        return 'border-emerald-500/50 bg-emerald-950/40 text-emerald-300';
      case 'alkali':
        return 'border-rose-500/50 bg-rose-950/40 text-rose-300';
      case 'noble':
        return 'border-indigo-500/50 bg-indigo-950/40 text-indigo-300';
      case 'metalloid':
        return 'border-pink-500/50 bg-pink-950/40 text-pink-300';
      default:
        return 'border-cyan-500/50 bg-cyan-950/40 text-cyan-300';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/75 backdrop-blur-md">
      <div className="hud-glass w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col overflow-hidden border border-cyan-500/30">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/20 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📊</span>
            <div>
              <h2 className="text-base font-bold text-slate-100 font-display">
                TABEL PERIODIK & ISOTOP NUKLIR
              </h2>
              <p className="text-[11px] text-slate-400">
                Pilih elemen untuk melihat kestabilan nuklir, waktu paruh, dan mode peluruhan
              </p>
            </div>
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

        {/* Modal Content: Grid + Detail Panel */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Elements Interactive Grid */}
          <div className="lg:col-span-7 flex flex-col gap-3">
            <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Katalog Elemen Penting Fisika Nuklir
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {PERIODIC_ELEMENTS.map((el) => {
                const isSelected = selectedEl.number === el.number;
                return (
                  <button
                    key={el.number}
                    onClick={() => {
                      setSelectedEl(el);
                      setSelectedIsotope(null);
                      soundManager.playUiClick();
                    }}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-cyan-400 bg-cyan-950/70 ring-2 ring-cyan-400/40 scale-[1.02]'
                        : categoryColor(el.category)
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-slate-400">#{el.number}</span>
                      <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-black/40 text-slate-300 font-mono">
                        {el.category}
                      </span>
                    </div>
                    <div className="text-xl font-bold font-display mt-1 text-slate-100">
                      {el.symbol}
                    </div>
                    <div className="text-xs text-slate-300 font-medium truncate">{el.name}</div>
                    <div className="text-[10px] font-mono text-slate-400 mt-1">{el.mass} u</div>
                  </button>
                );
              })}
            </div>

            {/* Hint for viewing in 3D */}
            {onSelectElementForAtomViewer && ['H', 'C', 'O', 'U'].includes(selectedEl.symbol) && (
              <button
                onClick={() => {
                  onSelectElementForAtomViewer(selectedEl.symbol);
                  onClose();
                  soundManager.playUiClick();
                }}
                className="mt-2 py-2 px-3 bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-400/50 rounded-lg text-xs font-semibold text-cyan-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>⚛️</span>
                <span>Buka {selectedEl.name} di 3D Atom Explorer</span>
              </button>
            )}
          </div>

          {/* Element Inspector Panel */}
          <div className="lg:col-span-5 flex flex-col gap-4 bg-slate-900/90 border border-slate-800 p-4 rounded-xl">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <div className="w-14 h-14 rounded-xl bg-cyan-950 border-2 border-cyan-400 flex flex-col items-center justify-center">
                <span className="text-xs font-mono text-cyan-300 leading-none">
                  {selectedEl.number}
                </span>
                <span className="text-xl font-bold text-slate-100 font-display">
                  {selectedEl.symbol}
                </span>
              </div>
              <div className="flex flex-col">
                <h3 className="text-base font-bold text-slate-100">{selectedEl.name}</h3>
                <span className="text-xs font-mono text-slate-400">
                  Massa Atom Standar: {selectedEl.mass} u
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
              {selectedEl.description}
            </p>

            {/* Stable Isotopes */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>🛡️</span> Isotop Stabil (Non-Radioaktif):
              </span>
              {selectedEl.stableIsotopes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedEl.stableIsotopes.map((iso, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 text-[11px] font-mono bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 rounded-md"
                    >
                      {iso}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">
                  Tidak memiliki isotop stabil alami (semuanya radioaktif).
                </span>
              )}
            </div>

            {/* Radioactive Isotopes */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                <span>☢️</span> Isotop Radioaktif (Radioisotop):
              </span>
              <div className="flex flex-col gap-1.5">
                {selectedEl.radioIsotopes.map((iso, i) => {
                  const isSelected = selectedIsotope === iso.name;
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        setSelectedIsotope(iso.name);
                        soundManager.playUiClick();
                      }}
                      className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-950/60 border-amber-400 text-amber-200 ring-1 ring-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex justify-between items-center font-mono">
                        <strong className="text-amber-300">{iso.name}</strong>
                        <span className="text-[11px] text-slate-400">
                          Mode: <span className="text-rose-400 font-semibold">{iso.decay}</span>
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-slate-400 mt-1">
                        Waktu Paruh (T½): <span className="text-cyan-300">{iso.halfLife}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
