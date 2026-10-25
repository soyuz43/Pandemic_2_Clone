import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import StartScreen from './components/StartScreen';
import GameHeader from './components/GameHeader';
import WorldMap from './components/WorldMap';
import EvolutionPanel from './components/EvolutionPanel';
import StatsPanel from './components/StatsPanel';
import NewsTicker from './components/NewsTicker';
import GameOverScreen from './components/GameOverScreen';
import HelpOverlay from './components/HelpOverlay';

export default function App() {
  const { gameState, startGame, evolve, setGameSpeed, togglePause, getAvailableEvolutions } = useGameState();
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const selectedCountry = selectedCountryId
    ? gameState.countries.find(c => c.id === selectedCountryId) || null
    : null;

  const handleStart = (name: string, countryId: string) => {
    startGame(name, countryId);
    setShowStartScreen(false);
    setShowHelp(true);
  };

  const handleRestart = () => {
    setShowStartScreen(true);
    setSelectedCountryId(null);
    setShowHelp(false);
  };

  if (showStartScreen) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-white overflow-hidden">
      {/* Header */}
      <GameHeader
        gameState={gameState}
        onTogglePause={togglePause}
        onSetSpeed={setGameSpeed}
        onShowHelp={() => setShowHelp(true)}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Evolution */}
        <div className="w-64 flex-shrink-0 p-2 overflow-hidden">
          <EvolutionPanel
            gameState={gameState}
            onEvolve={evolve}
            getAvailableEvolutions={getAvailableEvolutions}
          />
        </div>

        {/* Center - World Map */}
        <div className="flex-1 p-2 flex flex-col gap-2 min-w-0">
          <div className="flex-1 min-h-0">
            <WorldMap
              countries={gameState.countries}
              selectedCountry={selectedCountryId}
              onSelectCountry={setSelectedCountryId}
              startCountry={gameState.startCountry}
            />
          </div>
          {/* News ticker at bottom */}
          <div className="h-36 flex-shrink-0">
            <NewsTicker news={gameState.news} />
          </div>
        </div>

        {/* Right panel - Stats */}
        <div className="w-64 flex-shrink-0 p-2 overflow-y-auto">
          <StatsPanel
            gameState={gameState}
            selectedCountry={selectedCountry}
          />
        </div>
      </div>

      {/* Help overlay */}
      {showHelp && (
        <HelpOverlay onClose={() => setShowHelp(false)} />
      )}

      {/* Game Over overlay */}
      {gameState.gameOver && (
        <GameOverScreen gameState={gameState} onRestart={handleRestart} />
      )}
    </div>
  );
}
