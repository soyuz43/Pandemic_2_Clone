export interface Country {
  id: string;
  name: string;
  population: number;
  climate: 'hot' | 'cold' | 'temperate' | 'tropical';
  wealth: 'poor' | 'developing' | 'wealthy';
  connections: string[];
  x: number;
  y: number;
  infected: number;
  recovered: number;
  dead: number;
  closed: boolean;
  cureProgress: number;
}

export const initialCountries: Omit<Country, 'infected' | 'recovered' | 'dead' | 'closed' | 'cureProgress'>[] = [
  // Game capital cities (fictional node positions): usa = Chicago, south_africa = Johannesburg
  { id: 'usa', name: 'USA', population: 331000000, climate: 'temperate', wealth: 'wealthy', connections: ['canada', 'mexico', 'uk'], x: 16.5, y: 33.5 },
  { id: 'canada', name: 'Canada', population: 38000000, climate: 'cold', wealth: 'wealthy', connections: ['usa', 'uk', 'russia'], x: 18, y: 22 },
  { id: 'mexico', name: 'Mexico', population: 128000000, climate: 'hot', wealth: 'developing', connections: ['usa', 'brazil', 'colombia'], x: 15, y: 45 },
  { id: 'brazil', name: 'Brazil', population: 212000000, climate: 'tropical', wealth: 'developing', connections: ['mexico', 'argentina', 'colombia', 'nigeria', 'spain'], x: 28, y: 62 },
  { id: 'argentina', name: 'Argentina', population: 45000000, climate: 'temperate', wealth: 'developing', connections: ['brazil', 'colombia', 'south_africa'], x: 25, y: 78 },
  { id: 'colombia', name: 'Colombia', population: 51000000, climate: 'tropical', wealth: 'developing', connections: ['mexico', 'brazil', 'argentina'], x: 20, y: 55 },
  { id: 'uk', name: 'UK', population: 67000000, climate: 'cold', wealth: 'wealthy', connections: ['canada', 'france', 'usa'], x: 44, y: 28 },
  { id: 'france', name: 'France', population: 67000000, climate: 'temperate', wealth: 'wealthy', connections: ['uk', 'germany', 'spain', 'nigeria'], x: 46, y: 34 },
  { id: 'germany', name: 'Germany', population: 83000000, climate: 'cold', wealth: 'wealthy', connections: ['france', 'russia', 'italy'], x: 50, y: 30 },
  { id: 'spain', name: 'Spain', population: 47000000, climate: 'temperate', wealth: 'wealthy', connections: ['france', 'nigeria', 'brazil'], x: 43, y: 38 },
  { id: 'italy', name: 'Italy', population: 60000000, climate: 'temperate', wealth: 'wealthy', connections: ['germany', 'egypt'], x: 51, y: 37 },
  { id: 'russia', name: 'Russia', population: 144000000, climate: 'cold', wealth: 'developing', connections: ['germany', 'china', 'india', 'canada'], x: 65, y: 22 },
  { id: 'china', name: 'China', population: 1400000000, climate: 'temperate', wealth: 'developing', connections: ['russia', 'india', 'japan', 'korea'], x: 74, y: 38 },
  { id: 'india', name: 'India', population: 1380000000, climate: 'hot', wealth: 'developing', connections: ['china', 'russia', 'saudi', 'indonesia', 'kenya', 'madagascar'], x: 68, y: 45 },
  { id: 'japan', name: 'Japan', population: 126000000, climate: 'temperate', wealth: 'wealthy', connections: ['china', 'korea', 'australia'], x: 82, y: 36 },
  { id: 'korea', name: 'S. Korea', population: 52000000, climate: 'temperate', wealth: 'wealthy', connections: ['china', 'japan'], x: 79, y: 37 },
  { id: 'saudi', name: 'Saudi Arabia', population: 35000000, climate: 'hot', wealth: 'wealthy', connections: ['india', 'egypt', 'nigeria', 'ethiopia'], x: 58, y: 44 },
  { id: 'egypt', name: 'Egypt', population: 102000000, climate: 'hot', wealth: 'developing', connections: ['italy', 'saudi', 'nigeria', 'south_africa', 'ethiopia'], x: 53, y: 45 },
  { id: 'nigeria', name: 'Nigeria', population: 206000000, climate: 'tropical', wealth: 'poor', connections: ['egypt', 'saudi', 'france', 'spain', 'south_africa', 'brazil', 'kenya', 'dr_congo'], x: 47, y: 55 },
  { id: 'ethiopia', name: 'Ethiopia', population: 115000000, climate: 'hot', wealth: 'poor', connections: ['egypt', 'kenya', 'saudi'], x: 56, y: 53 },
  { id: 'kenya', name: 'Kenya', population: 54000000, climate: 'tropical', wealth: 'poor', connections: ['ethiopia', 'nigeria', 'south_africa', 'india', 'tanzania'], x: 56, y: 58 },
  { id: 'tanzania', name: 'Tanzania', population: 62000000, climate: 'tropical', wealth: 'poor', connections: ['kenya', 'mozambique', 'south_africa', 'madagascar', 'dr_congo', 'zambia', 'malawi'], x: 55.5, y: 63 },
  { id: 'dr_congo', name: 'DR Congo', population: 90000000, climate: 'tropical', wealth: 'poor', connections: ['nigeria', 'angola', 'tanzania', 'zambia'], x: 50.5, y: 60 },
  { id: 'angola', name: 'Angola', population: 33000000, climate: 'hot', wealth: 'developing', connections: ['dr_congo', 'namibia', 'south_africa'], x: 48.5, y: 67 },
  { id: 'namibia', name: 'Namibia', population: 2500000, climate: 'hot', wealth: 'developing', connections: ['angola', 'botswana', 'south_africa'], x: 50, y: 72 },
  { id: 'botswana', name: 'Botswana', population: 2400000, climate: 'hot', wealth: 'developing', connections: ['namibia', 'zambia', 'south_africa', 'zimbabwe'], x: 52, y: 70 },
  { id: 'zambia', name: 'Zambia', population: 19000000, climate: 'tropical', wealth: 'poor', connections: ['tanzania', 'dr_congo', 'botswana', 'mozambique', 'malawi', 'zimbabwe'], x: 53, y: 66 },
  // Game capital node = Johannesburg
  { id: 'south_africa', name: 'S. Africa', population: 59000000, climate: 'temperate', wealth: 'developing', connections: ['nigeria', 'egypt', 'indonesia', 'argentina', 'mozambique', 'botswana', 'namibia', 'kenya', 'tanzania', 'angola', 'zimbabwe', 'madagascar'], x: 53, y: 75 },
  { id: 'mozambique', name: 'Mozambique', population: 32000000, climate: 'tropical', wealth: 'poor', connections: ['tanzania', 'malawi', 'zimbabwe', 'south_africa', 'madagascar', 'zambia'], x: 56, y: 68 },
  { id: 'malawi', name: 'Malawi', population: 19000000, climate: 'tropical', wealth: 'poor', connections: ['mozambique', 'zambia', 'tanzania'], x: 54.5, y: 65 },
  { id: 'zimbabwe', name: 'Zimbabwe', population: 15000000, climate: 'hot', wealth: 'poor', connections: ['zambia', 'botswana', 'mozambique', 'south_africa'], x: 53, y: 69 },
  { id: 'madagascar', name: 'Madagascar', population: 28000000, climate: 'tropical', wealth: 'poor', connections: ['mozambique', 'tanzania', 'south_africa', 'india'], x: 59, y: 68 },
  { id: 'indonesia', name: 'Indonesia', population: 273000000, climate: 'tropical', wealth: 'developing', connections: ['india', 'australia', 'south_africa'], x: 76, y: 58 },
  { id: 'australia', name: 'Australia', population: 25000000, climate: 'hot', wealth: 'wealthy', connections: ['indonesia', 'japan'], x: 82, y: 72 },
];

export function getCountryConnections(countryId: string, countries: Country[]): Country[] {
  const country = countries.find(c => c.id === countryId);
  if (!country) return [];
  return countries.filter(c => country.connections.includes(c.id));
}
