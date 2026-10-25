import { useState, useCallback, useRef, useEffect } from 'react';
import { Country, initialCountries } from '../data/countries';
import { evolutions, Evolution } from '../data/evolutions';
import { DiseaseType, getDiseaseType } from '../data/diseaseTypes';
import { allRoutes, namedRoutes, type TradeRoute } from '../data/routes';

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

export interface GameState {
  countries: Country[];
  dnaPoints: number;
  totalInfected: number;
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
  day: number;
  gameSpeed: number;
  isRunning: boolean;
  gameOver: boolean;
  gameWon: boolean;
  news: NewsItem[];
  cureStarted: boolean;
  startCountry: string | null;
  closedAirports: string[];   // country ids whose airports are shut (blocks air seeding)
  closedSeaports: string[];   // country ids whose seaports are shut (blocks sea seeding)
  activeFlights: number;      // live stats for the travel overlay / HUD
  activeShips: number;
}

export interface NewsItem {
  day: number;
  text: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

const INITIAL_DNA = 15;
const DNA_PER_INFECTED = 0.1;

// Travel network tuning (fictional game values)
const AIR_BASE_POWER = 0.6;   // baseline flight-spreading power of any pathogen
const SEA_BASE_POWER = 0.4;   // baseline shipping-spreading power
const TRAFFIC_SCALE = 300;    // normalizer: route traffic / TRAFFIC_SCALE ≈ per-route seeding chance factor
const OUTBREAK_VISIBILITY_THRESHOLD = 0.35; // visible outbreaks trigger automatic closures

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    countries: [],
    dnaPoints: INITIAL_DNA,
    totalInfected: 0,
    totalDead: 0,
    totalPopulation: 0,
    unlockedEvolutions: [],
    diseaseName: 'Disease',
    diseaseType: 'bacteria',
    infectivity: 0.1,
    severity: 0,
    lethality: 0,
    heatResistance: 0,
    coldResistance: 0,
    drugResistance: 0,
    visibility: 0,
    stealth: 0,
    airTransmission: AIR_BASE_POWER,
    seaTransmission: SEA_BASE_POWER,
    day: 1,
    gameSpeed: 1,
    isRunning: false,
    gameOver: false,
    gameWon: false,
    news: [],
    cureStarted: false,
    startCountry: null,
    closedAirports: [],
    closedSeaports: [],
    activeFlights: 0,
    activeShips: 0,
  });

  const intervalRef = useRef<number | null>(null);

  const startGame = useCallback((diseaseName: string, startCountryId: string, diseaseType: DiseaseType) => {
    const diseaseConfig = getDiseaseType(diseaseType);
    
    const countries: Country[] = initialCountries.map(c => ({
      ...c,
      infected: c.id === startCountryId ? 10 : 0,
      dead: 0,
      closed: false,
      cureProgress: 0,
    }));

    const totalPop = countries.reduce((sum, c) => sum + c.population, 0);

    setGameState(prev => ({
      ...prev,
      countries,
      diseaseName,
      diseaseType,
      totalPopulation: totalPop,
      totalInfected: 10,
      startCountry: startCountryId,
      isRunning: true,
      day: 1,
      dnaPoints: INITIAL_DNA,
      infectivity: diseaseConfig.startingInfectivity,
      visibility: Math.max(0, diseaseConfig.startingVisibility),
      airTransmission: AIR_BASE_POWER * diseaseConfig.airTransmission,
      seaTransmission: SEA_BASE_POWER * diseaseConfig.seaTransmission,
      closedAirports: [],
      closedSeaports: [],
      activeFlights: 0,
      activeShips: 0,
      news: [{ day: 1, text: `${diseaseName} (${diseaseConfig.name}) has been identified in ${countries.find(c => c.id === startCountryId)?.name}.`, type: 'info' }],
    }));
  }, []);

  const evolve = useCallback((evolutionId: string) => {
    setGameState(prev => {
      const evo = evolutions.find(e => e.id === evolutionId);
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

      // Apply stealth bonus from disease type to visibility gain
      const visibilityGain = (evo.effect.visibility || 0) * (1 - diseaseConfig.stealthBonus);

      return {
        ...prev,
        dnaPoints: prev.dnaPoints - adjustedCost,
        unlockedEvolutions: [...prev.unlockedEvolutions, evolutionId],
        infectivity: Math.min(1, prev.infectivity + (evo.effect.infectivity || 0)),
        severity: Math.min(1, prev.severity + (evo.effect.severity || 0)),
        lethality: Math.min(1, prev.lethality + (evo.effect.lethality || 0)),
        heatResistance: Math.min(1, prev.heatResistance + (evo.effect.heatResistance || 0)),
        coldResistance: Math.min(1, prev.coldResistance + (evo.effect.coldResistance || 0)),
        drugResistance: Math.min(1, prev.drugResistance + (evo.effect.drugResistance || 0)),
        visibility: Math.min(1, Math.max(0, prev.visibility + visibilityGain - (evo.effect.stealth || 0))),
        stealth: Math.min(1, prev.stealth + (evo.effect.stealth || 0)),
        airTransmission: prev.airTransmission + (evo.effect.airTransmission || 0),
        seaTransmission: prev.seaTransmission + (evo.effect.seaTransmission || 0),
        news: newNews.slice(0, 50),
      };
    });
  }, []);

  const tick = useCallback(() => {
    setGameState(prev => {
      if (!prev.isRunning || prev.gameOver) return prev;

      const newCountries = prev.countries.map(c => ({ ...c }));
      let newDna = prev.dnaPoints;
      const newNews: NewsItem[] = [];
      const countryById: Record<string, Country> = {};
      newCountries.forEach(c => { countryById[c.id] = c; });

      // Travel network state for this day (airports/seaports closed by panic)
      const closedAirports = new Set(prev.closedAirports);
      const closedSeaports = new Set(prev.closedSeaports);
      let flightsToday = 0;
      let shipsToday = 0;

      // ---- FLIGHT & SHIP TRAFFIC LAYER ----
      // Every open route carries traffic each day. If the origin has a meaningful
      // outbreak and the destination is still clean, there is a chance an infected
      // traveler/boarder seeds the disease there. Seeding power depends on:
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
        if (dest.infected > 0) return;          // already seeded, no news spam
        if (origin.infected <= 0) return;

        const originRatio = origin.infected / origin.population;
        if (originRatio < 0.0005) return;       // too few cases to board anything

        const power = isAir ? prev.airTransmission : prev.seaTransmission;
        const volumeFactor = Math.min(2, route.traffic / TRAFFIC_SCALE);
        const stealthAssist = 1 + prev.stealth * 0.8; // undetected carriers pass screening
        const chance = power * volumeFactor * prev.infectivity * stealthAssist *
                       Math.min(1, originRatio * 40) * 0.08 * prev.gameSpeed;

        if (Math.random() < chance) {
          const seedCount = Math.max(3, Math.floor(Math.min(origin.infected * 0.005, dest.population * 0.0001)) || 3);
          dest.infected = Math.max(dest.infected, seedCount);
          if (newNews.length < 5) {
            newNews.push({
              day: prev.day,
              text: isAir
                ? `${prev.diseaseName} reached ${cityName(route, 'to')} aboard a flight from ${cityName(route, 'from')}!`
                : `${prev.diseaseName} reached ${cityName(route, 'to')} hidden aboard cargo ships from ${cityName(route, 'from')}!`,
              type: 'danger',
            });
          }
        }
      });

      // Spread disease
      const diseaseConfig = getDiseaseType(prev.diseaseType);
      
      newCountries.forEach(country => {
        if (country.infected <= 0) return;

        const infectionRate = prev.infectivity * (1 + prev.severity * 0.5);
        let climateMod = 1;
        if (country.climate === 'hot') climateMod = 0.7 + prev.heatResistance * 0.6 + diseaseConfig.climateResistanceBonus;
        if (country.climate === 'cold') climateMod = 0.7 + prev.coldResistance * 0.6 + diseaseConfig.climateResistanceBonus;
        if (country.climate === 'tropical') climateMod = 0.8 + prev.heatResistance * 0.4 + diseaseConfig.climateResistanceBonus;
        climateMod = Math.max(0.1, climateMod); // Don't let it go negative

        const healthyPop = country.population - country.infected - country.dead;
        if (healthyPop <= 0) return;

        // Fixed: Use a much higher base rate so infection actually spreads
        const baseSpreadRate = 0.15; // Base 15% daily spread
        const newInfections = Math.min(
          healthyPop,
          Math.max(1, Math.floor(country.infected * infectionRate * climateMod * baseSpreadRate * prev.gameSpeed))
        );
        country.infected += newInfections;

        // Deaths from severity/lethality
        const deathRate = prev.lethality * 0.02 * prev.gameSpeed;
        const newDeaths = Math.max(0, Math.floor(country.infected * deathRate));
        if (newDeaths > 0) {
          country.dead += newDeaths;
          country.infected -= newDeaths;
        }

        // DNA from infections - more generous, with disease type multiplier
        newDna += newInfections * DNA_PER_INFECTED * diseaseConfig.dnaMultiplier * prev.gameSpeed;
        // Bonus DNA for deaths (represents more severe disease = more research attention)
        newDna += newDeaths * DNA_PER_INFECTED * 2 * diseaseConfig.dnaMultiplier * prev.gameSpeed;

        // Spread to connected countries
        if (!country.closed && Math.random() < 0.5 * prev.gameSpeed) {
          const connections = country.connections;
          connections.forEach(connId => {
            const target = newCountries.find(c => c.id === connId);
            if (target && !target.closed && target.infected === 0 && country.infected > 10) {
              // Higher chance of spread, and more initial infections
              if (Math.random() < prev.infectivity * 0.3) {
                target.infected = Math.max(5, Math.floor(country.infected * 0.01));
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

      // Countries may close borders based on visibility (reduced by stealth).
      // Visible outbreaks ALSO trigger automatic airport & seaport closures —
      // the classic "panic response" that strangles the travel network.
      const effectiveVisibility = Math.max(0, prev.visibility - prev.stealth * 0.8);
      newCountries.forEach(country => {
        const wealthMod = country.wealth === 'wealthy' ? 0.3 : country.wealth === 'developing' ? 0.15 : 0.05;
        const outbreakRatio = country.infected / country.population;

        // Automatic airport closure: high local outbreak + disease is visible.
        if (!closedAirports.has(country.id) && outbreakRatio > 0.02 &&
            effectiveVisibility > OUTBREAK_VISIBILITY_THRESHOLD &&
            Math.random() < wealthMod * 0.3 * prev.gameSpeed) {
          closedAirports.add(country.id);
          newNews.push({
            day: prev.day,
            text: `${country.name} has shut its airports after visible outbreaks! ✈️🚫`,
            type: 'warning',
          });
        }

        // Automatic seaport closure: rarer — only at severe outbreak levels.
        if (!closedSeaports.has(country.id) && outbreakRatio > 0.10 &&
            effectiveVisibility > OUTBREAK_VISIBILITY_THRESHOLD + 0.15 &&
            Math.random() < wealthMod * 0.15 * prev.gameSpeed) {
          closedSeaports.add(country.id);
          newNews.push({
            day: prev.day,
            text: `${country.name} has sealed its seaports to incoming cargo! ⚓🚫`,
            type: 'warning',
          });
        }

        if (country.closed) return;
        const closeChance = effectiveVisibility * wealthMod * 0.02 * prev.gameSpeed;
        if (country.infected > country.population * 0.05 && Math.random() < closeChance) {
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
            ...prev,
            countries: newCountries,
            dnaPoints: Math.floor(newDna),
            day: prev.day + 1,
            gameOver: true,
            gameWon: false,
            news: [...newNews, ...prev.news].slice(0, 50),
            cureStarted,
          };
        }
      }

      // Calculate totals
      const totalInfected = newCountries.reduce((sum, c) => sum + c.infected, 0);
      const totalDead = newCountries.reduce((sum, c) => sum + c.dead, 0);
      const totalPop = prev.totalPopulation;

      // Check win condition - need to kill 95%+ of population
      const allDead = totalDead >= totalPop * 0.95;

      // Virus mutation mechanic - random symptom gain
      if (diseaseConfig.mutationChance > 0 && Math.random() < diseaseConfig.mutationChance * prev.gameSpeed) {
        const availableMutations = evolutions.filter(e => 
          !prev.unlockedEvolutions.includes(e.id) && 
          e.category === 'symptom' &&
          (!e.requires || e.requires.every(r => prev.unlockedEvolutions.includes(r)))
        );
        if (availableMutations.length > 0) {
          const mutation = availableMutations[Math.floor(Math.random() * availableMutations.length)];
          newNews.push({
            day: prev.day,
            text: `${prev.diseaseName} has spontaneously mutated: ${mutation.name}!`,
            type: 'danger',
          });
          // Apply mutation effects (free evolution)
          const newUnlocked = [...prev.unlockedEvolutions, mutation.id];
          prev = {
            ...prev,
            unlockedEvolutions: newUnlocked,
            infectivity: Math.min(1, prev.infectivity + (mutation.effect.infectivity || 0)),
            severity: Math.min(1, prev.severity + (mutation.effect.severity || 0)),
            lethality: Math.min(1, prev.lethality + (mutation.effect.lethality || 0)),
            visibility: Math.min(1, Math.max(0, prev.visibility + (mutation.effect.visibility || 0) * (1 - diseaseConfig.stealthBonus))),
          };
        }
      }

      // Random news events
      if (prev.day % 10 === 0 && prev.visibility > 0.1) {
        const events = [
          `WHO issues warning about ${prev.diseaseName} spread.`,
          `Hospitals overwhelmed as ${prev.diseaseName} cases surge.`,
          `Panic buying reported in multiple countries.`,
          `Scientists study ${prev.diseaseName} mutation patterns.`,
          `UN holds emergency session on ${prev.diseaseName}.`,
          `Mass graves being prepared in several nations.`,
          `Global economy collapses as ${prev.diseaseName} spreads.`,
          `Military deployed to enforce quarantine zones.`,
        ];
        newNews.push({
          day: prev.day,
          text: events[Math.floor(Math.random() * events.length)],
          type: 'info',
        });
      }

      return {
        ...prev,
        countries: newCountries,
        dnaPoints: Math.floor(newDna),
        totalInfected,
        totalDead,
        day: prev.day + 1,
        isRunning: !allDead,
        gameOver: allDead,
        gameWon: allDead,
        news: [...newNews, ...prev.news].slice(0, 50),
        cureStarted,
        closedAirports: Array.from(closedAirports),
        closedSeaports: Array.from(closedSeaports),
        activeFlights: flightsToday,
        activeShips: shipsToday,
      };
    });
  }, []);

  const setGameSpeed = useCallback((speed: number) => {
    setGameState(prev => ({ ...prev, gameSpeed: speed }));
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  // Manual border closure (costs DNA) — shuts land borders AND all travel links.
  const closeBorders = useCallback((countryId: string) => {
    setGameState(prev => {
      const country = prev.countries.find(c => c.id === countryId);
      if (!country || country.closed) return prev;
      
      const cost = country.wealth === 'wealthy' ? 15 : country.wealth === 'developing' ? 10 : 5;
      if (prev.dnaPoints < cost) return prev;

      const newCountries = prev.countries.map(c => 
        c.id === countryId ? { ...c, closed: true } : c
      );

      const newNews = [...prev.news];
      newNews.unshift({
        day: prev.day,
        text: `You have closed ${country.name}'s borders! Flights and shipping suspended. (-${cost} DNA)`,
        type: 'warning',
      });

      return {
        ...prev,
        countries: newCountries,
        dnaPoints: prev.dnaPoints - cost,
        news: newNews.slice(0, 50),
      };
    });
  }, []);

  // Emergency airport shutdown (cheaper than full border closure, air only).
  const closeAirports = useCallback((countryId: string) => {
    setGameState(prev => {
      const country = prev.countries.find(c => c.id === countryId);
      if (!country || prev.closedAirports.includes(countryId)) return prev;
      const cost = country.wealth === 'wealthy' ? 8 : country.wealth === 'developing' ? 6 : 4;
      if (prev.dnaPoints < cost) return prev;

      const newNews = [...prev.news];
      newNews.unshift({
        day: prev.day,
        text: `${country.name} has shut its airports by emergency decree. ✈️🚫 (-${cost} DNA)`,
        type: 'warning',
      });

      return {
        ...prev,
        dnaPoints: prev.dnaPoints - cost,
        closedAirports: [...prev.closedAirports, countryId],
        news: newNews.slice(0, 50),
      };
    });
  }, []);

  // Emergency seaport quarantine (sea only).
  const closeSeaports = useCallback((countryId: string) => {
    setGameState(prev => {
      const country = prev.countries.find(c => c.id === countryId);
      if (!country || prev.closedSeaports.includes(countryId)) return prev;
      const cost = country.wealth === 'wealthy' ? 6 : country.wealth === 'developing' ? 5 : 3;
      if (prev.dnaPoints < cost) return prev;

      const newNews = [...prev.news];
      newNews.unshift({
        day: prev.day,
        text: `${country.name} has quarantined its seaports — no cargo boarding. ⚓🚫 (-${cost} DNA)`,
        type: 'warning',
      });

      return {
        ...prev,
        dnaPoints: prev.dnaPoints - cost,
        closedSeaports: [...prev.closedSeaports, countryId],
        news: newNews.slice(0, 50),
      };
    });
  }, []);

  // Game loop
  useEffect(() => {
    if (gameState.isRunning && !gameState.gameOver) {
      const speed = 800; // Fixed interval
      intervalRef.current = window.setInterval(tick, speed);
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [gameState.isRunning, gameState.gameOver, tick]);

  const getAvailableEvolutions = useCallback((): Evolution[] => {
    return evolutions.filter(e => {
      if (gameState.unlockedEvolutions.includes(e.id)) return false;
      if (e.requires && !e.requires.every(r => gameState.unlockedEvolutions.includes(r))) return false;
      return true;
    });
  }, [gameState.unlockedEvolutions]);

  return {
    gameState,
    startGame,
    evolve,
    setGameSpeed,
    togglePause,
    getAvailableEvolutions,
    closeBorders,
    closeAirports,
    closeSeaports,
  };
}
