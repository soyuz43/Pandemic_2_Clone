import { describe, it, expect } from 'vitest';
import { WATER_SOURCES, createWaterRegions } from '../../data/waterSystems';
import { initialCountries } from '../../data/countries';

describe('water systems data', () => {
  it('defines sources for every country in the game', () => {
    const countryIds = initialCountries.map(c => c.id);
    for (const id of countryIds) {
      expect(WATER_SOURCES[id], `no water sources for ${id}`).toBeDefined();
    }
    expect(Object.keys(WATER_SOURCES).length).toBe(countryIds.length);
  });

  it('has no sources for countries that do not exist', () => {
    const countryIds = new Set(initialCountries.map(c => c.id));
    for (const id of Object.keys(WATER_SOURCES)) {
      expect(countryIds.has(id), `unknown country ${id}`).toBe(true);
    }
  });

  it('gives every country a populationShare that sums to 1', () => {
    for (const [countryId, sources] of Object.entries(WATER_SOURCES)) {
      const sum = sources.reduce((acc, s) => acc + s.populationShare, 0);
      expect(sum, `${countryId} populationShare sums to ${sum}`).toBeCloseTo(1, 6);
    }
  });

  it('gives every source a unique id, a name and a valid exposure', () => {
    for (const [countryId, sources] of Object.entries(WATER_SOURCES)) {
      const ids = sources.map(s => s.id);
      expect(new Set(ids).size, `${countryId} duplicate source ids`).toBe(ids.length);
      for (const source of sources) {
        expect(source.name.length, `${countryId}/${source.id}`).toBeGreaterThan(0);
        expect(source.populationShare, `${countryId}/${source.id}`).toBeGreaterThan(0);
        expect(source.populationShare, `${countryId}/${source.id}`).toBeLessThanOrEqual(1);
        expect(source.exposure, `${countryId}/${source.id}`).toBeGreaterThan(0);
        expect(source.exposure, `${countryId}/${source.id}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it('gives each country at least two distinct sources', () => {
    // Egypt legitimately has only two (Nile Valley / Nile Delta) because it is
    // defined by a single river system. The invariant that matters is that the
    // shares still cover the whole population, which is asserted above.
    for (const [countryId, sources] of Object.entries(WATER_SOURCES)) {
      expect(sources.length, `${countryId} source count`).toBeGreaterThanOrEqual(2);
    }
  });
});

describe('createWaterRegions', () => {
  const regions = createWaterRegions(initialCountries);

  it('creates a region for every source of every country', () => {
    const expected = Object.values(WATER_SOURCES).reduce((acc, s) => acc + s.length, 0);
    expect(regions).toHaveLength(expected);
  });

  it('starts every region clean', () => {
    for (const region of regions) {
      expect(region.contamination).toBe(0);
    }
  });

  it('keeps vulnerability within 0..1', () => {
    for (const region of regions) {
      expect(region.vulnerability).toBeGreaterThanOrEqual(0);
      expect(region.vulnerability).toBeLessThanOrEqual(1);
    }
  });

  it('gives each region a unique id', () => {
    const ids = regions.map(r => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses a generic fallback when a country has no custom sources', () => {
    const fallback = createWaterRegions([{ id: 'atlantis', wealth: 'poor', climate: 'temperate' }]);
    expect(fallback).toHaveLength(3);
    const total = fallback.reduce((acc, r) => acc + r.populationShare, 0);
    expect(total).toBeCloseTo(1, 6);
  });
});
