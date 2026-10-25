export interface Evolution {
  id: string;
  name: string;
  description: string;
  category: 'symptom' | 'transmission' | 'ability';
  cost: number;
  effect: {
    infectivity?: number;
    severity?: number;
    lethality?: number;
    heatResistance?: number;
    coldResistance?: number;
    drugResistance?: number;
    visibility?: number;
  };
  requires?: string[];
}

export const evolutions: Evolution[] = [
  // Symptoms
  { id: 'coughing', name: 'Coughing', description: '+5% infectivity, +2% severity', category: 'symptom', cost: 2, effect: { infectivity: 0.05, severity: 0.02, visibility: 0.01 } },
  { id: 'fever', name: 'Fever', description: '+5% infectivity, +5% severity', category: 'symptom', cost: 3, effect: { infectivity: 0.05, severity: 0.05, visibility: 0.02 }, requires: ['coughing'] },
  { id: 'nausea', name: 'Nausea', description: '+3% infectivity, +8% severity', category: 'symptom', cost: 4, effect: { infectivity: 0.03, severity: 0.08, visibility: 0.03 }, requires: ['coughing'] },
  { id: 'pneumonia', name: 'Pneumonia', description: '+8% severity, +5% lethality', category: 'symptom', cost: 8, effect: { severity: 0.08, lethality: 0.05, visibility: 0.05 }, requires: ['fever', 'coughing'] },
  { id: 'hemorrhage', name: 'Internal Hemorrhage', description: '+15% severity, +10% lethality', category: 'symptom', cost: 15, effect: { severity: 0.15, lethality: 0.10, visibility: 0.08 }, requires: ['pneumonia'] },
  { id: 'necrosis', name: 'Necrosis', description: '+20% severity, +15% lethality', category: 'symptom', cost: 25, effect: { severity: 0.20, lethality: 0.15, visibility: 0.10 }, requires: ['hemorrhage'] },
  { id: 'coma', name: 'Coma', description: '+25% severity, +20% lethality', category: 'symptom', cost: 40, effect: { severity: 0.25, lethality: 0.20, visibility: 0.12 }, requires: ['necrosis'] },
  
  // Transmission
  { id: 'air1', name: 'Air Transmission I', description: '+10% infectivity', category: 'transmission', cost: 5, effect: { infectivity: 0.10 } },
  { id: 'air2', name: 'Air Transmission II', description: '+20% infectivity', category: 'transmission', cost: 15, effect: { infectivity: 0.20 }, requires: ['air1'] },
  { id: 'water1', name: 'Water Transmission I', description: '+10% infectivity', category: 'transmission', cost: 5, effect: { infectivity: 0.10 } },
  { id: 'water2', name: 'Water Transmission II', description: '+20% infectivity', category: 'transmission', cost: 15, effect: { infectivity: 0.20 }, requires: ['water1'] },
  { id: 'blood', name: 'Blood Transmission', description: '+15% infectivity, +5% severity', category: 'transmission', cost: 10, effect: { infectivity: 0.15, severity: 0.05 } },
  { id: 'insect', name: 'Insect Transmission', description: '+15% infectivity', category: 'transmission', cost: 12, effect: { infectivity: 0.15 } },
  { id: 'rodent', name: 'Rodent Transmission', description: '+12% infectivity', category: 'transmission', cost: 10, effect: { infectivity: 0.12 } },
  { id: 'livestock', name: 'Livestock Transmission', description: '+12% infectivity', category: 'transmission', cost: 10, effect: { infectivity: 0.12 } },
  
  // Abilities
  { id: 'cold1', name: 'Cold Resistance I', description: '+25% cold resistance', category: 'ability', cost: 5, effect: { coldResistance: 0.25 } },
  { id: 'cold2', name: 'Cold Resistance II', description: '+50% cold resistance', category: 'ability', cost: 15, effect: { coldResistance: 0.50 }, requires: ['cold1'] },
  { id: 'heat1', name: 'Heat Resistance I', description: '+25% heat resistance', category: 'ability', cost: 5, effect: { heatResistance: 0.25 } },
  { id: 'heat2', name: 'Heat Resistance II', description: '+50% heat resistance', category: 'ability', cost: 15, effect: { heatResistance: 0.50 }, requires: ['heat1'] },
  { id: 'drug1', name: 'Drug Resistance I', description: '+25% drug resistance', category: 'ability', cost: 10, effect: { drugResistance: 0.25 } },
  { id: 'drug2', name: 'Drug Resistance II', description: '+50% drug resistance', category: 'ability', cost: 25, effect: { drugResistance: 0.50 }, requires: ['drug1'] },
  { id: 'genetic', name: 'Genetic Reshuffle', description: 'Slows cure research by 50%', category: 'ability', cost: 30, effect: { drugResistance: 0.30 }, requires: ['drug2'] },
];
