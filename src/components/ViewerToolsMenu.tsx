import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Sliders,
  Camera,
  Play,
  RotateCcw,
  Copy,
  Download,
  Check,
  Layers,
  Grid,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Maximize2,
  Minimize2,
  Compass,
  FileCode,
} from 'lucide-react';
import { RelativisticState, RelativisticMetrics, MotionAxis } from '../types';
import {
  DEFAULT_PYTHON_SCRIPT,
  executePythonScript,
  formatMetricLength,
} from '../utils/pythonEngine';

interface ViewerToolsMenuProps {
  state: RelativisticState;
  onStateChange: (updater: (prev: RelativisticState) => RelativisticState) => void;
  metrics: RelativisticMetrics;
  onMetricsUpdate?: (metrics: RelativisticMetrics) => void;
  onCameraPreset?: (preset: 'iso' | 'side' | 'front' | 'top' | 'macro') => void;
  onResetCamera?: () => void;
  onCaptureSnapshot?: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: (val: boolean) => void;
  showAxes: boolean;
  onToggleShowAxes: (val: boolean) => void;
  showGrid: boolean;
  onToggleShowGrid: (val: boolean) => void;
  pythonScript: string;
  onPythonScriptChange: (newScript: string) => void;
}

export const ViewerToolsMenu: React.FC<ViewerToolsMenuProps> = ({
  state,
  onStateChange,
  metrics,
  onMetricsUpdate,
  onCameraPreset,
  onResetCamera,
  onCaptureSnapshot,
  autoRotate,
  onToggleAutoRotate,
  showAxes,
  onToggleShowAxes,
  showGrid,
  onToggleShowGrid,
  pythonScript,
  onPythonScriptChange,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'editor' | 'tools'>('editor');
  const [isCopied, setIsCopied] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [consoleOutput, setConsoleOutput] = useState<string>(
    `[Python Engine: engine.py loaded]\n• Lorentz γ = ${metrics.gamma.toFixed(4)}\n• Contracted L = ${formatMetricLength(metrics.lengthContracted)}\n• Atom Packing = ${metrics.atomDensityRatio.toFixed(2)}x`
  );
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [execTime, setExecTime] = useState<number>(0.6);

  // Quick code templates for Python script
  const handleLoadSnippet = (type: 'standard' | 'extreme' | 'doppler' | 'custom_atom') => {
    if (type === 'standard') {
      onPythonScriptChange(DEFAULT_PYTHON_SCRIPT);
    } else if (type === 'extreme') {
      const code = DEFAULT_PYTHON_SCRIPT.replace(
        'def run_simulation(beta=0.8660254, delta=None, axis=\'x\', grid_size=5):',
        '# Preset: Extreme 11 Nines (0.99999999999 c)\ndef run_simulation(beta=0.99999999999, delta=1e-11, axis=\'x\', grid_size=5):'
      );
      onPythonScriptChange(code);
    } else if (type === 'doppler') {
      const extra = `\n\n# Custom Doppler relativistic frequency shift calculation\ndef calculate_doppler_factor(beta):\n    return math.sqrt((1.0 - beta) / (1.0 + beta))\n\nprint("Doppler Factor at beta =", calculate_doppler_factor(${state.beta}))\n`;
      onPythonScriptChange(DEFAULT_PYTHON_SCRIPT + extra);
    } else if (type === 'custom_atom') {
      const mod = DEFAULT_PYTHON_SCRIPT.replace('grid_size=5', 'grid_size=7');
      onPythonScriptChange(mod);
    }
  };

  const handleRunPython = async () => {
    setIsExecuting(true);
    setExecutionError(null);
    try {
      const result = await executePythonScript(
        pythonScript,
        state.beta,
        state.delta,
        state.motionAxis,
        state.atomGridSize,
        1.0
      );

      setConsoleOutput(result.stdout || 'Python executed successfully (0 errors)');
      setExecTime(result.executionTimeMs);

      if (result.error) {
        setExecutionError(result.error);
      } else if (onMetricsUpdate && result.metrics) {
        onMetricsUpdate(result.metrics);
      }
    } catch (err: any) {
      setExecutionError(err?.message || 'Error executing Python code');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(pythonScript);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonScript], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relativistic_engine.py';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="absolute top-4 right-4 z-30 flex flex-col items-end pointer-events-none">
      {/* Fold / Unfold Floating Action Button */}
      <button
        id="btn-toggle-tools-menu"
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 shadow-2xl backdrop-blur-md transition text-xs font-semibold"
      >
        <Code2 className="w-4 h-4 text-cyan-400" />
        <span>Python & Viewer Tools</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400 ml-1" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
        )}
      </button>

      {/* Foldable Content Panel */}
      {isOpen && (
        <div className="pointer-events-auto mt-2 w-[92vw] sm:w-[460px] md:w-[500px] max-h-[72vh] flex flex-col rounded-2xl bg-slate-950/95 border border-slate-800/90 shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-top-2">
          {/* Header & Tabs */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-slate-900/60">
            <div className="flex items-center gap-1.5 p-1 rounded-lg bg-slate-950/70 border border-slate-800">
              <button
                id="tab-tools-editor"
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'editor'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Python Script Editor</span>
              </button>
              <button
                id="tab-tools-viewer"
                onClick={() => setActiveTab('tools')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                  activeTab === 'tools'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Viewer Tools & Optics</span>
              </button>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              title="Fold Menu"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab 1: Python Script Editor */}
          {activeTab === 'editor' && (
            <div className="flex-1 flex flex-col p-3 gap-2.5 overflow-hidden text-xs">
              {/* Controls bar */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400 flex items-center gap-1">
                    <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                    engine.py
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Python 3.10
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    id="btn-copy-python"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition"
                    title="Copy Python Code"
                  >
                    {isCopied ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                  <button
                    id="btn-download-python"
                    onClick={handleDownloadPython}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition"
                    title="Download .py Script"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download</span>
                  </button>
                  <button
                    id="btn-reset-python"
                    onClick={() => handleLoadSnippet('standard')}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-[11px] transition"
                    title="Reset to Default Script"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                </div>
              </div>

              {/* Code Snippet Quick Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                <span className="text-slate-500 whitespace-nowrap">Templates:</span>
                <button
                  onClick={() => handleLoadSnippet('standard')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  Standard Lorentz
                </button>
                <button
                  onClick={() => handleLoadSnippet('extreme')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  11-Nines Extreme
                </button>
                <button
                  onClick={() => handleLoadSnippet('doppler')}
                  className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
                >
                  Doppler Optics
                </button>
              </div>

              {/* Live Editable Textarea */}
              <div className="relative flex-1 min-h-[190px] max-h-[260px] rounded-xl border border-slate-800 bg-slate-950 font-mono text-[11px] leading-relaxed overflow-hidden flex">
                <textarea
                  id="python-code-editor"
                  value={pythonScript}
                  onChange={(e) => onPythonScriptChange(e.target.value)}
                  spellCheck={false}
                  className="w-full h-full p-3 bg-transparent text-emerald-300/90 resize-none outline-none font-mono selection:bg-cyan-500/30 overflow-auto"
                />
              </div>

              {/* Action Bar & Run Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-400">
                  Execution time: <strong className="text-slate-200">{execTime.toFixed(1)} ms</strong>
                </span>

                <button
                  id="btn-run-python-script"
                  onClick={handleRunPython}
                  disabled={isExecuting}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{isExecuting ? 'Running...' : 'Run Python Script'}</span>
                </button>
              </div>

              {/* Console Output Terminal */}
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-2.5 text-[11px] font-mono max-h-[90px] overflow-y-auto space-y-1">
                <div className="flex items-center justify-between text-slate-500 text-[10px] pb-1 border-b border-slate-800">
                  <span>PYTHON STDOUT / CONSOLE</span>
                  <span className="text-emerald-400">Exit Code: 0</span>
                </div>
                {executionError ? (
                  <div className="text-rose-400 font-semibold">{executionError}</div>
                ) : (
                  <pre className="text-slate-300 whitespace-pre-wrap">{consoleOutput}</pre>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Viewer Tools & Optics */}
          {activeTab === 'tools' && (
            <div className="flex-1 flex flex-col p-3 gap-3 overflow-y-auto max-h-[58vh] text-xs">
              {/* Section: Camera & Viewing Angles */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between text-slate-300 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <Camera className="w-4 h-4 text-purple-400" />
                    Camera Presets & Orbit
                  </span>
                  {onResetCamera && (
                    <button
                      onClick={onResetCamera}
                      className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    onClick={() => onCameraPreset && onCameraPreset('iso')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-medium transition"
                  >
                    Perspective
                  </button>
                  <button
                    onClick={() => onCameraPreset && onCameraPreset('side')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-medium transition"
                  >
                    Side Profile
                  </button>
                  <button
                    onClick={() => onCameraPreset && onCameraPreset('front')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-medium transition"
                  >
                    Head-On Front
                  </button>
                  <button
                    onClick={() => onCameraPreset && onCameraPreset('top')}
                    className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-center font-medium transition"
                  >
                    Top-Down
                  </button>
                  <button
                    onClick={() => onCameraPreset && onCameraPreset('macro')}
                    className="py-1.5 px-2 rounded-lg bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 text-center font-medium border border-purple-800/50 transition col-span-2"
                  >
                    Macro Wafer Zoom
                  </button>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/60">
                  <span className="text-slate-400 text-[11px]">Auto-Rotate Simulation:</span>
                  <button
                    onClick={() => onToggleAutoRotate(!autoRotate)}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      autoRotate
                        ? 'bg-cyan-500 text-slate-950 shadow-sm'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {autoRotate ? 'Enabled' : 'Disabled'}
                  </button>
                </div>
              </div>

              {/* Section: Measurement & Spatial Guides */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  Spatial Reference & Guides
                </span>

                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 cursor-pointer transition">
                    <span className="text-slate-300">Ground Grid Floor</span>
                    <input
                      type="checkbox"
                      checked={showGrid}
                      onChange={(e) => onToggleShowGrid(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 cursor-pointer transition">
                    <span className="text-slate-300">XYZ Coordinate Axes</span>
                    <input
                      type="checkbox"
                      checked={showAxes}
                      onChange={(e) => onToggleShowAxes(e.target.checked)}
                      className="rounded accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 cursor-pointer transition">
                    <span className="text-slate-300">Ghost Rest Cube (L₀)</span>
                    <input
                      type="checkbox"
                      checked={state.showGhostCube}
                      onChange={(e) =>
                        onStateChange((prev) => ({ ...prev, showGhostCube: e.target.checked }))
                      }
                      className="rounded accent-cyan-500"
                    />
                  </label>
                  <label className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800/80 cursor-pointer transition">
                    <span className="text-slate-300">Laser Sensor Gates</span>
                    <input
                      type="checkbox"
                      checked={state.showDimensions}
                      onChange={(e) =>
                        onStateChange((prev) => ({ ...prev, showDimensions: e.target.checked }))
                      }
                      className="rounded accent-cyan-500"
                    />
                  </label>
                </div>
              </div>

              {/* Section: Atom Lattice & Bonds */}
              <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 space-y-2.5">
                <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Atom Grip Points & Packing Density
                </span>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Show Internal Grip Points:</span>
                  <button
                    onClick={() =>
                      onStateChange((prev) => ({ ...prev, showAtoms: !prev.showAtoms }))
                    }
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      state.showAtoms
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {state.showAtoms ? 'Visible' : 'Hidden'}
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Lattice Bond Lines:</span>
                  <button
                    onClick={() =>
                      onStateChange((prev) => ({ ...prev, showBonds: !prev.showBonds }))
                    }
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                      state.showBonds
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {state.showBonds ? 'Connected' : 'Points Only'}
                  </button>
                </div>

                <div className="space-y-1 pt-1 border-t border-slate-800/60">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Lattice Grid Size:</span>
                    <span className="font-mono text-cyan-300">
                      {state.atomGridSize}×{state.atomGridSize}×{state.atomGridSize} (
                      {state.atomGridSize ** 3} atoms)
                    </span>
                  </div>
                  <input
                    type="range"
                    min={3}
                    max={8}
                    step={1}
                    value={state.atomGridSize}
                    onChange={(e) =>
                      onStateChange((prev) => ({ ...prev, atomGridSize: Number(e.target.value) }))
                    }
                    className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
                  />
                </div>
              </div>

              {/* Section: Snapshot & Export */}
              <div className="pt-1 flex gap-2">
                {onCaptureSnapshot && (
                  <button
                    onClick={onCaptureSnapshot}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold flex items-center justify-center gap-1.5 transition text-xs border border-slate-700"
                  >
                    <Camera className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Capture PNG Snapshot</span>
                  </button>
                )}
                <button
                  onClick={handleDownloadPython}
                  className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold flex items-center justify-center gap-1.5 transition text-xs border border-emerald-500/40"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export .py</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
