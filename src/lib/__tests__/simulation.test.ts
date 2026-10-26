import { describe, it, expect } from 'vitest';
import {
  createInitialState,
  tick,
  applyEvolution,
  evolutionCost,
  panicThreshold,
  AIRPORT_CLOSE_THRESHOLD,
  SEAPORT_CLOSE_THRESHOLD,
  BORDER_CLOSE_THRESHOLD,
  type Rng,
} from '../simulation';
import { evolutions } from '../../data/evolutions';
import { getDiseaseType } from '../../data/diseaseTypes';
import type { GameState } from '../gameState';

/** Deterministic PRNG so every run is reproducible. */
function mulberry32(seed: number): Rng {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Greedy buyer that favours lethality — the fastest route to the 95% kill
 * win condition. Mirrors a strong human player.
 */
function buyEvolved(state: GameState): GameState {
  const diseaseConfig = getDiseaseType(state.diseaseType);
  let current = state;
  for (;;) {
    const owned = new Set(current.unlockedEvolutions);
    const affordable = evolutions.filter(e =>
      !owned.has(e.id) &&
      (!e.requires || e.requires.every(r => owned.has(r))) &&
      current.dnaPoints >= Math.ceil(e.cost * diseaseConfig.evolutionMultiplier)
    );
    if (affordable.length === 0) return current;
    affordable.sort((a, b) => {
      const la = (a.effect.lethality || 0) * 100 - (a.effect.infectivity || 0) * 20;
      const lb = (b.effect.lethality || 0) * 100 - (b.effect.infectivity || 0) * 20;
      if (lb !== la) return lb - la;
      return Math.ceil(a.cost * diseaseConfig.evolutionMultiplier) - Math.ceil(b.cost * diseaseConfig.evolutionMultiplier);
    });
    const next = applyEvolution(current, affordable[0].id);
    if (next === current) return current;
    current = next;
  }
}

interface RunOutcome {
  outcome: 'collapse' | 'extinction' | 'cure' | 'timeout';
  day: number;
  bought: number;
}

function playout(
  diseaseType: 'virus' | 'bacteria' | 'parasite',
  startCountry: string,
  seed: number,
  maxDays = 4000,
): RunOutcome {
  const random = mulberry32(seed);
  let state = createInitialState('Testpathogen', startCountry, diseaseType);
  let bought = 0;
  for (let day = 0; day < maxDays; day++) {
    const result = tick(state, random);
    state = result.state;
    const before = state.unlockedEvolutions.length;
    state = buyEvolved(state);
    bought += state.unlockedEvolutions.length - before;
    if (result.gameOver) {
      return { outcome: result.gameOverReason ?? 'timeout', day: state.day, bought };
    }
  }
  return { outcome: 'timeout', day: state.day, bought };
}

describe('panic thresholds', () => {
  it('uses the absolute threshold for large populations', () => {
    expect(panicThreshold(331_000_000, BORDER_CLOSE_THRESHOLD)).toBe(750_000);
    expect(panicThreshold(1_400_000_000, BORDER_CLOSE_THRESHOLD)).toBe(750_000);
  });

  it('scales down for small populations so they can still panic', () => {
    // Botswana: 5% of 2.4M = 120k, far below the 750k absolute threshold.
    expect(panicThreshold(2_400_000, BORDER_CLOSE_THRESHOLD)).toBe(120_000);
    expect(panicThreshold(2_500_000, BORDER_CLOSE_THRESHOLD)).toBe(125_000);
  });

  it('scales all three corridors consistently', () => {
    expect(panicThreshold(2_400_000, AIRPORT_CLOSE_THRESHOLD)).toBe(120_000);
    expect(panicThreshold(2_400_000, SEAPORT_CLOSE_THRESHOLD)).toBe(120_000);
  });
});

describe('simulation invariants', () => {
  it('never lets a country exceed its population', () => {
    const random = mulberry32(2024);
    let state = createInitialState('Testpathogen', 'usa', 'virus');
    for (let day = 0; day < 600; day++) {
      state = tick(state, random).state;
      for (const country of state.countries) {
        const accounted = country.infected + country.recovered + country.dead;
        expect(accounted, `${country.id} on day ${state.day}`).toBeLessThanOrEqual(country.population + 1);
        expect(country.infected, country.id).toBeGreaterThanOrEqual(0);
        expect(country.recovered, country.id).toBeGreaterThanOrEqual(0);
        expect(country.dead, country.id).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it('keeps every pathogen stat non-negative and bounded', () => {
    const random = mulberry32(99);
    let state = createInitialState('Testpathogen', 'india', 'parasite');
    for (let day = 0; day < 600; day++) {
      state = tick(state, random).state;
      state = buyEvolved(state);
      for (const key of ['infectivity', 'severity', 'lethality', 'visibility', 'stealth',
                         'heatResistance', 'coldResistance', 'drugResistance'] as const) {
        expect(state[key], key).toBeGreaterThanOrEqual(0);
        expect(state[key], key).toBeLessThanOrEqual(1);
      }
      expect(state.airTransmission).toBeGreaterThanOrEqual(0);
      expect(state.seaTransmission).toBeGreaterThanOrEqual(0);
      expect(state.waterTransmission).toBeGreaterThanOrEqual(0);
      expect(state.waterTransmission).toBeLessThanOrEqual(2);
      expect(Number.isFinite(state.dnaPoints)).toBe(true);
    }
  });

  it('is deterministic: the same seed produces the same result', () => {
    const a = playout('virus', 'usa', 12345);
    const b = playout('virus', 'usa', 12345);
    expect(a).toEqual(b);
  });
});

describe('the 95% collapse win is reachable', () => {
  // These guard the balance rebalance. Before the fix, the game could never be
  // won: DNA income collapsed once infections passed ~250k and bacteria and
  // parasite had R0 < 1, so every playthrough ended in "extinction".
  const cases: Array<[('virus' | 'bacteria' | 'parasite'), string]> = [
    ['virus', 'usa'],
    ['virus', 'china'],
    ['bacteria', 'usa'],
    ['bacteria', 'brazil'],
    ['parasite', 'usa'],
    ['parasite', 'india'],
  ];

  for (const [diseaseType, startCountry] of cases) {
    it(`${diseaseType} from ${startCountry} can reach the 95% kill condition`, () => {
      const result = playout(diseaseType, startCountry, 20260101);
      expect(result.outcome).toBe('collapse');
    });
  }

  it('is winnable across a broad sample of diseases, starts and seeds', () => {
    const diseases = ['virus', 'bacteria', 'parasite'] as const;
    const starts = ['usa', 'china', 'brazil', 'kenya', 'india', 'france'];
    const seeds = [31337, 424242, 999983];
    let wins = 0;
    let total = 0;
    for (const disease of diseases) {
      for (const start of starts) {
        for (const seed of seeds) {
          const result = playout(disease, start, seed);
          total++;
          if (result.outcome === 'collapse') wins++;
        }
      }
    }
    expect(wins / total).toBeGreaterThanOrEqual(0.95);
  });
});

describe('evolution purchasing', () => {
  it('refuses to purchase without enough DNA', () => {
    let state = createInitialState('Testpathogen', 'usa', 'parasite');
    state = { ...state, dnaPoints: 0 };
    const before = state.unlockedEvolutions.length;
    const after = applyEvolution(state, 'coughing');
    expect(after.unlockedEvolutions.length).toBe(before);
    expect(after.dnaPoints).toBe(0);
  });

  it('refuses to purchase an evolution whose prerequisites are unmet', () => {
    let state = createInitialState('Testpathogen', 'usa', 'bacteria');
    state = { ...state, dnaPoints: 1000 };
    const after = applyEvolution(state, 'organ_failure');
    expect(after.unlockedEvolutions).not.toContain('organ_failure');
  });

  it('charges the disease-adjusted cost', () => {
    let state = createInitialState('Testpathogen', 'usa', 'parasite');
    state = { ...state, dnaPoints: 1000 };
    const after = applyEvolution(state, 'coughing');
    expect(after.dnaPoints).toBe(1000 - evolutionCost(evolutions.find(e => e.id === 'coughing')!, 'parasite'));
  });

  it('prices parasites higher than viruses for the same evolution', () => {
    const coughing = evolutions.find(e => e.id === 'coughing')!;
    expect(evolutionCost(coughing, 'parasite')).toBeGreaterThan(evolutionCost(coughing, 'virus'));
  });
});
