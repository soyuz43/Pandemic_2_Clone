import type { Evolution } from '../data/evolutions';
import type { DiseaseTypeConfig } from '../data/diseaseTypes';

/**
 * The subset of game state that evolution effects can modify. Keeping this
 * narrow lets the same helper serve both the player-driven `evolve()` path and
 * the random-mutation path, so the two can never drift apart.
 */
export interface EvolutionStats {
  infectivity: number;
  severity: number;
  lethality: number;
  heatResistance: number;
  coldResistance: number;
  drugResistance: number;
  visibility: number;
  stealth: number;
  airTransmission: number;
  seaTransmission: number;
  waterTransmission: number;
}

/** Clamp a unit-interval stat to [0, 1]. */
function clampUnit(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Clamp a transmission stat to [0, ∞) — evolutions stack additively. */
function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

/**
 * Apply an evolution's effects to a set of stats, clamping every result.
 *
 * Trade-off evolutions apply negative deltas (e.g. `brain_death` costs 15%
 * infectivity), so a lower bound is required: a negative infectivity would
 * invert the spread math and corrupt the infected/dead/recovered bookkeeping.
 *
 * Visibility is the one stat with a compound rule — the disease type's stealth
 * bonus damps visibility *gains* only, while stealth evolutions subtract from
 * the total. Both `evolve()` and the mutation path must use this function so
 * the two stay consistent.
 */
export function applyEvolutionEffect(
  stats: EvolutionStats,
  evo: Evolution,
  diseaseConfig: DiseaseTypeConfig,
): EvolutionStats {
  const effect = evo.effect;

  // Visibility gains are damped by the disease type's stealth bonus.
  const visibilityGain = (effect.visibility || 0) * (1 - diseaseConfig.stealthBonus);

  return {
    infectivity: clampUnit(stats.infectivity + (effect.infectivity || 0)),
    severity: clampUnit(stats.severity + (effect.severity || 0)),
    lethality: clampUnit(stats.lethality + (effect.lethality || 0)),
    heatResistance: clampUnit(stats.heatResistance + (effect.heatResistance || 0)),
    coldResistance: clampUnit(stats.coldResistance + (effect.coldResistance || 0)),
    drugResistance: clampUnit(stats.drugResistance + (effect.drugResistance || 0)),
    visibility: clampUnit(stats.visibility + visibilityGain - (effect.stealth || 0)),
    stealth: clampUnit(stats.stealth + (effect.stealth || 0)),
    airTransmission: clampNonNegative(stats.airTransmission + (effect.airTransmission || 0)),
    seaTransmission: clampNonNegative(stats.seaTransmission + (effect.seaTransmission || 0)),
    waterTransmission: Math.max(0, Math.min(2, stats.waterTransmission + (effect.waterTransmission || 0))),
  };
}
