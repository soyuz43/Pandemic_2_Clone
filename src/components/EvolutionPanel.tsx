import { useState } from 'react';
import { Evolution, evolutions } from '../data/evolutions';
import { GameState } from '../hooks/useGameState';

interface EvolutionPanelProps {
  gameState: GameState;
  onEvolve: (id: string) => void;
  getAvailableEvolutions: () => Evolution[];
}

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
      onClick={handleClick}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${unlocked ? 'text-green' : categoryColors[evo.category]}`}>
          {evo.name}
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
  const symptoms = evolutions.filter(e => e.category === 'symptom');
  const transmissions = evolutions.filter(e => e.category === 'transmission');
  const abilities = evolutions.filter(e => e.category === 'ability');

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center justify-between">
        <span>Evolve</span>
        <span className="text-yellow font-mono">{Math.floor(gameState.dnaPoints)} DNA</span>
      </div>
      
      <div className="flex-1 scrollable p-2 space-y-3">
        {/* Symptoms */}
        <div>
          <div className="text-red text-[10px] font-bold uppercase tracking-wider mb-2">
            Symptoms
          </div>
          <div className="space-y-1">
            {symptoms.map(evo => (
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

        {/* Transmission */}
        <div>
          <div className="text-blue text-[10px] font-bold uppercase tracking-wider mb-2">
            Transmission
          </div>
          <div className="space-y-1">
            {transmissions.map(evo => (
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

        {/* Abilities */}
        <div>
          <div className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            Abilities
          </div>
          <div className="space-y-1">
            {abilities.map(evo => (
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
      </div>
    </div>
  );
}
