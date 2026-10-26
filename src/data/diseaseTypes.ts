export type DiseaseType = 'virus' | 'bacteria' | 'parasite';

export interface DiseaseTypeConfig {
  id: DiseaseType;
  name: string;
  description: string;
  icon: string;
  // Multipliers
  dnaMultiplier: number; // How fast you earn DNA
  evolutionMultiplier: number; // Cost reduction (1 = normal, 0.7 = 30% cheaper)
  // Starting bonuses
  startingInfectivity: number;
  startingVisibility: number;
  // Climate modifiers
  climateResistanceBonus: number; // Added to all climate checks
  // Special traits
  mutationChance: number; // Chance of random symptom evolution per day
  stealthBonus: number; // Reduces visibility gain from symptoms
  // Travel transmission: how efficiently the pathogen rides planes vs. ships
  airTransmission: number; // multiplier on flight-based seeding (1 = normal)
  seaTransmission: number; // multiplier on shipping-based seeding (1 = normal)
  waterTransmission: number; // ability to persist and spread through local water supplies
}

export const diseaseTypes: Record<DiseaseType, DiseaseTypeConfig> = {
  virus: {
    id: 'virus',
    name: 'Virus',
    description: 'Evolves rapidly and spreads easily, but is vulnerable to climate and highly visible. High risk, high reward.',
    icon: '🦠',
    dnaMultiplier: 1.5,
    evolutionMultiplier: 0.8, // 20% cheaper evolutions
    startingInfectivity: 0.15,
    startingVisibility: 0.05,
    climateResistanceBonus: -0.2,
    mutationChance: 0.02, // 2% chance per day of random mutation
    stealthBonus: 0,
    airTransmission: 1.5, // coughed into cabin air — loves planes
    seaTransmission: 0.7,
    waterTransmission: 0.05,
  },
  bacteria: {
    id: 'bacteria',
    name: 'Bacteria',
    description: 'Balanced pathogen with moderate evolution speed and average resistance to all factors. The reliable choice.',
    icon: '🔬',
    dnaMultiplier: 1.8,
    evolutionMultiplier: 1.0,
    startingInfectivity: 0.18,
    startingVisibility: 0.0,
    climateResistanceBonus: 0,
    mutationChance: 0.005,
    stealthBonus: 0.05,
    airTransmission: 1.0,
    seaTransmission: 1.2, // rides in cargo holds & contaminated water supplies
    waterTransmission: 0.12,
  },
  parasite: {
    id: 'parasite',
    name: 'Parasite',
    description: 'Slow to evolve but nearly invisible and highly resilient. Hard to detect, hard to kill. Patient players only.',
    icon: '🐛',
    dnaMultiplier: 2.6, // higher DNA gain to offset expensive evolutions
    evolutionMultiplier: 1.3, // 30% more expensive evolutions
    startingInfectivity: 0.18,
    startingVisibility: -0.05, // Starts with negative visibility (harder to detect)
    climateResistanceBonus: 0.25,
    mutationChance: 0.001,
    stealthBonus: 0.2, // 20% reduced visibility gain from symptoms
    airTransmission: 0.6, // adult parasites can't fly
    seaTransmission: 1.5, // stowaways in ballast water and cargo
    waterTransmission: 0.25,
  },
};

export function getDiseaseType(id: DiseaseType): DiseaseTypeConfig {
  return diseaseTypes[id];
}
