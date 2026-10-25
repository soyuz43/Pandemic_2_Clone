// Fictional flight & shipping network for the game world.
// Coordinates (x, y) are in the same 0-100 space as the country nodes in countries.ts.

export type RouteKind = 'air' | 'sea';

export interface TradeRoute {
  id: string;
  kind: RouteKind;
  from: string;   // country id
  to: string;     // country id
  traffic: number; // relative passenger/cargo volume per day (game units)
}

// Hub airports and ports used by the auto-generated route network below.
const AIR_HUBS = ['usa', 'uk', 'france', 'germany', 'china', 'japan', 'india', 'brazil', 'canada', 'saudi', 'egypt', 'australia', 'korea', 'russia', 'mexico', 'nigeria', 'spain', 'italy', 'argentina', 'south_africa', 'indonesia'];
const SEA_HUBS = ['usa', 'china', 'japan', 'india', 'brazil', 'nigeria', 'egypt', 'australia', 'mexico', 'spain', 'france', 'uk', 'russia', 'indonesia', 'south_africa', 'canada', 'saudi', 'korea', 'argentina', 'colombia'];

const POPULATION: Record<string, number> = {
  usa: 331, canada: 38, mexico: 128, brazil: 212, argentina: 45, colombia: 51,
  uk: 67, france: 67, germany: 83, spain: 47, italy: 60, russia: 144, china: 1400,
  india: 1380, japan: 126, korea: 52, saudi: 35, egypt: 102, nigeria: 206,
  south_africa: 59, indonesia: 273, australia: 25,
};

function distance(a: string, b: string): number {
  const pos: Record<string, [number, number]> = {
    usa: [18, 35], canada: [18, 22], mexico: [15, 45], brazil: [28, 62], argentina: [25, 78],
    colombia: [20, 55], uk: [44, 28], france: [46, 34], germany: [50, 30], spain: [43, 38],
    italy: [51, 37], russia: [65, 22], china: [74, 38], india: [68, 45], japan: [82, 36],
    korea: [79, 37], saudi: [58, 44], egypt: [53, 45], nigeria: [47, 55], south_africa: [53, 75],
    indonesia: [76, 58], australia: [82, 72],
  };
  const [ax, ay] = pos[a];
  const [bx, by] = pos[b];
  return Math.hypot(ax - bx, ay - by);
}

// Deterministic pseudo-random (so routes are stable between reloads/ticks).
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

function buildRoutes(kind: RouteKind, hubs: string[], maxLinksPerHub: number, linkRadius: number): TradeRoute[] {
  const seen = new Set<string>();
  const routes: TradeRoute[] = [];
  for (const a of hubs) {
    // Connect each hub to its nearest eligible partners within radius.
    const partners = hubs
      .filter(b => b !== a && distance(a, b) <= linkRadius)
      .sort((p, q) => distance(a, p) - distance(a, q))
      .slice(0, maxLinksPerHub);
    for (const b of partners) {
      const key = [a, b].sort().join('-');
      if (seen.has(key)) continue;
      seen.add(key);
      const base = Math.sqrt(POPULATION[a] * POPULATION[b]); // gravity model
      const noise = 0.7 + hash(`${kind}-${key}`) * 0.6;
      routes.push({
        id: `${kind}-${key}`,
        kind,
        from: a,
        to: b,
        traffic: Math.max(1, Math.round(base * noise * (kind === 'air' ? 0.5 : 0.8))),
      });
    }
  }
  return routes;
}

export const airRoutes: TradeRoute[] = buildRoutes('air', AIR_HUBS, 4, 45);
export const seaRoutes: TradeRoute[] = buildRoutes('sea', SEA_HUBS, 4, 50);

export const allRoutes: TradeRoute[] = [...airRoutes, ...seaRoutes];

export function getRoutesForCountry(countryId: string): TradeRoute[] {
  return allRoutes.filter(r => r.from === countryId || r.to === countryId);
}

export function totalNetworkTraffic(): number {
  return allRoutes.reduce((sum, r) => sum + r.traffic, 0);
}
