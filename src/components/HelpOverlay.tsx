import { useState, useEffect } from 'react';

interface HelpOverlayProps {
  onClose: () => void;
}

export default function HelpOverlay({ onClose }: HelpOverlayProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose();
    }, 12000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center pointer-events-none">
      <div className="bg-black/90 border border-green-500/50 rounded-xl p-6 max-w-sm mx-4 pointer-events-auto animate-fade-in">
        <h3 className="text-green-400 font-bold text-sm mb-3 flex items-center gap-2">
          <span>💡</span> How to Play
        </h3>
        <div className="text-[11px] text-gray-300 space-y-2">
          <p>🧬 <strong className="text-yellow-400">Earn DNA</strong> - Your disease earns DNA points as it infects people.</p>
          <p>🦠 <strong className="text-red-400">Evolve</strong> - Spend DNA to unlock symptoms, transmission methods, and abilities.</p>
          <p>🌍 <strong className="text-blue-400">Spread</strong> - Your disease spreads to connected countries automatically.</p>
          <p>🔒 <strong className="text-orange-400">Borders</strong> - Wealthy countries may close borders if your disease is visible.</p>
          <p>💊 <strong className="text-purple-400">Cure</strong> - If your disease is too visible, scientists will start researching a cure!</p>
          <p>💀 <strong className="text-red-500">Win</strong> - Kill 95% of the world population before a cure is found.</p>
        </div>
        <button
          onClick={() => { setVisible(false); onClose(); }}
          className="mt-3 w-full bg-green-800 hover:bg-green-700 text-white text-xs py-1.5 rounded transition-colors"
        >
          Got it!
        </button>
      </div>
    </div>
  );
}
