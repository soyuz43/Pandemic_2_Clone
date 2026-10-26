import { useMemo, useState } from 'react';
import { ChevronRight, Lock, Check, AlertTriangle, X } from 'lucide-react';
import { Evolution, evolutions } from '../data/evolutions';
import {
  EVOLUTION_BRANCHES,
  EVOLUTION_TOPICS,
  EvolutionTopicId,
} from '../data/evolutionBranches';
import { GameState } from '../hooks/useGameState';

interface EvolutionPanelProps {
  gameState: GameState;
  onEvolve: (id: string) => void;
  getAvailableEvolutions: () => Evolution[];
  getEvolutionCost: (evo: Evolution) => number;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

type CardState = 'unlocked' | 'buyable' | 'too_expensive' | 'locked';

function EvolutionCard({
  evo,
  state,
  cost,
  unmetRequires,
  onEvolve,
}: {
  evo: Evolution;
  state: CardState;
  cost: number;
  unmetRequires: string[];
  onEvolve: (id: string) => void;
}) {
  const purchasable = state === 'buyable';

  const handleClick = () => {
    if (purchasable) onEvolve(evo.id);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state !== 'buyable'}
      aria-label={`${evo.name}, ${cost} DNA`}
      className={`evo-card text-left ${state}`}
      // Indent deeper tiers to show tree depth, but shrink the width by the
      // same amount so the card never overflows the rail's right edge.
      style={{
        marginLeft: evo.tier * 9,
        width: `calc(100% - ${evo.tier * 9}px)`,
      }}
    >
      <div className="flex items-baseline gap-2">
        <span className={`text-[10px] font-bold leading-snug ${state === 'unlocked' ? 'text-green' : ''}`}>
          {evo.name}
        </span>
        {evo.tradeoff && (
          <AlertTriangle
            size={9}
            className="text-orange shrink-0 self-center"
            aria-label="Has a trade-off"
          />
        )}
        <span className="ml-auto flex items-center gap-1 shrink-0">
          {state === 'unlocked' ? (
            <Check size={10} className="text-green" aria-hidden="true" />
          ) : state === 'locked' ? (
            <Lock size={9} className="text-muted" aria-hidden="true" />
          ) : (
            <span className={`text-[10px] font-mono ${state === 'buyable' ? 'text-yellow' : 'text-red'}`}>
              {cost}
            </span>
          )}
        </span>
      </div>

      <div className="text-[9px] leading-snug text-dim mt-0.5">
        {evo.description}
      </div>

      {evo.tradeoff && evo.drawback && (
        <div className="text-[9px] leading-snug text-orange mt-0.5">
          ↳ {evo.drawback}
        </div>
      )}

      {state === 'locked' && unmetRequires.length > 0 && (
        <div className="text-[9px] leading-snug text-muted mt-0.5">
          Requires {unmetRequires.join(' + ')}
        </div>
      )}
    </button>
  );
}

export default function EvolutionPanel({
  gameState,
  onEvolve,
  getAvailableEvolutions,
  getEvolutionCost,
  collapsed,
  onToggleCollapsed,
}: EvolutionPanelProps) {
  const [activeTopic, setActiveTopic] = useState<EvolutionTopicId>('spreading');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ air: true });

  const availableIds = useMemo(
    () => new Set(getAvailableEvolutions().map(e => e.id)),
    [getAvailableEvolutions],
  );

  const unlocked = gameState.unlockedEvolutions;

  /** Per-branch roll-up used for the header counters. */
  const branchStats = useMemo(() => {
    const stats: Record<string, { owned: number; total: number; buyable: number }> = {};
    for (const branch of EVOLUTION_BRANCHES) {
      const items = evolutions.filter(e => e.branch === branch.id);
      stats[branch.id] = {
        owned: items.filter(e => unlocked.includes(e.id)).length,
        total: items.length,
        buyable: items.filter(
          e => availableIds.has(e.id) && gameState.dnaPoints >= getEvolutionCost(e),
        ).length,
      };
    }
    return stats;
  }, [unlocked, availableIds, gameState.dnaPoints, getEvolutionCost]);

  const toggleBranch = (branchId: string) => {
    setExpanded(prev => ({ ...prev, [branchId]: !prev[branchId] }));
  };

  /**
   * Switching topics opens the first branch of the incoming topic so the
   * player always lands on something actionable instead of a collapsed list.
   */
  const selectTopic = (topicId: EvolutionTopicId) => {
    setActiveTopic(topicId);
    const firstBranch = EVOLUTION_BRANCHES.find(b => b.topic === topicId);
    if (firstBranch) {
      setExpanded(prev => (prev[firstBranch.id] ? prev : { ...prev, [firstBranch.id]: true }));
    }
  };

  if (collapsed) {
    return (
      <div className="panel h-full flex flex-col items-center py-2 gap-1">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="btn px-1 py-1"
          title="Show evolution panel (E)"
        >
          <ChevronRight size={12} className="rotate-180" />
        </button>
        <div className="my-1 w-6 border-t border-subtle" />
        {EVOLUTION_TOPICS.map(topic => {
          const Icon = topic.icon;
          const topicBuyable = EVOLUTION_BRANCHES
            .filter(b => b.topic === topic.id)
            .reduce((sum, b) => sum + branchStats[b.id].buyable, 0);
          return (
            <button
              key={topic.id}
              type="button"
              // Clicking a topic in the collapsed rail jumps straight to it.
              onClick={() => {
                setActiveTopic(topic.id);
                onToggleCollapsed();
              }}
              title={`${topic.label} — ${topic.blurb}`}
              className={`relative p-1.5 ${activeTopic === topic.id ? topic.accent : 'text-muted hover:text-dim'}`}
            >
              <Icon size={14} />
              {topicBuyable > 0 && (
                <span className="absolute top-0 right-0 min-w-[9px] h-[9px] px-0.5 rounded-full bg-yellow text-[7px] leading-[9px] text-black font-bold text-center">
                  {topicBuyable}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  const activeTopicDef = EVOLUTION_TOPICS.find(t => t.id === activeTopic)!;
  const ActiveTopicIcon = activeTopicDef.icon;
  const topicBranches = EVOLUTION_BRANCHES.filter(b => b.topic === activeTopic);
  // Progress is scoped to the active topic so the numbers always describe
  // what is on screen, not the whole tree.
  const topicOwned = topicBranches.reduce(
    (sum, b) => sum + branchStats[b.id].owned,
    0,
  );
  const topicTotal = topicBranches.reduce(
    (sum, b) => sum + branchStats[b.id].total,
    0,
  );

  return (
    <div className="panel h-full flex flex-col">
      <div className="panel-header flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5">
          <ActiveTopicIcon size={11} className={activeTopicDef.accent} />
          Evolve
        </span>
        <span className="flex items-center gap-2">
          <span
            className="text-yellow font-mono normal-case tracking-normal"
            title="DNA points available"
          >
            {Math.floor(gameState.dnaPoints)} DNA
          </span>
          <button
            type="button"
            onClick={onToggleCollapsed}
            className="btn px-1 py-0 leading-none"
            title="Hide evolution panel (E)"
          >
            <X size={10} />
          </button>
        </span>
      </div>

      {/* Topic tabs */}
      <div className="grid grid-cols-4 gap-px bg-subtle border-b border-subtle">
        {EVOLUTION_TOPICS.map(topic => {
          const Icon = topic.icon;
          const isActive = topic.id === activeTopic;
          const topicBuyable = EVOLUTION_BRANCHES
            .filter(b => b.topic === topic.id)
            .reduce((sum, b) => sum + branchStats[b.id].buyable, 0);
          return (
            <button
              key={topic.id}
              type="button"
              onClick={() => selectTopic(topic.id)}
              title={topic.blurb}
              aria-pressed={isActive}
              className={`relative flex flex-col items-center gap-0.5 py-1.5 transition-colors ${
                isActive ? 'bg-[#1a1a1a]' : 'bg-[#0d0d0d] hover:bg-[#151515]'
              }`}
            >
              <Icon size={13} className={isActive ? topic.accent : 'text-muted'} />
              <span className={`text-[8px] leading-none uppercase tracking-wide ${isActive ? topic.accent : 'text-muted'}`}>
                {topic.label}
              </span>
              {topicBuyable > 0 && (
                <span className="absolute top-1 right-1 min-w-[11px] h-[11px] px-0.5 rounded-full bg-yellow text-[8px] leading-[11px] text-black font-bold text-center">
                  {topicBuyable}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Topic summary */}
      <div className="px-2 py-1.5 border-b border-subtle flex items-center justify-between text-[9px]">
        <span className="text-dim truncate pr-2">{activeTopicDef.blurb}</span>
        <span className="text-muted shrink-0 font-mono">{topicOwned}/{topicTotal}</span>
      </div>

      {/* Branch accordions */}
      <div className="flex-1 scrollable">
        {topicBranches.map(branch => {
          const Icon = branch.icon;
          const stats = branchStats[branch.id];
          const isOpen = !!expanded[branch.id];
          const items = evolutions.filter(e => e.branch === branch.id);

          return (
            <div key={branch.id} className="border-b border-subtle">
              <button
                type="button"
                onClick={() => toggleBranch(branch.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 hover:bg-[#161616] transition-colors text-left"
              >
                <Icon size={11} className={`${branch.accent} shrink-0`} aria-hidden="true" />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${branch.accent}`}>
                  {branch.label}
                </span>
                {stats.buyable > 0 && (
                  <span className="min-w-[12px] h-[12px] px-1 rounded-full bg-yellow text-black text-[8px] font-bold leading-[12px] text-center">
                    {stats.buyable}
                  </span>
                )}
                <span className="ml-auto text-[9px] text-muted font-mono">
                  {stats.owned}/{stats.total}
                </span>
                <ChevronRight
                  size={11}
                  className={`text-muted transition-transform shrink-0 ${isOpen ? 'rotate-90' : ''}`}
                  aria-hidden="true"
                />
              </button>

              {isOpen && (
                <div className="px-2 pb-2 space-y-1">
                  <div className="text-[9px] text-muted px-0.5 pb-0.5">{branch.blurb}</div>
                  {items.map(evo => {
                    const cost = getEvolutionCost(evo);
                    const unlockedNow = unlocked.includes(evo.id);
                    const prereqsMet = availableIds.has(evo.id);
                    let state: CardState;
                    if (unlockedNow) state = 'unlocked';
                    else if (!prereqsMet) state = 'locked';
                    else if (gameState.dnaPoints >= cost) state = 'buyable';
                    else state = 'too_expensive';

                    const unmetRequires = (evo.requires ?? [])
                      .filter(r => !unlocked.includes(r))
                      .map(r => evolutions.find(e => e.id === r)?.name ?? r);

                    return (
                      <EvolutionCard
                        key={evo.id}
                        evo={evo}
                        state={state}
                        cost={cost}
                        unmetRequires={unmetRequires}
                        onEvolve={onEvolve}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}






