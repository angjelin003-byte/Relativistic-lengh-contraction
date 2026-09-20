import React from 'react';
import {
  Zap,
  Maximize2,
  Minimize2,
  Atom,
  Clock,
  Flame,
  Info,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { RelativisticMetrics, RelativisticState } from '../types';
import { formatMetricLength } from '../utils/physics';

interface MetricsDashboardProps {
  metrics: RelativisticMetrics;
  state: RelativisticState;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics, state }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);

  // Determine physical scale comparison for intuition
  const getIntuitiveComparison = (lengthMeters: number) => {
    if (lengthMeters >= 0.99) return 'Identical to rest cube';
    if (lengthMeters >= 0.5) return 'Similar to a book spine';
    if (lengthMeters >= 0.1) return 'Thickness of an encyclopedia';
    if (lengthMeters >= 0.01) return 'Thickness of a credit card / coin stack';
    if (lengthMeters >= 0.001) return 'Thickness of a standard postage stamp';
    if (lengthMeters >= 100e-6) return 'Thickness of a single strand of human hair (~100 µm)';
    if (lengthMeters >= 10e-6) return 'Diameter of a human skin cell (~30 µm)';
    if (lengthMeters >= 4e-6) return 'Thinner than a human red blood cell (~7 µm)!';
    if (lengthMeters >= 1e-6) return 'Scale of a bacterium (~1 µm)';
    if (lengthMeters >= 100e-9) return 'Scale of a virus particle (~100 nm)';
    return 'Approaching atomic & molecular lattice limits!';
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-t border-slate-800 text-slate-200">
      {/* Collapsible Bar Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/50 transition border-b border-slate-800/40 select-none"
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-xs tracking-wider uppercase text-slate-100">
              Relativistic Metrics & Lorentz Invariants
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-400 border border-slate-700">
              γ = {metrics.gamma >= 1000 ? metrics.gamma.toExponential(4) : metrics.gamma.toFixed(4)}
            </span>
            <span className="px-2 py-0.5 rounded bg-slate-800 font-mono text-cyan-300 border border-slate-700">
              L = {formatMetricLength(metrics.lengthContracted)}
            </span>
            <span className="text-[11px] text-slate-400">
              ({getIntuitiveComparison(metrics.lengthContracted)})
            </span>
          </div>
        </div>

        <button
          id="btn-toggle-metrics-panel"
          className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1"
        >
          <span className="text-[11px]">{isExpanded ? 'Collapse' : 'Expand'}</span>
          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Metrics Grid */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* 1. Lorentz Factor Gamma */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Lorentz Factor (γ)</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="font-mono text-base font-bold text-cyan-400 my-1 truncate">
              {metrics.gamma >= 1000 ? metrics.gamma.toExponential(5) : metrics.gamma.toFixed(4)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              γ = 1 / √(1 - β²)
            </div>
          </div>

          {/* 2. Contracted Length L */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Length along {state.motionAxis.toUpperCase()}</span>
              <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="font-mono text-base font-bold text-cyan-300 my-1 truncate">
              {formatMetricLength(metrics.lengthContracted)}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              L = L₀ / γ (L₀ = 1.00 m)
            </div>
          </div>

          {/* 3. Transverse Dimensions */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Transverse Dimensions</span>
              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            </div>
            <div className="font-mono text-base font-bold text-slate-200 my-1 truncate">
              1.0000 m (100%)
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              L⊥ = L₀ (No transverse contraction)
            </div>
          </div>

          {/* 4. Atomic Density Ratio */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Atomic Packing (ρ)</span>
              <Atom className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="font-mono text-base font-bold text-cyan-400 my-1 truncate">
              {metrics.atomDensityRatio >= 1000
                ? `${metrics.atomDensityRatio.toExponential(3)}×`
                : `${metrics.atomDensityRatio.toFixed(2)}×`}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              ρ = ρ₀ × γ (Compressed layers)
            </div>
          </div>

          {/* 5. Time Dilation Factor */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Cube Clock Slowdown</span>
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="font-mono text-base font-bold text-slate-200 my-1 truncate">
              {metrics.timeDilationRatio >= 1000
                ? `${metrics.timeDilationRatio.toExponential(3)}×`
                : `${metrics.timeDilationRatio.toFixed(2)}×`}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              Δt' = γ × Δt (Dilation)
            </div>
          </div>

          {/* 6. Kinetic Energy vs Rest Mass */}
          <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="font-medium">Kinetic / Rest Energy</span>
              <Flame className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="font-mono text-base font-bold text-amber-400 my-1 truncate">
              {metrics.kineticEnergyRestRatio >= 1000
                ? `${metrics.kineticEnergyRestRatio.toExponential(3)} E₀`
                : `${metrics.kineticEnergyRestRatio.toFixed(3)} E₀`}
            </div>
            <div className="text-[11px] text-slate-500 font-mono">
              E_k = (γ - 1) m₀ c²
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
