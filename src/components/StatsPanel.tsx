import { GameState } from '../hooks/useGameState';
import { Country } from '../data/countries';

interface StatsPanelProps {
  gameState: GameState;
  selectedCountry: Country | null;
}

function formatNumber(n: number): string {
  if (n >= 1000000000) return (n / 1000000000).toFixed(2) + 'B';
  if (n >= 1000000) return (n / 1000000).toFixed(2) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toFixed(0);
}

function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="mb-1">
      <div className="flex justify-between text-[10px]">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{pct.toFixed(1)}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function StatsPanel({ gameState, selectedCountry }: StatsPanelProps) {
  const infectedPct = gameState.totalPopulation > 0
    ? (gameState.totalInfected / gameState.totalPopulation * 100)
    : 0;
  const deadPct = gameState.totalPopulation > 0
    ? (gameState.totalDead / gameState.totalPopulation * 100)
    : 0;
  const healthyPct = 100 - infectedPct - deadPct;

  const infectedCountries = gameState.countries.filter(c => c.infected > 0).length;
  const closedCountries = gameState.countries.filter(c => c.closed).length;
  const avgCure = gameState.countries.reduce((sum, c) => sum + c.cureProgress, 0) / gameState.countries.length;

  return (
    <div className="bg-black/60 rounded-lg border border-green-900/50 p-3">
      <h2 className="text-green-400 font-bold text-sm mb-2 flex items-center gap-2">
        <span>📊</span> STATISTICS
        <span className="text-gray-500 font-normal text-xs ml-auto">Day {gameState.day}</span>
      </h2>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="bg-green-900/20 rounded p-1.5 text-center border border-green-900/30">
          <div className="text-[9px] text-green-400 uppercase">Healthy</div>
          <div className="text-xs font-bold text-green-300">{formatNumber(gameState.totalPopulation - gameState.totalInfected - gameState.totalDead)}</div>
          <div className="text-[9px] text-green-500">{healthyPct.toFixed(1)}%</div>
        </div>
        <div className="bg-red-900/20 rounded p-1.5 text-center border border-red-900/30">
          <div className="text-[9px] text-red-400 uppercase">Infected</div>
          <div className="text-xs font-bold text-red-300">{formatNumber(gameState.totalInfected)}</div>
          <div className="text-[9px] text-red-500">{infectedPct.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-900/40 rounded p-1.5 text-center border border-gray-700/30">
          <div className="text-[9px] text-gray-400 uppercase">Dead</div>
          <div className="text-xs font-bold text-gray-300">{formatNumber(gameState.totalDead)}</div>
          <div className="text-[9px] text-gray-500">{deadPct.toFixed(1)}%</div>
        </div>
      </div>

      {/* Progress bars */}
      <StatBar label="Global Infection" value={infectedPct} max={100} color="#ef4444" />
      <StatBar label="Global Deaths" value={deadPct} max={100} color="#6b7280" />
      
      {gameState.cureStarted && (
        <StatBar label="Cure Progress" value={avgCure} max={100} color="#3b82f6" />
      )}

      {/* Country stats */}
      <div className="grid grid-cols-2 gap-2 mt-3 text-[10px]">
        <div className="flex justify-between">
          <span className="text-gray-500">Countries Infected:</span>
          <span className="text-yellow-400">{infectedCountries}/{gameState.countries.length}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Borders Closed:</span>
          <span className="text-orange-400">{closedCountries}/{gameState.countries.length}</span>
        </div>
      </div>

      {/* Disease stats */}
      <div className="mt-3 pt-2 border-t border-green-900/30">
        <h3 className="text-[10px] text-green-500 uppercase font-bold mb-1">Disease Properties</h3>
        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
          <div className="flex justify-between">
            <span className="text-gray-500">Infectivity:</span>
            <span className="text-blue-300">{(gameState.infectivity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Severity:</span>
            <span className="text-red-300">{(gameState.severity * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Lethality:</span>
            <span className="text-red-400">{(gameState.lethality * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Visibility:</span>
            <span className="text-yellow-300">{(gameState.visibility * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Cold Resist:</span>
            <span className="text-cyan-300">{(gameState.coldResistance * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Heat Resist:</span>
            <span className="text-orange-300">{(gameState.heatResistance * 100).toFixed(0)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Drug Resist:</span>
            <span className="text-purple-300">{(gameState.drugResistance * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>

      {/* Selected country details */}
      {selectedCountry && (
        <div className="mt-3 pt-2 border-t border-green-900/30">
          <h3 className="text-[10px] text-green-500 uppercase font-bold mb-1">
            {selectedCountry.name}
            {selectedCountry.closed && <span className="text-orange-400 ml-1">🔒 CLOSED</span>}
          </h3>
          <div className="text-[10px] space-y-0.5">
            <div className="flex justify-between">
              <span className="text-gray-500">Population:</span>
              <span className="text-white">{formatNumber(selectedCountry.population)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Infected:</span>
              <span className="text-red-300">{formatNumber(selectedCountry.infected)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Dead:</span>
              <span className="text-gray-300">{formatNumber(selectedCountry.dead)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Climate:</span>
              <span className="text-cyan-300 capitalize">{selectedCountry.climate}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Wealth:</span>
              <span className="text-yellow-300 capitalize">{selectedCountry.wealth}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Connections:</span>
              <span className="text-blue-300">{selectedCountry.connections.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
