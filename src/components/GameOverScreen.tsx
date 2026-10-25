import { GameState } from '../hooks/useGameState';

interface GameOverScreenProps {
  gameState: GameState;
  onRestart: () => void;
}

export default function GameOverScreen({ gameState, onRestart }: GameOverScreenProps) {
  const infectedPct = (gameState.totalInfected / gameState.totalPopulation) * 100;
  const deadPct = (gameState.totalDead / gameState.totalPopulation) * 100;

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="panel max-w-md w-full">
        {gameState.gameWon ? (
          <>
            <div className="panel-header text-center text-red text-sm">
              Humanity Falls
            </div>
            <div className="p-6 text-center">
              <p className="text-dim text-sm mb-6">
                {gameState.diseaseName} has eliminated civilization.
              </p>
            </div>
          </>
        ) : gameState.gameOverReason === 'extinction' ? (
          <>
            <div className="panel-header text-center text-green text-sm">
              Outbreak Burned Out
            </div>
            <div className="p-6 text-center">
              <p className="text-dim text-sm mb-6">
                Most infected people recovered and the outbreak could no longer spread.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="panel-header text-center text-blue text-sm">
              Cure Found
            </div>
            <div className="p-6 text-center">
              <p className="text-dim text-sm mb-6">
                Scientists developed a cure for {gameState.diseaseName}.
              </p>
            </div>
          </>
        )}

        <div className="p-4 border-t border-subtle">
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="stat-block border-red/30">
              <div className="stat-value text-red">{deadPct.toFixed(1)}%</div>
              <div className="stat-label text-dim">Killed</div>
            </div>
            <div className="stat-block border-yellow/30">
              <div className="stat-value text-yellow">{infectedPct.toFixed(1)}%</div>
              <div className="stat-label text-dim">Infected</div>
            </div>
            <div className="stat-block border-green/30">
              <div className="stat-value text-green">{(gameState.totalRecovered / gameState.totalPopulation * 100).toFixed(1)}%</div>
              <div className="stat-label text-dim">Recovered</div>
            </div>
            <div className="stat-block">
              <div className="stat-value text-green">{gameState.day}</div>
              <div className="stat-label text-dim">Days</div>
            </div>
            <div className="stat-block">
              <div className="stat-value text-blue">{gameState.unlockedEvolutions.length}</div>
              <div className="stat-label text-dim">Evolutions</div>
            </div>
          </div>

          <button
            onClick={onRestart}
            className="btn btn-primary w-full py-2"
          >
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}
