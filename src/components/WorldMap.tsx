import React, { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
  Line,
} from 'react-simple-maps';
import { Country } from '../data/countries';
import { allRoutes } from '../data/routes';

interface WorldMapProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (id: string) => void;
  startCountry: string | null;
  onCloseBorders?: (id: string) => void;
  onCloseAirports?: (id: string) => void;
  onCloseSeaports?: (id: string) => void;
  closedAirports?: string[];
  closedSeaports?: string[];
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
  ethiopia: '231',
  kenya: '404',
  tanzania: '834',
  dr_congo: '180',
  angola: '024',
  namibia: '516',
  botswana: '072',
  zambia: '894',
  south_africa: '710',
  mozambique: '508',
  malawi: '454',
  zimbabwe: '716',
  madagascar: '450',
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

// Fictional country node coordinates (capital cities, same space as countries.ts) for travel lines.
const NODE_POS: Record<string, [number, number]> = {
  usa: [-87.6, 41.9], // Chicago
  canada: [-98, 58], mexico: [-102, 24], brazil: [-55, -10],
  argentina: [-65, -35], colombia: [-74, 3], uk: [-2, 53], france: [2, 47],
  germany: [10, 51], spain: [-4, 40], italy: [12.5, 42], russia: [60, 55],
  china: [105, 35], india: [78, 22], japan: [138, 37], korea: [127, 36],
  saudi: [45, 24], egypt: [30, 27], nigeria: [8, 10],
  ethiopia: [38.7, 9], kenya: [36.8, -1.3], tanzania: [35.7, -6.2],
  dr_congo: [15.3, -4.3], angola: [13.2, -8.8], namibia: [17.1, -22.6],
  botswana: [25.9, -24.7], zambia: [28.3, -15.4],
  south_africa: [28, -26.2], // Johannesburg
  mozambique: [32.6, -25.9], malawi: [35, -14], zimbabwe: [28.5, -19],
  madagascar: [47.5, -18.9], // Antananarivo
  indonesia: [115, -3], australia: [134, -25],
};

type TravelFilter = 'all' | 'air' | 'sea';

export default function WorldMap({
  countries, selectedCountry, onSelectCountry, startCountry,
  onCloseBorders, onCloseAirports, onCloseSeaports,
  closedAirports = [], closedSeaports = [], dnaPoints = 0,
}: WorldMapProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    countryId: null,
  });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [showTravel, setShowTravel] = useState(true);
  const [travelFilter, setTravelFilter] = useState<TravelFilter>('all');

  const countryLookup = useMemo(() => {
    const lookup: Record<string, Country> = {};
    countries.forEach(c => {
      const iso = countryIdToIso[c.id];
      if (iso) lookup[iso] = c;
    });
    return lookup;
  }, [countries]);

  const infectedIds = useMemo(() => new Set(countries.filter(c => c.infected > 0).map(c => c.id)), [countries]);
  const closedAirportSet = useMemo(() => new Set(closedAirports), [closedAirports]);
  const closedSeaportSet = useMemo(() => new Set(closedSeaports), [closedSeaports]);

  // Routes to draw on the overlay (only those touching an infected country get highlighted)
  const visibleRoutes = useMemo(() => {
    return allRoutes.filter(r => travelFilter === 'all' || r.kind === travelFilter);
  }, [travelFilter]);

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

          {/* ---- Flight & ship traffic overlay ---- */}
          {showTravel && visibleRoutes.map(route => {
            const from = NODE_POS[route.from];
            const to = NODE_POS[route.to];
            if (!from || !to) return null;

            const isAir = route.kind === 'air';
            const shut =
              isAir
                ? closedAirportSet.has(route.from) || closedAirportSet.has(route.to)
                : closedSeaportSet.has(route.from) || closedSeaportSet.has(route.to);
            const touchingInfection = infectedIds.has(route.from) || infectedIds.has(route.to);
            const active = !shut && touchingInfection;

            return (
              <Line
                key={route.id}
                from={from}
                to={to}
                stroke={shut ? '#4a4a4a' : active ? (isAir ? '#ff5555' : '#ff9944') : isAir ? '#3d6b8f' : '#2f5a4f'}
                strokeWidth={active ? Math.min(2.5, 0.6 + route.traffic / 250) : 0.5}
                strokeDasharray={shut ? '2 3' : active ? '6 3' : undefined}
                opacity={shut ? 0.35 : active ? 0.9 : 0.4}
                style={{ pointerEvents: 'none' } as React.CSSProperties}
              />
            );
          })}

          {/* Airport / seaport status markers */}
          {showTravel && countries.map(c => {
            const pos = NODE_POS[c.id];
            if (!pos) return null;
            const airportShut = closedAirportSet.has(c.id) || c.closed;
            const portShut = closedSeaportSet.has(c.id) || c.closed;
            return (
              <Marker key={`mk-${c.id}`} coordinates={[pos[0], pos[1] - 2.5]} style={{ pointerEvents: 'none' }}>
                <text textAnchor="middle" fontSize={airportShut ? 7 : 6} opacity={airportShut ? 0.5 : 0.95}>
                  {airportShut ? '🛬' : '✈️'}{portShut ? '' : ' ⚓'}
                </text>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Travel overlay controls */}
      <div className="absolute top-2 right-2 flex gap-1 z-10">
        <button
          className={`btn text-[9px] px-2 py-0.5 ${showTravel ? 'btn-primary' : ''}`}
          onClick={() => setShowTravel(v => !v)}
          title="Toggle flight & shipping routes"
        >
          ✈️⚓ Traffic {showTravel ? 'ON' : 'OFF'}
        </button>
        {showTravel && (['all', 'air', 'sea'] as TravelFilter[]).map(f => (
          <button
            key={f}
            className={`btn text-[9px] px-2 py-0.5 ${travelFilter === f ? 'btn-primary' : ''}`}
            onClick={() => setTravelFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'air' ? '✈️ Air' : '⚓ Sea'}
          </button>
        ))}
      </div>

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
            {!country.closed && !closedAirportSet.has(country.id) && onCloseAirports && (
              <button
                className="context-menu-item w-full text-left text-blue hover:bg-blue/10 cursor-pointer"
                onClick={() => {
                  onCloseAirports(country.id);
                  closeContextMenu();
                }}
              >
                ✈️🚫 Shut Airports ({country.wealth === 'wealthy' ? 8 : country.wealth === 'developing' ? 6 : 4} DNA)
              </button>
            )}
            {closedAirportSet.has(country.id) && !country.closed && (
              <div className="context-menu-item text-dim">✈️ Airports shut</div>
            )}
            {!country.closed && !closedSeaportSet.has(country.id) && onCloseSeaports && (
              <button
                className="context-menu-item w-full text-left text-blue hover:bg-blue/10 cursor-pointer"
                onClick={() => {
                  onCloseSeaports(country.id);
                  closeContextMenu();
                }}
              >
                ⚓🚫 Quarantine Seaports ({country.wealth === 'wealthy' ? 6 : country.wealth === 'developing' ? 5 : 3} DNA)
              </button>
            )}
            {closedSeaportSet.has(country.id) && !country.closed && (
              <div className="context-menu-item text-dim">⚓ Seaports quarantined</div>
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
