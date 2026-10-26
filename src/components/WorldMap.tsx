import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
  Line,
  useMapContext,
} from 'react-simple-maps';
import { Country } from '../data/countries';
import type { WaterRegionState } from '../data/waterSystems';
import { allRoutes, namedRoutes, type TradeRoute } from '../data/routes';
import { getProjectedTravelHeading, interpolateGreatCircle } from '../lib/travel';
import { PlaneIcon, ShipIcon } from './icons';

interface WorldMapProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (id: string) => void;
  startCountry: string | null;
  closedAirports?: string[];
  closedSeaports?: string[];
  waterRegions?: WaterRegionState[];
  waterTransmission?: number;
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

interface TravelVehicle {
  id: number;
  routeId: string;
  kind: 'air' | 'sea';
  from: [number, number];
  to: [number, number];
  progress: number;
  speed: number;
  reverse: boolean;
}

const MAX_VISIBLE_VEHICLES = 72;

function buildTravelVehicles(routes: TradeRoute[]): TravelVehicle[] {
  const maxTraffic = Math.max(...routes.map(route => route.traffic), 1);
  const weighted: { route: TradeRoute; weight: number }[] = [];
  let totalWeight = 0;
  routes.forEach(route => {
    const weight = Math.sqrt(Math.max(0, route.traffic) / maxTraffic) * (route.kind === 'air' ? 0.7 : 0.3);
    if (weight > 0.06) {
      weighted.push({ route, weight });
      totalWeight += weight;
    }
  });

  if (totalWeight === 0) return [];

  const vehicles: TravelVehicle[] = [];
  let target = 0;
  for (let index = 0; index < MAX_VISIBLE_VEHICLES; index++) {
    target += totalWeight / MAX_VISIBLE_VEHICLES;
    let cumulative = 0;
    let selected = weighted[0];
    let selectedWeight = weighted[0].weight;
    for (const item of weighted) {
      cumulative += item.weight;
      if (cumulative >= target) {
        selected = item;
        selectedWeight = item.weight;
        break;
      }
    }

    vehicles.push({
      id: index,
      routeId: selected.route.id,
      kind: selected.route.kind,
      from: NODE_POS[selected.route.from],
      to: NODE_POS[selected.route.to],
      progress: ((index * 37) % 100) / 100,
      speed: 0.045 + selectedWeight * 0.075,
      reverse: index % 2 === 1,
    });
  }
  return vehicles;
}

const namedRouteById = new Map(namedRoutes.map(route => [route.id, route]));

function TravelVehicleMarker({ vehicle, progress }: { vehicle: TravelVehicle; progress: number }) {
  const { projection } = useMapContext();
  const coordinates = interpolateGreatCircle(vehicle.from, vehicle.to, progress);
  const heading = getProjectedTravelHeading(
    coordinates => projection(coordinates),
    vehicle.from,
    vehicle.to,
    progress,
    vehicle.reverse
  );
  const Icon = vehicle.kind === 'air' ? PlaneIcon : ShipIcon;
  const rotation = heading === null ? 0 : heading + 90;

  return (
    <Marker coordinates={coordinates} style={{ pointerEvents: 'none' }}>
      <g transform={`rotate(${rotation})`}>
        <g transform="scale(0.42) translate(-11 -11)">
          <Icon size={22} className={vehicle.kind === 'air' ? 'text-red' : 'text-orange'} />
        </g>
      </g>
    </Marker>
  );
}

export default function WorldMap({
  countries, selectedCountry, onSelectCountry, startCountry,
  closedAirports = [], closedSeaports = [],
  waterRegions = [], waterTransmission = 0,
}: WorldMapProps) {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    countryId: null,
  });
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [hoveredRouteId, setHoveredRouteId] = useState<string | null>(null);
  const [showTravel, setShowTravel] = useState(true);
  const [travelFilter, setTravelFilter] = useState<TravelFilter>('all');
  const [showLegend, setShowLegend] = useState(true);

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
  const closedCountrySet = useMemo(() => new Set(countries.filter(c => c.closed).map(c => c.id)), [countries]);

  // Routes to draw on the overlay (only those touching an infected country get highlighted)
  const visibleRoutes = useMemo(() => {
    return allRoutes.filter(r => travelFilter === 'all' || r.kind === travelFilter);
  }, [travelFilter]);

  const travelVehicles = useMemo(() => buildTravelVehicles(visibleRoutes), [visibleRoutes]);
  const vehicleAnimationRef = useRef<number | null>(null);
  const vehicleProgressRef = useRef<Map<number, number>>(new Map());
  const [, setVehicleAnimationFrame] = useState(0);

  useEffect(() => {
    vehicleProgressRef.current = new Map(
      travelVehicles.map(vehicle => {
        const current = vehicleProgressRef.current.get(vehicle.id);
        return [vehicle.id, current ?? vehicle.progress] as const;
      })
    );
    if (!showTravel || travelVehicles.length === 0) {
      setVehicleAnimationFrame(0);
      return;
    }

    let previousTime: number | null = null;
    const animate = (time: number) => {
      if (previousTime !== null) {
        const delta = Math.min(0.1, (time - previousTime) / 1000);
        travelVehicles.forEach(vehicle => {
          const progress = vehicleProgressRef.current.get(vehicle.id) ?? vehicle.progress;
          vehicleProgressRef.current.set(vehicle.id, (progress + delta * vehicle.speed) % 1);
        });
        setVehicleAnimationFrame(frame => (frame + 1) % 1_000_000);
      }
      previousTime = time;
      vehicleAnimationRef.current = window.requestAnimationFrame(animate);
    };

    vehicleAnimationRef.current = window.requestAnimationFrame(animate);
    return () => {
      if (vehicleAnimationRef.current !== null) {
        window.cancelAnimationFrame(vehicleAnimationRef.current);
        vehicleAnimationRef.current = null;
      }
    };
  }, [showTravel, travelVehicles]);

  const hoveredCountryData = hoveredCountry ? countries.find(c => c.id === hoveredCountry) : null;
  const hoveredRoute = hoveredRouteId ? visibleRoutes.find(route => route.id === hoveredRouteId) : null;
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

  // The hover tooltip lives in the top-left corner; hide the route legend
  // while it is showing so the two never overlap.
  const tooltipVisible = (!!hoveredRoute || !!hoveredCountryData) && !contextMenu.visible;

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
              closedCountrySet.has(route.from) || closedCountrySet.has(route.to) || (isAir
                ? closedAirportSet.has(route.from) || closedAirportSet.has(route.to)
                : closedSeaportSet.has(route.from) || closedSeaportSet.has(route.to));
            const touchingInfection = infectedIds.has(route.from) || infectedIds.has(route.to);
            const active = !shut && touchingInfection;
            const routeColor = shut ? '#4a4a4a' : active ? (isAir ? '#ff5555' : '#ff9944') : isAir ? '#3d6b8f' : '#2f5a4f';

            return (
              <React.Fragment key={route.id}>
                <Line
                  from={from}
                  to={to}
                  stroke="transparent"
                  strokeWidth={10}
                  style={{ pointerEvents: 'stroke', cursor: 'help' } as React.CSSProperties}
                  onMouseEnter={() => setHoveredRouteId(route.id)}
                  onMouseLeave={() => setHoveredRouteId(null)}
                />
                <Line
                  from={from}
                  to={to}
                  stroke={routeColor}
                  strokeWidth={active ? Math.min(2.5, 0.6 + route.traffic / 250) : 0.5}
                  strokeDasharray={shut ? '2 3' : active ? '6 3' : undefined}
                  opacity={shut ? 0.35 : active ? 0.9 : 0.4}
                  style={{ pointerEvents: 'none' } as React.CSSProperties}
                />
              </React.Fragment>
            );
          })}

          {showTravel && travelVehicles.map(vehicle => {
            const route = visibleRoutes.find(item => item.id === vehicle.routeId);
            if (!route) return null;

            const shut =
              closedCountrySet.has(route.from) || closedCountrySet.has(route.to) || (vehicle.kind === 'air'
                ? closedAirportSet.has(route.from) || closedAirportSet.has(route.to)
                : closedSeaportSet.has(route.from) || closedSeaportSet.has(route.to));
            if (shut) return null;

            const rawProgress = vehicleProgressRef.current.get(vehicle.id) ?? vehicle.progress;
            const progress = vehicle.reverse ? 1 - rawProgress : rawProgress;

            return (
              <TravelVehicleMarker
                key={`vehicle-${vehicle.id}`}
                vehicle={vehicle}
                progress={progress}
              />
            );
          })}

          {/* Airport / seaport status markers */}
          {showTravel && countries.map(c => {
            const pos = NODE_POS[c.id];
            if (!pos) return null;
            const airportShut = closedAirportSet.has(c.id);
            const portShut = closedSeaportSet.has(c.id);
            return (
              <Marker key={`mk-${c.id}`} coordinates={[pos[0], pos[1] - 2.5]} style={{ pointerEvents: 'none' }}>
                <g transform="translate(-8 -6)">
                  <PlaneIcon
                    size={8}
                    className={airportShut ? 'text-red opacity-50' : 'text-blue'}
                  />
                </g>
                {!portShut && (
                  <g transform="translate(0 -6)">
                    <ShipIcon size={8} className="text-orange" />
                  </g>
                )}
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Travel overlay controls — top right */}
      <div className="absolute top-2 right-2 flex gap-1 z-20">
        <button
          className={`btn text-[9px] px-2 py-0.5 ${showTravel ? 'btn-primary' : ''}`}
          onClick={() => setShowTravel(v => !v)}
          title="Toggle flight & shipping routes"
        >
          <span className="flex items-center gap-1">
            <PlaneIcon size={10} />
            <ShipIcon size={10} />
            Traffic {showTravel ? 'ON' : 'OFF'}
          </span>
        </button>
        {showTravel && (['all', 'air', 'sea'] as TravelFilter[]).map(f => (
          <button
            key={f}
            className={`btn text-[9px] px-2 py-0.5 ${travelFilter === f ? 'btn-primary' : ''}`}
            onClick={() => setTravelFilter(f)}
            title={`Show ${f === 'all' ? 'all' : f} routes only`}
          >
            {f === 'all' ? 'All' : (
              <span className="flex items-center gap-1">
                {f === 'air' ? <PlaneIcon size={10} /> : <ShipIcon size={10} />}
                {f === 'air' ? 'Air' : 'Sea'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Route legend — top left, below the hover tooltip */}
      {showTravel && showLegend && !tooltipVisible && (
        <div className="absolute top-2 left-2 map-overlay px-2 py-1.5 text-[9px] leading-relaxed pointer-events-none">
          <div><span className="text-blue">━</span> Blue / teal: open air / sea route</div>
          <div><span className="text-red">━</span> Red / orange: infected endpoint</div>
          <div><span className="text-dim">┄</span> Gray dashed: route closed</div>
          <div className="text-dim mt-1">Hover a line for route details</div>
        </div>
      )}

      {/* Hover tooltip */}
      {hoveredRoute && !contextMenu.visible ? (
        <div className="tooltip top-2 left-2 z-20 pointer-events-none">
          <div className="font-bold text-green mb-1">
            {namedRouteById.has(hoveredRoute.id)
              ? `${namedRouteById.get(hoveredRoute.id)!.fromCity} → ${namedRouteById.get(hoveredRoute.id)!.toCity}`
              : `${countries.find(c => c.id === hoveredRoute.from)?.name || hoveredRoute.from} → ${countries.find(c => c.id === hoveredRoute.to)?.name || hoveredRoute.to}`}
          </div>
          <div className="flex items-center gap-1">
            {hoveredRoute.kind === 'air' ? <PlaneIcon size={10} /> : <ShipIcon size={10} />}
            {hoveredRoute.kind === 'air' ? 'Flight corridor' : 'Shipping corridor'}
          </div>
          <div>Relative traffic: {hoveredRoute.traffic.toLocaleString()} game units/day</div>
          <div className="text-dim">
            {closedCountrySet.has(hoveredRoute.from) || closedCountrySet.has(hoveredRoute.to) ||
              (hoveredRoute.kind === 'air'
                ? closedAirportSet.has(hoveredRoute.from) || closedAirportSet.has(hoveredRoute.to)
                : closedSeaportSet.has(hoveredRoute.from) || closedSeaportSet.has(hoveredRoute.to))
              ? 'Closed at one or both endpoints'
              : infectedIds.has(hoveredRoute.from) || infectedIds.has(hoveredRoute.to)
                ? 'Open; an endpoint has reported infections'
                : 'Open; no infected endpoint yet'}
          </div>
        </div>
      ) : hoveredCountryData && !contextMenu.visible ? (
        <div className="tooltip top-2 left-2 z-20">
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
            {hoveredCountryData.recovered > 0 && (
              <div className="text-green">
                Recovered: {((hoveredCountryData.recovered / hoveredCountryData.population) * 100).toFixed(2)}%
              </div>
            )}
            {hoveredCountryData.closed && <div className="text-red">[BORDERS CLOSED]</div>}
            <div className="text-dim mt-1">Click to select • Right-click for menu</div>
          </div>
        </div>
      ) : null}

      {/* Context menu */}
      {contextMenu.visible && contextMenu.countryId && (() => {
        const country = countries.find(c => c.id === contextMenu.countryId);
        if (!country) return null;

        const countryWaterRegions = waterRegions.filter(r => r.countryId === country.id);
        const showWater = countryWaterRegions.length > 0 && waterTransmission > 0;

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
            {closedAirportSet.has(country.id) && (
              <div className="context-menu-item text-dim flex items-center gap-1"><PlaneIcon size={10} /> Airports shut</div>
            )}
            {country.closed && (
              <div className="context-menu-item text-red">Borders closed</div>
            )}
            {closedSeaportSet.has(country.id) && (
              <div className="context-menu-item text-dim flex items-center gap-1"><ShipIcon size={10} /> Seaports quarantined</div>
            )}
            {showWater && (
              <div className="context-menu-item">
                <div className="font-bold text-blue border-b border-subtle mb-1">Water Systems</div>
                {countryWaterRegions.map(region => {
                  const pct = Math.round(region.contamination * 100);
                  const fillColor = pct >= 100 ? '#df7d7d' : pct > 0 ? '#e0964c' : '#7ddf7d';
                  const textClass = pct >= 100 ? 'text-red' : pct > 0 ? 'text-yellow' : 'text-green';
                  return (
                    <div key={region.id} className="mb-1">
                      <div className="flex justify-between">
                        <span className="text-dim">{region.name}</span>
                        <span className={textClass}>{pct}%</span>
                      </div>
                      <div className="h-1 bg-panel rounded overflow-hidden">
                        <div
                          className="h-full"
                          style={{ width: `${pct}%`, backgroundColor: fillColor }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {!showWater && countryWaterRegions.length > 0 && (
              <div className="context-menu-item text-dim">
                Water systems dormant (no waterborne evolution)
              </div>
            )}
            <div className="context-menu-item text-dim">
              Connections: {country.connections.length}
            </div>
            </div>
        );
      })()}

      {/* Selected country info panel — bottom right, clear of the map controls */}
      {selectedCountryData && (
        <div className="absolute bottom-8 right-2 z-20 map-overlay p-2 text-[10px] min-w-[160px]">
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

      {/* Infection legend — bottom left */}
      <div className="absolute bottom-2 left-2 map-overlay px-2 py-1.5 text-[9px]">
        <div className="font-bold mb-1 text-dim uppercase tracking-wider">
          Infection
          <button
            onClick={() => setShowLegend(v => !v)}
            className="ml-2 text-muted hover:text-dim normal-case tracking-normal"
            title={showLegend ? 'Hide legend' : 'Show legend'}
          >
            {showLegend ? '−' : '+'}
          </button>
        </div>
        {showLegend && (
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5">
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#1a2a1a] border border-[#333]"></span> Untracked</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#2d5a27]"></span> Clean</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#ffdd00]"></span> Low</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#ff6600]"></span> Medium</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#cc3300]"></span> High</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#8b0000]"></span> Critical</div>
            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#4a4a4a]"></span> Closed</div>
          </div>
        )}
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-2 right-2 map-overlay px-2 py-1 text-[9px] text-dim">
        Scroll: zoom • Drag: pan • Right-click: info
      </div>
    </div>
  );
}

