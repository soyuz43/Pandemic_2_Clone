import { Country, initialCountries } from '../data/countries';
import { evolutions, Evolution } from '../data/evolutions';
import { DiseaseType, getDiseaseType } from '../data/diseaseTypes';
import { allRoutes, namedRoutes, type TradeRoute } from '../data/routes';
import { createWaterRegions, type WaterRegionState } from '../data/waterSystems';
import { applyEvolutionEffect } from './evolutionEffects';
import type { GameState, NewsItem } from './gameState';

// Friendly game-city names for news headlines (fictional: usa node = Chicago, south_africa node = Johannesburg).
const CITY_NAMES: Record<string, string> = Object.fromEntries(
  namedRoutes.flatMap(r => [[r.from, r.fromCity], [r.to, r.toCity]] as [string, string][])
);
function cityName(route: TradeRoute, side: 'from' | 'to'): string {
  const id = route[side];
  if ('fromCity' in route && route.fromCity) {
    return side === 'from' ? (route as typeof route & { fromCity: string }).fromCity : (route as typeof route & { toCity: string }).toCity;
  }
  return CITY_NAMES[id] || initialCountries.find(c => c.id === id)?.name || id;
}

// Simulation tuning (fictional game values)
export const INITIAL_DNA = 15;
export const DNA_BANK_CAP = 250;
export const BASE_SPREAD_RATE = 0.15;
export const TARGET_BASE_REPRODUCTION = 1.06;
export const DNA_PER_TICK_CAP = 1.5;
export const DNA_CASE_SCALE = 0.35;
export const DNA_DEATH_SCALE = 0.12;
export const DNA_DAMPING_CASES = 250_000;
export const WATER_SPREAD_RATE = 0.001;


// Travel network tuning (fictional game values)
export const AIR_BASE_POWER = 0.6;   // baseline flight-spreading power of any pathogen
export const SEA_BASE_POWER = 0.4;   // baseline shipping-spreading power


/** Deterministic source of randomness; injectable so runs can be reproduced. */
export type Rng = () => number;

/** Result of advancing the simulation by one day. */
export interface TickResult {
  state: GameState;
  gameOver: boolean;
  gameWon: boolean;
  gameOverReason: 'cure' | 'extinction' | 'collapse' | null;
}

export function createInitialState(
  diseaseName: string,
  startCountryId: string,
  diseaseType: DiseaseType,
): GameState {
  const diseaseConfig = getDiseaseType(diseaseType);

  const countries: Country[] = initialCountries.map(c => ({
    ...c,
    infected: c.id === startCountryId ? 10 : 0,
    recovered: 0,
    dead: 0,
    closed: false,
    cureProgress: 0,
  }));

  const totalPop = countries.reduce((sum, c) => sum + c.population, 0);

  return {
    countries,
    dnaPoints: INITIAL_DNA,
    totalInfected: 10,
    totalRecovered: 0,
    totalDead: 0,
    totalPopulation: totalPop,
    unlockedEvolutions: [],
    diseaseName,
    diseaseType,
    infectivity: diseaseConfig.startingInfectivity,
    severity: 0,
    lethality: 0,
    heatResistance: 0,
    coldResistance: 0,
    drugResistance: 0,
    visibility: Math.max(0, diseaseConfig.startingVisibility),
    stealth: 0,
    airTransmission: AIR_BASE_POWER * diseaseConfig.airTransmission,
    seaTransmission: SEA_BASE_POWER * diseaseConfig.seaTransmission,
    waterTransmission: diseaseConfig.waterTransmission,
    waterRegions: createWaterRegions(countries),
    day: 1,
    gameSpeed: 1,
    isRunning: true,
    gameOver: false,
    gameWon: false,
    gameOverReason: null,
    news: [{
      day: 1,
      text: `${diseaseName} (${diseaseConfig.name}) has been identified in ${countries.find(c => c.id === startCountryId)?.name}.`,
      type: 'info',
    }],
    cureStarted: false,
    startCountry: startCountryId,
    closedAirports: [],
    closedSeaports: [],
    activeFlights: 0,
    activeShips: 0,
  };
}

/**
 * Advance the simulation by one day.
 *
 * Pure with respect to its inputs: given the same state and the same sequence
 * of random numbers, it always produces the same result. This makes the whole
 * balance model testable without a browser.
 */
export function tick(prev: GameState, random: Rng): TickResult {
  const diseaseConfig = getDiseaseType(prev.diseaseType);

  const newCountries = prev.countries.map(c => ({ ...c }));
  let newDna = prev.dnaPoints;
  let newInfectionsToday = 0;
  let newDeathsToday = 0;
  const newNews: NewsItem[] = [];
  const countryById: Record<string, Country> = {};
  newCountries.forEach(c => { countryById[c.id] = c; });

  // Travel network state for this day (airports/seaports closed by panic)
  const closedAirports = new Set(prev.closedAirports);
  const closedSeaports = new Set(prev.closedSeaports);
  let flightsToday = 0;
  let shipsToday = 0;

  // ---- FLIGHT & SHIP TRAFFIC LAYER ----
  // Every open corridor carries traffic in both directions. If either endpoint
  // has a meaningful outbreak and the other is still clean, infected travelers
  // can seed the disease there. Seeding power depends on:
  //   route traffic (volume), pathogen travel transmission (type + evolutions),
  //   infectivity, stealth (undetected travelers slip past screening),
  //   and whether either end has shut its airports/seaports.
  allRoutes.forEach(route => {
    const origin = countryById[route.from];
    const dest = countryById[route.to];
    if (!origin || !dest) return;

    const isAir = route.kind === 'air';
    const transportClosed =
      origin.closed || dest.closed ||
      (isAir ? (closedAirports.has(origin.id) || closedAirports.has(dest.id))
             : (closedSeaports.has(origin.id) || closedSeaports.has(dest.id)));

    // Traffic still flies/sails between open countries — it just can't seed
    // across a shut frontier. Count live traffic for the HUD/overlay.
    if (!transportClosed) {
      if (isAir) flightsToday += route.traffic;
      else shipsToday += route.traffic;
    }

    if (transportClosed) return;            // nothing crosses a closed frontier
    const seedAcrossCorridor = (
      source: Country,
      target: Country,
      sourceSide: 'from' | 'to',
      targetSide: 'from' | 'to',
    ) => {
      if (target.infected > 0 || target.dead + target.recovered >= target.population) return;
      if (source.infected < 10) return;

      const power = isAir ? prev.airTransmission : prev.seaTransmission;
      const sourceRatio = source.infected / source.population;
      const screeningFactor = 1 - Math.min(0.75, Math.max(0, prev.visibility - prev.stealth * 0.8));
      const carrierPressure = route.traffic / 20 * sourceRatio * power * prev.infectivity *
        (1 + prev.stealth * 0.8) * screeningFactor * prev.gameSpeed;
      const chance = 1 - Math.exp(-carrierPressure);

      if (random() >= chance) return;

      const susceptible = target.population - target.dead - target.recovered;
      const seedCount = Math.min(susceptible, Math.max(3, Math.floor(Math.min(source.infected * 0.005, target.population * 0.0001)) || 3));
      target.infected = Math.max(target.infected, seedCount);
      newInfectionsToday += seedCount;
      if (newNews.length < 5) {
        newNews.push({
          day: prev.day,
          text: isAir
            ? `${prev.diseaseName} reached ${cityName(route, targetSide)} aboard a flight from ${cityName(route, sourceSide)}!`
            : `${prev.diseaseName} reached ${cityName(route, targetSide)} hidden aboard cargo ships from ${cityName(route, sourceSide)}!`,
          type: 'danger',
        });
      }
    };

    seedAcrossCorridor(origin, dest, 'from', 'to');
    seedAcrossCorridor(dest, origin, 'to', 'from');
  });

  // Spread disease
  newCountries.forEach(country => {
    if (country.infected <= 0) return;

    const infectionRate = prev.infectivity * (1 + prev.severity * 0.5);
    let climateMod = 1;
    if (country.climate === 'hot') climateMod = 0.7 + prev.heatResistance * 0.6 + diseaseConfig.climateResistanceBonus;
    if (country.climate === 'cold') climateMod = 0.7 + prev.coldResistance * 0.6 + diseaseConfig.climateResistanceBonus;
    if (country.climate === 'tropical') climateMod = 0.8 + prev.heatResistance * 0.4 + diseaseConfig.climateResistanceBonus;
    climateMod = Math.max(0.1, climateMod);
    climateMod = 0.9 + climateMod * 0.1;

    const healthyPop = country.population - country.infected - country.dead - country.recovered;
    // Only seed NEW infections while a susceptible pool remains. We must NOT
    // early-return when the healthy pool is exhausted: the infected still need
    // to die and recover, otherwise infected/dead tallies freeze (nobody dies).
    const newInfections = healthyPop > 0
      ? Math.min(healthyPop, country.infected * infectionRate * climateMod * BASE_SPREAD_RATE * prev.gameSpeed)
      : 0;
    country.infected += newInfections;
    newInfectionsToday += newInfections;

    const deathRate = prev.lethality * 0.02 * prev.gameSpeed;
    const newDeaths = Math.min(country.infected, country.infected * deathRate);
    if (newDeaths > 0) {
      country.dead += newDeaths;
      country.infected -= newDeaths;
      newDeathsToday += newDeaths;
    }

    const recoverySuppression = Math.max(0.01, 1 - prev.lethality * 1.98);
    const recoveryRate = diseaseConfig.startingInfectivity * BASE_SPREAD_RATE / TARGET_BASE_REPRODUCTION * recoverySuppression * prev.gameSpeed;
    const recoveries = Math.min(country.infected, country.infected * recoveryRate);
    country.infected -= recoveries;
    country.recovered += recoveries;

    // Spread to connected countries
    if (!country.closed && random() < 0.5 * prev.gameSpeed) {
      const connections = country.connections;
      connections.forEach(connId => {
        const target = newCountries.find(c => c.id === connId);
        if (target && !target.closed && target.infected === 0 && target.dead + target.recovered < target.population && country.infected > 10) {
          // Higher chance of spread, and more initial infections
          if (random() < prev.infectivity * 0.3) {
            const seedCount = Math.min(target.population - target.dead - target.recovered, Math.max(5, Math.floor(country.infected * 0.01)));
            target.infected = seedCount;
            newInfectionsToday += seedCount;
            if (newNews.length < 3) {
              newNews.push({
                day: prev.day,
                text: `${prev.diseaseName} has reached ${target.name}!`,
                type: 'danger',
              });
            }
          }
        }
      });
    }
  });

  // ---- WATER CONTAMINATION LAYER ----
  // Each country has its own named water sources. Contamination grows with the
  // local outbreak and decays over time, so sources flip from clean to
  // contaminated at staggered moments.
  const newWaterRegions: WaterRegionState[] = prev.waterRegions.map(region => {
    const country = countryById[region.countryId];
    if (!country) return region;

    const prevalence = country.infected / country.population;
    const contaminationGrowth = prevalence * prev.waterTransmission * (0.025 + region.vulnerability * 0.05) * prev.gameSpeed;
    const contaminationDecay = region.contamination * (0.012 + (1 - region.vulnerability) * 0.025) * prev.gameSpeed;

    return {
      ...region,
      contamination: Math.max(0, Math.min(1, region.contamination + contaminationGrowth - contaminationDecay)),
    };
  });

  newCountries.forEach(country => {
    const susceptible = country.population - country.infected - country.dead - country.recovered;
    if (susceptible <= 0 || prev.waterTransmission <= 0) return;

    const regionalExposure = newWaterRegions
      .filter(region => region.countryId === country.id)
      .reduce((sum, region) => sum + region.populationShare * region.vulnerability * region.contamination, 0);
    const waterInfectionRate = Math.min(0.01, regionalExposure * prev.waterTransmission * WATER_SPREAD_RATE * prev.gameSpeed);
    const waterInfections = Math.min(susceptible, susceptible * waterInfectionRate);
    country.infected += waterInfections;
    newInfectionsToday += waterInfections;
  });

  const caseDna = Math.log1p(newInfectionsToday / 100) * DNA_CASE_SCALE;
  const deathDna = Math.log1p(newDeathsToday / 100) * DNA_DEATH_SCALE;
  const dnaDiminishingReturns = 1 / (1 + prev.totalInfected / DNA_DAMPING_CASES);
  newDna = Math.min(
    DNA_BANK_CAP,
    newDna + Math.min(DNA_PER_TICK_CAP, (caseDna + deathDna) * diseaseConfig.dnaMultiplier) * dnaDiminishingReturns,
  );

  // PANIC RESPONSE — countries react once their OWN outbreak is large in
  // absolute terms (hundreds of thousands of infected), not on tiny
  // percentages. Wealthier nations detect and react sooner; poor nations
  // only move once the caseload is catastrophic. High visibility (low
  // stealth) makes detection faster.
  const effectiveVisibility = Math.max(0, prev.visibility - prev.stealth * 0.8);
  // Detection multiplier: how readily cases are noticed (0.4 invisible .. 1.3 obvious).
  const detect = 0.4 + effectiveVisibility * 0.9;
  newCountries.forEach(country => {
    const wealthMod = country.wealth === 'wealthy' ? 1.0 : country.wealth === 'developing' ? 0.5 : 0.25;
    const infected = country.infected;

    // Automatic airport closure: starts once a country has a serious
    // caseload and ramps up as cases climb into the millions.
    if (!closedAirports.has(country.id) && infected >= 150_000) {
      const intensity = Math.min(1, (infected - 150_000) / 850_000) * wealthMod * detect;
      if (random() < intensity * 0.25 * prev.gameSpeed) {
        closedAirports.add(country.id);
        newNews.push({
          day: prev.day,
          text: `${country.name} has shut its airports amid ${Math.floor(infected / 1000)}k infections! ✈️🚫`,
          type: 'warning',
        });
      }
    }

    // Automatic seaport closure: kicks in at a heavier caseload.
    if (!closedSeaports.has(country.id) && infected >= 400_000) {
      const intensity = Math.min(1, (infected - 400_000) / 1_600_000) * wealthMod * detect;
      if (random() < intensity * 0.2 * prev.gameSpeed) {
        closedSeaports.add(country.id);
        newNews.push({
          day: prev.day,
          text: `${country.name} has sealed its seaports to incoming cargo! ⚓🚫`,
          type: 'warning',
        });
      }
    }

    if (country.closed) return;
    const closeChance = effectiveVisibility * wealthMod * 0.02 * prev.gameSpeed;
    if (infected >= 750_000 && random() < closeChance) {
      country.closed = true;
      newNews.push({
        day: prev.day,
        text: `${country.name} has closed its borders!`,
        type: 'warning',
      });
    }
  });

  // Cure progress (delayed by stealth)
  let cureStarted = prev.cureStarted;
  const cureThreshold = Math.max(0.1, 0.2 - prev.stealth * 0.15);
  if (!cureStarted && effectiveVisibility > cureThreshold && prev.day > 30) {
    cureStarted = true;
    newNews.push({
      day: prev.day,
      text: `Scientists have begun researching a cure for ${prev.diseaseName}!`,
      type: 'danger',
    });
  }

  if (cureStarted) {
    const wealthyCountries = newCountries.filter(c => c.wealth === 'wealthy' && !c.closed);
    const cureRate = (0.1 + wealthyCountries.length * 0.05) * (1 - prev.drugResistance * 0.5) * prev.gameSpeed;
    newCountries.forEach(c => {
      if (c.infected > 0 && c.wealth === 'wealthy') {
        c.cureProgress = Math.min(100, c.cureProgress + cureRate * 0.1);
      }
    });

    const avgCure = newCountries.reduce((sum, c) => sum + c.cureProgress, 0) / newCountries.length;
    if (avgCure >= 100) {
      newNews.push({
        day: prev.day,
        text: `A cure for ${prev.diseaseName} has been found! The disease is being eradicated.`,
        type: 'success',
      });
      return {
        state: {
          ...prev,
          countries: newCountries,
          dnaPoints: newDna,
          waterRegions: newWaterRegions,
          totalInfected: newCountries.reduce((sum, c) => sum + c.infected, 0),
          totalRecovered: newCountries.reduce((sum, c) => sum + c.recovered, 0),
          totalDead: newCountries.reduce((sum, c) => sum + c.dead, 0),
          day: prev.day + 1,
          isRunning: false,
          gameOver: true,
          gameWon: false,
          gameOverReason: 'cure',
          news: [...newNews, ...prev.news].slice(0, 50),
          cureStarted,
        },
        gameOver: true,
        gameWon: false,
        gameOverReason: 'cure',
      };
    }
  }

  // Calculate totals
  const totalInfected = newCountries.reduce((sum, c) => sum + c.infected, 0);
  const totalDead = newCountries.reduce((sum, c) => sum + c.dead, 0);
  const totalPop = prev.totalPopulation;

  // Check win condition - need to kill 95%+ of population
  const allDead = totalDead >= totalPop * 0.95;
  const outbreakBurnedOut = totalInfected < 1;
  const gameIsOver = allDead || outbreakBurnedOut;

  if (outbreakBurnedOut && !allDead) {
    newNews.push({
      day: prev.day,
      text: `${prev.diseaseName} has burned out after most infected people recovered.`,
      type: 'success',
    });
  }

  // Virus mutation mechanic - random symptom gain
  let state: GameState = prev;
  if (diseaseConfig.mutationChance > 0 && random() < diseaseConfig.mutationChance * prev.gameSpeed) {
    const availableMutations = evolutions.filter(e =>
      !prev.unlockedEvolutions.includes(e.id) &&
      e.category === 'symptom' &&
      (!e.requires || e.requires.every(r => prev.unlockedEvolutions.includes(r)))
    );
    if (availableMutations.length > 0) {
      const mutation = availableMutations[Math.floor(random() * availableMutations.length)];
      newNews.push({
        day: prev.day,
        text: `${prev.diseaseName} has spontaneously mutated: ${mutation.name}!`,
        type: 'danger',
      });
      // Apply mutation effects (free evolution). Uses the same clamped helper as
      // the player-driven path so trade-off evolutions cannot push stats
      // negative here either.
      state = {
        ...state,
        unlockedEvolutions: [...state.unlockedEvolutions, mutation.id],
        ...applyEvolutionEffect(state, mutation, diseaseConfig),
      };
    }
  }

  // Random news events
  if (state.day % 10 === 0 && state.visibility > 0.1) {
    const events = [
      `WHO issues warning about ${state.diseaseName} spread.`,
      `Hospitals overwhelmed as ${state.diseaseName} cases surge.`,
      `Panic buying reported in multiple countries.`,
      `Scientists study ${state.diseaseName} mutation patterns.`,
      `UN holds emergency session on ${state.diseaseName}.`,
      `Mass graves being prepared in several nations.`,
      `Global economy collapses as ${state.diseaseName} spreads.`,
      `Military deployed to enforce quarantine zones.`,
    ];
    newNews.push({
      day: state.day,
      text: events[Math.floor(random() * events.length)],
      type: 'info',
    });
  }

  const finalState: GameState = {
    ...state,
    countries: newCountries,
    dnaPoints: newDna,
    totalInfected,
    totalRecovered: newCountries.reduce((sum, c) => sum + c.recovered, 0),
    totalDead,
    day: prev.day + 1,
    isRunning: !gameIsOver,
    gameOver: gameIsOver,
    gameWon: allDead,
    gameOverReason: allDead ? 'collapse' : outbreakBurnedOut ? 'extinction' : null,
    news: [...newNews, ...state.news].slice(0, 50),
    cureStarted,
    closedAirports: Array.from(closedAirports),
    closedSeaports: Array.from(closedSeaports),
    waterRegions: newWaterRegions,
    activeFlights: flightsToday,
    activeShips: shipsToday,
  };

  return {
    state: finalState,
    gameOver: gameIsOver,
    gameWon: allDead,
    gameOverReason: finalState.gameOverReason,
  };
}

/**
 * Purchase an evolution if it is affordable and unlocked. Returns the updated
 * state, or the original state when the purchase is not allowed.
 */
export function applyEvolution(
  prev: GameState,
  evolutionId: string,
): GameState {
  const evo: Evolution | undefined = evolutions.find(e => e.id === evolutionId);
  if (!evo) return prev;
  if (prev.unlockedEvolutions.includes(evolutionId)) return prev;

  const diseaseConfig = getDiseaseType(prev.diseaseType);
  const adjustedCost = Math.ceil(evo.cost * diseaseConfig.evolutionMultiplier);

  if (prev.dnaPoints < adjustedCost) return prev;
  if (evo.requires && !evo.requires.every(r => prev.unlockedEvolutions.includes(r))) return prev;

  const newNews: NewsItem[] = [...prev.news];
  newNews.unshift({
    day: prev.day,
    text: `${prev.diseaseName} has evolved: ${evo.name}`,
    type: 'warning',
  });

  return {
    ...prev,
    dnaPoints: prev.dnaPoints - adjustedCost,
    unlockedEvolutions: [...prev.unlockedEvolutions, evolutionId],
    ...applyEvolutionEffect(prev, evo, diseaseConfig),
    news: newNews.slice(0, 50),
  };
}

/** Effective (disease-adjusted) cost of an evolution for the given disease. */
export function evolutionCost(evo: Evolution, diseaseType: DiseaseType): number {
  const diseaseConfig = getDiseaseType(diseaseType);
  return Math.ceil(evo.cost * diseaseConfig.evolutionMultiplier);
}
