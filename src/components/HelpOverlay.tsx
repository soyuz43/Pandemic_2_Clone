import { X } from 'lucide-react';
import { EVOLUTION_TOPICS } from '../data/evolutionBranches';

interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div
      className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div className="panel max-w-lg w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header flex items-center justify-between">
          <span>How to Play</span>
          <button onClick={onClose} className="btn text-xs px-2 py-0" aria-label="Close help">
            <X size={12} />
          </button>
        </div>

        <div className="flex-1 scrollable p-4 space-y-4 text-xs">
          <div>
            <div className="text-green font-bold mb-1">Objective</div>
            <p className="text-dim">
              Evolve your pathogen to eliminate 95% of the world population before scientists develop a cure.
              The header bar tracks how close you are to that threshold.
            </p>
          </div>

          <div>
            <div className="text-yellow font-bold mb-1">DNA Points</div>
            <p className="text-dim">
              Earn diminishing DNA from new infections and deaths. DNA income scales with the size of your outbreak and slows as the world immunises.
            </p>
          </div>

          <div>
            <div className="text-blue font-bold mb-1">Evolutions</div>
            <p className="text-dim">
              The evolution tree is split into topics so you can pursue one idea at a time. Open a topic, expand a branch, then buy what you can afford.
              Gold-bordered cards are ready to buy right now.
            </p>
            <div className="mt-2 space-y-1">
              {EVOLUTION_TOPICS.map(topic => {
                const Icon = topic.icon;
                return (
                  <div key={topic.id} className="flex items-start gap-2">
                    <Icon size={11} className={`${topic.accent} mt-0.5 shrink-0`} aria-hidden="true" />
                    <span className="text-dim">
                      <span className={topic.accent}>{topic.label}</span> — {topic.blurb}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="text-blue font-bold mb-1">Spread</div>
            <p className="text-dim">
              Your disease spreads locally, across land connections, and over two-way flight and shipping corridors. Recovered people gain immunity; water-capable pathogens contaminate each country's own named water sources (rivers, aquifers, reservoirs) at staggered rates. These are country-level exposure estimates, not detailed geographic water tables. Hover route lines to inspect traffic and status.
            </p>
          </div>

          <div>
            <div className="text-red font-bold mb-1">Visibility</div>
            <p className="text-dim">
              Severe symptoms increase visibility. Visibility speeds up detection, which drives a country's panic response, and it also gates when researchers begin hunting a cure.
            </p>
          </div>

          <div className="border-t border-subtle pt-3">
            <div className="text-dim font-bold mb-2 uppercase tracking-wider text-[10px]">Controls</div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-2">
                <span className="kbd">Space</span>
                <span className="text-dim">Pause/Resume</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">1</span><span className="kbd">2</span><span className="kbd">3</span><span className="kbd">4</span>
                <span className="text-dim">Speed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">E</span>
                <span className="text-dim">Toggle evolution panel</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">Click</span>
                <span className="text-dim">Select country</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">Right-click</span>
                <span className="text-dim">Country info</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">Scroll</span>
                <span className="text-dim">Zoom map</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">Drag</span>
                <span className="text-dim">Pan map</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="kbd">Esc</span>
                <span className="text-dim">Close overlay</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 border-t border-subtle flex-shrink-0">
          <button onClick={onClose} className="btn btn-primary w-full py-2">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
