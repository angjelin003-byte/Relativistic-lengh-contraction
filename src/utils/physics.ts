import { RelativisticMetrics } from '../types';

export const SPEED_OF_LIGHT = 299792.458; // km/s

/**
 * Calculates Lorentz factor gamma with high numerical stability
 * even when beta = 0.99999999999 (11 nines).
 */
export function calculateGamma(beta: number, deltaOverride?: number): number {
  if (beta <= 0) return 1.0;
  
  // Use delta = 1 - beta to avoid catastrophic cancellation in 1 - beta^2
  let delta = deltaOverride;
  if (delta === undefined || delta <= 0) {
    delta = Math.max(0, 1 - beta);
  }
  
  if (delta <= 1e-15) {
    // Clamped close to light speed
    delta = 1e-15;
  }
  
  // 1 - beta^2 = (1 - beta)(1 + beta) = delta * (2 - delta)
  const denomSq = delta * (2 - delta);
  if (denomSq <= 0) return 1e8; // cap
  
  return 1 / Math.sqrt(denomSq);
}

/**
 * Count how many consecutive 9s are after the decimal point in beta
 */
export function countNines(beta: number): number {
  if (beta < 0.9) return 0;
  const str = beta.toFixed(14);
  const decimalPart = str.split('.')[1] || '';
  let count = 0;
  for (const char of decimalPart) {
    if (char === '9') count++;
    else break;
  }
  return count;
}

/**
 * Creates beta value from number of nines (e.g. 11 nines -> 0.99999999999)
 */
export function betaFromNines(n: number): { beta: number; delta: number } {
  if (n <= 0) return { beta: 0, delta: 1 };
  const delta = Math.pow(10, -n);
  const beta = 1 - delta;
  return { beta, delta };
}

export function calculateMetrics(
  beta: number,
  delta?: number,
  restLengthMeters: number = 1.0
): RelativisticMetrics {
  const gamma = calculateGamma(beta, delta);
  const lengthContracted = restLengthMeters / gamma;
  const volumeRatio = 1 / gamma;
  const atomDensityRatio = gamma;
  const timeDilationRatio = gamma;
  const kineticEnergyRestRatio = gamma - 1;
  const velocityKmPerS = beta * SPEED_OF_LIGHT;
  const numberOfNines = countNines(beta);

  return {
    beta,
    gamma,
    lengthRest: restLengthMeters,
    lengthContracted,
    volumeRatio,
    atomDensityRatio,
    timeDilationRatio,
    kineticEnergyRestRatio,
    velocityKmPerS,
    numberOfNines,
  };
}

/**
 * Formats lengths in human-friendly scientific or metric units
 */
export function formatMetricLength(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`;
  }
  if (meters >= 0.01) {
    return `${(meters * 100).toFixed(2)} cm (${meters.toFixed(4)} m)`;
  }
  if (meters >= 0.001) {
    return `${(meters * 1000).toFixed(2)} mm`;
  }
  if (meters >= 1e-6) {
    return `${(meters * 1e6).toFixed(2)} µm (microns)`;
  }
  if (meters >= 1e-9) {
    return `${(meters * 1e9).toFixed(2)} nm (nanometers)`;
  }
  if (meters >= 1e-12) {
    return `${(meters * 1e12).toFixed(2)} pm (picometers)`;
  }
  return `${meters.toExponential(4)} m`;
}

export interface SpeedPreset {
  label: string;
  name: string;
  beta: number;
  delta?: number;
  description: string;
  badge?: string;
}

export const SPEED_PRESETS: SpeedPreset[] = [
  {
    label: '0.0 c',
    name: 'Rest Frame (Observer)',
    beta: 0,
    description: 'Reference cube at absolute rest. Gamma = 1.0, zero deformation.',
  },
  {
    label: '0.50 c',
    name: 'Relativistic Threshold',
    beta: 0.5,
    description: 'Half light speed. Noticeable 13.4% contraction (gamma = 1.155).',
  },
  {
    label: '0.866 c',
    name: '50% Contraction (γ = 2.0)',
    beta: 0.8660254,
    description: 'Exact 2x contraction. Cube length along motion is halved.',
  },
  {
    label: '0.99 c',
    name: 'Muon Cosmic Ray',
    beta: 0.99,
    description: 'Flattens to ~14.1% original width (gamma = 7.09).',
  },
  {
    label: '0.9999 c',
    name: 'Particle Accelerator (LHC Injection)',
    beta: 0.9999,
    delta: 1e-4,
    description: 'Heavy flattening by 70.7x (gamma = 70.7). Atom spacing compressed.',
  },
  {
    label: '0.999999 c',
    name: '6 Nines (Ultra-Relativistic)',
    beta: 0.999999,
    delta: 1e-6,
    description: 'Flattens by 707x. Ghost cube reveals dramatic original geometry.',
  },
  {
    label: '0.99999999999 c',
    name: '11 Nines (Extreme Relativistic Limit)',
    beta: 0.99999999999,
    delta: 1e-11,
    description: 'Target query limit: gamma = 223,607! 1m cube flattens to 4.47 microns!',
    badge: 'Requested Limit',
  },
];
