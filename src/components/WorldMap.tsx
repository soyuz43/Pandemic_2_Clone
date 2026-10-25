import { Country } from '../data/countries';

interface WorldMapProps {
  countries: Country[];
  selectedCountry: string | null;
  onSelectCountry: (id: string) => void;
  startCountry: string | null;
}

function getCountryColor(country: Country): string {
  if (country.closed) return '#666666';
  if (country.dead > country.population * 0.5) return '#1a0000';
  if (country.infected <= 0) return '#2d5a27';
  
  const infectionRatio = country.infected / country.population;
  if (infectionRatio > 0.5) return '#8b0000';
  if (infectionRatio > 0.2) return '#cc3300';
  if (infectionRatio > 0.05) return '#ff6600';
  if (infectionRatio > 0.01) return '#ffaa00';
  return '#ffdd00';
}

function getCountryRadius(country: Country): number {
  const baseSize = Math.log10(country.population) * 1.5;
  const infectionBoost = country.infected > 0 ? Math.min(5, Math.log10(country.infected + 1) * 0.8) : 0;
  return Math.max(6, baseSize + infectionBoost);
}

export default function WorldMap({ countries, selectedCountry, onSelectCountry, startCountry }: WorldMapProps) {
  return (
    <div className="relative w-full h-full bg-[#0a1628] rounded-lg overflow-hidden border border-green-900/50">
      {/* Grid lines */}
      <svg className="absolute inset-0 w-full h-full opacity-10">
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={`${(i + 1) * 10}%`} x2="100%" y2={`${(i + 1) * 10}%`} stroke="#00ff00" strokeWidth="0.5" />
        ))}
        {Array.from({ length: 10 }).map((_, i) => (
          <line key={`v${i}`} x1={`${(i + 1) * 10}%`} y1="0" x2={`${(i + 1) * 10}%`} y2="100%" stroke="#00ff00" strokeWidth="0.5" />
        ))}
      </svg>

      {/* Connection lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {countries.map(country =>
          country.connections.map(connId => {
            const target = countries.find(c => c.id === connId);
            if (!target) return null;
            if (country.id > connId) return null; // avoid drawing twice
            const isInfected = country.infected > 0 || target.infected > 0;
            return (
              <line
                key={`${country.id}-${connId}`}
                x1={`${country.x}%`}
                y1={`${country.y}%`}
                x2={`${target.x}%`}
                y2={`${target.y}%`}
                stroke={isInfected ? '#ff440044' : '#00ff0022'}
                strokeWidth="1"
                strokeDasharray={isInfected ? 'none' : '4,4'}
              />
            );
          })
        )}
      </svg>

      {/* Country nodes */}
      {countries.map(country => {
        const radius = getCountryRadius(country);
        const color = getCountryColor(country);
        const isSelected = selectedCountry === country.id;
        const isStart = startCountry === country.id;
        const infectionPct = country.population > 0 ? (country.infected / country.population * 100) : 0;

        return (
          <div
            key={country.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
            style={{ left: `${country.x}%`, top: `${country.y}%` }}
            onClick={() => onSelectCountry(country.id)}
          >
            {/* Pulse animation for infected countries */}
            {country.infected > 0 && (
              <div
                className="absolute rounded-full animate-ping opacity-30"
                style={{
                  width: radius * 2.5,
                  height: radius * 2.5,
                  left: -(radius * 1.25) + radius,
                  top: -(radius * 1.25) + radius,
                  backgroundColor: color,
                }}
              />
            )}
            
            {/* Country circle */}
            <div
              className={`rounded-full flex items-center justify-center transition-all duration-300 ${
                isSelected ? 'ring-2 ring-white ring-offset-1 ring-offset-transparent' : ''
              } ${isStart ? 'ring-2 ring-yellow-400' : ''}`}
              style={{
                width: radius * 2,
                height: radius * 2,
                backgroundColor: color,
                boxShadow: isSelected ? `0 0 15px ${color}` : `0 0 5px ${color}44`,
              }}
            >
              {country.closed && (
                <span className="text-white text-[8px] font-bold">🔒</span>
              )}
            </div>

            {/* Country name tooltip */}
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              <div className="bg-black/90 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap border border-green-500/30">
                <div className="font-bold">{country.name}</div>
                <div>Pop: {(country.population / 1000000).toFixed(1)}M</div>
                {country.infected > 0 && <div className="text-red-400">Infected: {infectionPct.toFixed(2)}%</div>}
                {country.closed && <div className="text-gray-400">CLOSED</div>}
              </div>
            </div>
          </div>
        );
      })}

      {/* Legend */}
      <div className="absolute bottom-2 left-2 bg-black/70 rounded p-2 text-[10px] text-green-300 border border-green-900/50">
        <div className="font-bold mb-1">Infection Level</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#2d5a27]"></span> Clean</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ffdd00]"></span> Low</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ff6600]"></span> Medium</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#cc3300]"></span> High</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#8b0000]"></span> Critical</div>
        <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#666]"></span> Closed</div>
      </div>
    </div>
  );
}
