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
const AIR_HUBS = ['usa', 'uk', 'france', 'germany', 'china', 'japan', 'india', 'brazil', 'canada', 'saudi', 'egypt', 'australia', 'korea', 'russia', 'mexico', 'nigeria', 'spain', 'italy', 'argentina', 'south_africa', 'indonesia', 'kenya', 'ethiopia', 'mozambique', 'madagascar'];
const SEA_HUBS = ['usa', 'china', 'japan', 'india', 'brazil', 'nigeria', 'egypt', 'australia', 'mexico', 'spain', 'france', 'uk', 'russia', 'indonesia', 'south_africa', 'canada', 'saudi', 'korea', 'argentina', 'colombia', 'kenya', 'tanzania', 'mozambique', 'madagascar', 'angola'];

// Hand-authored named corridors (game city pairs) that guarantee iconic links
// regardless of what the gravity model produces, e.g. Chicago -> Johannesburg.
export interface NamedRoute extends TradeRoute {
  fromCity: string;
  toCity: string;
}

const NAMED_ROUTES: NamedRoute[] = [
  { id: 'air-usa-south_africa', kind: 'air', from: 'usa', to: 'south_africa', traffic: 420, fromCity: 'Chicago', toCity: 'Johannesburg' },
  { id: 'air-south_africa-mozambique', kind: 'air', from: 'south_africa', to: 'mozambique', traffic: 180, fromCity: 'Johannesburg', toCity: 'Maputo' },
  { id: 'air-mozambique-madagascar', kind: 'air', from: 'mozambique', to: 'madagascar', traffic: 120, fromCity: 'Maputo', toCity: 'Antananarivo' },
  { id: 'sea-mozambique-madagascar', kind: 'sea', from: 'mozambique', to: 'madagascar', traffic: 160, fromCity: 'Maputo', toCity: 'Toamasina' },
  { id: 'air-kenya-south_africa', kind: 'air', from: 'kenya', to: 'south_africa', traffic: 230, fromCity: 'Nairobi', toCity: 'Johannesburg' },
];

const POPULATION: Record<string, number> = {
  usa: 331, canada: 38, mexico: 128, brazil: 212, argentina: 45, colombia: 51,
  uk: 67, france: 67, germany: 83, spain: 47, italy: 60, russia: 144, china: 1400,
  india: 1380, japan: 126, korea: 52, saudi: 35, egypt: 102, nigeria: 206,
  south_africa: 59, indonesia: 273, australia: 25,
  ethiopia: 115, kenya: 54, tanzania: 62, dr_congo: 90, angola: 33,
  namibia: 2.5, botswana: 2.4, zambia: 19, mozambique: 32, malawi: 19,
  zimbabwe: 15, madagascar: 28,
};

function distance(a: string, b: string): number {
  const pos: Record<string, [number, number]> = {
    usa: [16.5, 33.5], canada: [18, 22], mexico: [15, 45], brazil: [28, 62], argentina: [25, 78],
    colombia: [20, 55], uk: [44, 28], france: [46, 34], germany: [50, 30], spain: [43, 38],
    italy: [51, 37], russia: [65, 22], china: [74, 38], india: [68, 45], japan: [82, 36],
    korea: [79, 37], saudi: [58, 44], egypt: [53, 45], nigeria: [47, 55], south_africa: [53, 75],
    indonesia: [76, 58], australia: [82, 72],
    ethiopia: [56, 53], kenya: [56, 58], tanzania: [55.5, 63], dr_congo: [50.5, 60],
    angola: [48.5, 67], namibia: [50, 72], botswana: [52, 70], zambia: [53, 66],
    mozambique: [56, 68], malawi: [54.5, 65], zimbabwe: [53, 69], madagascar: [59, 68],
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

// Merge hand-authored named corridors in (they override the auto-generated
// traffic for the same city pair so iconic routes feel busy and readable).
const namedKeys = new Set(NAMED_ROUTES.map(r => [r.from, r.to].sort().join('-')));
function mergeNamed(kind: RouteKind, generated: TradeRoute[]): TradeRoute[] {
  const overrides = NAMED_ROUTES.filter(r => r.kind === kind);
  const kept = generated.filter(r => !namedKeys.has([r.from, r.to].sort().join('-')));
  return [...kept, ...overrides];
}

export const allRoutes: TradeRoute[] = [
  ...mergeNamed('air', airRoutes),
  ...mergeNamed('sea', seaRoutes),
];

export const namedRoutes: NamedRoute[] = NAMED_ROUTES;

export function getRoutesForCountry(countryId: string): TradeRoute[] {
  return allRoutes.filter(r => r.from === countryId || r.to === countryId);
}

export function totalNetworkTraffic(): number {
  return allRoutes.reduce((sum, r) => sum + r.traffic, 0);
}
