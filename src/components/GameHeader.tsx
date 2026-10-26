import { GameState } from '../hooks/useGameState';
import { GAME_SPEEDS } from '../hooks/useGameState';

interface GameHeaderProps {
  gameState: GameState;
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  onShowHelp?: () => void;
}

export default function GameHeader({ gameState, onTogglePause, onSetSpeed, onShowHelp }: GameHeaderProps) {
  const infectedPct = gameState.totalPopulation > 0
    ? ((gameState.totalInfected / gameState.totalPopulation) * 100).toFixed(1)
    : '0.0';
  const deadPct = gameState.totalPopulation > 0
    ? ((gameState.totalDead / gameState.totalPopulation) * 100).toFixed(1)
    : '0.0';
  const countriesInfected = gameState.countries.filter(c => c.infected > 0).length;

  return (
    <div className="bg-panel border-b border-subtle px-3 py-2 flex items-center gap-4 text-xs">
      {/* Disease info */}
      <div className="flex items-center gap-2">
        <span className="text-green font-bold">{gameState.diseaseName}</span>
        <span className="text-dim text-[10px]">({gameState.diseaseType})</span>
        <span className="text-dim">|</span>
        <span className="text-white font-bold">Day {gameState.day}</span>
      </div>

      {/* DNA */}
      <div className="flex items-center gap-1">
        <span className="text-yellow font-bold">{Math.floor(gameState.dnaPoints)}</span>
        <span className="text-dim">DNA</span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 ml-auto">
        <div>
          <span className="text-red">{infectedPct}%</span>
          <span className="text-dim ml-1">infected</span>
        </div>
        <div>
          <span className="text-dim">{deadPct}%</span>
          <span className="text-dim ml-1">dead</span>
        </div>
        <div>
          <span className="text-green">{countriesInfected}</span>
          <span className="text-dim ml-1">countries</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onTogglePause}
          className={`btn ${gameState.isRunning ? '' : 'btn-primary'}`}
          title={gameState.isRunning ? 'Pause (Space)' : 'Resume (Space)'}
        >
          {gameState.isRunning ? 'Pause' : 'Resume'}
        </button>
        
        {GAME_SPEEDS.map(speed => (
          <button
            key={speed}
            onClick={() => onSetSpeed(speed)}
            className={`btn ${gameState.gameSpeed === speed ? 'btn-primary' : ''}`}
            title={`Speed ${speed}x`}
          >
            {speed}x
          </button>
        ))}

        {onShowHelp && (
          <button
            onClick={onShowHelp}
            className="btn ml-2"
            title="Help (?)"
          >
            ?
          </button>
        )}
      </div>
    </div>
  );
}
