export type MotionAxis = 'x' | 'y' | 'z';

export type ReferenceFrame = 'lab' | 'cube';

export type ViewMode = 'physical' | 'magnified' | 'cross_section';

export interface RelativisticState {
  // beta = v / c
  beta: number;
  // delta = 1 - beta (useful for ultra-relativistic precision up to 11 nines)
  delta: number;
  motionAxis: MotionAxis;
  referenceFrame: ReferenceFrame;
  
  // Visual toggles
  showGhostCube: boolean;
  showAtoms: boolean;
  showBonds: boolean;
  showFaces: boolean;
  showDimensions: boolean;
  showLightClock: boolean;
  showTerrellEffect: boolean;
  
  // Atom lattice resolution (e.g. 5x5x5 = 125 atoms)
  atomGridSize: number; // 3 to 10
  atomRadius: number;
  
  // Animation / flyby
  isPlaying: boolean;
  playbackSpeed: number;
  flybyProgress: number; // -10 to +10 along axis
  
  // Visual scaling mode for extreme relativistic speeds (where gamma > 100)
  viewMode: ViewMode;
  magnificationFactor: number; // when gamma is huge, optionally magnify thickness on screen so user can still see atoms
}

export interface RelativisticMetrics {
  beta: number;
  gamma: number;
  lengthRest: number; // L0 in meters
  lengthContracted: number; // L in meters
  volumeRatio: number; // V / V0 = 1 / gamma
  atomDensityRatio: number; // rho / rho0 = gamma
  timeDilationRatio: number; // dt' / dt = gamma
  kineticEnergyRestRatio: number; // (gamma - 1)
  velocityKmPerS: number;
  numberOfNines: number;
}
