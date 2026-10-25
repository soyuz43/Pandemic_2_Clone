import { useState } from 'react';
import { initialCountries } from '../data/countries';

interface StartScreenProps {
  onStart: (name: string, countryId: string) => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [diseaseName, setDiseaseName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('india');
  const [step, setStep] = useState(0);

  const handleStart = () => {
    const name = diseaseName.trim() || 'Plague';
    onStart(name, selectedCountry);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 mb-2 tracking-tight">
            PANDEMIC
          </h1>
          <div className="text-2xl font-bold text-green-500 tracking-widest">2</div>
          <p className="text-gray-500 text-sm mt-2">Evolve. Infect. Destroy.</p>
        </div>

        {step === 0 && (
          <div className="bg-black/80 rounded-xl border border-green-900/50 p-6 space-y-6 animate-fade-in">
            <div className="text-center">
              <div className="text-6xl mb-4">🦠</div>
              <h2 className="text-xl font-bold text-green-400 mb-2">Create Your Disease</h2>
              <p className="text-gray-400 text-sm">
                Name your pathogen and choose where it begins its journey to destroy humanity.
              </p>
            </div>

            <div>
              <label className="block text-green-400 text-xs font-bold uppercase mb-2">
                Disease Name
              </label>
              <input
                type="text"
                value={diseaseName}
                onChange={(e) => setDiseaseName(e.target.value)}
                placeholder="Enter disease name..."
                className="w-full bg-gray-900 border border-green-900/50 rounded-lg px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-green-500 transition-colors"
                maxLength={30}
              />
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-gradient-to-r from-green-700 to-green-600 hover:from-green-600 hover:to-green-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
            >
              Choose Starting Country →
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="bg-black/80 rounded-xl border border-green-900/50 p-6 space-y-4 animate-fade-in">
            <div className="text-center">
              <h2 className="text-xl font-bold text-green-400 mb-2">Select Starting Location</h2>
              <p className="text-gray-400 text-sm">
                Choose wisely - climate and population affect early spread.
              </p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-1">
              {initialCountries.map(country => (
                <button
                  key={country.id}
                  onClick={() => setSelectedCountry(country.id)}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    selectedCountry === country.id
                      ? 'border-green-500 bg-green-900/40 scale-105'
                      : 'border-gray-700 bg-gray-900/40 hover:border-gray-500'
                  }`}
                >
                  <div className="text-xs font-bold text-white">{country.name}</div>
                  <div className="text-[9px] text-gray-400">
                    {(country.population / 1000000).toFixed(0)}M pop
                  </div>
                  <div className="flex gap-1 mt-0.5">
                    <span className={`text-[8px] px-1 rounded ${
                      country.climate === 'hot' ? 'bg-orange-900/50 text-orange-300' :
                      country.climate === 'cold' ? 'bg-blue-900/50 text-blue-300' :
                      country.climate === 'tropical' ? 'bg-green-900/50 text-green-300' :
                      'bg-yellow-900/50 text-yellow-300'
                    }`}>
                      {country.climate}
                    </span>
                    <span className={`text-[8px] px-1 rounded ${
                      country.wealth === 'wealthy' ? 'bg-purple-900/50 text-purple-300' :
                      country.wealth === 'developing' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-gray-900/50 text-gray-300'
                    }`}>
                      {country.wealth}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setStep(0)}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-3 rounded-lg transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleStart}
                className="flex-1 bg-gradient-to-r from-red-700 to-red-600 hover:from-red-600 hover:to-red-500 text-white font-bold py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-95"
              >
                🦠 Begin Pandemic
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-6 text-gray-600 text-xs">
          <p>A tribute to the classic Flash game Pandemic 2</p>
          <p className="mt-1">Evolve your disease to wipe out humanity before they find a cure!</p>
        </div>
      </div>
    </div>
  );
}
