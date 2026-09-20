import React from 'react';
import { Sparkles, RotateCcw, Box, HelpCircle, Smartphone } from 'lucide-react';
import { RelativisticState, ReferenceFrame } from '../types';

interface HeaderProps {
  state: RelativisticState;
  onStateChange: (updater: (prev: RelativisticState) => RelativisticState) => void;
  onOpenExplainer: () => void;
  onOpenAndroidModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  state,
  onStateChange,
  onOpenExplainer,
  onOpenAndroidModal,
}) => {
  const handleReset = () => {
    onStateChange((prev) => ({
      ...prev,
      beta: 0,
      delta: 1,
      motionAxis: 'x',
      referenceFrame: 'lab',
      showGhostCube: true,
      showAtoms: true,
      showBonds: true,
      showFaces: true,
      showDimensions: true,
      atomGridSize: 5,
      isPlaying: false,
      flybyProgress: 0,
      viewMode: 'physical',
    }));
  };

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 select-none">
      {/* Title & Physics Badge */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-md shadow-cyan-500/20">
          <Box className="w-4 h-4 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-bold text-sm text-slate-100 tracking-tight">
              Relativistic Length Contraction
            </h1>
            <span className="hidden sm:inline-block text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 font-semibold">
              0.99999999999 c
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Special Relativity 3D Visualization: Lorentz Contraction of a Moving Cube
          </p>
        </div>
      </div>

      {/* Frame of Reference Toggle & Actions */}
      <div className="flex items-center gap-2">
        {/* Frame Toggle */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          <button
            id="btn-frame-lab"
            onClick={() =>
              onStateChange((prev) => ({ ...prev, referenceFrame: 'lab' }))
            }
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              state.referenceFrame === 'lab'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Laboratory Frame
          </button>
          <button
            id="btn-frame-cube"
            onClick={() =>
              onStateChange((prev) => ({ ...prev, referenceFrame: 'cube' }))
            }
            className={`px-2.5 py-1 rounded-md font-medium transition ${
              state.referenceFrame === 'cube'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Cube Rest Frame
          </button>
        </div>

        {/* Android & Python Modal Button */}
        <button
          id="btn-header-android"
          onClick={onOpenAndroidModal}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition min-h-[44px] shadow-sm"
          title="Build Android APK via GitHub Actions"
        >
          <Smartphone className="w-4 h-4 text-emerald-400" />
          <span className="sm:hidden">Build APK</span>
          <span className="hidden sm:inline">Build Android APK</span>
        </button>

        {/* Physics Explainer Button */}
        <button
          id="btn-header-help"
          onClick={onOpenExplainer}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 transition"
          title="Relativistic Physics Guide"
        >
          <HelpCircle className="w-4 h-4 text-cyan-400" />
        </button>

        {/* Reset Button */}
        <button
          id="btn-header-reset"
          onClick={handleReset}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 transition"
          title="Reset to Default State"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
