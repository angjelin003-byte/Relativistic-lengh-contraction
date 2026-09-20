import React from 'react';
import { X, BookOpen, Sparkles, ArrowRight, Atom, Box, Layers, HelpCircle } from 'lucide-react';
import { RelativisticMetrics } from '../types';
import { formatMetricLength } from '../utils/pythonEngine';

interface ExplainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: RelativisticMetrics;
}

export const ExplainerModal: React.FC<ExplainerModalProps> = ({ isOpen, onClose, metrics }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden text-slate-200 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h3 className="font-bold text-base text-slate-100">
              Relativistic Length Contraction Physics Guide
            </h3>
          </div>
          <button
            id="btn-close-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm leading-relaxed text-slate-300">
          {/* Live snapshot banner */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/50 flex items-center justify-between">
            <div>
              <span className="text-xs text-cyan-300 uppercase tracking-wider font-semibold block">
                Current State at β = {metrics.beta.toFixed(Math.min(11, Math.max(4, metrics.numberOfNines + 2)))} c
              </span>
              <span className="text-sm font-medium text-slate-200">
                1.00 m rest cube →{' '}
                <strong className="text-cyan-400 font-mono">
                  {formatMetricLength(metrics.lengthContracted)}
                </strong>{' '}
                (Factor of {metrics.gamma >= 1000 ? metrics.gamma.toExponential(4) : metrics.gamma.toFixed(2)}×)
              </span>
            </div>
            <div className="text-right font-mono text-xs text-slate-400">
              γ = {metrics.gamma >= 1000 ? metrics.gamma.toExponential(3) : metrics.gamma.toFixed(3)}
            </div>
          </div>

          {/* 1. The Lorentz Transformation & Spatial Contraction */}
          <section className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-400" />
              1. What is Relativistic Length Contraction?
            </h4>
            <p>
              In Einstein’s Special Relativity (1905), the speed of light $c$ is invariant for all inertial observers.
              Because time runs slower for a moving object ($\Delta t&apos; = \gamma \Delta t$), measuring the endpoints
              of a moving object simultaneously in the stationary laboratory frame yields a contracted length:
            </p>
            <div className="p-3 rounded-lg bg-slate-950 font-mono text-center text-cyan-300 border border-slate-800 text-sm">
              L = L₀ √(1 - v²/c²) = L₀ / γ
            </div>
            <p className="text-xs text-slate-400">
              Notice that contraction is <em>purely longitudinal</em>: dimensions perpendicular to the direction of motion
              ($y$ and $z$) experience zero contraction ($L_\perp = L_0$).
            </p>
          </section>

          {/* 2. Atomic Grip Points Lattice */}
          <section className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <Atom className="w-4 h-4 text-cyan-400" />
              2. Atom Grip Points & Crystal Lattice Compression
            </h4>
            <p>
              Inside solid matter, atoms are bound by electromagnetic field forces. In the observer’s frame,
              the Coulomb fields of moving charges compress into flattened pancakes (Heaviside ellipsoids).
            </p>
            <p>
              As a result, the distance between adjacent atom planes along the motion axis shrinks by exactly
              $1/\gamma$. Consequently, the number density of atoms increases:
            </p>
            <div className="p-2.5 rounded-lg bg-slate-950 font-mono text-center text-cyan-300 border border-slate-800 text-xs">
              ρ(v) = ρ₀ × γ
            </div>
            <p className="text-xs text-slate-400">
              The transparent grip points in this visualizer demonstrate how atomic crystal planes squeeze
              tightly together while maintaining their full transverse spacing.
            </p>
          </section>

          {/* 3. The 0.99999999999 c Extreme Limit */}
          <section className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              3. The 0.99999999999 c Ultra-Relativistic Limit (11 Nines)
            </h4>
            <p>
              When an object approaches $\beta = 0.99999999999$ ($1 - 10^{-11}$):
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-300">
              <li>
                <strong>Lorentz factor γ:</strong> jumps to approximately <strong>223,607</strong>!
              </li>
              <li>
                <strong>Contracted thickness:</strong> A 1-meter rest cube compresses into a microscopic blade of{' '}
                <strong>4.47 micrometers (µm)</strong>.
              </li>
              <li>
                <strong>Size comparison:</strong> A human red blood cell is ~7 µm wide; this 1-meter solid block becomes
                thinner than a red blood cell!
              </li>
              <li>
                <strong>Kinetic Energy:</strong> Accelerating a 1 kg cube to this velocity requires{' '}
                <strong>2.01 × 10²² Joules</strong> of energy (equivalent to thousands of megatons of TNT).
              </li>
            </ul>
          </section>

          {/* 4. Terrell-Penrose Rotation (Visual vs Spatial Reality) */}
          <section className="space-y-2">
            <h4 className="font-semibold text-slate-100 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              4. Length Contraction vs. What a Camera Sees (Terrell-Penrose Effect)
            </h4>
            <p>
              There is an essential distinction between <strong>simultaneous spatial coordinate measurement</strong> (what
              the Lorentz contraction formula describes) and <strong>photographic observation</strong>:
            </p>
            <p className="text-xs text-slate-400">
              When you take a photograph of a rapidly moving cube, light emitted from the far rear corners takes longer to
              reach the lens than light from the front. Because the rear is seen from earlier in its flight path, the cube
              photographically appears <em>rotated</em> rather than squished flat on optical film!
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            id="btn-close-modal-bottom"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs transition"
          >
            Got it, back to simulation
          </button>
        </div>
      </div>
    </div>
  );
};
