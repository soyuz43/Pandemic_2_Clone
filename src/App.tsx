import { useState, useEffect } from 'react';
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
  const { gameState, startGame, evolve, setGameSpeed, togglePause, getAvailableEvolutions, getEvolutionCost } = useGameState();
  const [selectedCountryId, setSelectedCountryId] = useState<string | null>(null);
  const [showStartScreen, setShowStartScreen] = useState(true);
  const [showHelp, setShowHelp] = useState(false);

  const selectedCountry = selectedCountryId
    ? gameState.countries.find(c => c.id === selectedCountryId) || null
    : null;

  const handleStart = (name: string, countryId: string, diseaseType: any) => {
    startGame(name, countryId, diseaseType);
    setShowStartScreen(false);
    setShowHelp(true);
  };

  const handleRestart = () => {
    setShowStartScreen(true);
    setSelectedCountryId(null);
    setShowHelp(false);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showStartScreen || gameState.gameOver) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.key === '1') {
        setGameSpeed(1);
      } else if (e.key === '2') {
        setGameSpeed(2);
      } else if (e.key === '3') {
        setGameSpeed(3);
      } else if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setShowHelp(true);
      } else if (e.key === 'Escape') {
        setShowHelp(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showStartScreen, gameState.gameOver, togglePause, setGameSpeed]);

  if (showStartScreen) {
    return <StartScreen onStart={handleStart} />;
  }

  return (
    <div className="h-screen flex flex-col bg-dark overflow-hidden">
      <GameHeader
        gameState={gameState}
        onTogglePause={togglePause}
        onSetSpeed={setGameSpeed}
        onShowHelp={() => setShowHelp(true)}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Evolution */}
        <div className="w-64 flex-shrink-0 p-2 overflow-hidden">
          <EvolutionPanel
            gameState={gameState}
            onEvolve={evolve}
            getAvailableEvolutions={getAvailableEvolutions}
            getEvolutionCost={getEvolutionCost}
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
              closedAirports={gameState.closedAirports}
              closedSeaports={gameState.closedSeaports}
              waterRegions={gameState.waterRegions}
              waterTransmission={gameState.waterTransmission}
            />
          </div>
          <div className="h-36 flex-shrink-0">
            <NewsTicker news={gameState.news} />
          </div>
        </div>

        {/* Right panel - Stats */}
        <div className="w-64 flex-shrink-0 p-2 overflow-hidden">
          <StatsPanel
            gameState={gameState}
            selectedCountry={selectedCountry}
          />
        </div>
      </div>

      {showHelp && (
        <HelpOverlay onClose={() => setShowHelp(false)} />
      )}

      {gameState.gameOver && (
        <GameOverScreen gameState={gameState} onRestart={handleRestart} />
      )}
    </div>
  );
}
