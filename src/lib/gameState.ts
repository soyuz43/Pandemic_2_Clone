import type { Country } from '../data/countries';
import type { DiseaseType } from '../data/diseaseTypes';
import type { WaterRegionState } from '../data/waterSystems';

export interface NewsItem {
  day: number;
  text: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

export interface GameState {
  countries: Country[];
  dnaPoints: number;
  totalInfected: number;
  totalRecovered: number;
  totalDead: number;
  totalPopulation: number;
  unlockedEvolutions: string[];
  diseaseName: string;
  diseaseType: DiseaseType;
  infectivity: number;
  severity: number;
  lethality: number;
  heatResistance: number;
  coldResistance: number;
  drugResistance: number;
  visibility: number;
  stealth: number;
  airTransmission: number; // pathogen's flight-spreading power (base + evolutions)
  seaTransmission: number; // pathogen's shipping-spreading power (base + evolutions)
  waterTransmission: number;
  waterRegions: WaterRegionState[];
  day: number;
  gameSpeed: number;
  isRunning: boolean;
  gameOver: boolean;
  gameWon: boolean;
  gameOverReason: 'cure' | 'extinction' | 'collapse' | null;
  news: NewsItem[];
  cureStarted: boolean;
  startCountry: string | null;
  closedAirports: string[];   // country ids whose airports are shut (blocks air seeding)
  closedSeaports: string[];   // country ids whose seaports are shut (blocks sea seeding)
  activeFlights: number;      // traffic volume per day for the travel overlay / HUD
  activeShips: number;
  inTransitFlights: number;   // live airborne vehicles at this simulation instant
  inTransitShips: number;     // live ships at sea at this simulation instant
}
