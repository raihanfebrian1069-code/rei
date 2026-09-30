import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  LabStationId,
  ReactorState,
  SubatomicParticleType,
  ShieldMaterial,
} from '../types/nuclear';
import {
  ATOM_ELEMENTS,
  RADIATION_SAMPLES,
  RADIATION_TYPES,
  REACTOR_COMPONENTS,
  ISOTOPES_DECAY_DATA,
} from '../data/elementsData';
import { soundManager } from '../audio/soundEffects';

interface ThreeCanvasProps {
  station: LabStationId;
  onSelectStation: (st: LabStationId) => void;
  activeElementId: string;
  activeRadiationType: 'alpha' | 'beta' | 'gamma';
  activeShieldMaterial: string;
  activeShields?: ShieldMaterial[];
  simulatorDistanceCm?: number;
  reactorState: ReactorState;
  onParticleClick: (type: SubatomicParticleType) => void;
  onReactorComponentClick: (componentId: string) => void;
  onDetectorSampleProximity: (cpm: number, distanceCm: number, sampleName: string) => void;
  chainReactionRunning: boolean;
  onChainReactionFission: (newScore: number, totalFissions: number) => void;
  decayElapsedTime: number;
  decayIsotopeId: string;
  onDecayProgress: (remaining: number) => void;
  setOrbitControlsRef?: (controls: OrbitControls | null) => void;
  onWebGlError?: () => void;
}

export const ThreeCanvas: React.FC<ThreeCanvasProps> = ({
  station,
  onSelectStation,
  activeElementId,
  activeRadiationType,
  activeShieldMaterial,
  activeShields = [],
  simulatorDistanceCm = 60,
  reactorState,
  onParticleClick,
  onReactorComponentClick,
  onDetectorSampleProximity,
  chainReactionRunning,
  onChainReactionFission,
  decayElapsedTime,
  decayIsotopeId,
  onDecayProgress,
  setOrbitControlsRef,
  onWebGlError,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);

  // References to preserve Three.js objects across updates
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);

  // Groups for specific stations
  const labGroupRef = useRef<THREE.Group | null>(null);
  const atomGroupRef = useRef<THREE.Group | null>(null);
  const nucleusGroupRef = useRef<THREE.Group | null>(null);
  const radiationGroupRef = useRef<THREE.Group | null>(null);
  const detectorGroupRef = useRef<THREE.Group | null>(null);
  const reactorGroupRef = useRef<THREE.Group | null>(null);
  const flowGroupRef = useRef<THREE.Group | null>(null);
  const chainGroupRef = useRef<THREE.Group | null>(null);
  const decayGroupRef = useRef<THREE.Group | null>(null);

  // Animation references
  const electronsRef = useRef<{ mesh: THREE.Mesh; radius: number; speed: number; angle: number; shellIdx: number }[]>([]);
  const controlRodsMeshRef = useRef<THREE.Group | null>(null);
  const turbineRotorRef = useRef<THREE.Mesh | null>(null);
  const radiationParticlesRef = useRef<{ mesh: THREE.Mesh; pos: number; speed: number; yOff: number; zOff: number }[]>([]);
  const probeMeshRef = useRef<THREE.Group | null>(null);
  const chainNucleiRef = useRef<{ mesh: THREE.Mesh; x: number; y: number; z: number; fissioned: boolean }[]>([]);
  const chainNeutronsRef = useRef<{ mesh: THREE.Mesh; vx: number; vy: number; vz: number; life: number }[]>([]);
  const decayAtomsRef = useRef<{ mesh: THREE.Mesh; decayTime: number; isDecayed: boolean }[]>([]);

  // Score accumulation in chain reaction
  const chainScoreRef = useRef(0);
  const totalFissionsRef = useRef(0);

  // Helper to create circular canvas texture for KIR SMA KP Baleendah Logo in 3D
  const createKirLogoTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    // Deep navy background
    ctx.fillStyle = '#0c1d38';
    ctx.fillRect(0, 0, 512, 512);

    // Hexagonal border
    ctx.beginPath();
    ctx.moveTo(256, 30);
    ctx.lineTo(470, 140);
    ctx.lineTo(470, 372);
    ctx.lineTo(256, 482);
    ctx.lineTo(42, 372);
    ctx.lineTo(42, 140);
    ctx.closePath();
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Central Atom Rings
    ctx.save();
    ctx.translate(256, 170);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.ellipse(0, 0, 90, 36, -Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, 90, 36, Math.PI / 6, 0, Math.PI * 2);
    ctx.stroke();

    // Lightbulb
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Book
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(170, 260, 172, 45);

    // Large KIR text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 90px "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KIR', 256, 410);

    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('SMA KP BALEENDAH', 256, 450);

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // Helper to create Trefoil Hazard Texture
  const createTrefoilTexture = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return new THREE.CanvasTexture(canvas);

    ctx.fillStyle = '#f59e0b'; // Amber yellow
    ctx.fillRect(0, 0, 256, 256);

    ctx.save();
    ctx.translate(128, 128);
    ctx.fillStyle = '#0f172a';

    // 3 Trefoil blades
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(0, 0, 95, -Math.PI / 6, Math.PI / 6);
      ctx.arc(0, 0, 38, Math.PI / 6, -Math.PI / 6, true);
      ctx.closePath();
      ctx.fill();
      ctx.rotate((Math.PI * 2) / 3);
    }
    // Center circle
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    return new THREE.CanvasTexture(canvas);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color('#030712');
    scene.fog = new THREE.FogExp2('#030712', 0.022);

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      150
    );
    camera.position.set(0, 5, 12);
    cameraRef.current = camera;

    // 3. Renderer Setup with fallback detection
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;
      container.appendChild(renderer.domElement);
    } catch {
      if (onWebGlError) onWebGlError();
      return;
    }

    // 4. OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // prevent going beneath floor
    controls.minDistance = 1.2;
    controls.maxDistance = 35;
    controlsRef.current = controls;
    if (setOrbitControlsRef) setOrbitControlsRef(controls);

    // 5. Lighting Setup
    const ambientLight = new THREE.AmbientLight('#1e293b', 1.8);
    scene.add(ambientLight);

    // Main studio key light
    const keyLight = new THREE.DirectionalLight('#e0f2fe', 2.4);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    scene.add(keyLight);

    // Cool fill light
    const fillLight = new THREE.DirectionalLight('#0284c7', 1.2);
    fillLight.position.set(-8, 6, -6);
    scene.add(fillLight);

    // Center reactor glow point light
    const coreGlowLight = new THREE.PointLight('#38bdf8', 3.5, 18);
    coreGlowLight.position.set(4, 3, -1);
    scene.add(coreGlowLight);

    // 6. BUILD MAIN LAB ENVIRONMENT (Room, floor, tables, banners)
    const labGroup = new THREE.Group();
    labGroupRef.current = labGroup;
    scene.add(labGroup);

    // Floor with grid
    const floorGeo = new THREE.PlaneGeometry(36, 36);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#080f1e',
      roughness: 0.6,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    labGroup.add(floor);

    // Grid lines on floor
    const gridHelper = new THREE.GridHelper(36, 36, '#06b6d4', '#1e293b');
    gridHelper.position.y = 0.01;
    labGroup.add(gridHelper);

    // Back Lab Wall with KIR SMA KP Baleendah Crest & Banners
    const wallGeo = new THREE.PlaneGeometry(36, 10);
    const wallMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.8,
    });
    const backWall = new THREE.Mesh(wallGeo, wallMat);
    backWall.position.set(0, 5, -8);
    labGroup.add(backWall);

    // KIR Logo Wall Plaque in 3D
    const kirTex = createKirLogoTexture();
    const kirPlaqueMat = new THREE.MeshStandardMaterial({
      map: kirTex,
      roughness: 0.3,
      metalness: 0.1,
    });
    const kirPlaque = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), kirPlaqueMat);
    kirPlaque.position.set(-6, 6.2, -7.95);
    labGroup.add(kirPlaque);

    // Radiation Trefoil Warning Sign
    const trefoilTex = createTrefoilTexture();
    const trefoilMat = new THREE.MeshStandardMaterial({
      map: trefoilTex,
      roughness: 0.4,
    });
    const trefoilPlaque = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), trefoilMat);
    trefoilPlaque.position.set(6, 6.2, -7.95);
    labGroup.add(trefoilPlaque);

    // Lab Stations Workbenches
    // Table 1: Left Workbench (Atom Explorer Pedestal)
    const tableMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      roughness: 0.3,
      metalness: 0.7,
    });
    const table1 = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.4, 1.2, 32), tableMat);
    table1.position.set(-4.5, 0.6, 0.5);
    table1.receiveShadow = true;
    table1.castShadow = true;
    table1.userData = { clickable: true, station: 'atom', label: 'Stasiun 3D Atom Explorer' };
    labGroup.add(table1);

    // Pedestal glowing ring
    const ringMat = new THREE.MeshBasicMaterial({ color: '#06b6d4', wireframe: true });
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.25, 0.05, 8, 32), ringMat);
    ring1.rotation.x = Math.PI / 2;
    ring1.position.set(-4.5, 1.21, 0.5);
    labGroup.add(ring1);

    // Table 2: Right Bay (Reactor Platform)
    const reactorBay = new THREE.Mesh(new THREE.BoxGeometry(7, 0.8, 6), tableMat);
    reactorBay.position.set(4.5, 0.4, -0.5);
    reactorBay.receiveShadow = true;
    reactorBay.castShadow = true;
    reactorBay.userData = { clickable: true, station: 'reactor', label: 'Stasiun Reaktor Nuklir Cutaway' };
    labGroup.add(reactorBay);

    // Table 3: Radiation Detector Workbench (Front Center)
    const radBench = new THREE.Mesh(new THREE.BoxGeometry(6, 0.9, 2.5), tableMat);
    radBench.position.set(0, 0.45, 4.5);
    radBench.receiveShadow = true;
    radBench.castShadow = true;
    radBench.userData = { clickable: true, station: 'detector', label: 'Stasiun Detektor Radiasi Geiger' };
    labGroup.add(radBench);

    // 7. BUILD 3D ATOM EXPLORER GROUP
    const atomGroup = new THREE.Group();
    atomGroup.position.set(-4.5, 2.4, 0.5);
    atomGroupRef.current = atomGroup;
    scene.add(atomGroup);

    // 8. BUILD 3D NUCLEUS GROUP (Entered deep dive)
    const nucleusGroup = new THREE.Group();
    nucleusGroup.position.set(0, 3, 0);
    nucleusGroup.visible = false;
    nucleusGroupRef.current = nucleusGroup;
    scene.add(nucleusGroup);

    // 9. BUILD 3D RADIATION SIMULATOR GROUP (Source -> Shield -> Detector)
    const radiationGroup = new THREE.Group();
    radiationGroup.position.set(-0.5, 2.6, 2.8);
    radiationGroup.visible = false;
    radiationGroupRef.current = radiationGroup;
    scene.add(radiationGroup);

    // 10. BUILD 3D RADIATION DETECTOR STATION (Samples + Geiger Wand)
    const detectorGroup = new THREE.Group();
    detectorGroup.position.set(0, 1.35, 4.5);
    detectorGroupRef.current = detectorGroup;
    scene.add(detectorGroup);

    // 4 Radioactive specimen containers on the bench
    RADIATION_SAMPLES.forEach((sample) => {
      const sampleBox = new THREE.Group();
      sampleBox.position.set(sample.position[0], 0, 0);

      // Petri dish / container base
      const dish = new THREE.Mesh(
        new THREE.CylinderGeometry(0.35, 0.35, 0.12, 16),
        new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.6, roughness: 0.3 })
      );
      sampleBox.add(dish);

      // Radioactive core sample with glow
      const specimen = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 16, 16),
        new THREE.MeshStandardMaterial({
          color: sample.color,
          emissive: sample.color,
          emissiveIntensity: 0.5,
          roughness: 0.4,
        })
      );
      specimen.position.y = 0.18;
      specimen.userData = {
        clickable: true,
        isSample: true,
        sampleId: sample.id,
        sampleName: sample.name,
        cpm: sample.baseActivityCPM,
      };
      sampleBox.add(specimen);

      detectorGroup.add(sampleBox);
    });

    // 3D Geiger-Müller Counter Unit on Bench
    const geigerBase = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.4, 0.6),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.4, metalness: 0.5 })
    );
    geigerBase.position.set(-1.8, 0.2, 0.6);
    detectorGroup.add(geigerBase);

    // Handheld Geiger Probe (Movable 3D cylinder)
    const probeGroup = new THREE.Group();
    probeGroup.position.set(0.5, 0.3, 0.2);
    probeMeshRef.current = probeGroup;

    const probeBody = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 0.6, 16),
      new THREE.MeshStandardMaterial({ color: '#0f172a', metalness: 0.8, roughness: 0.2 })
    );
    probeBody.rotation.x = Math.PI / 2;
    probeGroup.add(probeBody);

    const probeTip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.08, 0.15, 16),
      new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 0.6 })
    );
    probeTip.rotation.x = Math.PI / 2;
    probeTip.position.z = 0.35;
    probeGroup.add(probeTip);

    probeGroup.userData = { clickable: true, isProbe: true, label: 'Probe Detektor Geiger (Klik & Geser)' };
    detectorGroup.add(probeGroup);

    // 11. BUILD 3D NUCLEAR REACTOR (Cutaway)
    const reactorGroup = new THREE.Group();
    reactorGroup.position.set(4.5, 0.8, -0.5);
    reactorGroupRef.current = reactorGroup;
    scene.add(reactorGroup);

    // Reactor Pressure Vessel (RPV) - Cutaway cylinder
    const vesselMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      metalness: 0.7,
      roughness: 0.3,
      side: THREE.DoubleSide,
    });
    // Arc of 270 degrees to create cutaway opening!
    const vesselGeo = new THREE.CylinderGeometry(1.6, 1.6, 4.2, 32, 1, true, 0, Math.PI * 1.5);
    const vessel = new THREE.Mesh(vesselGeo, vesselMat);
    vessel.position.y = 2.1;
    vessel.userData = {
      clickable: true,
      componentId: 'vessel',
      label: 'Bejana Tekan Reaktor (RPV)',
    };
    reactorGroup.add(vessel);

    // Reactor Core Fuel Assemblies (vertical rods inside)
    const fuelRodsGroup = new THREE.Group();
    fuelRodsGroup.position.y = 1.4;
    for (let x = -0.9; x <= 0.9; x += 0.45) {
      for (let z = -0.9; z <= 0.9; z += 0.45) {
        if (Math.hypot(x, z) < 1.25) {
          const rod = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 2.0, 12),
            new THREE.MeshStandardMaterial({
              color: '#0284c7',
              emissive: '#0284c7',
              emissiveIntensity: 0.4,
              metalness: 0.8,
            })
          );
          rod.position.set(x, 0, z);
          rod.userData = {
            clickable: true,
            componentId: 'fuel_rods',
            label: 'Fuel Rods (Batang Bahan Bakar UO₂)',
          };
          fuelRodsGroup.add(rod);
        }
      }
    }
    reactorGroup.add(fuelRodsGroup);

    // Control Rods Assembly (Movable in 3D based on slider!)
    const controlRodsGroup = new THREE.Group();
    controlRodsMeshRef.current = controlRodsGroup;
    controlRodsGroup.position.y = 2.6; // initial height

    const topCrossbar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 0.15, 24),
      new THREE.MeshStandardMaterial({ color: '#ef4444', metalness: 0.8 })
    );
    topCrossbar.userData = {
      clickable: true,
      componentId: 'control_rods',
      label: 'Batang Kendali (Control Rods)',
    };
    controlRodsGroup.add(topCrossbar);

    for (let x = -0.65; x <= 0.65; x += 0.45) {
      for (let z = -0.65; z <= 0.65; z += 0.45) {
        const rod = new THREE.Mesh(
          new THREE.CylinderGeometry(0.06, 0.06, 2.2, 12),
          new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.3 })
        );
        rod.position.set(x, -1.1, z);
        controlRodsGroup.add(rod);
      }
    }
    reactorGroup.add(controlRodsGroup);

    // Steam Generator next to reactor
    const sgGeo = new THREE.CylinderGeometry(0.9, 0.9, 3.8, 24);
    const sgMat = new THREE.MeshStandardMaterial({ color: '#0d9488', metalness: 0.6, roughness: 0.3 });
    const steamGen = new THREE.Mesh(sgGeo, sgMat);
    steamGen.position.set(3.2, 1.9, 0);
    steamGen.userData = {
      clickable: true,
      componentId: 'steam_generator',
      label: 'Steam Generator (Pembangkit Uap)',
    };
    reactorGroup.add(steamGen);

    // Steam Turbine & Generator
    const turbineBase = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.6, 1.2),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.7, roughness: 0.3 })
    );
    turbineBase.position.set(3.2, 0.4, 2.4);
    turbineBase.userData = { clickable: true, componentId: 'turbine', label: 'Turbin Uap' };
    reactorGroup.add(turbineBase);

    // Turbine rotating blades
    const rotor = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.4, 1.0, 8),
      new THREE.MeshStandardMaterial({ color: '#fbbf24', wireframe: true })
    );
    rotor.rotation.z = Math.PI / 2;
    rotor.position.set(3.2, 0.9, 2.4);
    turbineRotorRef.current = rotor;
    reactorGroup.add(rotor);

    // Generator Unit
    const generator = new THREE.Mesh(
      new THREE.CylinderGeometry(0.5, 0.5, 1.2, 16),
      new THREE.MeshStandardMaterial({ color: '#10b981', metalness: 0.7, roughness: 0.2 })
    );
    generator.rotation.x = Math.PI / 2;
    generator.position.set(3.2, 0.8, 3.8);
    generator.userData = { clickable: true, componentId: 'generator', label: 'Generator Listrik' };
    reactorGroup.add(generator);

    // 12. BUILD 3D CHAIN REACTION GROUP
    const chainGroup = new THREE.Group();
    chainGroup.position.set(0, 3, 0);
    chainGroup.visible = false;
    chainGroupRef.current = chainGroup;
    scene.add(chainGroup);

    // 13. BUILD 3D RADIOACTIVE DECAY GROUP
    const decayGroup = new THREE.Group();
    decayGroup.position.set(0, 3, 0);
    decayGroup.visible = false;
    decayGroupRef.current = decayGroup;
    scene.add(decayGroup);

    // Window resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // 14. ANIMATION LOOP
    let animFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const time = clock.getElapsedTime();

      // Controls update
      if (controlsRef.current) {
        controlsRef.current.update();
      }

      // Rotate Atom electrons on their shells
      if (atomGroupRef.current && electronsRef.current.length > 0) {
        electronsRef.current.forEach((el) => {
          el.angle += el.speed * delta;
          const x = Math.cos(el.angle) * el.radius;
          const z = Math.sin(el.angle) * el.radius;
          // inclined plane based on shell index
          const tilt = (el.shellIdx * Math.PI) / 3;
          el.mesh.position.set(
            x * Math.cos(tilt),
            x * Math.sin(tilt) * 0.4 + Math.sin(el.angle * 2) * 0.1,
            z
          );
        });
      }

      // Rotate Turbine based on electric output
      if (turbineRotorRef.current) {
        const speed = (reactorState.electricOutputMWe / 1100) * 8 + 0.5;
        turbineRotorRef.current.rotation.x += speed * delta;
      }

      // Animate Control Rods height based on slider state
      if (controlRodsMeshRef.current) {
        // Insertion 0% -> height = 3.6 (fully extracted)
        // Insertion 100% -> height = 2.0 (fully inserted into fuel)
        const targetY = 3.6 - (reactorState.controlRodInsertion / 100) * 1.6;
        controlRodsMeshRef.current.position.y +=
          (targetY - controlRodsMeshRef.current.position.y) * 0.1;
      }

      // Animate Radiation Particles in simulator
      if (radiationGroupRef.current && radiationGroupRef.current.visible) {
        const shieldTrans =
          RADIATION_TYPES[activeRadiationType]?.attenuationByShield[
            activeShieldMaterial as keyof typeof RADIATION_TYPES[typeof activeRadiationType]['attenuationByShield']
          ] ?? 100;
        const penetrates = shieldTrans > 5;

        radiationParticlesRef.current.forEach((p) => {
          p.pos += p.speed * delta;
          if (p.pos > 3.6) {
            p.pos = 0; // reset
          }
          // If stopped by shield at pos = 1.8
          if (!penetrates && p.pos > 1.8) {
            p.pos = 0;
          }
          p.mesh.position.x = -1.8 + p.pos;
          p.mesh.position.y = 0.2 + p.yOff + Math.sin(time * 8 + p.pos * 4) * 0.06;
          p.mesh.position.z = p.zOff;
        });
      }

      // Animate Chain Reaction Mini Game
      if (chainGroupRef.current && chainGroupRef.current.visible && chainReactionRunning) {
        // Move active neutrons
        const remainingNeutrons: typeof chainNeutronsRef.current = [];
        chainNeutronsRef.current.forEach((n) => {
          n.mesh.position.x += n.vx * delta;
          n.mesh.position.y += n.vy * delta;
          n.mesh.position.z += n.vz * delta;
          n.life -= delta;

          // Check if intercepted by Control Rods absorber plane!
          // Control rods insertion defines an absorption barrier at top/bottom or height
          const rodThreshold = (reactorState.controlRodInsertion / 100) * 1.8;
          if (Math.abs(n.mesh.position.y) < rodThreshold * 0.8 && Math.random() < 0.08) {
            // absorbed by control rod!
            chainGroupRef.current?.remove(n.mesh);
            return;
          }

          // Check collision with unfissioned nuclei
          let collided = false;
          for (let i = 0; i < chainNucleiRef.current.length; i++) {
            const nucleus = chainNucleiRef.current[i];
            if (!nucleus.fissioned) {
              const dist = n.mesh.position.distanceTo(
                new THREE.Vector3(nucleus.x, nucleus.y, nucleus.z)
              );
              if (dist < 0.45) {
                // FISSION OCCURS!
                collided = true;
                nucleus.fissioned = true;
                (nucleus.mesh.material as THREE.MeshStandardMaterial).color.set('#f59e0b');
                (nucleus.mesh.material as THREE.MeshStandardMaterial).emissive.set('#f59e0b');
                (nucleus.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.0;

                soundManager.playFissionPop();
                chainScoreRef.current += Math.round(50 * reactorState.chainReactionMulti);
                totalFissionsRef.current += 1;
                onChainReactionFission(chainScoreRef.current, totalFissionsRef.current);

                // Spawn 2 or 3 new fast neutrons
                for (let k = 0; k < 3; k++) {
                  const newNMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(0.09, 8, 8),
                    new THREE.MeshStandardMaterial({
                      color: '#ffffff',
                      emissive: '#38bdf8',
                      emissiveIntensity: 0.8,
                    })
                  );
                  newNMesh.position.set(nucleus.x, nucleus.y, nucleus.z);
                  chainGroupRef.current?.add(newNMesh);

                  const dir = new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                  ).normalize();

                  remainingNeutrons.push({
                    mesh: newNMesh,
                    vx: dir.x * 2.8,
                    vy: dir.y * 2.8,
                    vz: dir.z * 2.8,
                    life: 2.2,
                  });
                }
                break;
              }
            }
          }

          if (!collided && n.life > 0) {
            remainingNeutrons.push(n);
          } else {
            chainGroupRef.current?.remove(n.mesh);
          }
        });
        chainNeutronsRef.current = remainingNeutrons;
      }

      // Check distance from Geiger probe to samples
      if (probeMeshRef.current && station === 'detector') {
        const probeWorldPos = new THREE.Vector3();
        probeMeshRef.current.getWorldPosition(probeWorldPos);

        let closestDist = 999;
        let closestSample = RADIATION_SAMPLES[0];

        RADIATION_SAMPLES.forEach((s) => {
          const sPos = new THREE.Vector3(s.position[0], 1.35, 4.5);
          const d = probeWorldPos.distanceTo(sPos);
          if (d < closestDist) {
            closestDist = d;
            closestSample = s;
          }
        });

        // Distance in cm
        const distCm = Math.max(2, Math.round(closestDist * 20));
        // Inverse square law: CPM = base / (r / 5)^2
        const rRatio = Math.max(0.4, distCm / 5);
        const calcCpm = Math.round(closestSample.baseActivityCPM / (rRatio * rRatio) + 18);

        onDetectorSampleProximity(calcCpm, distCm, closestSample.name);
        soundManager.updateGeigerStream(calcCpm);
      } else {
        soundManager.stopGeiger();
      }

      renderer.render(scene, camera);
    };

    animate();

    // 15. Raycaster for Hover & Click Events
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      let foundLabel: string | null = null;
      for (const hit of intersects) {
        if (hit.object.userData?.label) {
          foundLabel = hit.object.userData.label;
          break;
        }
      }
      setHoveredLabel(foundLabel);
    };

    const onPointerDown = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        const u = hit.object.userData;
        if (!u) continue;

        if (u.station) {
          onSelectStation(u.station);
          soundManager.playUiClick();
          break;
        }
        if (u.particleType) {
          onParticleClick(u.particleType);
          soundManager.playUiClick();
          break;
        }
        if (u.componentId) {
          onReactorComponentClick(u.componentId);
          soundManager.playUiClick();
          break;
        }
        if (u.isProbe && station === 'detector') {
          // Move probe in a circle around samples
          const angle = Math.random() * Math.PI * 2;
          const rad = 0.4 + Math.random() * 0.8;
          probeGroup.position.x = Math.cos(angle) * rad;
          probeGroup.position.z = Math.sin(angle) * rad;
          soundManager.playUiClick();
          break;
        }
      }
    };

    container.addEventListener('mousemove', onPointerMove);
    container.addEventListener('pointerdown', onPointerDown);

    // Cleanup
    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('mousemove', onPointerMove);
      container.removeEventListener('pointerdown', onPointerDown);
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      soundManager.stopGeiger();
      soundManager.stopReactorHum();
    };
  }, []);

  // Update Audio reactor drone with reactor power
  useEffect(() => {
    const powerNorm = reactorState.electricOutputMWe / 1100;
    soundManager.updateReactorHum(powerNorm);
  }, [reactorState.electricOutputMWe]);

  // Handle station transitions & Camera movements
  useEffect(() => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    // Reset visibility flags
    if (labGroupRef.current) labGroupRef.current.visible = true;
    if (atomGroupRef.current) atomGroupRef.current.visible = station === 'atom' || station === 'lab';
    if (nucleusGroupRef.current) nucleusGroupRef.current.visible = station === 'nucleus';
    if (radiationGroupRef.current) radiationGroupRef.current.visible = station === 'radiation';
    if (chainGroupRef.current) chainGroupRef.current.visible = station === 'chain_reaction';
    if (decayGroupRef.current) decayGroupRef.current.visible = station === 'decay';

    // Animate camera to focus on selected station
    switch (station) {
      case 'lab':
        camera.position.set(0, 5.5, 11);
        controls.target.set(0, 1.8, 0);
        break;
      case 'atom':
        camera.position.set(-4.5, 3.2, 4.0);
        controls.target.set(-4.5, 2.4, 0.5);
        break;
      case 'nucleus':
        camera.position.set(0, 3.2, 4.2);
        controls.target.set(0, 3.0, 0);
        break;
      case 'radiation':
        camera.position.set(-0.5, 3.5, 6.2);
        controls.target.set(-0.5, 2.6, 2.8);
        break;
      case 'detector':
        camera.position.set(0, 2.6, 6.8);
        controls.target.set(0, 1.35, 4.5);
        break;
      case 'reactor':
      case 'flow':
        camera.position.set(4.5, 3.2, 4.5);
        controls.target.set(4.5, 2.0, -0.5);
        break;
      case 'chain_reaction':
        camera.position.set(0, 3.5, 5.5);
        controls.target.set(0, 3.0, 0);
        break;
      case 'decay':
        camera.position.set(0, 4.5, 5.2);
        controls.target.set(0, 2.8, 0);
        break;
      default:
        break;
    }
    controls.update();
  }, [station]);

  // Rebuild 3D Atom when activeElement changes
  useEffect(() => {
    const atomGroup = atomGroupRef.current;
    if (!atomGroup) return;

    // Clear old meshes
    while (atomGroup.children.length > 0) {
      atomGroup.remove(atomGroup.children[0]);
    }
    electronsRef.current = [];

    const elem = ATOM_ELEMENTS.find((e) => e.id === activeElementId) || ATOM_ELEMENTS[0];

    // Nucleus cluster
    const nucleus = new THREE.Group();
    const protonsCount = Math.min(elem.atomicNumber, 24); // scale visually
    const neutronsCount = Math.min(elem.neutrons, 28);
    const totalNucleons = protonsCount + neutronsCount;

    const pMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      roughness: 0.3,
      metalness: 0.2,
      emissive: '#ef4444',
      emissiveIntensity: 0.2,
    });
    const nMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      roughness: 0.4,
      metalness: 0.1,
    });

    for (let i = 0; i < totalNucleons; i++) {
      const isProton = i < protonsCount;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.12, 16, 16),
        isProton ? pMat : nMat
      );

      // Golden ratio phyllotaxis in 3D sphere
      const phi = Math.acos(-1 + (2 * i) / totalNucleons);
      const theta = Math.sqrt(totalNucleons * Math.PI) * phi;
      const radius = 0.35 + Math.cbrt(i / totalNucleons) * 0.3;

      sphere.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      sphere.userData = {
        clickable: true,
        particleType: isProton ? 'proton' : 'neutron',
        label: isProton ? 'Proton (Muatan +1)' : 'Neutron (Muatan 0)',
      };
      nucleus.add(sphere);
    }
    atomGroup.add(nucleus);

    // Electron Shells and Orbiting Electrons
    elem.electronShells.forEach((numE, shellIdx) => {
      const shellRadius = 1.0 + shellIdx * 0.65;

      // Shell orbit circle
      const shellMat = new THREE.MeshBasicMaterial({
        color: '#06b6d4',
        wireframe: true,
        transparent: true,
        opacity: 0.35,
      });
      const shellLine = new THREE.Mesh(
        new THREE.TorusGeometry(shellRadius, 0.015, 8, 48),
        shellMat
      );
      shellLine.rotation.x = Math.PI / 2 + (shellIdx * Math.PI) / 6;
      atomGroup.add(shellLine);

      // Electrons on this shell
      for (let e = 0; e < numE; e++) {
        const eMat = new THREE.MeshStandardMaterial({
          color: '#38bdf8',
          emissive: '#38bdf8',
          emissiveIntensity: 0.8,
        });
        const eMesh = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 12), eMat);
        eMesh.userData = {
          clickable: true,
          particleType: 'electron',
          label: 'Elektron (Muatan -1)',
        };
        atomGroup.add(eMesh);

        electronsRef.current.push({
          mesh: eMesh,
          radius: shellRadius,
          speed: 1.4 - shellIdx * 0.25,
          angle: (e * Math.PI * 2) / numE,
          shellIdx,
        });
      }
    });
  }, [activeElementId]);

  // Rebuild 3D Nucleus deep dive
  useEffect(() => {
    const nucleusGroup = nucleusGroupRef.current;
    if (!nucleusGroup) return;

    while (nucleusGroup.children.length > 0) {
      nucleusGroup.remove(nucleusGroup.children[0]);
    }

    const elem = ATOM_ELEMENTS.find((e) => e.id === activeElementId) || ATOM_ELEMENTS[0];
    const protonsCount = Math.min(elem.atomicNumber, 32);
    const neutronsCount = Math.min(elem.neutrons, 36);
    const total = protonsCount + neutronsCount;

    const pMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      roughness: 0.2,
      emissive: '#ef4444',
      emissiveIntensity: 0.3,
    });
    const nMat = new THREE.MeshStandardMaterial({
      color: '#64748b',
      roughness: 0.3,
    });

    for (let i = 0; i < total; i++) {
      const isProton = i < protonsCount;
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.24, 20, 20),
        isProton ? pMat : nMat
      );

      const phi = Math.acos(-1 + (2 * i) / total);
      const theta = Math.sqrt(total * Math.PI) * phi;
      const radius = 0.65 + Math.cbrt(i / total) * 0.6;

      sphere.position.set(
        radius * Math.cos(theta) * Math.sin(phi),
        radius * Math.sin(theta) * Math.sin(phi),
        radius * Math.cos(phi)
      );

      sphere.userData = {
        clickable: true,
        particleType: isProton ? 'proton' : 'neutron',
        label: isProton ? 'PROTON: +1e | ~1 u | uud' : 'NEUTRON: 0e | ~1 u | udd',
      };
      nucleusGroup.add(sphere);
    }
  }, [activeElementId, station]);

  // Rebuild 3D Radiation Simulator Setup (Source -> Shield -> Detector)
  useEffect(() => {
    const radGroup = radiationGroupRef.current;
    if (!radGroup) return;

    while (radGroup.children.length > 0) {
      radGroup.remove(radGroup.children[0]);
    }
    radiationParticlesRef.current = [];

    // 1. Source Collimator Block (Left)
    const sourceBlock = new THREE.Mesh(
      new THREE.CylinderGeometry(0.4, 0.45, 0.8, 24),
      new THREE.MeshStandardMaterial({ color: '#f59e0b', metalness: 0.7, roughness: 0.3 })
    );
    sourceBlock.rotation.z = Math.PI / 2;
    sourceBlock.position.set(-2.0, 0.4, 0);
    sourceBlock.userData = { label: 'Sumber Radiasi Nuklir' };
    radGroup.add(sourceBlock);

    // 2. Shield Slots & Multi-Material Plates (Center)
    const shieldColors: Record<string, string> = {
      none: '#000000',
      paper: '#f8fafc',
      aluminium: '#94a3b8',
      concrete: '#78716c',
      lead: '#334155',
    };

    // Use activeShields array if provided, otherwise fallback to single activeShieldMaterial
    const effectiveShields = activeShields.length > 0 ? activeShields : activeShieldMaterial !== 'none' ? [activeShieldMaterial as ShieldMaterial] : [];

    effectiveShields.forEach((shieldKey, idx) => {
      const thickness = shieldKey === 'paper' ? 0.05 : shieldKey === 'lead' ? 0.35 : shieldKey === 'concrete' ? 0.45 : 0.2;
      const shieldMesh = new THREE.Mesh(
        new THREE.BoxGeometry(thickness, 1.4, 1.2),
        new THREE.MeshStandardMaterial({
          color: shieldColors[shieldKey] || '#94a3b8',
          metalness: shieldKey === 'lead' ? 0.8 : 0.2,
          roughness: 0.4,
          transparent: shieldKey === 'paper',
          opacity: shieldKey === 'paper' ? 0.95 : 1.0,
        })
      );
      // Offset multiple shields along x-axis between -0.8 and +0.8
      const xOffset = -0.5 + idx * 0.45;
      shieldMesh.position.set(xOffset, 0.4, 0);
      shieldMesh.userData = { label: `Perisai Radiasi: ${shieldKey.toUpperCase()} (Lapisan #${idx + 1})` };
      radGroup.add(shieldMesh);
    });

    // 3. Geiger-Müller Detector Tube (Adjusted based on distanceCm)
    // Scale 10cm - 200cm into 3D world x range: 0.8 to 3.8
    const detectorX = Math.min(4.0, Math.max(1.2, 0.6 + (simulatorDistanceCm / 50)));
    const detTube = new THREE.Mesh(
      new THREE.CylinderGeometry(0.35, 0.35, 0.9, 20),
      new THREE.MeshStandardMaterial({ color: '#0284c7', metalness: 0.8, roughness: 0.2 })
    );
    detTube.rotation.z = Math.PI / 2;
    detTube.position.set(detectorX, 0.4, 0);
    detTube.userData = { label: `Tabung Detektor Geiger-Müller (Jarak: ${simulatorDistanceCm} cm)` };
    radGroup.add(detTube);

    // 4. Create Stream Particles
    const pCount = 16;
    const totalDist = detectorX - (-2.0);
    for (let i = 0; i < pCount; i++) {
      let pMesh: THREE.Mesh;
      if (activeRadiationType === 'alpha') {
        pMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.12, 12, 12),
          new THREE.MeshStandardMaterial({ color: '#eab308', emissive: '#eab308', emissiveIntensity: 0.5 })
        );
      } else if (activeRadiationType === 'beta') {
        pMesh = new THREE.Mesh(
          new THREE.SphereGeometry(0.06, 8, 8),
          new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#38bdf8', emissiveIntensity: 0.8 })
        );
      } else {
        pMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8),
          new THREE.MeshStandardMaterial({ color: '#c084fc', emissive: '#c084fc', emissiveIntensity: 0.9 })
        );
        pMesh.rotation.z = Math.PI / 2;
      }

      radGroup.add(pMesh);
      radiationParticlesRef.current.push({
        mesh: pMesh,
        pos: (i / pCount) * totalDist,
        speed: activeRadiationType === 'alpha' ? 1.4 : activeRadiationType === 'beta' ? 3.0 : 4.5,
        yOff: (Math.random() - 0.5) * 0.2,
        zOff: (Math.random() - 0.5) * 0.2,
      });
    }
  }, [activeRadiationType, activeShieldMaterial, activeShields, simulatorDistanceCm, station]);

  // Rebuild 3D Chain Reaction Game lattice
  useEffect(() => {
    const chainGroup = chainGroupRef.current;
    if (!chainGroup) return;

    while (chainGroup.children.length > 0) {
      chainGroup.remove(chainGroup.children[0]);
    }
    chainNucleiRef.current = [];
    chainNeutronsRef.current = [];
    chainScoreRef.current = 0;
    totalFissionsRef.current = 0;

    // 3D Lattice of Uranium-235 Nuclei (4x3x4 = 48 nuclei)
    const uMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.3,
      metalness: 0.4,
      roughness: 0.3,
    });

    for (let x = -1.5; x <= 1.5; x += 1.0) {
      for (let y = -1.0; y <= 1.0; y += 1.0) {
        for (let z = -1.5; z <= 1.5; z += 1.0) {
          const nucleusMesh = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), uMat.clone());
          nucleusMesh.position.set(x, y, z);
          chainGroup.add(nucleusMesh);

          chainNucleiRef.current.push({
            mesh: nucleusMesh,
            x,
            y,
            z,
            fissioned: false,
          });
        }
      }
    }

    // Launch primary neutron if game is started
    if (chainReactionRunning) {
      const pNeutron = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 12, 12),
        new THREE.MeshStandardMaterial({ color: '#ffffff', emissive: '#38bdf8', emissiveIntensity: 1.0 })
      );
      pNeutron.position.set(-3.2, 0, 0);
      chainGroup.add(pNeutron);

      chainNeutronsRef.current.push({
        mesh: pNeutron,
        vx: 3.5,
        vy: 0,
        vz: 0,
        life: 3.0,
      });
    }
  }, [chainReactionRunning, station]);

  // Rebuild 3D Half-Life Decay array (10x10 = 100 nuclei)
  useEffect(() => {
    const decayGroup = decayGroupRef.current;
    if (!decayGroup) return;

    while (decayGroup.children.length > 0) {
      decayGroup.remove(decayGroup.children[0]);
    }
    decayAtomsRef.current = [];

    const currentIso = ISOTOPES_DECAY_DATA.find((i) => i.id === decayIsotopeId) || ISOTOPES_DECAY_DATA[0];
    const halfLife = currentIso.halfLifeSeconds;

    // Parent atom material
    const parentMat = new THREE.MeshStandardMaterial({
      color: currentIso.color,
      emissive: currentIso.color,
      emissiveIntensity: 0.4,
      metalness: 0.5,
      roughness: 0.3,
    });

    const size = 10;
    const spacing = 0.38;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const x = (c - (size - 1) / 2) * spacing;
        const z = (r - (size - 1) / 2) * spacing;

        const atomMesh = new THREE.Mesh(new THREE.SphereGeometry(0.13, 14, 14), parentMat.clone());
        atomMesh.position.set(x, 0, z);
        decayGroup.add(atomMesh);

        // Generate individual exponential random decay timestamp: t = -ln(U) * (T_half / ln 2)
        const randU = Math.random();
        const decayTime = -Math.log(randU + 0.0001) * (halfLife / Math.LN2);

        decayAtomsRef.current.push({
          mesh: atomMesh,
          decayTime,
          isDecayed: false,
        });
      }
    }
  }, [decayIsotopeId, station]);

  // Update decay states based on elapsed time
  useEffect(() => {
    if (decayAtomsRef.current.length === 0) return;

    let remainingCount = 0;
    decayAtomsRef.current.forEach((item) => {
      if (decayElapsedTime >= item.decayTime) {
        if (!item.isDecayed) {
          item.isDecayed = true;
          // Decayed daughter product turns into gray/blue stable nucleus
          (item.mesh.material as THREE.MeshStandardMaterial).color.set('#475569');
          (item.mesh.material as THREE.MeshStandardMaterial).emissive.set('#1e293b');
          (item.mesh.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.1;
        }
      } else {
        remainingCount++;
      }
    });

    onDecayProgress(remainingCount);
  }, [decayElapsedTime, onDecayProgress]);

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* 3D Raycasting Hover Tooltip */}
      {hoveredLabel && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-none z-20 px-3.5 py-1.5 rounded-lg bg-slate-950/80 border border-cyan-400/40 text-cyan-200 text-xs font-mono backdrop-blur-md shadow-lg flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>{hoveredLabel}</span>
        </div>
      )}
    </div>
  );
};
