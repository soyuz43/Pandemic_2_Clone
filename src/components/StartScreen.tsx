import { useState } from 'react';
import { initialCountries } from '../data/countries';
import { diseaseTypes, DiseaseType } from '../data/diseaseTypes';

interface StartScreenProps {
  onStart: (name: string, countryId: string, diseaseType: DiseaseType) => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const [diseaseName, setDiseaseName] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('india');
  const [selectedDiseaseType, setSelectedDiseaseType] = useState<DiseaseType>('bacteria');
  const [step, setStep] = useState(0);

  const handleStart = () => {
    const name = diseaseName.trim() || 'Plague';
    onStart(name, selectedCountry, selectedDiseaseType);
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-1 tracking-tight">
            PANDEMIC 2
          </h1>
          <p className="text-dim text-sm">Disease Simulator</p>
        </div>

        {step === 0 && (
          <div className="panel">
            <div className="panel-header text-center">
              Choose Your Pathogen
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-dim text-xs mb-2 uppercase tracking-wide">
                  Disease Name
                </label>
                <input
                  type="text"
                  value={diseaseName}
                  onChange={(e) => setDiseaseName(e.target.value)}
                  placeholder="Enter name..."
                  className="w-full bg-black border border-subtle px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  maxLength={30}
                />
              </div>

              <div>
                <label className="block text-dim text-xs mb-2 uppercase tracking-wide">
                  Pathogen Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(diseaseTypes) as DiseaseType[]).map(type => {
                    const config = diseaseTypes[type];
                    const isSelected = selectedDiseaseType === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedDiseaseType(type)}
                        className={`panel p-3 text-left transition-all ${
                          isSelected
                            ? 'border-green text-green bg-[#0d1a0d]'
                            : 'hover:border-[#555]'
                        }`}
                      >
                        <div className="text-2xl mb-1">{config.icon}</div>
                        <div className="text-xs font-bold">{config.name}</div>
                        <div className="text-[9px] text-dim mt-1 leading-tight">
                          {config.description}
                        </div>
                        <div className="mt-2 text-[9px] space-y-0.5">
                          <div className="flex justify-between">
                            <span className="text-dim">DNA Gain:</span>
                            <span className={config.dnaMultiplier > 1 ? 'text-green' : config.dnaMultiplier < 1 ? 'text-red' : 'text-white'}>
                              {config.dnaMultiplier > 1 ? '+' : ''}{((config.dnaMultiplier - 1) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dim">Evo Cost:</span>
                            <span className={config.evolutionMultiplier < 1 ? 'text-green' : config.evolutionMultiplier > 1 ? 'text-red' : 'text-white'}>
                              {config.evolutionMultiplier < 1 ? '' : '+'}{((1 - config.evolutionMultiplier) * 100).toFixed(0)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-dim">Climate:</span>
                            <span className={config.climateResistanceBonus > 0 ? 'text-green' : config.climateResistanceBonus < 0 ? 'text-red' : 'text-white'}>
                              {config.climateResistanceBonus > 0 ? '+' : ''}{(config.climateResistanceBonus * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setStep(1)}
                className="btn btn-primary w-full py-2"
              >
                Select Origin →
              </button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="panel">
            <div className="panel-header text-center">
              Select Origin Country
            </div>
            <div className="p-4">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 scrollable mb-4">
                {initialCountries.map(country => (
                  <button
                    key={country.id}
                    onClick={() => setSelectedCountry(country.id)}
                    className={`panel p-2 text-left transition-all ${
                      selectedCountry === country.id
                        ? 'border-green text-green bg-[#0d1a0d]'
                        : 'hover:border-[#555]'
                    }`}
                  >
                    <div className="text-xs font-bold">{country.name}</div>
                    <div className="text-[9px] text-dim mt-1">
                      {(country.population / 1000000).toFixed(0)}M
                    </div>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[8px] px-1 bg-[#1a1a1a] border border-subtle">
                        {country.climate}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setStep(0)}
                  className="btn flex-1 py-2"
                >
                  ← Back
                </button>
                <button
                  onClick={handleStart}
                  className="btn btn-danger flex-1 py-2"
                >
                  Start Pandemic
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-6 text-muted text-xs">
          <p>Evolve your pathogen. Eliminate humanity. Avoid the cure.</p>
        </div>
      </div>
    </div>
  );
}
