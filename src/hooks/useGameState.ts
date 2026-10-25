import { useState, useCallback, useRef, useEffect } from 'react';
import { Country, initialCountries } from '../data/countries';
import { evolutions, Evolution } from '../data/evolutions';

export interface GameState {
  countries: Country[];
  dnaPoints: number;
  totalInfected: number;
  totalDead: number;
  totalPopulation: number;
  unlockedEvolutions: string[];
  diseaseName: string;
  infectivity: number;
  severity: number;
  lethality: number;
  heatResistance: number;
  coldResistance: number;
  drugResistance: number;
  visibility: number;
  stealth: number;
  day: number;
  gameSpeed: number;
  isRunning: boolean;
  gameOver: boolean;
  gameWon: boolean;
  news: NewsItem[];
  cureStarted: boolean;
  startCountry: string | null;
}

export interface NewsItem {
  day: number;
  text: string;
  type: 'info' | 'warning' | 'danger' | 'success';
}

const INITIAL_DNA = 15;
const DNA_PER_INFECTED = 0.1;

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    countries: [],
    dnaPoints: INITIAL_DNA,
    totalInfected: 0,
    totalDead: 0,
    totalPopulation: 0,
    unlockedEvolutions: [],
    diseaseName: 'Disease',
    infectivity: 0.1,
    severity: 0,
    lethality: 0,
    heatResistance: 0,
    coldResistance: 0,
    drugResistance: 0,
    visibility: 0,
    stealth: 0,
    day: 1,
    gameSpeed: 1,
    isRunning: false,
    gameOver: false,
    gameWon: false,
    news: [],
    cureStarted: false,
    startCountry: null,
  });

  const intervalRef = useRef<number | null>(null);

  const startGame = useCallback((diseaseName: string, startCountryId: string) => {
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
      totalPopulation: totalPop,
      totalInfected: 10,
      startCountry: startCountryId,
      isRunning: true,
      day: 1,
      dnaPoints: INITIAL_DNA,
      news: [{ day: 1, text: `${diseaseName} has been identified in ${countries.find(c => c.id === startCountryId)?.name}.`, type: 'info' }],
    }));
  }, []);

  const evolve = useCallback((evolutionId: string) => {
    setGameState(prev => {
      const evo = evolutions.find(e => e.id === evolutionId);
      if (!evo) return prev;
      if (prev.unlockedEvolutions.includes(evolutionId)) return prev;
      if (prev.dnaPoints < evo.cost) return prev;
      if (evo.requires && !evo.requires.every(r => prev.unlockedEvolutions.includes(r))) return prev;

      const newNews: NewsItem[] = [...prev.news];
      newNews.unshift({
        day: prev.day,
        text: `${prev.diseaseName} has evolved: ${evo.name}`,
        type: 'warning',
      });

      return {
        ...prev,
        dnaPoints: prev.dnaPoints - evo.cost,
        unlockedEvolutions: [...prev.unlockedEvolutions, evolutionId],
        infectivity: Math.min(1, prev.infectivity + (evo.effect.infectivity || 0)),
        severity: Math.min(1, prev.severity + (evo.effect.severity || 0)),
        lethality: Math.min(1, prev.lethality + (evo.effect.lethality || 0)),
        heatResistance: Math.min(1, prev.heatResistance + (evo.effect.heatResistance || 0)),
        coldResistance: Math.min(1, prev.coldResistance + (evo.effect.coldResistance || 0)),
        drugResistance: Math.min(1, prev.drugResistance + (evo.effect.drugResistance || 0)),
        visibility: Math.min(1, Math.max(0, prev.visibility + (evo.effect.visibility || 0) - (evo.effect.stealth || 0))),
        stealth: Math.min(1, prev.stealth + (evo.effect.stealth || 0)),
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

      // Spread disease
      newCountries.forEach(country => {
        if (country.infected <= 0) return;

        const infectionRate = prev.infectivity * (1 + prev.severity * 0.5);
        let climateMod = 1;
        if (country.climate === 'hot') climateMod = 0.7 + prev.heatResistance * 0.6;
        if (country.climate === 'cold') climateMod = 0.7 + prev.coldResistance * 0.6;
        if (country.climate === 'tropical') climateMod = 0.8 + prev.heatResistance * 0.4;

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

        // DNA from infections - more generous
        newDna += newInfections * DNA_PER_INFECTED * prev.gameSpeed;
        // Bonus DNA for deaths (represents more severe disease = more research attention)
        newDna += newDeaths * DNA_PER_INFECTED * 2 * prev.gameSpeed;

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

      // Countries may close borders based on visibility (reduced by stealth)
      const effectiveVisibility = Math.max(0, prev.visibility - prev.stealth * 0.8);
      newCountries.forEach(country => {
        if (country.closed) return;
        const wealthMod = country.wealth === 'wealthy' ? 0.3 : country.wealth === 'developing' ? 0.15 : 0.05;
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
      };
    });
  }, []);

  const setGameSpeed = useCallback((speed: number) => {
    setGameState(prev => ({ ...prev, gameSpeed: speed }));
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: !prev.isRunning }));
  }, []);

  // Manual border closure (costs DNA)
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
        text: `You have closed ${country.name}'s borders! (-${cost} DNA)`,
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
  };
}
