import { GameState } from '../hooks/useGameState';
import { Country } from '../data/countries';
import { getDiseaseType } from '../data/diseaseTypes';
import { PlaneIcon, ShipIcon } from './icons';

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

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="progress-bar">
      <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  );
}

export default function StatsPanel({ gameState, selectedCountry }: StatsPanelProps) {
  const diseaseConfig = getDiseaseType(gameState.diseaseType);
  const infectedPct = gameState.totalPopulation > 0
    ? (gameState.totalInfected / gameState.totalPopulation * 100)
    : 0;
  const deadPct = gameState.totalPopulation > 0
    ? (gameState.totalDead / gameState.totalPopulation * 100)
    : 0;

  const infectedCountries = gameState.countries.filter(c => c.infected > 0).length;
  const closedCountries = gameState.countries.filter(c => c.closed).length;
  const avgCure = gameState.countries.reduce((sum, c) => sum + c.cureProgress, 0) / gameState.countries.length;

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span>Statistics</span>
        <span className="text-dim">Day {gameState.day}</span>
      </div>

      <div className="flex-1 scrollable p-3 space-y-3">
        {/* Global stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="stat-block border-green/30">
            <div className="stat-value text-green">
              {formatNumber(gameState.totalPopulation - gameState.totalInfected - gameState.totalRecovered - gameState.totalDead)}
            </div>
            <div className="stat-label text-green">Healthy</div>
          </div>
          <div className="stat-block border-red/30">
            <div className="stat-value text-red">{formatNumber(gameState.totalInfected)}</div>
            <div className="stat-label text-red">Infected</div>
          </div>
          <div className="stat-block border-green/30">
            <div className="stat-value text-green">{formatNumber(gameState.totalRecovered)}</div>
            <div className="stat-label text-green">Recovered</div>
          </div>
          <div className="stat-block">
            <div className="stat-value text-dim">{formatNumber(gameState.totalDead)}</div>
            <div className="stat-label text-dim">Dead</div>
          </div>
        </div>

        {/* Progress bars */}
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-dim">Global Infection</span>
              <span className="text-red">{infectedPct.toFixed(1)}%</span>
            </div>
            <ProgressBar value={infectedPct} max={100} color="#df7d7d" />
          </div>
          <div>
            <div className="flex justify-between text-[10px] mb-1">
              <span className="text-dim">Global Deaths</span>
              <span className="text-dim">{deadPct.toFixed(1)}%</span>
            </div>
            <ProgressBar value={deadPct} max={100} color="#666" />
          </div>
          {gameState.cureStarted && (
            <div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-dim">Cure Progress</span>
                <span className="text-blue">{avgCure.toFixed(1)}%</span>
              </div>
              <ProgressBar value={avgCure} max={100} color="#7d9fdf" />
            </div>
          )}
        </div>

        {/* Country stats */}
        <div className="space-y-1 text-[10px]">
          <div className="data-row">
            <span className="data-label">Countries Infected</span>
            <span className="data-value text-yellow">{infectedCountries}/{gameState.countries.length}</span>
          </div>
          <div className="data-row">
            <span className="data-label">Borders Closed</span>
            <span className="data-value text-red">{closedCountries}/{gameState.countries.length}</span>
          </div>
          <div className="data-row">
            <span className="data-label flex items-center gap-1">
              <PlaneIcon size={10} className="inline" /> Airports Shut
            </span>
            <span className="data-value text-red">
              {gameState.closedAirports.length}/{gameState.countries.length}
            </span>
          </div>
          <div className="data-row">
            <span className="data-label flex items-center gap-1">
              <ShipIcon size={10} className="inline" /> Seaports Sealed
            </span>
            <span className="data-value text-red">
              {gameState.closedSeaports.length}/{gameState.countries.length}
            </span>
          </div>
        </div>

        {/* Disease type traits */}
        <div className="pt-2 border-t border-subtle">
          <div className="text-[10px] text-dim uppercase tracking-wider font-bold mb-2">
            {diseaseConfig.icon} {diseaseConfig.name} Traits
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="data-row">
              <span className="data-label">DNA Gain</span>
              <span className={`data-value ${diseaseConfig.dnaMultiplier > 1 ? 'text-green' : diseaseConfig.dnaMultiplier < 1 ? 'text-red' : ''}`}>
                {diseaseConfig.dnaMultiplier > 1 ? '+' : ''}{((diseaseConfig.dnaMultiplier - 1) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Evo Cost</span>
              <span className={`data-value ${diseaseConfig.evolutionMultiplier < 1 ? 'text-green' : diseaseConfig.evolutionMultiplier > 1 ? 'text-red' : ''}`}>
                {diseaseConfig.evolutionMultiplier < 1 ? '' : '+'}{((1 - diseaseConfig.evolutionMultiplier) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Climate Resist</span>
              <span className={`data-value ${diseaseConfig.climateResistanceBonus > 0 ? 'text-green' : diseaseConfig.climateResistanceBonus < 0 ? 'text-red' : ''}`}>
                {diseaseConfig.climateResistanceBonus > 0 ? '+' : ''}{(diseaseConfig.climateResistanceBonus * 100).toFixed(0)}%
              </span>
            </div>
            {diseaseConfig.mutationChance > 0.01 && (
              <div className="data-row">
                <span className="data-label">Mutation</span>
                <span className="data-value text-yellow">{(diseaseConfig.mutationChance * 100).toFixed(1)}%/day</span>
              </div>
            )}
            {diseaseConfig.stealthBonus > 0 && (
              <div className="data-row">
                <span className="data-label">Stealth</span>
                <span className="data-value text-cyan-400">-{(diseaseConfig.stealthBonus * 100).toFixed(0)}% vis gain</span>
              </div>
            )}
          </div>
        </div>

        {/* Disease properties */}
        <div className="pt-2 border-t border-subtle">
          <div className="text-[10px] text-dim uppercase tracking-wider font-bold mb-2">
            Disease Properties
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="data-row">
              <span className="data-label">Infectivity</span>
              <span className="data-value text-blue">{(gameState.infectivity * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Severity</span>
              <span className="data-value text-red">{(gameState.severity * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Lethality</span>
              <span className="data-value text-red">{(gameState.lethality * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Visibility</span>
              <span className="data-value text-yellow">{(gameState.visibility * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Cold Resist</span>
              <span className="data-value text-blue">{(gameState.coldResistance * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Heat Resist</span>
              <span className="data-value text-yellow">{(gameState.heatResistance * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Drug Resist</span>
              <span className="data-value text-purple-400">{(gameState.drugResistance * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Stealth</span>
              <span className="data-value text-cyan-400">{(gameState.stealth * 100).toFixed(0)}%</span>
            </div>
            <div className="data-row">
              <span className="data-label">Flight Spread</span>
              <span className={`data-value ${gameState.airTransmission >= 1 ? 'text-green' : 'text-dim'}`}>
                {(gameState.airTransmission * 100).toFixed(0)}%
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Shipping Spread</span>
              <span className={`data-value ${gameState.seaTransmission >= 1 ? 'text-green' : 'text-dim'}`}>
                {(gameState.seaTransmission * 100).toFixed(0)}%
              </span>
            </div>
            <div className="data-row">
              <span className="data-label">Waterborne Spread</span>
              <span className={`data-value ${gameState.waterTransmission >= 0.5 ? 'text-green' : 'text-dim'}`}>
                {(gameState.waterTransmission * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </div>

        {/* Travel network */}
        <div className="pt-2 border-t border-subtle">
          <div className="text-[10px] text-dim uppercase tracking-wider font-bold mb-2">
            <span className="flex items-center gap-1">
              <PlaneIcon size={10} />
              <ShipIcon size={10} />
              Travel Network
            </span>
          </div>
          <div className="space-y-1 text-[10px]">
            <div className="data-row">
              <span className="data-label">Flights in Air</span>
              <span className="data-value text-blue">{formatNumber(gameState.inTransitFlights)}</span>
            </div>
            <div className="data-row">
              <span className="data-label">Ships at Sea</span>
              <span className="data-value text-blue">{formatNumber(gameState.inTransitShips)}</span>
            </div>

          </div>
        </div>

        {/* Selected country details */}
        {selectedCountry && (
          <div className="pt-2 border-t border-subtle">
            <div className="text-[10px] text-green uppercase tracking-wider font-bold mb-2">
              {selectedCountry.name}
              {selectedCountry.closed && <span className="text-red ml-2">[CLOSED]</span>}
            </div>
            <div className="space-y-1 text-[10px]">
              <div className="data-row">
                <span className="data-label">Population</span>
                <span className="data-value">{formatNumber(selectedCountry.population)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Infected</span>
                <span className="data-value text-red">{formatNumber(selectedCountry.infected)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Recovered</span>
                <span className="data-value text-green">{formatNumber(selectedCountry.recovered)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Dead</span>
                <span className="data-value text-dim">{formatNumber(selectedCountry.dead)}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Climate</span>
                <span className="data-value text-blue capitalize">{selectedCountry.climate}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Wealth</span>
                <span className="data-value text-yellow capitalize">{selectedCountry.wealth}</span>
              </div>
              <div className="data-row">
                <span className="data-label">Connections</span>
                <span className="data-value">{selectedCountry.connections.length}</span>
              </div>
            </div>
            <div className="mt-2 pt-2 border-t border-subtle">
              <div className="text-[10px] text-dim uppercase tracking-wider font-bold mb-1">Local Water Sources</div>
              <div className="space-y-2">
                {gameState.waterRegions.filter(region => region.countryId === selectedCountry.id).map(region => (
                  <div key={region.id}>
                    <div className="flex justify-between text-[9px] mb-1">
                      <span>{region.name}</span>
                      <span className="text-dim">Risk {(region.vulnerability * 100).toFixed(0)}% · Contam {(region.contamination * 100).toFixed(0)}%</span>
                    </div>
                    <ProgressBar value={region.contamination * 100} max={100} color="#4a9a9a" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

