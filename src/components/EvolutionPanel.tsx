import { useState } from 'react';
import { Evolution, evolutions } from '../data/evolutions';
import { GameState } from '../hooks/useGameState';

interface EvolutionPanelProps {
  gameState: GameState;
  onEvolve: (id: string) => void;
  getAvailableEvolutions: () => Evolution[];
}

// Branch display info (label + accent color class).
const BRANCHES: { id: string; label: string; color: string }[] = [
  { id: 'symptom',    label: 'Symptoms',       color: 'text-red' },
  { id: 'air',        label: 'Air Travel',     color: 'text-sky-400' },
  { id: 'sea',        label: 'Sea Travel',     color: 'text-cyan-400' },
  { id: 'water',      label: 'Waterborne',     color: 'text-blue' },
  { id: 'vector',     label: 'Vectors',        color: 'text-emerald-400' },
  { id: 'climate',    label: 'Climate',        color: 'text-amber-400' },
  { id: 'resistance', label: 'Drug Resistance',color: 'text-fuchsia-400' },
  { id: 'stealth',    label: 'Stealth',        color: 'text-purple-400' },
  { id: 'specialist', label: 'Specializations',color: 'text-orange-400' },
];

function EvolutionCard({ evo, unlocked, available, canAfford, onEvolve }: {
  evo: Evolution;
  unlocked: boolean;
  available: boolean;
  canAfford: boolean;
  onEvolve: (id: string) => void;
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  const handleClick = () => {
    if (available && canAfford && !unlocked) {
      onEvolve(evo.id);
    }
  };

  const categoryColors = {
    symptom: 'text-red',
    transmission: 'text-blue',
    ability: 'text-purple-400',
  };

  return (
    <div
      className={`evo-card ${unlocked ? 'unlocked' : ''} ${!unlocked && available && canAfford ? 'affordable' : ''} ${!available || (!canAfford && !unlocked) ? 'locked' : ''}`}
      style={{ marginLeft: evo.tier * 10 }}
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${unlocked ? 'text-green' : categoryColors[evo.category]}`}>
          {evo.name}
          {evo.tradeoff && <span className="ml-1 text-orange-400" title={evo.drawback}>⚠</span>}
        </span>
        {!unlocked && (
          <span className={`text-[10px] font-mono ${canAfford ? 'text-yellow' : 'text-red'}`}>
            {evo.cost}
          </span>
        )}
        {unlocked && <span className="text-green text-[10px]">✓</span>}
      </div>

      {showTooltip && (
        <div className="tooltip left-0 top-full mt-1">
          <div className="font-bold mb-1">{evo.name}</div>
          <div className="text-dim">{evo.description}</div>
          {evo.tradeoff && evo.drawback && (
            <div className="text-orange-400 mt-1">Trade-off: {evo.drawback}</div>
          )}
          {evo.requires && !unlocked && (
            <div className="text-muted mt-1">
              Requires: {evo.requires.join(', ')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EvolutionPanel({ gameState, onEvolve, getAvailableEvolutions }: EvolutionPanelProps) {
  const available = getAvailableEvolutions();

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span>Evolve</span>
        <span className="text-yellow font-mono">{Math.floor(gameState.dnaPoints)} DNA</span>
      </div>

      <div className="flex-1 scrollable p-2 space-y-3">
        {BRANCHES.map(branch => {
          const items = evolutions.filter(e => e.branch === branch.id);
          if (items.length === 0) return null;
          return (
            <div key={branch.id}>
              <div className={`${branch.color} text-[10px] font-bold uppercase tracking-wider mb-2`}>
                {branch.label}
              </div>
              <div className="space-y-1">
                {items.map(evo => (
                  <EvolutionCard
                    key={evo.id}
                    evo={evo}
                    unlocked={gameState.unlockedEvolutions.includes(evo.id)}
                    available={available.some(a => a.id === evo.id)}
                    canAfford={gameState.dnaPoints >= evo.cost}
                    onEvolve={onEvolve}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
