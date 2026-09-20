import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RelativisticState, RelativisticMetrics, MotionAxis } from '../types';
import { calculateMetrics, formatMetricLength } from '../utils/physics';

interface ThreeVisualizerProps {
  state: RelativisticState;
  onStateChange: (updater: (prev: RelativisticState) => RelativisticState) => void;
  metrics: RelativisticMetrics;
}

export const ThreeVisualizer: React.FC<ThreeVisualizerProps> = ({
  state,
  onStateChange,
  metrics,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Group references
  const movingCubeGroupRef = useRef<THREE.Group | null>(null);
  const ghostCubeGroupRef = useRef<THREE.Group | null>(null);
  const atomLatticeRef = useRef<THREE.InstancedMesh | null>(null);
  const ghostAtomsRef = useRef<THREE.InstancedMesh | null>(null);
  const latticeBondsRef = useRef<THREE.LineSegments | null>(null);
  const ghostBondsRef = useRef<THREE.LineSegments | null>(null);
  const solidCubeMeshRef = useRef<THREE.Mesh | null>(null);
  const cubeEdgesRef = useRef<THREE.LineSegments | null>(null);
  const velocityArrowRef = useRef<THREE.ArrowHelper | null>(null);
  const measurementGroupRef = useRef<THREE.Group | null>(null);
  const laserGateGroupRef = useRef<THREE.Group | null>(null);

  const [activeCameraView, setActiveCameraView] = useState<'iso' | 'side' | 'front' | 'top' | 'macro'>('iso');

  // Base rest dimension in Three.js units (2 units = 1.0 meter)
  const CUBE_SIZE = 2.0;

  // Calculate visual scale factor along contraction axis
  // For extreme gamma (up to 223,607), true scale is 2 / 223607 = ~0.0000089 units.
  // In 'magnified' mode, we give it a logarithmic boost so the packed atom planes are visibly distinguishable.
  const visualContractionFactor = React.useMemo(() => {
    const trueFactor = 1 / metrics.gamma;
    if (state.viewMode === 'physical') {
      // True physical scale, clamped to a tiny minimum for GPU line visibility
      return Math.max(trueFactor, 0.0001);
    }
    if (state.viewMode === 'magnified') {
      // Magnified view for ultra-relativistic inspection
      if (metrics.gamma > 50) {
        // Log-scaled magnification so ultra-thin layers can still be visually inspected
        const logGamma = Math.log10(metrics.gamma);
        return Math.max(0.04, 1 / (1 + logGamma * 4));
      }
      return trueFactor;
    }
    // Cross section mode
    return Math.max(trueFactor, 0.02);
  }, [metrics.gamma, state.viewMode]);

  // Set camera preset
  const setCameraPreset = useCallback((view: 'iso' | 'side' | 'front' | 'top' | 'macro') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;

    setActiveCameraView(view);
    const dist = 5.2;

    switch (view) {
      case 'iso':
        camera.position.set(3.6, 2.8, 3.8);
        controls.target.set(0, 0, 0);
        break;
      case 'side':
        // Profile view looking directly perpendicular to the contraction axis
        if (state.motionAxis === 'x') {
          camera.position.set(0, 0.5, 5.0);
        } else if (state.motionAxis === 'y') {
          camera.position.set(5.0, 0, 0.5);
        } else {
          camera.position.set(5.0, 0.5, 0);
        }
        controls.target.set(0, 0, 0);
        break;
      case 'front':
        // Head-on view looking down the motion vector
        if (state.motionAxis === 'x') {
          camera.position.set(5.0, 0, 0);
        } else if (state.motionAxis === 'y') {
          camera.position.set(0, 5.0, 0);
        } else {
          camera.position.set(0, 0, 5.0);
        }
        controls.target.set(0, 0, 0);
        break;
      case 'top':
        camera.position.set(0, 5.5, 0.001);
        controls.target.set(0, 0, 0);
        break;
      case 'macro':
        // Close-up macro on the flattened wafer
        camera.position.set(0.8, 0.4, 1.2);
        controls.target.set(0, 0, 0);
        break;
    }
    controls.update();
  }, [state.motionAxis]);

  // Initialize Three.js Scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Atmospheric deep space background with faint relativistic cosmic dust
    scene.background = new THREE.Color(0x0a0c14);
    scene.fog = new THREE.FogExp2(0x0a0c14, 0.04);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.01, 100);
    camera.position.set(3.6, 2.8, 3.8);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxDistance = 25;
    controls.minDistance = 0.4;
    controlsRef.current = controls;

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0x70b0ff, 1.8);
    keyLight.position.set(5, 8, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x00ffff, 1.4);
    rimLight.position.set(-5, -3, -5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0x38bdf8, 1.2, 15);
    fillLight.position.set(0, 3, 2);
    scene.add(fillLight);

    // Subtle spatial grid floor
    const gridHelper = new THREE.GridHelper(16, 32, 0x1e293b, 0x0f172a);
    gridHelper.position.y = -1.5;
    scene.add(gridHelper);

    // Laser measurement gates along the track
    const laserGroup = new THREE.Group();
    laserGateGroupRef.current = laserGroup;
    scene.add(laserGroup);

    // Create moving cube parent group
    const movingGroup = new THREE.Group();
    movingCubeGroupRef.current = movingGroup;
    scene.add(movingGroup);

    // Create ghost cube parent group
    const ghostGroup = new THREE.Group();
    ghostCubeGroupRef.current = ghostGroup;
    scene.add(ghostGroup);

    // Measurement calipers group
    const measurementGroup = new THREE.Group();
    measurementGroupRef.current = measurementGroup;
    scene.add(measurementGroup);

    // Velocity arrow indicator
    const arrowDir = new THREE.Vector3(1, 0, 0);
    const arrowOrigin = new THREE.Vector3(0, 1.4, 0);
    const arrow = new THREE.ArrowHelper(arrowDir, arrowOrigin, 1.8, 0x38bdf8, 0.35, 0.22);
    velocityArrowRef.current = arrow;
    scene.add(arrow);

    // Resize handler
    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // Animation Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Flyby animation if playing
      if (state.isPlaying && movingCubeGroupRef.current) {
        onStateChange((prev) => {
          let nextProgress = prev.flybyProgress + prev.playbackSpeed * delta * 2.5;
          if (nextProgress > 6) nextProgress = -6;
          return { ...prev, flybyProgress: nextProgress };
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Update Moving Cube Geometry, Face Shaders & Edges
  useEffect(() => {
    const movingGroup = movingCubeGroupRef.current;
    if (!movingGroup) return;

    // Clean previous solid mesh
    if (solidCubeMeshRef.current) {
      movingGroup.remove(solidCubeMeshRef.current);
      solidCubeMeshRef.current.geometry.dispose();
      (solidCubeMeshRef.current.material as THREE.Material).dispose();
      solidCubeMeshRef.current = null;
    }
    if (cubeEdgesRef.current) {
      movingGroup.remove(cubeEdgesRef.current);
      cubeEdgesRef.current.geometry.dispose();
      (cubeEdgesRef.current.material as THREE.Material).dispose();
      cubeEdgesRef.current = null;
    }

    const boxGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);

    // Glowing relativistic material
    // Colors dynamically reflect Lorentz factor & kinetic compression:
    // Cyan at rest -> Electric Blue -> Ultraviolet / Violet at ultra-relativistic speeds
    let emissiveColor = 0x0284c7;
    let surfaceColor = 0x0ea5e9;
    if (metrics.gamma > 50) {
      emissiveColor = 0x9333ea; // Violet relativistic shift
      surfaceColor = 0xa855f7;
    } else if (metrics.gamma > 5) {
      emissiveColor = 0x2563eb;
      surfaceColor = 0x38bdf8;
    }

    const material = new THREE.MeshPhysicalMaterial({
      color: surfaceColor,
      transparent: true,
      opacity: state.showFaces ? (state.viewMode === 'cross_section' ? 0.25 : 0.42) : 0.0,
      roughness: 0.15,
      metalness: 0.3,
      transmission: 0.75, // Glassy / transparent to clearly reveal internal atoms
      ior: 1.35,
      reflectivity: 0.9,
      clearcoat: 0.8,
      emissive: emissiveColor,
      emissiveIntensity: 0.35,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const mesh = new THREE.Mesh(boxGeo, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    movingGroup.add(mesh);
    solidCubeMeshRef.current = mesh;

    // Wireframe edges of the contracted cube
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const edgesMat = new THREE.LineBasicMaterial({
      color: metrics.gamma > 50 ? 0xd8b4fe : 0x7dd3fc,
      linewidth: 2,
      transparent: true,
      opacity: 0.95,
    });
    const edges = new THREE.LineSegments(edgesGeo, edgesMat);
    movingGroup.add(edges);
    cubeEdgesRef.current = edges;
  }, [state.showFaces, state.viewMode, metrics.gamma]);

  // Build & Update Atom Lattice (Transparent Grips Points) & Bonds
  useEffect(() => {
    const movingGroup = movingCubeGroupRef.current;
    if (!movingGroup) return;

    // Remove old atoms & bonds
    if (atomLatticeRef.current) {
      movingGroup.remove(atomLatticeRef.current);
      atomLatticeRef.current.geometry.dispose();
      (atomLatticeRef.current.material as THREE.Material).dispose();
      atomLatticeRef.current = null;
    }
    if (latticeBondsRef.current) {
      movingGroup.remove(latticeBondsRef.current);
      latticeBondsRef.current.geometry.dispose();
      (latticeBondsRef.current.material as THREE.Material).dispose();
      latticeBondsRef.current = null;
    }

    if (!state.showAtoms && !state.showBonds) return;

    const N = state.atomGridSize;
    const count = N * N * N;
    const half = CUBE_SIZE / 2;
    const step = N > 1 ? CUBE_SIZE / (N - 1) : 0;

    // 1. Create Atom Instanced Mesh
    if (state.showAtoms) {
      const atomRadius = Math.max(0.02, 0.065 * (5 / N));
      const sphereGeo = new THREE.SphereGeometry(atomRadius, 14, 14);

      // Color intensity proportional to relativistic density compression
      const atomMat = new THREE.MeshStandardMaterial({
        color: metrics.gamma > 50 ? 0xf0abfc : 0x38bdf8,
        emissive: metrics.gamma > 50 ? 0xc084fc : 0x0284c7,
        emissiveIntensity: Math.min(2.5, 0.8 + Math.log10(Math.max(1, metrics.gamma)) * 0.4),
        roughness: 0.2,
        metalness: 0.5,
        transparent: true,
        opacity: 0.9,
      });

      const instancedMesh = new THREE.InstancedMesh(sphereGeo, atomMat, count);
      const dummy = new THREE.Object3D();

      let idx = 0;
      for (let ix = 0; ix < N; ix++) {
        const rx = -half + ix * step;
        for (let iy = 0; iy < N; iy++) {
          const ry = -half + iy * step;
          for (let iz = 0; iz < N; iz++) {
            const rz = -half + iz * step;
            dummy.position.set(rx, ry, rz);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            instancedMesh.setMatrixAt(idx++, dummy.matrix);
          }
        }
      }
      instancedMesh.instanceMatrix.needsUpdate = true;
      movingGroup.add(instancedMesh);
      atomLatticeRef.current = instancedMesh;
    }

    // 2. Create Lattice Bonds / Grid Lines connecting atom grip points
    if (state.showBonds) {
      const positions: number[] = [];

      // Generate lines connecting adjacent atoms in 3D grid
      for (let ix = 0; ix < N; ix++) {
        const rx = -half + ix * step;
        for (let iy = 0; iy < N; iy++) {
          const ry = -half + iy * step;
          for (let iz = 0; iz < N; iz++) {
            const rz = -half + iz * step;

            // Bond along X
            if (ix < N - 1) {
              positions.push(rx, ry, rz);
              positions.push(rx + step, ry, rz);
            }
            // Bond along Y
            if (iy < N - 1) {
              positions.push(rx, ry, rz);
              positions.push(rx, ry + step, rz);
            }
            // Bond along Z
            if (iz < N - 1) {
              positions.push(rx, ry, rz);
              positions.push(rx, ry, rz + step);
            }
          }
        }
      }

      const bondGeo = new THREE.BufferGeometry();
      bondGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      const bondMat = new THREE.LineBasicMaterial({
        color: 0x0284c7,
        transparent: true,
        opacity: 0.45,
        linewidth: 1,
      });

      const bonds = new THREE.LineSegments(bondGeo, bondMat);
      movingGroup.add(bonds);
      latticeBondsRef.current = bonds;
    }
  }, [state.atomGridSize, state.showAtoms, state.showBonds, metrics.gamma]);

  // Build Ghost Rigid Reference Cube (Uncontracted Rest Frame Cube L0)
  useEffect(() => {
    const ghostGroup = ghostCubeGroupRef.current;
    if (!ghostGroup) return;

    // Clear previous ghost
    while (ghostGroup.children.length > 0) {
      const child = ghostGroup.children[0];
      ghostGroup.remove(child);
      if ('geometry' in child && child.geometry) (child.geometry as THREE.BufferGeometry).dispose();
      if ('material' in child && child.material) (child.material as THREE.Material).dispose();
    }

    if (!state.showGhostCube) return;

    // 1. Ghost wireframe box with dashed or clean faint white/slate styling
    const boxGeo = new THREE.BoxGeometry(CUBE_SIZE, CUBE_SIZE, CUBE_SIZE);
    const edgesGeo = new THREE.EdgesGeometry(boxGeo);
    const ghostEdgesMat = new THREE.LineDashedMaterial({
      color: 0x94a3b8, // Slate faint outline
      dashSize: 0.12,
      gapSize: 0.08,
      linewidth: 1.5,
      transparent: true,
      opacity: 0.75,
    });
    const ghostEdges = new THREE.LineSegments(edgesGeo, ghostEdgesMat);
    ghostEdges.computeLineDistances();
    ghostGroup.add(ghostEdges);

    // 2. Faint transparent ghost volume
    const ghostVolumeMat = new THREE.MeshBasicMaterial({
      color: 0x334155,
      transparent: true,
      opacity: 0.08,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const ghostVolume = new THREE.Mesh(boxGeo, ghostVolumeMat);
    ghostGroup.add(ghostVolume);

    // 3. Faint Ghost Atom Grip Points (Rest Frame Reference)
    if (state.showAtoms) {
      const N = state.atomGridSize;
      const count = N * N * N;
      const half = CUBE_SIZE / 2;
      const step = N > 1 ? CUBE_SIZE / (N - 1) : 0;
      const ghostAtomRadius = Math.max(0.015, 0.045 * (5 / N));

      const ghostSphereGeo = new THREE.SphereGeometry(ghostAtomRadius, 8, 8);
      const ghostAtomMat = new THREE.MeshBasicMaterial({
        color: 0x64748b,
        transparent: true,
        opacity: 0.35,
        wireframe: true,
      });

      const ghostInstanced = new THREE.InstancedMesh(ghostSphereGeo, ghostAtomMat, count);
      const dummy = new THREE.Object3D();
      let idx = 0;
      for (let ix = 0; ix < N; ix++) {
        const rx = -half + ix * step;
        for (let iy = 0; iy < N; iy++) {
          const ry = -half + iy * step;
          for (let iz = 0; iz < N; iz++) {
            const rz = -half + iz * step;
            dummy.position.set(rx, ry, rz);
            dummy.scale.set(1, 1, 1);
            dummy.updateMatrix();
            ghostInstanced.setMatrixAt(idx++, dummy.matrix);
          }
        }
      }
      ghostInstanced.instanceMatrix.needsUpdate = true;
      ghostGroup.add(ghostInstanced);
      ghostAtomsRef.current = ghostInstanced;
    }
  }, [state.showGhostCube, state.showAtoms, state.atomGridSize]);

  // Apply Lorentz Contraction Scale & Position to the Moving Cube
  useEffect(() => {
    const movingGroup = movingCubeGroupRef.current;
    if (!movingGroup) return;

    // Apply scaling along chosen axis of motion
    // X, Y, or Z flattens by 1 / gamma (or visualContractionFactor)
    // Transverse dimensions stay exactly 1.0!
    const sx = state.motionAxis === 'x' ? visualContractionFactor : 1.0;
    const sy = state.motionAxis === 'y' ? visualContractionFactor : 1.0;
    const sz = state.motionAxis === 'z' ? visualContractionFactor : 1.0;

    movingGroup.scale.set(sx, sy, sz);

    // Apply flyby motion position if playing, or centered if stationary observer
    let px = 0;
    let py = 0;
    let pz = 0;

    if (state.isPlaying) {
      if (state.motionAxis === 'x') px = state.flybyProgress;
      if (state.motionAxis === 'y') py = state.flybyProgress;
      if (state.motionAxis === 'z') pz = state.flybyProgress;
    }

    movingGroup.position.set(px, py, pz);

    // Update Velocity Vector Arrow
    if (velocityArrowRef.current) {
      const arrow = velocityArrowRef.current;
      const dir = new THREE.Vector3(
        state.motionAxis === 'x' ? 1 : 0,
        state.motionAxis === 'y' ? 1 : 0,
        state.motionAxis === 'z' ? 1 : 0
      );
      arrow.setDirection(dir);
      arrow.position.set(px, py + 1.4, pz);
      // Hide or shrink arrow if at rest
      arrow.visible = state.beta > 0.001;
      const arrowLen = Math.min(2.2, 0.8 + state.beta * 1.4);
      arrow.setLength(arrowLen, 0.35, 0.22);
    }
  }, [visualContractionFactor, state.motionAxis, state.isPlaying, state.flybyProgress, state.beta]);

  // Update Laser Gates & Measurement Calipers
  useEffect(() => {
    const laserGroup = laserGateGroupRef.current;
    const measureGroup = measurementGroupRef.current;
    if (!laserGroup || !measureGroup) return;

    // Clear previous
    while (laserGroup.children.length > 0) {
      const c = laserGroup.children[0];
      laserGroup.remove(c);
      if ('geometry' in c && c.geometry) (c.geometry as THREE.BufferGeometry).dispose();
      if ('material' in c && c.material) (c.material as THREE.Material).dispose();
    }
    while (measureGroup.children.length > 0) {
      const c = measureGroup.children[0];
      measureGroup.remove(c);
      if ('geometry' in c && c.geometry) (c.geometry as THREE.BufferGeometry).dispose();
      if ('material' in c && c.material) (c.material as THREE.Material).dispose();
    }

    if (!state.showDimensions) return;

    // Caliper dimensions lines
    // 1. Rest frame caliper (showing L0 = 1.0 m)
    const lineMat = new THREE.LineBasicMaterial({ color: 0x94a3b8, transparent: true, opacity: 0.6 });
    const measureGeo = new THREE.BufferGeometry();
    const half = CUBE_SIZE / 2;
    const yOffset = -1.3;

    if (state.motionAxis === 'x') {
      const pts = [
        -half, yOffset, half + 0.2,
        half, yOffset, half + 0.2,
        // ticks
        -half, yOffset - 0.1, half + 0.2,
        -half, yOffset + 0.1, half + 0.2,
        half, yOffset - 0.1, half + 0.2,
        half, yOffset + 0.1, half + 0.2,
      ];
      measureGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    } else if (state.motionAxis === 'y') {
      const pts = [
        half + 0.2, -half, half,
        half + 0.2, half, half,
        half + 0.2, -half, half - 0.1,
        half + 0.2, -half, half + 0.1,
        half + 0.2, half, half - 0.1,
        half + 0.2, half, half + 0.1,
      ];
      measureGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    } else {
      const pts = [
        half + 0.2, yOffset, -half,
        half + 0.2, yOffset, half,
        half + 0.2, yOffset - 0.1, -half,
        half + 0.2, yOffset + 0.1, -half,
        half + 0.2, yOffset - 0.1, half,
        half + 0.2, yOffset + 0.1, half,
      ];
      measureGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    }

    const caliperLine = new THREE.LineSegments(measureGeo, lineMat);
    measureGroup.add(caliperLine);

    // Laser gates along motion axis for detecting passing fronts
    const gateGeo = new THREE.BufferGeometry();
    const gateMat = new THREE.LineBasicMaterial({ color: 0xef4444, transparent: true, opacity: 0.45 });
    const gatePts = [
      -half, -1.5, -2, -half, 1.5, -2,
      -half, 1.5, -2, -half, 1.5, 2,
      -half, 1.5, 2, -half, -1.5, 2,
      half, -1.5, -2, half, 1.5, -2,
      half, 1.5, -2, half, 1.5, 2,
      half, 1.5, 2, half, -1.5, 2,
    ];
    gateGeo.setAttribute('position', new THREE.Float32BufferAttribute(gatePts, 3));
    const gates = new THREE.LineSegments(gateGeo, gateMat);
    laserGroup.add(gates);
  }, [state.showDimensions, state.motionAxis]);

  return (
    <div className="relative w-full h-full flex flex-col select-none overflow-hidden bg-slate-950">
      {/* 3D WebGL Canvas Container */}
      <div id="three-canvas-container" ref={containerRef} className="w-full flex-1 cursor-grab active:cursor-grabbing" />

      {/* Top Floating View HUD / Camera Presets */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs text-slate-300 shadow-xl">
        <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          Camera:
        </span>
        <button
          id="btn-cam-iso"
          onClick={() => setCameraPreset('iso')}
          className={`px-2.5 py-1 rounded-md transition font-medium ${
            activeCameraView === 'iso' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          Perspective
        </button>
        <button
          id="btn-cam-side"
          onClick={() => setCameraPreset('side')}
          className={`px-2.5 py-1 rounded-md transition font-medium ${
            activeCameraView === 'side' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          Side (Profile)
        </button>
        <button
          id="btn-cam-front"
          onClick={() => setCameraPreset('front')}
          className={`px-2.5 py-1 rounded-md transition font-medium ${
            activeCameraView === 'front' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          Head-On
        </button>
        <button
          id="btn-cam-macro"
          onClick={() => setCameraPreset('macro')}
          className={`px-2.5 py-1 rounded-md transition font-medium ${
            activeCameraView === 'macro' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          Macro Wafer Zoom
        </button>
      </div>

      {/* Axis of Motion Selector Quick Badge */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-xs shadow-xl">
        <span className="text-slate-400 font-medium">Motion Axis:</span>
        {(['x', 'y', 'z'] as MotionAxis[]).map((axis) => (
          <button
            key={axis}
            id={`btn-axis-${axis}`}
            onClick={() => onStateChange((prev) => ({ ...prev, motionAxis: axis }))}
            className={`px-2 py-0.5 rounded font-mono font-bold uppercase transition ${
              state.motionAxis === axis
                ? 'bg-cyan-500 text-slate-950 shadow-sm shadow-cyan-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {axis}
          </button>
        ))}
      </div>

      {/* Overlay: Live Dimension Comparison HUD */}
      <div className="absolute bottom-4 left-4 z-10 max-w-sm bg-slate-900/85 backdrop-blur-md p-3.5 rounded-xl border border-slate-800 shadow-2xl text-xs space-y-2">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-cyan-400 shadow-sm shadow-cyan-400" />
            <span className="font-semibold text-slate-200">Contracted Moving Cube</span>
          </div>
          <span className="font-mono text-cyan-400 font-bold">
            {formatMetricLength(metrics.lengthContracted)}
          </span>
        </div>

        {state.showGhostCube && (
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm border border-dashed border-slate-400 bg-slate-700/30" />
              <span className="text-slate-400">Ghost Rigid Rest Cube (L₀)</span>
            </div>
            <span className="font-mono text-slate-300">1.0000 m</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
          <div>
            <span className="text-slate-500 block">Longitudinal (Axis {state.motionAxis.toUpperCase()}):</span>
            <span className="font-mono font-semibold text-cyan-300">
              {(metrics.lengthContracted / metrics.lengthRest * 100).toFixed(
                metrics.numberOfNines >= 6 ? 6 : 2
              )}% of L₀
            </span>
          </div>
          <div>
            <span className="text-slate-500 block">Transverse Dimensions:</span>
            <span className="font-mono font-semibold text-slate-300">100.0% (Unaffected)</span>
          </div>
        </div>

        {metrics.gamma > 100 && (
          <div className="mt-2 text-[11px] bg-purple-950/40 border border-purple-800/50 rounded-lg p-2 text-purple-200">
            <div className="flex items-center justify-between mb-1">
              <span className="font-medium text-purple-300">Visual Scale Mode</span>
              <span className="font-mono text-[10px] uppercase text-purple-400">
                {state.viewMode === 'magnified' ? 'Magnified Layering' : 'True 1:1 Scale'}
              </span>
            </div>
            <div className="flex gap-1.5">
              <button
                id="btn-viewmode-physical"
                onClick={() => onStateChange((prev) => ({ ...prev, viewMode: 'physical' }))}
                className={`flex-1 py-1 rounded text-center font-medium transition ${
                  state.viewMode === 'physical'
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                True Scale (Wafer)
              </button>
              <button
                id="btn-viewmode-magnified"
                onClick={() => onStateChange((prev) => ({ ...prev, viewMode: 'magnified' }))}
                className={`flex-1 py-1 rounded text-center font-medium transition ${
                  state.viewMode === 'magnified'
                    ? 'bg-purple-600 text-white shadow'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                }`}
              >
                Inspect Atoms
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Orbit Controls Help Tip */}
      <div className="absolute bottom-4 right-4 z-10 text-[11px] text-slate-500 pointer-events-none hidden sm:block bg-slate-950/60 px-2.5 py-1 rounded-md border border-slate-900">
        Left-click drag: Rotate • Right-click: Pan • Scroll: Zoom
      </div>
    </div>
  );
};
