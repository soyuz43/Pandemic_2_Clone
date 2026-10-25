import React, { useMemo, useState } from 'react';
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
  onCloseBorders?: (id: string) => void;
  dnaPoints?: number;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  countryId: string | null;
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

export default function WorldMap({ countries, selectedCountry, onSelectCountry, startCountry, onCloseBorders, dnaPoints = 0 }: WorldMapProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    countryId: null,
  });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);

  const countryLookup = useMemo(() => {
    const lookup: Record<string, Country> = {};
    countries.forEach(c => {
      const iso = countryIdToIso[c.id];
      if (iso) lookup[iso] = c;
    });
    return lookup;
  }, [countries]);

  const hoveredCountryData = hoveredCountry ? countries.find(c => c.id === hoveredCountry) : null;
  const selectedCountryData = selectedCountry ? countries.find(c => c.id === selectedCountry) : null;

  const handleContextMenu = (e: React.MouseEvent, countryId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      countryId,
    });
  };

  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, countryId: null });
  };

  return (
    <div className="panel h-full relative" onClick={closeContextMenu}>
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
                const isHovered = countryId === hoveredCountry;
                
                let fillColor = '#1a2a1a';
                let strokeColor = '#0a1a0a';
                let strokeWidth = 0.3;

                if (country) {
                  fillColor = getCountryColor(country);
                  strokeColor = isSelected ? '#ffffff' : isStart ? '#ffd700' : '#000000';
                  strokeWidth = isSelected ? 1.5 : isStart ? 1 : 0.3;
                }

                if (isHovered && country) {
                  strokeColor = '#ffffff';
                  strokeWidth = 1;
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
                    onContextMenu={(e) => {
                      if (countryId) handleContextMenu(e, countryId);
                    }}
                    onMouseEnter={() => {
                      if (countryId) setHoveredCountry(countryId);
                    }}
                    onMouseLeave={() => setHoveredCountry(null)}
                    style={{
                      outline: 'none',
                      cursor: countryId ? 'pointer' : 'default',
                    } as React.CSSProperties}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Hover tooltip */}
      {hoveredCountryData && !contextMenu.visible && (
        <div className="tooltip top-2 left-2">
          <div className="font-bold text-green mb-1">{hoveredCountryData.name}</div>
          <div className="space-y-0.5">
            <div>Pop: {(hoveredCountryData.population / 1000000).toFixed(1)}M</div>
            {hoveredCountryData.infected > 0 && (
              <div className="text-red">
                Infected: {((hoveredCountryData.infected / hoveredCountryData.population) * 100).toFixed(2)}%
              </div>
            )}
            {hoveredCountryData.dead > 0 && (
              <div className="text-dim">
                Dead: {((hoveredCountryData.dead / hoveredCountryData.population) * 100).toFixed(2)}%
              </div>
            )}
            {hoveredCountryData.closed && <div className="text-red">[BORDERS CLOSED]</div>}
            <div className="text-dim mt-1">Click to select • Right-click for menu</div>
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu.visible && contextMenu.countryId && (() => {
        const country = countries.find(c => c.id === contextMenu.countryId);
        if (!country) return null;

        return (
          <div
            className="context-menu"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="context-menu-item font-bold text-green border-b border-subtle">
              {country.name}
            </div>
            <div className="context-menu-item text-dim">
              Population: {(country.population / 1000000).toFixed(1)}M
            </div>
            {country.infected > 0 && (
              <div className="context-menu-item text-red">
                Infected: {((country.infected / country.population) * 100).toFixed(2)}%
              </div>
            )}
            {country.dead > 0 && (
              <div className="context-menu-item text-dim">
                Dead: {((country.dead / country.population) * 100).toFixed(2)}%
              </div>
            )}
            <div className="context-menu-item text-dim">
              Climate: {country.climate}
            </div>
            <div className="context-menu-item text-dim">
              Wealth: {country.wealth}
            </div>
            {country.closed ? (
              <div className="context-menu-item text-red">
                [BORDERS CLOSED]
              </div>
            ) : (
              <button
                className="context-menu-item w-full text-left text-yellow hover:bg-yellow/10 cursor-pointer"
                onClick={() => {
                  if (onCloseBorders) {
                    onCloseBorders(country.id);
                    closeContextMenu();
                  }
                }}
              >
                🔒 Close Borders ({country.wealth === 'wealthy' ? 15 : country.wealth === 'developing' ? 10 : 5} DNA)
              </button>
            )}
            <div className="context-menu-item text-dim">
              Connections: {country.connections.length}
            </div>
          </div>
        );
      })()}

      {/* Selected country info panel */}
      {selectedCountryData && (
        <div className="absolute top-2 right-2 panel p-2 text-[10px] min-w-[160px]">
          <div className="font-bold text-green mb-1 border-b border-subtle pb-1">
            {selectedCountryData.name}
            {selectedCountryData.closed && <span className="text-red ml-2">[CLOSED]</span>}
          </div>
          <div className="space-y-0.5">
            <div className="flex justify-between">
              <span className="text-dim">Population:</span>
              <span>{(selectedCountryData.population / 1000000).toFixed(1)}M</span>
            </div>
            {selectedCountryData.infected > 0 && (
              <div className="flex justify-between">
                <span className="text-dim">Infected:</span>
                <span className="text-red">{((selectedCountryData.infected / selectedCountryData.population) * 100).toFixed(2)}%</span>
              </div>
            )}
            {selectedCountryData.dead > 0 && (
              <div className="flex justify-between">
                <span className="text-dim">Dead:</span>
                <span>{((selectedCountryData.dead / selectedCountryData.population) * 100).toFixed(2)}%</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-dim">Climate:</span>
              <span className="text-blue">{selectedCountryData.climate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dim">Wealth:</span>
              <span className="text-yellow">{selectedCountryData.wealth}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 panel p-2 text-[9px]">
        <div className="font-bold mb-1 text-dim uppercase tracking-wider">Infection</div>
        <div className="space-y-0.5">
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1a2a1a]"></span> Untracked</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#2d5a27]"></span> Clean</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#ffdd00]"></span> Low</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#ff6600]"></span> Medium</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#cc3300]"></span> High</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#8b0000]"></span> Critical</div>
          <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#4a4a4a]"></span> Closed</div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 panel px-2 py-1 text-[9px] text-dim">
        Scroll: zoom • Drag: pan • Right-click: info
      </div>
    </div>
  );
}
