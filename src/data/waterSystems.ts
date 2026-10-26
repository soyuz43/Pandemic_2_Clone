import type { Country } from './countries';

export interface WaterRegionState {
  id: string;
  countryId: string;
  name: string;
  populationShare: number;   // fraction of the country served (sums to ~1 per country)
  vulnerability: number;     // 0..1 how readily this source passes on infection
  contamination: number;     // 0 = clean, 1 = fully contaminated (sliding scale)
}

export interface WaterSourceDef {
  id: string;
  name: string;
  populationShare: number;
  exposure: number; // 0..1 how easy this source is to contaminate (drives timing)
}

// Per-country water source map. Each country gets its own named sources (fictional
// "regions" — e.g. USA split into 5-6 basins, Russia into 8). populationShare for
// a country sums to ~1 so aggregate spread stays balanced; exposure varies so
// sources flip from clean -> contaminated at different times.
export const WATER_SOURCES: Record<string, WaterSourceDef[]> = {
  usa: [
    { id: 'greatlakes', name: 'Great Lakes Basin', populationShare: 0.20, exposure: 0.45 },
    { id: 'ogallala',   name: 'Ogallala Aquifer',  populationShare: 0.18, exposure: 0.85 },
    { id: 'colorado',   name: 'Colorado Aqueduct',  populationShare: 0.15, exposure: 0.60 },
    { id: 'mississippi',name: 'Mississippi River',  populationShare: 0.22, exposure: 1.0 },
    { id: 'columbia',   name: 'Columbia Basin',     populationShare: 0.13, exposure: 0.55 },
    { id: 'municipal',  name: 'Municipal Supply',   populationShare: 0.12, exposure: 0.35 },
  ],
  canada: [
    { id: 'stlawrence', name: 'St. Lawrence',       populationShare: 0.35, exposure: 0.55 },
    { id: 'greatbear',  name: 'Great Bear Lakes',   populationShare: 0.30, exposure: 0.80 },
    { id: 'fraser',     name: 'Fraser River',       populationShare: 0.35, exposure: 1.0 },
  ],
  mexico: [
    { id: 'lerma',     name: 'Lerma River',         populationShare: 0.40, exposure: 1.0 },
    { id: 'gw_mex',    name: 'Northern Aquifer',    populationShare: 0.35, exposure: 0.85 },
    { id: 'yucatan',   name: 'Yucatan Cenotes',     populationShare: 0.25, exposure: 0.60 },
  ],
  brazil: [
    { id: 'amazon',    name: 'Amazon Basin',        populationShare: 0.40, exposure: 1.0 },
    { id: 'sao',       name: 'Sao Francisco River', populationShare: 0.30, exposure: 0.90 },
    { id: 'guarani',   name: 'Guarani Aquifer',     populationShare: 0.30, exposure: 0.70 },
  ],
  argentina: [
    { id: 'plata',     name: 'Rio de la Plata',     populationShare: 0.45, exposure: 1.0 },
    { id: 'pampas',    name: 'Pampas Aquifer',      populationShare: 0.30, exposure: 0.75 },
    { id: 'patagonia', name: 'Patagonia Lakes',     populationShare: 0.25, exposure: 0.55 },
  ],
  colombia: [
    { id: 'magdalena', name: 'Magdalena River',     populationShare: 0.45, exposure: 1.0 },
    { id: 'andean',    name: 'Andean Aquifers',     populationShare: 0.30, exposure: 0.80 },
    { id: 'caribbean', name: 'Caribbean Coast',     populationShare: 0.25, exposure: 0.65 },
  ],
  uk: [
    { id: 'thames',    name: 'Thames System',       populationShare: 0.35, exposure: 0.40 },
    { id: 'severn',    name: 'Severn Estuary',      populationShare: 0.30, exposure: 0.60 },
    { id: 'gw_uk',     name: 'Chalk Aquifers',      populationShare: 0.35, exposure: 0.75 },
  ],
  france: [
    { id: 'seine',     name: 'Seine Basin',         populationShare: 0.35, exposure: 0.50 },
    { id: 'rhone',     name: 'Rhone Valley',        populationShare: 0.30, exposure: 0.70 },
    { id: 'gw_fr',     name: 'Artesian Wells',      populationShare: 0.35, exposure: 0.85 },
  ],
  germany: [
    { id: 'rhine',     name: 'Rhine System',        populationShare: 0.40, exposure: 0.50 },
    { id: 'elbe',      name: 'Elbe Basin',          populationShare: 0.30, exposure: 0.70 },
    { id: 'gw_de',     name: 'North German Aquifer',populationShare: 0.30, exposure: 0.85 },
  ],
  spain: [
    { id: 'ebro',      name: 'Ebro River',          populationShare: 0.40, exposure: 0.85 },
    { id: 'tagus',     name: 'Tagus Basin',         populationShare: 0.30, exposure: 0.70 },
    { id: 'gw_es',     name: 'Iberian Aquifer',     populationShare: 0.30, exposure: 1.0 },
  ],
  italy: [
    { id: 'po',        name: 'Po Valley',           populationShare: 0.45, exposure: 0.90 },
    { id: 'tiber',     name: 'Tiber Basin',         populationShare: 0.30, exposure: 0.70 },
    { id: 'gw_it',     name: 'Apennine Springs',    populationShare: 0.25, exposure: 0.55 },
  ],
  russia: [
    { id: 'volga',     name: 'Volga Basin',         populationShare: 0.18, exposure: 0.80 },
    { id: 'siberia',   name: 'Siberian Rivers',     populationShare: 0.14, exposure: 1.0 },
    { id: 'baikal',    name: 'Lake Baikal',         populationShare: 0.12, exposure: 0.45 },
    { id: 'ural',      name: 'Ural System',         populationShare: 0.13, exposure: 0.70 },
    { id: 'don',       name: 'Don Basin',           populationShare: 0.14, exposure: 0.85 },
    { id: 'north',     name: 'Northern Dvina',       populationShare: 0.11, exposure: 0.65 },
    { id: 'amur',      name: 'Amur Basin',          populationShare: 0.10, exposure: 0.90 },
    { id: 'gw_ru',     name: 'Steppe Aquifers',      populationShare: 0.08, exposure: 1.0 },
  ],
  china: [
    { id: 'yangtze',   name: 'Yangtze Basin',       populationShare: 0.35, exposure: 1.0 },
    { id: 'yellow',    name: 'Yellow River',        populationShare: 0.30, exposure: 0.95 },
    { id: 'pearl',     name: 'Pearl River',         populationShare: 0.20, exposure: 0.80 },
    { id: 'gw_cn',     name: 'North China Aquifer', populationShare: 0.15, exposure: 0.90 },
  ],
  india: [
    { id: 'ganges',    name: 'Ganges River',        populationShare: 0.30, exposure: 1.0 },
    { id: 'yamuna',    name: 'Yamuna River',        populationShare: 0.18, exposure: 0.95 },
    { id: 'godavari',  name: 'Godavari Basin',      populationShare: 0.17, exposure: 0.85 },
    { id: 'gw_in',     name: 'Alluvial Aquifer',    populationShare: 0.20, exposure: 0.75 },
    { id: 'monsoon',   name: 'Monsoon Catchment',   populationShare: 0.15, exposure: 0.60 },
  ],
  japan: [
    { id: 'tono',      name: 'Tone River',          populationShare: 0.35, exposure: 0.70 },
    { id: 'yodo',      name: 'Yodo Basin',          populationShare: 0.30, exposure: 0.60 },
    { id: 'gw_jp',     name: 'Volcanic Aquifers',   populationShare: 0.35, exposure: 0.85 },
  ],
  korea: [
    { id: 'han',       name: 'Han River',           populationShare: 0.45, exposure: 0.70 },
    { id: 'nakdong',   name: 'Nakdong River',       populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_kr',     name: 'Basin Aquifers',      populationShare: 0.25, exposure: 1.0 },
  ],
  saudi: [
    { id: 'gw_sa',     name: 'Deep Aquifers',       populationShare: 0.45, exposure: 0.80 },
    { id: 'desal',     name: 'Desalination',        populationShare: 0.35, exposure: 0.30 },
    { id: 'wadis',     name: 'Wadi Catchments',     populationShare: 0.20, exposure: 0.95 },
  ],
  egypt: [
    { id: 'nile',      name: 'Nile Valley',         populationShare: 0.70, exposure: 1.0 },
    { id: 'delta',     name: 'Nile Delta',          populationShare: 0.30, exposure: 0.85 },
  ],
  nigeria: [
    { id: 'niger',     name: 'Niger River',         populationShare: 0.45, exposure: 1.0 },
    { id: 'gw_ng',     name: 'Sahel Aquifers',      populationShare: 0.30, exposure: 0.85 },
    { id: 'coast',     name: 'Coastal Lagoons',     populationShare: 0.25, exposure: 0.70 },
  ],
  ethiopia: [
    { id: 'abbay',     name: 'Abbay (Blue Nile)',   populationShare: 0.45, exposure: 1.0 },
    { id: 'rift',      name: 'Rift Valley Lakes',   populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_et',     name: 'Highland Springs',    populationShare: 0.25, exposure: 0.65 },
  ],
  kenya: [
    { id: 'victoria',  name: 'Lake Victoria',       populationShare: 0.40, exposure: 1.0 },
    { id: 'rift_ke',   name: 'Rift Lakes',          populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_ke',     name: 'Aquifer Basins',      populationShare: 0.30, exposure: 0.70 },
  ],
  tanzania: [
    { id: 'vic_tz',    name: 'Lake Victoria',       populationShare: 0.40, exposure: 1.0 },
    { id: 'rift_tz',   name: 'Rift Lakes',          populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_tz',     name: 'Highland Wells',      populationShare: 0.30, exposure: 0.70 },
  ],
  dr_congo: [
    { id: 'congo',     name: 'Congo River',         populationShare: 0.50, exposure: 1.0 },
    { id: 'lakes',     name: 'Interlacustrine Lakes',populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_cd',     name: 'Basin Aquifers',      populationShare: 0.20, exposure: 0.70 },
  ],
  angola: [
    { id: 'cuanza',    name: 'Cuanza River',        populationShare: 0.45, exposure: 1.0 },
    { id: 'okavango',  name: 'Okavango Spill',      populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_ao',     name: 'Central Aquifers',    populationShare: 0.25, exposure: 0.70 },
  ],
  namibia: [
    { id: 'okav',      name: 'Okavango',            populationShare: 0.40, exposure: 0.90 },
    { id: 'gw_na',     name: 'Karst Aquifers',      populationShare: 0.35, exposure: 0.70 },
    { id: 'coast_na',  name: 'Coastal Supply',      populationShare: 0.25, exposure: 0.50 },
  ],
  botswana: [
    { id: 'okav_bw',   name: 'Okavango Delta',      populationShare: 0.45, exposure: 0.90 },
    { id: 'gw_bw',     name: 'Kalahari Aquifers',   populationShare: 0.35, exposure: 0.75 },
    { id: 'limpopo',   name: 'Limpopo Tributaries', populationShare: 0.20, exposure: 1.0 },
  ],
  zambia: [
    { id: 'zambezi',   name: 'Zambezi River',       populationShare: 0.45, exposure: 1.0 },
    { id: 'gw_zm',     name: 'Plateau Aquifers',    populationShare: 0.30, exposure: 0.80 },
    { id: 'lakes_zm',  name: 'Rift Lakes',          populationShare: 0.25, exposure: 0.70 },
  ],
  south_africa: [
    { id: 'vaal',      name: 'Vaal River',          populationShare: 0.45, exposure: 0.90 },
    { id: 'orange',    name: 'Orange River',        populationShare: 0.30, exposure: 1.0 },
    { id: 'gw_za',     name: 'Karoo Aquifers',      populationShare: 0.25, exposure: 0.75 },
  ],
  mozambique: [
    { id: 'zambezi_mz',name: 'Zambezi Delta',       populationShare: 0.45, exposure: 1.0 },
    { id: 'limpopo_mz',name: 'Limpopo Basin',       populationShare: 0.30, exposure: 0.90 },
    { id: 'gw_mz',     name: 'Coastal Aquifers',    populationShare: 0.25, exposure: 0.70 },
  ],
  malawi: [
    { id: 'malawi_l',  name: 'Lake Malawi',         populationShare: 0.50, exposure: 1.0 },
    { id: 'shir',      name: 'Shire River',         populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_mw',     name: 'Highland Springs',    populationShare: 0.20, exposure: 0.70 },
  ],
  zimbabwe: [
    { id: 'zambezi_zw',name: 'Zambezi Basin',       populationShare: 0.45, exposure: 1.0 },
    { id: 'gw_zw',     name: 'Plateau Aquifers',    populationShare: 0.30, exposure: 0.80 },
    { id: 'limp_zw',   name: 'Limpopo Tributaries', populationShare: 0.25, exposure: 0.90 },
  ],
  madagascar: [
    { id: 'betsiboka', name: 'Betsiboka River',     populationShare: 0.40, exposure: 1.0 },
    { id: 'gw_md',     name: 'Highland Aquifers',   populationShare: 0.30, exposure: 0.80 },
    { id: 'coast_md',  name: 'Coastal Catchment',   populationShare: 0.30, exposure: 0.65 },
  ],
  indonesia: [
    { id: 'java',      name: 'Java Rivers',         populationShare: 0.40, exposure: 1.0 },
    { id: 'sumatra',   name: 'Sumatra Basins',      populationShare: 0.30, exposure: 0.85 },
    { id: 'gw_id',     name: 'Volcanic Aquifers',   populationShare: 0.30, exposure: 0.70 },
  ],
  australia: [
    { id: 'murray',    name: 'Murray-Darling',      populationShare: 0.40, exposure: 0.90 },
    { id: 'gw_au',     name: 'Great Artesian',      populationShare: 0.35, exposure: 0.60 },
    { id: 'coast_au',  name: 'Coastal Catchment',   populationShare: 0.25, exposure: 0.75 },
  ],
};

const WEALTH_VULNERABILITY = {
  poor: 0.68,
  developing: 0.43,
  wealthy: 0.2,
} as const;

export function createWaterRegions(countries: Pick<Country, 'id' | 'wealth' | 'climate'>[]): WaterRegionState[] {
  return countries.flatMap(country => {
    const climateRisk = country.climate === 'hot' ? 0.1 : country.climate === 'tropical' ? 0.06 : 0;
    const baseline = Math.min(0.95, WEALTH_VULNERABILITY[country.wealth] + climateRisk);

    const sources = WATER_SOURCES[country.id] ?? [
      { id: 'treated', name: 'Treated supply', populationShare: 0.5, exposure: 0.45 },
      { id: 'groundwater', name: 'Groundwater wells', populationShare: 0.3, exposure: 0.85 },
      { id: 'surface', name: 'Surface water', populationShare: 0.2, exposure: 1 },
    ];

    return sources.map(source => ({
      id: `${country.id}-${source.id}`,
      countryId: country.id,
      name: source.name,
      populationShare: source.populationShare,
      vulnerability: Math.min(0.98, baseline * source.exposure),
      contamination: 0,
    }));
  });
}
