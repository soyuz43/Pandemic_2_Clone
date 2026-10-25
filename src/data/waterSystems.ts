import type { Country } from './countries';

export interface WaterRegionState {
  id: string;
  countryId: string;
  name: string;
  populationShare: number;
  vulnerability: number;
  contamination: number;
}

const WATER_SOURCES = [
  { id: 'treated', name: 'Treated supply', populationShare: 0.5, exposure: 0.45 },
  { id: 'groundwater', name: 'Groundwater wells', populationShare: 0.3, exposure: 0.85 },
  { id: 'surface', name: 'Surface water', populationShare: 0.2, exposure: 1 },
] as const;

const WEALTH_VULNERABILITY = {
  poor: 0.68,
  developing: 0.43,
  wealthy: 0.2,
} as const;

export function createWaterRegions(countries: Pick<Country, 'id' | 'wealth' | 'climate'>[]): WaterRegionState[] {
  return countries.flatMap(country => {
    const climateRisk = country.climate === 'hot' ? 0.1 : country.climate === 'tropical' ? 0.06 : 0;
    const baseline = Math.min(0.95, WEALTH_VULNERABILITY[country.wealth] + climateRisk);

    return WATER_SOURCES.map(source => ({
      id: `${country.id}-${source.id}`,
      countryId: country.id,
      name: source.name,
      populationShare: source.populationShare,
      vulnerability: Math.min(0.98, baseline * source.exposure),
      contamination: 0,
    }));
  });
}
