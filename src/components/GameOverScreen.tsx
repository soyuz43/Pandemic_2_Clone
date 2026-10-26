import { Trophy, Flame, CheckCircle2, RotateCcw, Dna } from 'lucide-react';
import { GameState } from '../hooks/useGameState';
import { evolutions } from '../data/evolutions';

interface GameOverScreenProps {
  gameState: GameState;
  onRestart: () => void;
}

type Outcome = {
  title: string;
  tagline: string;
  accent: string;
  icon: typeof Trophy;
};

function getOutcome(gameState: GameState): Outcome {
  if (gameState.gameWon) {
    return {
      title: 'Humanity Falls',
      tagline: `${gameState.diseaseName} has eliminated civilization.`,
      accent: 'text-red',
      icon: Trophy,
    };
  }
  if (gameState.gameOverReason === 'extinction') {
    return {
      title: 'Outbreak Burned Out',
      tagline: 'Most infected people recovered and the outbreak could no longer spread.',
      accent: 'text-green',
      icon: Flame,
    };
  }
  return {
    title: 'Cure Found',
    tagline: `Scientists developed a cure for ${gameState.diseaseName}.`,
    accent: 'text-blue',
    icon: CheckCircle2,
  };
}

export default function GameOverScreen({ gameState, onRestart }: GameOverScreenProps) {
  const outcome = getOutcome(gameState);
  const OutcomeIcon = outcome.icon;

  const pct = (n: number) =>
    gameState.totalPopulation > 0 ? (n / gameState.totalPopulation) * 100 : 0;

  // Map evolution ids to their display names for the loadout chips.
  const evoName = (id: string) => evolutions.find(e => e.id === id)?.name ?? id;

  const deadPct = pct(gameState.totalDead);
  const infectedPct = pct(gameState.totalInfected);
  const recoveredPct = pct(gameState.totalRecovered);

  return (
    <div className="fixed inset-0 bg-black/95 flex items-center justify-center z-50 p-4">
      <div className="panel max-w-md w-full">
        <div className={`panel-header flex items-center justify-center gap-2 ${outcome.accent}`}>
          <OutcomeIcon size={13} aria-hidden="true" />
          {outcome.title}
        </div>

        <div className="p-4 space-y-4">
          <p className="text-dim text-xs text-center leading-relaxed">{outcome.tagline}</p>

          {/* Outcome bars */}
          <div className="space-y-2">
            <OutcomeBar
              label="Killed"
              value={deadPct}
              color="#b54a4a"
              highlight={gameState.gameWon}
            />
            <OutcomeBar label="Infected" value={infectedPct} color="#dfaf7d" />
            <OutcomeBar label="Recovered" value={recoveredPct} color="#4ab54a" />
          </div>

          {/* Run summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="stat-block border-green/30">
              <div className="stat-value text-green">{gameState.day}</div>
              <div className="stat-label text-dim">Days</div>
            </div>
            <div className="stat-block border-yellow/30">
              <div className="stat-value text-yellow">{gameState.unlockedEvolutions.length}</div>
              <div className="stat-label text-dim">Evolutions</div>
            </div>
            <div className="stat-block border-blue/30">
              <div className="stat-value text-blue">
                {gameState.countries.filter(c => c.infected > 0).length}
              </div>
              <div className="stat-label text-dim">Countries</div>
            </div>
          </div>

          {/* Final evolution loadout */}
          {gameState.unlockedEvolutions.length > 0 && (
            <div className="border-t border-subtle pt-3">
              <div className="text-[10px] text-dim uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                <Dna size={10} aria-hidden="true" />
                Final Genome
              </div>
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto scrollable">
                {gameState.unlockedEvolutions.map(id => (
                  <span
                    key={id}
                    className="px-1.5 py-0.5 border border-subtle bg-[#0f0f0f] text-[9px] text-dim"
                  >
                    {evoName(id)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-3 border-t border-subtle">
          <button onClick={onRestart} className="btn btn-primary w-full py-2 flex items-center justify-center gap-2">
            <RotateCcw size={11} aria-hidden="true" />
            New Game
          </button>
        </div>
      </div>
    </div>
  );
}

function OutcomeBar({
  label,
  value,
  color,
  highlight,
}: {
  label: string;
  value: number;
  color: string;
  highlight?: boolean;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-dim">{label}</span>
        <span style={{ color }}>{value.toFixed(2)}%</span>
      </div>
      <div className="progress-bar" style={{ height: 6 }}>
        <div
          className="progress-bar-fill"
          style={{ width: `${Math.min(100, value)}%`, backgroundColor: color }}
        />
      </div>
      {highlight && (
        <div className="text-[9px] text-red mt-0.5">95% threshold reached</div>
      )}
    </div>
  );
}

