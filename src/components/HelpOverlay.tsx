interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="panel max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
        <div className="panel-header flex items-center justify-between">
          <span>How to Play</span>
          <button onClick={onClose} className="btn text-xs px-2 py-0">✕</button>
        </div>
        <div className="p-4 space-y-4 text-xs">
          <div>
            <div className="text-green font-bold mb-1">Objective</div>
            <p className="text-dim">
              Evolve your pathogen to eliminate 95% of the world population before scientists develop a cure.
            </p>
          </div>

          <div>
            <div className="text-yellow font-bold mb-1">DNA Points</div>
            <p className="text-dim">
              Earn diminishing DNA from new infections and deaths. Close borders for free; airport and seaport shutdowns still cost DNA.
            </p>
          </div>

          <div>
            <div className="text-blue font-bold mb-1">Spread</div>
            <p className="text-dim">
              Your disease spreads locally, across land connections, and over two-way flight and shipping corridors. Recovered people gain immunity; water-capable pathogens contaminate treated, groundwater, and surface-water sources. These are country-level exposure estimates, not detailed geographic water tables. Hover route lines to inspect traffic and status.
            </p>
          </div>

          <div>
            <div className="text-red font-bold mb-1">Visibility</div>
            <p className="text-dim">
              Severe symptoms increase visibility. High visibility triggers border closures and cure research.
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
                <span className="kbd">1</span><span className="kbd">2</span><span className="kbd">3</span>
                <span className="text-dim">Speed</span>
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
            </div>
          </div>
        </div>
        <div className="p-3 border-t border-subtle">
          <button onClick={onClose} className="btn btn-primary w-full py-2">
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}
