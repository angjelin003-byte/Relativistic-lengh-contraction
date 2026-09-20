import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Gauge,
  Eye,
  Sliders,
  Maximize2,
  Box,
  Smartphone,
  Download,
} from 'lucide-react';
import { RelativisticState, RelativisticMetrics, MotionAxis } from '../types';
import { SPEED_PRESETS, betaFromNines, countNines } from '../utils/physics';

interface ControlPanelProps {
  state: RelativisticState;
  onStateChange: (updater: (prev: RelativisticState) => RelativisticState) => void;
  metrics: RelativisticMetrics;
  onOpenExplainer: () => void;
  onOpenAndroidModal?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  state,
  onStateChange,
  metrics,
  onOpenExplainer,
  onOpenAndroidModal,
}) => {
  // Handle slider change (0 to 1 with non-linear scale for high precision)
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = parseFloat(e.target.value); // 0 to 1000
    // Non-linear mapping to give high fidelity at ultra-relativistic speeds
    // 0 -> 0c
    // 500 -> ~0.9c
    // 800 -> ~0.999c
    // 1000 -> 0.99999999999c (11 nines)
    if (rawVal === 0) {
      onStateChange((prev) => ({ ...prev, beta: 0, delta: 1 }));
      return;
    }

    if (rawVal >= 999.5) {
      // 11 nines
      const { beta, delta } = betaFromNines(11);
      onStateChange((prev) => ({ ...prev, beta, delta }));
      return;
    }

    // Smooth power-law curve: map rawVal 0..1000 to beta
    const normalized = rawVal / 1000;
    // Map normalized 0..1 to beta up to 0.99999999999
    // Using delta = 10^(-11 * normalized)
    const exponent = 11 * Math.pow(normalized, 2.2);
    const delta = Math.pow(10, -exponent);
    const beta = Math.min(1 - delta, 0.99999999999);

    onStateChange((prev) => ({ ...prev, beta, delta }));
  };

  // Convert current beta to slider position
  const sliderValue = React.useMemo(() => {
    if (state.beta <= 0) return 0;
    const delta = state.delta > 0 ? state.delta : Math.max(1e-15, 1 - state.beta);
    const exponent = -Math.log10(delta);
    const normalized = Math.min(1, Math.max(0, Math.pow(exponent / 11, 1 / 2.2)));
    return normalized * 1000;
  }, [state.beta, state.delta]);

  const currentNines = countNines(state.beta);

  const handleNinesChange = (n: number) => {
    const { beta, delta } = betaFromNines(n);
    onStateChange((prev) => ({ ...prev, beta, delta }));
  };

  return (
    <aside className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col h-auto lg:h-full overflow-y-auto z-20 text-slate-200">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-800/80 bg-slate-900/60 sticky top-0 backdrop-blur-md z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h2 className="font-semibold text-sm tracking-wide text-slate-100 uppercase">
            Relativistic Controls
          </h2>
        </div>
        <button
          id="btn-open-explainer"
          onClick={onOpenExplainer}
          className="text-xs flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-cyan-950/60 text-cyan-300 hover:bg-cyan-900/60 border border-cyan-800/50 transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Physics Notes</span>
        </button>
      </div>

      <div className="p-4 space-y-6">
        {/* Section 1: Velocity / Speed of Light Slider */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <label htmlFor="input-velocity-slider" className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-cyan-400" />
              Velocity (β = v/c)
            </label>
            <span className="font-mono text-sm font-bold text-cyan-400">
              {state.beta === 0
                ? '0.0000 c'
                : state.beta >= 0.99999999999
                ? '0.99999999999 c'
                : `${state.beta.toFixed(Math.min(11, Math.max(4, currentNines + 2)))} c`}
            </span>
          </div>

          <div className="space-y-1.5">
            <input
              id="input-velocity-slider"
              type="range"
              min={0}
              max={1000}
              step={1}
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 hover:accent-cyan-300"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0.0c</span>
              <span>0.5c</span>
              <span>0.9c</span>
              <span>0.999c</span>
              <span className="text-cyan-400 font-semibold">0.99999999999c (11 9s)</span>
            </div>
          </div>

          {/* Stepped "Number of 9s" Quick Select */}
          <div className="pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs mb-1.5 text-slate-400">
              <span>Stepped Precision (Nines after 0.):</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {currentNines > 0 ? `${currentNines} Nines` : 'Sub-relativistic'}
              </span>
            </div>
            <div className="grid grid-cols-6 gap-1">
              {[0, 1, 2, 4, 8, 11].map((n) => (
                <button
                  key={n}
                  id={`btn-nines-${n}`}
                  onClick={() => handleNinesChange(n)}
                  className={`py-1 rounded text-center text-xs font-mono font-medium transition ${
                    currentNines === n || (n === 0 && state.beta < 0.9)
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30'
                      : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {n === 0 ? '0c' : `${n}×9`}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Section 2: Preset Scenarios */}
        <section className="space-y-2.5">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            Physics Velocity Presets
          </label>
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {SPEED_PRESETS.map((preset) => {
              const isSelected =
                (preset.beta === 0 && state.beta === 0) ||
                (preset.delta && Math.abs(state.delta - preset.delta) < preset.delta * 0.1) ||
                (!preset.delta && Math.abs(state.beta - preset.beta) < 0.005);

              return (
                <button
                  key={preset.label}
                  id={`btn-preset-${preset.label.replace(/\s+/g, '')}`}
                  onClick={() => {
                    onStateChange((prev) => ({
                      ...prev,
                      beta: preset.beta,
                      delta: preset.delta || (1 - preset.beta),
                    }));
                  }}
                  className={`w-full text-left p-2.5 rounded-lg border transition text-xs flex items-start justify-between gap-2 ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-slate-100 shadow-md shadow-cyan-950/50'
                      : 'bg-slate-800/40 hover:bg-slate-800/80 border-slate-800 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-cyan-400">{preset.label}</span>
                      <span className="font-medium text-slate-200">{preset.name}</span>
                      {preset.badge && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {preset.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                      {preset.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* Section 3: Visual Elements & Atom Grip Points */}
        <section className="space-y-3 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            Visual Components
          </label>

          <div className="space-y-2 text-xs">
            {/* Ghost Rigid Cube Toggle */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer border border-slate-800">
              <div className="flex items-center gap-2">
                <Box className="w-4 h-4 text-slate-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Ghost Rigid Cube (L₀)</span>
                  <span className="text-[11px] text-slate-500">
                    Rest-frame uncontracted reference frame
                  </span>
                </div>
              </div>
              <input
                id="toggle-ghost-cube"
                type="checkbox"
                checked={state.showGhostCube}
                onChange={(e) =>
                  onStateChange((prev) => ({ ...prev, showGhostCube: e.target.checked }))
                }
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-cyan-500"
              />
            </label>

            {/* Atom Grid Lattice Toggle */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full border border-cyan-400 flex items-center justify-center text-[10px] text-cyan-400 font-bold">
                  ●
                </span>
                <div>
                  <span className="font-medium text-slate-200 block">Atom Grip Points Lattice</span>
                  <span className="text-[11px] text-slate-500">
                    Internal crystal nodes compressing along motion
                  </span>
                </div>
              </div>
              <input
                id="toggle-atoms"
                type="checkbox"
                checked={state.showAtoms}
                onChange={(e) =>
                  onStateChange((prev) => ({ ...prev, showAtoms: e.target.checked }))
                }
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-cyan-500"
              />
            </label>

            {/* Inter-atomic Grip Bonds Toggle */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 text-xs">☵</span>
                <div>
                  <span className="font-medium text-slate-200 block">Inter-Atomic Grip Bonds</span>
                  <span className="text-[11px] text-slate-500">
                    Bonds shorten along motion axis, rigid transversely
                  </span>
                </div>
              </div>
              <input
                id="toggle-bonds"
                type="checkbox"
                checked={state.showBonds}
                onChange={(e) =>
                  onStateChange((prev) => ({ ...prev, showBonds: e.target.checked }))
                }
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-cyan-500"
              />
            </label>

            {/* Translucent Solid Envelope */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer border border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Relativistic Surface Shell</span>
                  <span className="text-[11px] text-slate-500">
                    Translucent dielectric volume wrapper
                  </span>
                </div>
              </div>
              <input
                id="toggle-faces"
                type="checkbox"
                checked={state.showFaces}
                onChange={(e) =>
                  onStateChange((prev) => ({ ...prev, showFaces: e.target.checked }))
                }
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-cyan-500"
              />
            </label>

            {/* Calipers & Dimension Lines */}
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/40 hover:bg-slate-800/70 cursor-pointer border border-slate-800">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-cyan-400" />
                <div>
                  <span className="font-medium text-slate-200 block">Dimension Calipers</span>
                  <span className="text-[11px] text-slate-500">
                    Spatial guides & laboratory laser gates
                  </span>
                </div>
              </div>
              <input
                id="toggle-dimensions"
                type="checkbox"
                checked={state.showDimensions}
                onChange={(e) =>
                  onStateChange((prev) => ({ ...prev, showDimensions: e.target.checked }))
                }
                className="w-4 h-4 rounded bg-slate-900 border-slate-700 accent-cyan-500"
              />
            </label>
          </div>

          {/* Atom Density Grid Resolution Slider */}
          <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Atom Grid Density:</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {state.atomGridSize}×{state.atomGridSize}×{state.atomGridSize} ({Math.pow(state.atomGridSize, 3)} atoms)
              </span>
            </div>
            <input
              id="input-atom-grid-size"
              type="range"
              min={3}
              max={8}
              step={1}
              value={state.atomGridSize}
              onChange={(e) =>
                onStateChange((prev) => ({ ...prev, atomGridSize: parseInt(e.target.value) }))
              }
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </section>

        {/* Section 4: Motion Axis & Flyby Animation Controls */}
        <section className="space-y-3 pt-2 border-t border-slate-800/80">
          <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            Motion & Flight Track
          </label>

          <div className="flex items-center gap-2">
            <button
              id="btn-toggle-play"
              onClick={() =>
                onStateChange((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg font-medium text-xs transition shadow-sm ${
                state.isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400'
              }`}
            >
              {state.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Flyby</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Flyby Across Lab</span>
                </>
              )}
            </button>

            <button
              id="btn-reset-pos"
              onClick={() =>
                onStateChange((prev) => ({ ...prev, flybyProgress: 0, isPlaying: false }))
              }
              title="Reset Position"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-750 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Section 5: Mobile Web - Build Android APK via GitHub Actions */}
        {onOpenAndroidModal && (
          <section className="pt-2 border-t border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-950 border border-emerald-800/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                  Android APK on Mobile
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  GitHub Cloud Build
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Export to GitHub via the settings menu. GitHub automatically compiles the native APK with Gradle & Python in ~2 mins.
              </p>
              <button
                id="btn-sidebar-build-apk"
                onClick={onOpenAndroidModal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-md min-h-[44px]"
              >
                <Download className="w-4 h-4" />
                <span>Build & Download APK via GitHub</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </aside>
  );
};
