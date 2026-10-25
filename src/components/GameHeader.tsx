import { GameState } from '../hooks/useGameState';

interface GameHeaderProps {
  gameState: GameState;
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  onShowHelp?: () => void;
}

export default function GameHeader({ gameState, onTogglePause, onSetSpeed, onShowHelp }: GameHeaderProps) {
  return (
    <div className="bg-black/80 border-b border-green-900/50 px-4 py-2 flex items-center justify-between gap-4">
      {/* Disease name */}
      <div className="flex items-center gap-2">
        <span className="text-xl">🦠</span>
        <div>
          <div className="text-green-400 font-bold text-sm">{gameState.diseaseName}</div>
          <div className="text-[10px] text-gray-500">Day {gameState.day}</div>
        </div>
      </div>

      {/* DNA Points */}
      <div className="flex items-center gap-2 bg-yellow-900/20 border border-yellow-900/40 rounded-lg px-3 py-1">
        <span className="text-yellow-400 text-sm">🧬</span>
        <div>
          <div className="text-yellow-400 font-bold font-mono text-sm">{Math.floor(gameState.dnaPoints)}</div>
          <div className="text-[9px] text-yellow-600">DNA Points</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePause}
          className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
            gameState.isRunning
              ? 'bg-yellow-700 hover:bg-yellow-600 text-white'
              : 'bg-green-700 hover:bg-green-600 text-white'
          }`}
        >
          {gameState.isRunning ? '⏸ Pause' : '▶ Play'}
        </button>
        
        {[1, 2, 3].map(speed => (
          <button
            key={speed}
            onClick={() => onSetSpeed(speed)}
            className={`px-2 py-1.5 rounded text-xs font-bold transition-all ${
              gameState.gameSpeed === speed
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {speed}x
          </button>
        ))}
        
        {onShowHelp && (
          <button
            onClick={onShowHelp}
            className="px-2 py-1.5 rounded text-xs font-bold bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white transition-all ml-1"
            title="Help"
          >
            ?
          </button>
        )}
      </div>

      {/* Quick stats */}
      <div className="hidden sm:flex items-center gap-3 text-[10px]">
        <div className="text-center">
          <div className="text-red-400 font-bold">{((gameState.totalInfected / gameState.totalPopulation) * 100).toFixed(1)}%</div>
          <div className="text-gray-500">Infected</div>
        </div>
        <div className="text-center">
          <div className="text-gray-300 font-bold">{((gameState.totalDead / gameState.totalPopulation) * 100).toFixed(1)}%</div>
          <div className="text-gray-500">Dead</div>
        </div>
        <div className="text-center">
          <div className="text-green-400 font-bold">{gameState.countries.filter(c => c.infected > 0).length}</div>
          <div className="text-gray-500">Countries</div>
        </div>
      </div>
    </div>
  );
}
