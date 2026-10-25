import { Evolution, evolutions } from '../data/evolutions';
import { GameState } from '../hooks/useGameState';

interface EvolutionPanelProps {
  gameState: GameState;
  onEvolve: (id: string) => void;
  getAvailableEvolutions: () => Evolution[];
}

function EvolutionNode({ evo, unlocked, available, canAfford, onEvolve }: {
  evo: Evolution;
  unlocked: boolean;
  available: boolean;
  canAfford: boolean;
  onEvolve: (id: string) => void;
}) {
  const categoryColors = {
    symptom: 'border-red-500 bg-red-900/30',
    transmission: 'border-blue-500 bg-blue-900/30',
    ability: 'border-purple-500 bg-purple-900/30',
  };

  const categoryIcons = {
    symptom: '🦠',
    transmission: '🔄',
    ability: '🧬',
  };

  return (
    <button
      onClick={() => available && canAfford && onEvolve(evo.id)}
      disabled={!available || !canAfford || unlocked}
      className={`w-full text-left p-2 rounded border transition-all ${
        unlocked
          ? 'border-green-500 bg-green-900/40 opacity-80'
          : available && canAfford
          ? `${categoryColors[evo.category]} hover:opacity-100 cursor-pointer hover:scale-[1.02]`
          : available
          ? 'border-gray-600 bg-gray-900/30 opacity-50 cursor-not-allowed'
          : 'border-gray-700 bg-gray-900/20 opacity-30 cursor-not-allowed'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="text-sm">{categoryIcons[evo.category]}</span>
          <span className={`text-xs font-bold ${unlocked ? 'text-green-300' : 'text-white'}`}>
            {evo.name}
          </span>
        </div>
        {!unlocked && (
          <span className={`text-xs font-mono ${canAfford ? 'text-yellow-400' : 'text-red-400'}`}>
            {evo.cost} DNA
          </span>
        )}
        {unlocked && <span className="text-green-400 text-xs">✓</span>}
      </div>
      <div className="text-[10px] text-gray-400 mt-0.5">{evo.description}</div>
      {evo.requires && !unlocked && (
        <div className="text-[9px] text-gray-500 mt-0.5">
          Requires: {evo.requires.join(', ')}
        </div>
      )}
    </button>
  );
}

export default function EvolutionPanel({ gameState, onEvolve, getAvailableEvolutions }: EvolutionPanelProps) {
  const available = getAvailableEvolutions();
  const symptoms = evolutions.filter(e => e.category === 'symptom');
  const transmissions = evolutions.filter(e => e.category === 'transmission');
  const abilities = evolutions.filter(e => e.category === 'ability');

  return (
    <div className="h-full flex flex-col bg-black/60 rounded-lg border border-green-900/50 overflow-hidden">
      <div className="p-2 bg-gradient-to-r from-green-900/50 to-transparent border-b border-green-900/50">
        <h2 className="text-green-400 font-bold text-sm flex items-center gap-2">
          <span>🧬</span> EVOLVE
          <span className="text-yellow-400 font-mono text-xs ml-auto">
            {Math.floor(gameState.dnaPoints)} DNA
          </span>
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
        {/* Symptoms */}
        <div>
          <h3 className="text-red-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>🦠</span> Symptoms
          </h3>
          <div className="space-y-1">
            {symptoms.map(evo => (
              <EvolutionNode
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
          <h3 className="text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>🔄</span> Transmission
          </h3>
          <div className="space-y-1">
            {transmissions.map(evo => (
              <EvolutionNode
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
          <h3 className="text-purple-400 text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
            <span>🧬</span> Abilities
          </h3>
          <div className="space-y-1">
            {abilities.map(evo => (
              <EvolutionNode
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
