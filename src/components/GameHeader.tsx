import { Pause, Play, PanelLeft, HelpCircle, Dna, FlaskConical } from 'lucide-react';
import { GameState } from '../hooks/useGameState';
import { GAME_SPEEDS } from '../hooks/useGameState';

interface GameHeaderProps {
  gameState: GameState;
  onTogglePause: () => void;
  onSetSpeed: (speed: number) => void;
  onShowHelp?: () => void;
  onToggleEvoPanel?: () => void;
}

export default function GameHeader({
  gameState,
  onTogglePause,
  onSetSpeed,
  onShowHelp,
  onToggleEvoPanel,
}: GameHeaderProps) {
  const infectedPct = gameState.totalPopulation > 0
    ? ((gameState.totalInfected / gameState.totalPopulation) * 100).toFixed(1)
    : '0.0';
  const deadPct = gameState.totalPopulation > 0
    ? ((gameState.totalDead / gameState.totalPopulation) * 100).toFixed(1)
    : '0.0';
  const countriesInfected = gameState.countries.filter(c => c.infected > 0).length;

  // Win condition is 95% of the world population dead.
  const killPct = gameState.totalPopulation > 0
    ? (gameState.totalDead / gameState.totalPopulation) * 100
    : 0;
  const killProgress = Math.min(100, (killPct / 95) * 100);

  // Cure progress is the average across all countries.
  const cureProgress = gameState.countries.length > 0
    ? gameState.countries.reduce((sum, c) => sum + c.cureProgress, 0) / gameState.countries.length
    : 0;

  return (
    <div className="bg-panel border-b border-subtle px-3 py-1.5 flex items-center gap-4 text-xs h-11">
      {/* Disease info */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-green font-bold truncate max-w-[14rem]" title={gameState.diseaseName}>
          {gameState.diseaseName}
        </span>
        <span className="text-dim text-[10px] uppercase">{gameState.diseaseType}</span>
        <span className="text-dim">|</span>
        <span className="text-white font-bold">Day {gameState.day}</span>
      </div>

      {/* DNA */}
      <div className="flex items-center gap-1" title="DNA points — spend them on evolutions">
        <Dna size={12} className="text-yellow" aria-hidden="true" />
        <span className="text-yellow font-bold font-mono">{Math.floor(gameState.dnaPoints)}</span>
        <span className="text-dim">DNA</span>
      </div>

      {/* Objective progress */}
      <div className="hidden lg:flex items-center gap-2 min-w-0" title="Win condition: kill 95% of humanity">
        <span className="text-dim text-[10px] uppercase tracking-wider shrink-0">Objective</span>
        <div className="progress-bar w-24 shrink-0" style={{ height: 6 }}>
          <div
            className="progress-bar-fill"
            style={{ width: `${killProgress}%`, backgroundColor: '#b54a4a' }}
          />
        </div>
        <span className="text-[10px] text-red font-mono shrink-0">{killPct.toFixed(1)}% / 95%</span>
      </div>

      {/* Cure warning */}
      {gameState.cureStarted && (
        <div
          className="hidden md:flex items-center gap-1 shrink-0"
          title="Scientists are developing a cure"
        >
          <FlaskConical size={12} className="text-blue" aria-hidden="true" />
          <div className="progress-bar w-16" style={{ height: 6 }}>
            <div
              className="progress-bar-fill"
              style={{ width: `${cureProgress}%`, backgroundColor: '#7d9fdf' }}
            />
          </div>
          <span className="text-[10px] text-blue font-mono">{cureProgress.toFixed(0)}%</span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="text-right">
          <span className="text-red">{infectedPct}%</span>
          <span className="text-dim ml-1 hidden xl:inline">infected</span>
        </div>
        <div className="text-right">
          <span className="text-dim">{deadPct}%</span>
          <span className="text-dim ml-1 hidden xl:inline">dead</span>
        </div>
        <div className="text-right">
          <span className="text-green">{countriesInfected}</span>
          <span className="text-dim ml-1 hidden xl:inline">countries</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onTogglePause}
          className={`btn flex items-center gap-1 ${gameState.isRunning ? '' : 'btn-primary'}`}
          title={gameState.isRunning ? 'Pause (Space)' : 'Resume (Space)'}
          aria-label={gameState.isRunning ? 'Pause' : 'Resume'}
        >
          {gameState.isRunning ? <Pause size={10} /> : <Play size={10} />}
          <span className="hidden md:inline">{gameState.isRunning ? 'Pause' : 'Resume'}</span>
        </button>

        {GAME_SPEEDS.map(speed => (
          <button
            key={speed}
            onClick={() => onSetSpeed(speed)}
            className={`btn ${gameState.gameSpeed === speed ? 'btn-primary' : ''}`}
            title={`Speed ${speed}x`}
            aria-pressed={gameState.gameSpeed === speed}
          >
            {speed}x
          </button>
        ))}

        {onToggleEvoPanel && (
          <button
            onClick={onToggleEvoPanel}
            className="btn ml-1"
            title="Toggle evolution panel (E)"
            aria-label="Toggle evolution panel"
          >
            <PanelLeft size={11} />
          </button>
        )}

        {onShowHelp && (
          <button
            onClick={onShowHelp}
            className="btn ml-1"
            title="Help (?)"
            aria-label="Help"
          >
            <HelpCircle size={11} />
          </button>
        )}
      </div>
    </div>
  );
}
