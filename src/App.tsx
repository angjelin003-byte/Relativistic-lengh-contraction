import React, { useState, useMemo, useEffect } from 'react';
import { RelativisticState, RelativisticMetrics } from './types';
import {
  calculateMetrics,
  DEFAULT_PYTHON_SCRIPT,
  initPyodide,
} from './utils/pythonEngine';
import { ThreeVisualizer } from './components/ThreeVisualizer';
import { ControlPanel } from './components/ControlPanel';
import { MetricsDashboard } from './components/MetricsDashboard';
import { Header } from './components/Header';
import { ExplainerModal } from './components/ExplainerModal';
import { AndroidExportModal } from './components/AndroidExportModal';

export default function App() {
  const [state, setState] = useState<RelativisticState>({
    beta: 0.8660254, // 50% length contraction (gamma = 2.0) as default starter
    delta: 1 - 0.8660254,
    motionAxis: 'x',
    referenceFrame: 'lab',
    showGhostCube: true,
    showAtoms: true,
    showBonds: true,
    showFaces: true,
    showDimensions: true,
    showLightClock: false,
    showTerrellEffect: false,
    atomGridSize: 5,
    atomRadius: 0.05,
    isPlaying: false,
    playbackSpeed: 1.0,
    flybyProgress: 0,
    viewMode: 'physical',
    magnificationFactor: 1.0,
  });

  const [pythonScript, setPythonScript] = useState<string>(DEFAULT_PYTHON_SCRIPT);
  const [customMetricsOverride, setCustomMetricsOverride] = useState<RelativisticMetrics | null>(null);
  const [isExplainerOpen, setIsExplainerOpen] = useState(false);
  const [isAndroidModalOpen, setIsAndroidModalOpen] = useState(false);

  // Initialize Pyodide WebAssembly Python in the background if available
  useEffect(() => {
    initPyodide();
  }, []);

  // Compute live relativistic metrics via Python engine
  const metrics = useMemo(() => {
    if (customMetricsOverride) {
      return customMetricsOverride;
    }
    // If in cube's rest frame, effective beta observed on the cube is 0
    const effectiveBeta = state.referenceFrame === 'cube' ? 0 : state.beta;
    const effectiveDelta = state.referenceFrame === 'cube' ? 1 : state.delta;
    return calculateMetrics(effectiveBeta, effectiveDelta, 1.0);
  }, [state.beta, state.delta, state.referenceFrame, customMetricsOverride]);

  const handleStateChange = (updater: (prev: RelativisticState) => RelativisticState) => {
    setCustomMetricsOverride(null);
    setState(updater);
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none font-sans">
      {/* Header */}
      <Header
        state={state}
        onStateChange={handleStateChange}
        onOpenExplainer={() => setIsExplainerOpen(true)}
        onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
      />

      {/* Main 3D Stage & Control Panel Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative">
        {/* 3D WebGL Canvas Viewport */}
        <main className="flex-1 relative h-[55vh] lg:h-full min-h-0">
          <ThreeVisualizer
            state={state}
            onStateChange={handleStateChange}
            metrics={metrics}
            onMetricsUpdate={setCustomMetricsOverride}
            pythonScript={pythonScript}
            onPythonScriptChange={setPythonScript}
          />

          {/* Rest Frame Banner (if user selected Cube Rest Frame) */}
          {state.referenceFrame === 'cube' && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 bg-blue-950/90 border border-blue-600/80 px-4 py-2 rounded-xl text-xs text-blue-200 shadow-2xl backdrop-blur-md max-w-md text-center">
              <span className="font-bold text-white block mb-0.5">
                Cube Co-Moving Rest Frame (S&apos;)
              </span>
              In its own rest frame, the cube experiences <strong>no deformation</strong> (L = L₀).
              Instead, the outside laboratory, laser gates, and observer are rushing past at -v and contracting!
            </div>
          )}
        </main>

        {/* Right Sidebar Control Panel */}
        <ControlPanel
          state={state}
          onStateChange={handleStateChange}
          metrics={metrics}
          onOpenExplainer={() => setIsExplainerOpen(true)}
          onOpenAndroidModal={() => setIsAndroidModalOpen(true)}
        />
      </div>

      {/* Bottom Live Relativistic Metrics Bar */}
      <MetricsDashboard metrics={metrics} state={state} />

      {/* Educational Physics Modal */}
      <ExplainerModal
        isOpen={isExplainerOpen}
        onClose={() => setIsExplainerOpen(false)}
        metrics={metrics}
      />

      {/* Android & Python GitHub Export Modal */}
      <AndroidExportModal
        isOpen={isAndroidModalOpen}
        onClose={() => setIsAndroidModalOpen(false)}
      />
    </div>
  );
}
