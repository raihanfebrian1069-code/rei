/**
 * Type definitions for NUCLEA-3D Educational Lab
 */

export type LabStationId =
  | 'lab'             // Main Lab Overview
  | 'atom'            // 3D Atom Explorer
  | 'nucleus'         // 3D Nucleus deep dive
  | 'radiation'       // Source -> Shield -> Detector simulator
  | 'detector'        // 3D Geiger-Müller radiation detector probe
  | 'reactor'         // 3D Cutaway Nuclear Reactor
  | 'flow'            // Reactor thermodynamic energy flow
  | 'chain_reaction'  // 3D Chain reaction mini-game
  | 'decay'           // Half-life radioactive decay lab
  | 'periodic'        // 3D / Interactive isotope periodic table
  | 'missions';       // Student Nuclear Missions / Quizzes

export type SubatomicParticleType = 'proton' | 'neutron' | 'electron';

export interface ParticleInfo {
  type: SubatomicParticleType;
  name: string;
  symbol: string;
  charge: string;
  mass: string;
  quarkComposition?: string;
  location: string;
  description: string;
}

export interface ElementData {
  id: string;
  name: string;
  symbol: string;
  atomicNumber: number; // Z
  massNumber: number;   // A
  neutrons: number;     // N = A - Z
  electrons: number;
  electronShells: number[]; // e.g. [2, 4] for Carbon
  description: string;
  color: string;
  isotopes: {
    name: string;
    mass: number;
    abundance: string;
    halfLife: string;
    isStable: boolean;
    decayMode?: string;
  }[];
}

export type RadiationType = 'alpha' | 'beta' | 'gamma';

export interface RadiationInfo {
  type: RadiationType;
  name: string;
  symbol: string;
  particle: string;
  charge: string;
  mass: string;
  speed: string;
  ionizingPower: string;
  penetrationPower: string;
  attenuationByShield: {
    none: number;       // Transmission % (100)
    paper: number;      // 0 for alpha, 90 for beta, 99 for gamma
    aluminium: number;  // 0 for alpha, 0 for beta, 85 for gamma
    concrete: number;   // 0 for alpha, 0 for beta, 30 for gamma
    lead: number;       // 0 for alpha, 0 for beta, 2 for gamma
  };
  educationalNote: string;
}

export type ShieldMaterial = 'none' | 'paper' | 'aluminium' | 'concrete' | 'lead';

export interface ShieldInfo {
  id: ShieldMaterial;
  name: string;
  thickness: string;
  density: string;
  color: string;
  description: string;
}

export interface RadiationSample {
  id: string;
  name: string;
  category: string;
  baseActivityCPM: number; // Simulated base counts per minute at 5cm
  dominantRadiation: RadiationType;
  description: string;
  position: [number, number, number];
  color: string;
}

export interface ReactorComponentData {
  id: string;
  name: string;
  indonesianName: string;
  role: string;
  material: string;
  physicsPrinciple: string;
  safetyNote: string;
  color: string;
}

export interface ReactorState {
  controlRodInsertion: number; // 0% (rods fully removed = max fission) to 100% (rods fully inserted = reaction stopped)
  coolingPumpSpeed: number;    // 0 to 100%
  thermalEnergyMW: number;     // 0 to 3200 MWth
  steamFlowKgS: number;        // 0 to 1800 kg/s
  electricOutputMWe: number;   // 0 to 1100 MWe
  coreTempC: number;           // 280°C (idle) to 340°C (normal) to 400°C (high)
  chainReactionMulti: number;  // 0.0 to 2.5
  status: 'SCRAM' | 'SUBCRITICAL' | 'CRITICAL (BALANCED)' | 'SUPERCRITICAL' | 'WARNING_HIGH_TEMP';
}

export interface RadiationScenario {
  id: string;
  name: string;
  radiationType: RadiationType;
  shields: ShieldMaterial[];
  distanceCm: number;
  initialActivityCPM: number;
  createdAt: string;
}

export interface Mission {
  id: number;
  level: number;
  code: string;
  title: string;
  subtitle: string;
  badgeName: string;
  badgeIcon: string;
  xpReward: number;
  description: string;
  objective: string;
  targetStation: LabStationId;
  completed: boolean;
  tasks: {
    id: string;
    text: string;
    completed: boolean;
  }[];
}
