import { useState, useCallback, useRef, useEffect } from 'react';
import { DiseaseType } from '../data/diseaseTypes';
import { evolutions, Evolution } from '../data/evolutions';
import {
  applyEvolution,
  createInitialState,
  tick as simulateTick,
  INITIAL_DNA,
  AIR_BASE_POWER,
  SEA_BASE_POWER,
} from '../lib/simulation';
import type { GameState, NewsItem } from '../lib/gameState';

export type { GameState, NewsItem } from '../lib/gameState';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>({
    countries: [],
    dnaPoints: INITIAL_DNA,
    totalInfected: 0,
    totalRecovered: 0,
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
    waterTransmission: 0,
    waterRegions: [],
    day: 1,
    gameSpeed: 1,
    isRunning: false,
    gameOver: false,
    gameWon: false,
    gameOverReason: null,
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
    setGameState(prev => ({
      ...prev,
      ...createInitialState(diseaseName, startCountryId, diseaseType),
    }));
  }, []);

  const evolve = useCallback((evolutionId: string) => {
    setGameState(prev => applyEvolution(prev, evolutionId));
  }, []);

  const tick = useCallback(() => {
    setGameState(prev => {
      if (!prev.isRunning || prev.gameOver) return prev;
      return simulateTick(prev, Math.random).state;
    });
  }, []);

  const setGameSpeed = useCallback((speed: number) => {
    setGameState(prev => ({ ...prev, gameSpeed: speed }));
  }, []);

  const togglePause = useCallback(() => {
    setGameState(prev => ({ ...prev, isRunning: !prev.isRunning }));
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
  };
}
