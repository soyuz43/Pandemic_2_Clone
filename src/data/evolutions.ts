export interface Evolution {
  id: string;
  name: string;
  description: string;
  category: 'symptom' | 'transmission' | 'ability';
  branch: string;        // tree branch (e.g. "air", "symptom", "stealth")
  tier: number;          // depth in the branch (0 = root), used for tree indentation
  cost: number;
  effect: {
    infectivity?: number;
    severity?: number;
    lethality?: number;
    heatResistance?: number;
    coldResistance?: number;
    drugResistance?: number;
    visibility?: number;
    stealth?: number;
    airTransmission?: number; // additive boost to flight seeding power
    seaTransmission?: number; // additive boost to shipping seeding power
    waterTransmission?: number;
  };
  requires?: string[];
  tradeoff?: boolean;    // has a downside baked into the effect
  drawback?: string;     // human-readable downside for the tooltip
}

export const evolutions: Evolution[] = [
  // ========================= SYMPTOMS =========================
  // Visible illness. Strong spread + severity, but every symptom
  // raises visibility, making detection (and countermeasures) easier.
  { id: 'coughing',     name: 'Coughing',          branch: 'symptom', tier: 0, description: '+5% infectivity, +2% severity', category: 'symptom', cost: 2,  effect: { infectivity: 0.05, severity: 0.02, visibility: 0.01 } },
  { id: 'fever',        name: 'Fever',             branch: 'symptom', tier: 1, description: '+5% infectivity, +5% severity', category: 'symptom', cost: 3,  effect: { infectivity: 0.05, severity: 0.05, visibility: 0.02 }, requires: ['coughing'] },
  { id: 'nausea',       name: 'Nausea',            branch: 'symptom', tier: 1, description: '+3% infectivity, +8% severity', category: 'symptom', cost: 4,  effect: { infectivity: 0.03, severity: 0.08, visibility: 0.03 }, requires: ['coughing'] },
  { id: 'rash',         name: 'Skin Rash',         branch: 'symptom', tier: 2, description: '+6% infectivity, +4% severity, +visibility', category: 'symptom', cost: 5,  effect: { infectivity: 0.06, severity: 0.04, visibility: 0.04 }, requires: ['fever'] },
  { id: 'pneumonia',    name: 'Pneumonia',         branch: 'symptom', tier: 2, description: '+8% severity, +5% lethality', category: 'symptom', cost: 8,  effect: { severity: 0.08, lethality: 0.05, visibility: 0.05 }, requires: ['fever', 'coughing'] },
  { id: 'lesions',      name: 'Open Lesions',      branch: 'symptom', tier: 3, description: '+12% severity, +10% visibility', category: 'symptom', cost: 12, effect: { severity: 0.12, visibility: 0.10 }, requires: ['rash'] },
  { id: 'hemorrhage',   name: 'Internal Hemorrhage', branch: 'symptom', tier: 3, description: '+15% severity, +10% lethality', category: 'symptom', cost: 15, effect: { severity: 0.15, lethality: 0.10, visibility: 0.08 }, requires: ['pneumonia'] },
  { id: 'necrosis',     name: 'Necrosis',          branch: 'symptom', tier: 4, description: '+20% severity, +15% lethality', category: 'symptom', cost: 25, effect: { severity: 0.20, lethality: 0.15, visibility: 0.10 }, requires: ['hemorrhage'] },
  { id: 'coma',         name: 'Coma',              branch: 'symptom', tier: 5, description: '+25% severity, +20% lethality', category: 'symptom', cost: 40, effect: { severity: 0.25, lethality: 0.20, visibility: 0.12 }, requires: ['necrosis'] },
  { id: 'organ_failure', name: 'Organ Failure',    branch: 'symptom', tier: 6, description: '+25% lethality, +15% severity, very visible', category: 'symptom', cost: 55, effect: { lethality: 0.25, severity: 0.15, visibility: 0.15 }, requires: ['coma'] },
  { id: 'brain_death',  name: 'Total Systemic Collapse', branch: 'symptom', tier: 7, description: '+30% lethality BUT -15% infectivity (dead hosts spread less)', category: 'symptom', cost: 75, effect: { lethality: 0.30, infectivity: -0.15, visibility: 0.12 }, requires: ['organ_failure'], tradeoff: true, drawback: 'Extreme lethality kills hosts before they can spread.' },

  // ========================= TRANSMISSION =========================
  // Three independent travel branches (air / sea / water) plus a vector branch.
  // Each can be specialized — but specializing trades the other modes away.
  // --- Air branch ---
  { id: 'air1',         name: 'Air Transmission I',  branch: 'air', tier: 0, description: '+10% infectivity, doubles flight transmission', category: 'transmission', cost: 5,  effect: { infectivity: 0.10, airTransmission: 1.0 } },
  { id: 'air2',         name: 'Air Transmission II', branch: 'air', tier: 1, description: '+20% infectivity, triples flight transmission', category: 'transmission', cost: 15, effect: { infectivity: 0.20, airTransmission: 2.0 }, requires: ['air1'] },
  { id: 'air3',         name: 'Air Transmission III',branch: 'air', tier: 2, description: '+25% infectivity, flight transmission x5', category: 'transmission', cost: 35, effect: { infectivity: 0.25, airTransmission: 3.0 }, requires: ['air2'] },
  { id: 'airborne_spec', name: 'Aerosol Specialist', branch: 'air', tier: 3, description: 'Flight spread soars, but sea seeding collapses', category: 'transmission', cost: 50, effect: { airTransmission: 4.0, seaTransmission: -1.5 }, requires: ['air3'], tradeoff: true, drawback: 'Optimized for cabins, nearly useless on ships.' },

  // --- Sea branch ---
  { id: 'sea1',         name: 'Sea Transmission I',  branch: 'sea', tier: 0, description: '+8% infectivity, doubles shipping transmission', category: 'transmission', cost: 5,  effect: { infectivity: 0.08, seaTransmission: 1.0 } },
  { id: 'sea2',         name: 'Sea Transmission II', branch: 'sea', tier: 1, description: '+15% infectivity, triples shipping transmission', category: 'transmission', cost: 15, effect: { infectivity: 0.15, seaTransmission: 2.0 }, requires: ['sea1'] },
  { id: 'sea3',         name: 'Sea Transmission III',branch: 'sea', tier: 2, description: '+25% infectivity, shipping x5', category: 'transmission', cost: 35, effect: { infectivity: 0.25, seaTransmission: 3.0 }, requires: ['sea2'] },
  { id: 'maritime_spec', name: 'Maritime Specialist', branch: 'sea', tier: 3, description: 'Shipping spread soars, but flight seeding collapses', category: 'transmission', cost: 50, effect: { seaTransmission: 4.0, airTransmission: -1.5 }, requires: ['sea3'], tradeoff: true, drawback: 'Dominates cargo, weak in aircraft cabins.' },

  // --- Water branch ---
  { id: 'water1',       name: 'Waterborne I',       branch: 'water', tier: 0, description: 'Contaminates groundwater; improves local water spread', category: 'transmission', cost: 5,  effect: { waterTransmission: 0.45 } },
  { id: 'water2',       name: 'Waterborne II',      branch: 'water', tier: 1, description: 'Persists in treated supplies; spreads more efficiently', category: 'transmission', cost: 15, effect: { waterTransmission: 0.8 }, requires: ['water1'] },
  { id: 'water3',       name: 'Waterborne III',     branch: 'water', tier: 2, description: 'Biofilms everywhere; severe local contamination', category: 'transmission', cost: 30, effect: { waterTransmission: 1.0 }, requires: ['water2'] },

  // --- Vector branch ---
  { id: 'blood',        name: 'Blood Transmission',  branch: 'vector', tier: 0, description: '+15% infectivity, +5% severity', category: 'transmission', cost: 10, effect: { infectivity: 0.15, severity: 0.05 } },
  { id: 'insect',       name: 'Insect Transmission', branch: 'vector', tier: 0, description: '+15% infectivity, boosts flight & shipping spread', category: 'transmission', cost: 12, effect: { infectivity: 0.15, airTransmission: 0.5, seaTransmission: 0.5 } },
  { id: 'rodent',       name: 'Rodent Transmission', branch: 'vector', tier: 1, description: '+12% infectivity', category: 'transmission', cost: 10, effect: { infectivity: 0.12 }, requires: ['blood'] },
  { id: 'livestock',    name: 'Livestock Transmission', branch: 'vector', tier: 1, description: '+12% infectivity', category: 'transmission', cost: 10, effect: { infectivity: 0.12 }, requires: ['blood'] },
  { id: 'vector_master',name: 'Vector Mastery',     branch: 'vector', tier: 2, description: '+10% infectivity, +0.5 air/sea, but +12% visibility', category: 'transmission', cost: 30, effect: { infectivity: 0.10, airTransmission: 0.5, seaTransmission: 0.5, visibility: 0.12 }, requires: ['insect', 'blood'], tradeoff: true, drawback: 'Swarming vectors are easy to notice.' },
  { id: 'zoonotic',     name: 'Zoonotic Spillover', branch: 'vector', tier: 2, description: '+18% infectivity from animals, but +10% visibility', category: 'transmission', cost: 28, effect: { infectivity: 0.18, visibility: 0.10 }, requires: ['rodent', 'livestock'], tradeoff: true, drawback: 'Animal outbreaks draw scrutiny.' },

  // ========================= ABILITIES =========================
  // Resilience, climate, stealth, and a set of deliberate trade-off specializations.
  // --- Climate branch ---
  { id: 'cold1',        name: 'Cold Resistance I',  branch: 'climate', tier: 0, description: '+25% cold resistance', category: 'ability', cost: 5,  effect: { coldResistance: 0.25 } },
  { id: 'cold2',        name: 'Cold Resistance II', branch: 'climate', tier: 1, description: '+50% cold resistance', category: 'ability', cost: 15, effect: { coldResistance: 0.50 }, requires: ['cold1'] },
  { id: 'heat1',        name: 'Heat Resistance I',  branch: 'climate', tier: 0, description: '+25% heat resistance', category: 'ability', cost: 5,  effect: { heatResistance: 0.25 } },
  { id: 'heat2',        name: 'Heat Resistance II', branch: 'climate', tier: 1, description: '+50% heat resistance', category: 'ability', cost: 15, effect: { heatResistance: 0.50 }, requires: ['heat1'] },
  { id: 'frost_spec',   name: 'Frost Specialist',   branch: 'climate', tier: 2, description: 'Mastery of cold, but weak in heat', category: 'ability', cost: 30, effect: { coldResistance: 0.50, heatResistance: -0.40 }, requires: ['cold2'], tradeoff: true, drawback: 'Loses most heat tolerance.' },
  { id: 'thermal_spec', name: 'Thermal Specialist', branch: 'climate', tier: 2, description: 'Mastery of heat, but weak in cold', category: 'ability', cost: 30, effect: { heatResistance: 0.50, coldResistance: -0.40 }, requires: ['heat2'], tradeoff: true, drawback: 'Loses most cold tolerance.' },

  // --- Drug resistance branch ---
  { id: 'drug1',        name: 'Drug Resistance I',  branch: 'resistance', tier: 0, description: '+25% drug resistance', category: 'ability', cost: 10, effect: { drugResistance: 0.25 } },
  { id: 'drug2',        name: 'Drug Resistance II', branch: 'resistance', tier: 1, description: '+50% drug resistance', category: 'ability', cost: 25, effect: { drugResistance: 0.50 }, requires: ['drug1'] },
  { id: 'genetic',      name: 'Genetic Reshuffle',  branch: 'resistance', tier: 2, description: 'Slows cure research by 50%', category: 'ability', cost: 30, effect: { drugResistance: 0.30 }, requires: ['drug2'] },
  { id: 'drug3',        name: 'Absolute Resistance', branch: 'resistance', tier: 3, description: 'Cure nearly useless, but slower replication (-10% infectivity)', category: 'ability', cost: 55, effect: { drugResistance: 0.40, infectivity: -0.10 }, requires: ['genetic'], tradeoff: true, drawback: 'Bulky genome spreads less readily.' },

  // --- Stealth branch ---
  { id: 'asymptomatic1',name: 'Asymptomatic I',     branch: 'stealth', tier: 0, description: '-15% visibility, +5% infectivity', category: 'ability', cost: 8,  effect: { stealth: 0.15, infectivity: 0.05 } },
  { id: 'asymptomatic2',name: 'Asymptomatic II',    branch: 'stealth', tier: 1, description: '-25% visibility, +10% infectivity', category: 'ability', cost: 20, effect: { stealth: 0.25, infectivity: 0.10 }, requires: ['asymptomatic1'] },
  { id: 'incubation',   name: 'Long Incubation',    branch: 'stealth', tier: 1, description: '-20% visibility, delays detection', category: 'ability', cost: 15, effect: { stealth: 0.20 } },
  { id: 'mimicry',      name: 'Symptom Mimicry',    branch: 'stealth', tier: 2, description: '-30% visibility, mimics common cold', category: 'ability', cost: 25, effect: { stealth: 0.30 }, requires: ['asymptomatic1', 'incubation'] },
  { id: 'latent',       name: 'Latent Infection',   branch: 'stealth', tier: 3, description: '-40% visibility, hard to detect', category: 'ability', cost: 40, effect: { stealth: 0.40 }, requires: ['mimicry'] },
  { id: 'ghost',        name: 'Ghost Pathogen',     branch: 'stealth', tier: 4, description: '-50% visibility, but -10% severity (milder = less deadly)', category: 'ability', cost: 60, effect: { stealth: 0.50, severity: -0.10 }, requires: ['latent'], tradeoff: true, drawback: 'So subtle it harms hosts less.' },
  { id: 'cryptic',      name: 'Cryptic Carrier',    branch: 'stealth', tier: 4, description: '-45% visibility, but -8% infectivity', category: 'ability', cost: 55, effect: { stealth: 0.45, infectivity: -0.08 }, requires: ['latent'], tradeoff: true, drawback: 'Hides so well it transmits slower.' },

  // --- Deliberate trade-off specializations (ability) ---
  { id: 'hypervirulent',name: 'Hypervirulence',     branch: 'specialist', tier: 0, description: '+20% lethality, +15% severity, BUT +15% visibility & -10% infectivity', category: 'ability', cost: 45, effect: { lethality: 0.20, severity: 0.15, visibility: 0.15, infectivity: -0.10 }, tradeoff: true, drawback: 'Kills fast and loud; hosts die before spreading widely.' },
  { id: 'obvious_strain',name: 'Obvious Strain',    branch: 'specialist', tier: 0, description: '+25% infectivity, BUT +20% visibility (easy to track)', category: 'ability', cost: 30, effect: { infectivity: 0.25, visibility: 0.20 }, tradeoff: true, drawback: 'Spreads like wildfire but is impossible to hide.' },
  { id: 'slow_burn',    name: 'Slow Burn',          branch: 'specialist', tier: 0, description: '+20% stealth & +10% drug resistance, BUT -12% infectivity', category: 'ability', cost: 40, effect: { stealth: 0.20, drugResistance: 0.10, infectivity: -0.12 }, tradeoff: true, drawback: 'Hidden and durable, yet sluggish to spread.' },
];
