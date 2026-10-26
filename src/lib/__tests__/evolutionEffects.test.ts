import { describe, it, expect } from 'vitest';
import { applyEvolutionEffect, type EvolutionStats } from '../evolutionEffects';
import { evolutions, type Evolution } from '../../data/evolutions';
import { getDiseaseType } from '../../data/diseaseTypes';

const cfg = getDiseaseType('bacteria');

function baseStats(overrides: Partial<EvolutionStats> = {}): EvolutionStats {
  return {
    infectivity: 0.5,
    severity: 0.5,
    lethality: 0.5,
    heatResistance: 0.5,
    coldResistance: 0.5,
    drugResistance: 0.5,
    visibility: 0.5,
    stealth: 0.5,
    airTransmission: 1,
    seaTransmission: 1,
    waterTransmission: 1,
    ...overrides,
  };
}

function evoById(id: string): Evolution {
  const evo = evolutions.find(e => e.id === id);
  if (!evo) throw new Error(`missing evolution: ${id}`);
  return evo;
}

describe('applyEvolutionEffect', () => {
  it('applies positive deltas', () => {
    const result = applyEvolutionEffect(baseStats({ infectivity: 0.2 }), evoById('coughing'), cfg);
    expect(result.infectivity).toBeCloseTo(0.25, 10);
    expect(result.severity).toBeCloseTo(0.52, 10);
  });

  it('never produces a negative stat, even for trade-off evolutions', () => {
    // brain_death costs 15% infectivity; applied at 5% infectivity it must
    // floor at zero rather than going negative (which would invert the math).
    const result = applyEvolutionEffect(baseStats({ infectivity: 0.05 }), evoById('brain_death'), cfg);
    expect(result.infectivity).toBe(0);
    for (const value of Object.values(result)) {
      expect(value).toBeGreaterThanOrEqual(0);
    }
  });

  it('clamps unit stats to at most 1', () => {
    const result = applyEvolutionEffect(baseStats({ lethality: 0.95 }), evoById('brain_death'), cfg);
    expect(result.lethality).toBe(1);
  });

  it('clamps visibility into [0, 1]', () => {
    const low = applyEvolutionEffect(baseStats({ visibility: 0 }), evoById('latent'), cfg);
    expect(low.visibility).toBe(0);
    const high = applyEvolutionEffect(baseStats({ visibility: 0.99 }), evoById('obvious_strain'), cfg);
    expect(high.visibility).toBe(1);
  });

  it('reduces transmission on trade-off specializations but not below zero', () => {
    const result = applyEvolutionEffect(baseStats({ seaTransmission: 1.0 }), evoById('airborne_spec'), cfg);
    expect(result.seaTransmission).toBe(0);
    expect(result.airTransmission).toBeGreaterThan(1);

    const floored = applyEvolutionEffect(baseStats({ airTransmission: 0.2 }), evoById('maritime_spec'), cfg);
    expect(floored.airTransmission).toBe(0);
  });

  it('allows transmission stats to exceed 1 (they stack additively)', () => {
    const result = applyEvolutionEffect(baseStats({ airTransmission: 0.9 }), evoById('air3'), cfg);
    expect(result.airTransmission).toBeCloseTo(3.9, 10);
  });

  it('caps waterTransmission at 2', () => {
    const result = applyEvolutionEffect(baseStats({ waterTransmission: 1.5 }), evoById('water3'), cfg);
    expect(result.waterTransmission).toBe(2);
  });

  it('applies the disease type stealth bonus to visibility gains only', () => {
    const parasite = getDiseaseType('parasite');
    const stats = baseStats({ visibility: 0, stealth: 0 });
    // coughing grants +1% visibility; parasite's 20% stealth bonus damps it.
    const result = applyEvolutionEffect(stats, evoById('coughing'), parasite);
    expect(result.visibility).toBeCloseTo(0.008, 10);
  });

  it('subtracts stealth from visibility as well as adding it to stealth', () => {
    const result = applyEvolutionEffect(baseStats({ visibility: 0.5, stealth: 0 }), evoById('asymptomatic1'), cfg);
    expect(result.stealth).toBeCloseTo(0.15, 10);
    expect(result.visibility).toBeCloseTo(0.35, 10);
  });
});

describe('every evolution is safe to apply', () => {
  it('keeps all stats within valid ranges for any starting values', () => {
    const startingPoints: EvolutionStats[] = [
      baseStats(),
      baseStats({
        infectivity: 0, severity: 0, lethality: 0, visibility: 0, stealth: 0,
        heatResistance: 0, coldResistance: 0, drugResistance: 0,
        airTransmission: 0, seaTransmission: 0, waterTransmission: 0,
      }),
      baseStats({
        infectivity: 1, severity: 1, lethality: 1, visibility: 1, stealth: 1,
        heatResistance: 1, coldResistance: 1, drugResistance: 1,
        airTransmission: 1, seaTransmission: 1, waterTransmission: 2,
      }),
    ];

    for (const evo of evolutions) {
      for (const start of startingPoints) {
        const result = applyEvolutionEffect(start, evo, cfg);
        for (const [key, value] of Object.entries(result)) {
          expect(Number.isFinite(value), `${evo.id}.${key}`).toBe(true);
          expect(value, `${evo.id}.${key}`).toBeGreaterThanOrEqual(0);
          if (key !== 'airTransmission' && key !== 'seaTransmission' && key !== 'waterTransmission') {
            expect(value, `${evo.id}.${key}`).toBeLessThanOrEqual(1);
          }
        }
        expect(result.waterTransmission).toBeLessThanOrEqual(2);
      }
    }
  });
});
