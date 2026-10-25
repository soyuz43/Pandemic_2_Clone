import { GameState } from '../hooks/useGameState';

interface GameOverScreenProps {
  gameState: GameState;
  onRestart: () => void;
}

export default function GameOverScreen({ gameState, onRestart }: GameOverScreenProps) {
  const infectedPct = (gameState.totalInfected / gameState.totalPopulation) * 100;
  const deadPct = (gameState.totalDead / gameState.totalPopulation) * 100;

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="max-w-md w-full bg-[#0a0a0a] rounded-xl border border-green-900/50 p-8 text-center">
        {gameState.gameWon ? (
          <>
            <div className="text-6xl mb-4">💀</div>
            <h2 className="text-3xl font-black text-red-500 mb-2">HUMANITY FALLS</h2>
            <p className="text-gray-400 mb-6">
              {gameState.diseaseName} has wiped out civilization.
            </p>
          </>
        ) : (
          <>
            <div className="text-6xl mb-4">💊</div>
            <h2 className="text-3xl font-black text-blue-500 mb-2">CURE FOUND</h2>
            <p className="text-gray-400 mb-6">
              Scientists have developed a cure for {gameState.diseaseName}. Your disease has been eradicated.
            </p>
          </>
        )}

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-red-900/20 border border-red-900/40 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-400">{deadPct.toFixed(1)}%</div>
            <div className="text-[10px] text-gray-500 uppercase">Population Killed</div>
          </div>
          <div className="bg-orange-900/20 border border-orange-900/40 rounded-lg p-3">
            <div className="text-2xl font-bold text-orange-400">{infectedPct.toFixed(1)}%</div>
            <div className="text-[10px] text-gray-500 uppercase">Population Infected</div>
          </div>
          <div className="bg-green-900/20 border border-green-900/40 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-400">{gameState.day}</div>
            <div className="text-[10px] text-gray-500 uppercase">Days Survived</div>
          </div>
          <div className="bg-purple-900/20 border border-purple-900/40 rounded-lg p-3">
            <div className="text-2xl font-bold text-purple-400">{gameState.unlockedEvolutions.length}</div>
            <div className="text-[10px] text-gray-500 uppercase">Evolutions</div>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
        >
          🔄 New Game
        </button>
      </div>
    </div>
  );
}
