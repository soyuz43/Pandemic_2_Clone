import React, { useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from 'react-simple-maps';
import { Country } from '../data/countries';

interface WorldMapProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (id: string) => void;
  startCountry: string | null;
}

// Map our country IDs to ISO 3166-1 Alpha-3 codes used by the TopoJSON
const countryIdToIso: Record<string, string> = {
  usa: '840',
  canada: '124',
  mexico: '484',
  brazil: '076',
  argentina: '032',
  colombia: '170',
  uk: '826',
  france: '250',
  germany: '276',
  spain: '724',
  italy: '380',
  russia: '643',
  china: '156',
  india: '356',
  japan: '392',
  korea: '410',
  saudi: '682',
  egypt: '818',
  nigeria: '566',
  south_africa: '710',
  indonesia: '360',
  australia: '036',
};

// Reverse mapping
const isoToCountryId: Record<string, string> = Object.fromEntries(
  Object.entries(countryIdToIso).map(([k, v]) => [v, k])
);

function getCountryColor(country: Country): string {
  if (country.closed) return '#4a4a4a';
  if (country.dead > country.population * 0.5) return '#1a0000';
  if (country.infected <= 0) return '#2d5a27';
  
  const infectionRatio = country.infected / country.population;
  if (infectionRatio > 0.5) return '#8b0000';
  if (infectionRatio > 0.2) return '#cc3300';
  if (infectionRatio > 0.05) return '#ff6600';
  if (infectionRatio > 0.01) return '#ffaa00';
  return '#ffdd00';
}

const GEO_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

export default function WorldMap({ countries, selectedCountry, onSelectCountry, startCountry }: WorldMapProps) {
  // Build a lookup for quick access
  const countryLookup = useMemo(() => {
    const lookup: Record<string, Country> = {};
    countries.forEach(c => {
      const iso = countryIdToIso[c.id];
      if (iso) lookup[iso] = c;
    });
    return lookup;
  }, [countries]);

  const selectedCountryData = selectedCountry ? countries.find(c => c.id === selectedCountry) : null;

  return (
    <div className="relative w-full h-full bg-[#0a1628] rounded-lg overflow-hidden border border-green-900/50">
      <ComposableMap
        projectionConfig={{
          rotate: [-10, 0, 0],
          scale: 147,
        }}
        style={{ width: '100%', height: '100%' }}
      >
        <ZoomableGroup center={[0, 20]} zoom={1}>
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map(geo => {
                const isoCode = String(geo.id || '');
                const countryId = isoToCountryId[isoCode] || undefined;
                const country = countryLookup[isoCode];
                const isSelected = countryId === selectedCountry;
                const isStart = countryId === startCountry;
                
                let fillColor = '#1a3a1a'; // Default untracked country
                let strokeColor = '#0a2a0a';
                let strokeWidth = 0.5;

                if (country) {
                  fillColor = getCountryColor(country);
                  strokeColor = isSelected ? '#ffffff' : isStart ? '#ffd700' : '#000000';
                  strokeWidth = isSelected ? 1.5 : isStart ? 1 : 0.5;
                }

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={fillColor}
                    stroke={strokeColor}
                    strokeWidth={strokeWidth}
                    onClick={() => {
                      if (countryId) onSelectCountry(countryId);
                    }}
                    style={{
                      outline: 'none',
                      transition: 'fill 0.3s',
                    } as React.CSSProperties}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-black/80 rounded p-2 text-[10px] text-green-300 border border-green-900/50">
        <div className="font-bold mb-1">Infection Level</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#1a3a1a]"></span> Untracked</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2d5a27]"></span> Clean</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffdd00]"></span> Low</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff6600]"></span> Medium</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#cc3300]"></span> High</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b0000]"></span> Critical</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4a4a4a]"></span> Closed</div>
      </div>

      {/* Selected country tooltip */}
      {selectedCountryData && (
        <div className="absolute top-2 right-2 bg-black/90 text-white text-xs p-3 rounded border border-green-500/30 min-w-[160px]">
          <div className="font-bold text-green-400 mb-1">{selectedCountryData.name}</div>
          <div className="space-y-0.5 text-[10px]">
            <div>Population: {(selectedCountryData.population / 1000000).toFixed(1)}M</div>
            {selectedCountryData.infected > 0 && (
              <div className="text-red-400">
                Infected: {((selectedCountryData.infected / selectedCountryData.population) * 100).toFixed(2)}%
              </div>
            )}
            {selectedCountryData.dead > 0 && (
              <div className="text-gray-400">
                Dead: {((selectedCountryData.dead / selectedCountryData.population) * 100).toFixed(2)}%
              </div>
            )}
            {selectedCountryData.closed && <div className="text-orange-400">🔒 BORDERS CLOSED</div>}
            <div className="text-gray-500">Climate: {selectedCountryData.climate}</div>
            <div className="text-gray-500">Wealth: {selectedCountryData.wealth}</div>
            <div className="text-gray-500">Connections: {selectedCountryData.connections.length}</div>
          </div>
        </div>
      )}

      {/* Map controls hint */}
      <div className="absolute top-2 left-2 bg-black/60 rounded px-2 py-1 text-[9px] text-gray-500 border border-green-900/30">
        Scroll to zoom • Drag to pan
      </div>
    </div>
  );
}
