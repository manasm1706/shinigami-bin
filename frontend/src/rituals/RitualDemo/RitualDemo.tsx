import React, { useState } from 'react';
import { useRituals } from '../useRituals';
import { RitualExecutor } from '../';
import { useAuth } from '../../auth/useAuth';
import './RitualDemo.css';

const RitualDemo: React.FC = () => {
  const { username } = useAuth();
  const { rituals, getRitualsByCategory } = useRituals();
  const [selectedCity, setSelectedCity] = useState('Seattle');
  const [lastResults, setLastResults] = useState<Record<string, any>>({});

  const divinationRituals = getRitualsByCategory('divination');
  const omenRituals = getRitualsByCategory('omen');
  const fateRituals = getRitualsByCategory('fate');

  const handleRitualResult = (ritualId: string, result: any) => {
    setLastResults(prev => ({
      ...prev,
      [ritualId]: result
    }));
  };

  return (
    <div className="ritual-demo">
      <div className="ritual-demo-header">
        <h2 className="demo-title">🔮 RITUAL CHAMBER</h2>
        <p className="demo-subtitle">Channel the mystical forces through the unified ritual system</p>
      </div>

      <div className="ritual-categories">
        {/* Divination Rituals */}
        <div className="ritual-category">
          <h3 className="category-title">DIVINATION</h3>
          <div className="ritual-grid">
            {divinationRituals.map(ritual => (
              <RitualExecutor
                key={ritual.id}
                ritualId={ritual.id}
                params={{ username: username || 'Anonymous' }}
                onResult={(result) => handleRitualResult(ritual.id, result)}
                className="ritual-card"
              >
                <div className="ritual-result">
                  {lastResults[ritual.id] && (
                    <div className={`result-display ${lastResults[ritual.id].data?.severity || 'neutral'}`}>
                      <div className="result-text">
                        {lastResults[ritual.id].data?.fortune || 'No fortune revealed'}
                      </div>
                      <div className="result-meta">
                        Severity: {lastResults[ritual.id].data?.severity || 'unknown'}
                      </div>
                    </div>
                  )}
                </div>
              </RitualExecutor>
            ))}
          </div>
        </div>

        {/* Omen Rituals */}
        <div className="ritual-category">
          <h3 className="category-title">OMENS</h3>
          <div className="ritual-grid">
            {omenRituals.map(ritual => (
              <RitualExecutor
                key={ritual.id}
                ritualId={ritual.id}
                params={{ city: selectedCity }}
                onResult={(result) => handleRitualResult(ritual.id, result)}
                className="ritual-card"
              >
                <div className="city-input">
                  <label htmlFor="city">City for Omen:</label>
                  <input
                    id="city"
                    type="text"
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="city-field"
                    placeholder="Enter city name..."
                  />
                </div>
                <div className="ritual-result">
                  {lastResults[ritual.id] && (
                    <div className={`result-display ${lastResults[ritual.id].data?.severity || 'neutral'}`}>
                      <div className="result-text">
                        {lastResults[ritual.id].data?.omen || 'No omen revealed'}
                      </div>
                      <div className="result-meta">
                        Weather: {lastResults[ritual.id].data?.weather || 'unknown'} | 
                        Severity: {lastResults[ritual.id].data?.severity || 'unknown'}
                      </div>
                    </div>
                  )}
                </div>
              </RitualExecutor>
            ))}
          </div>
        </div>

        {/* Fate Rituals */}
        <div className="ritual-category">
          <h3 className="category-title">FATE</h3>
          <div className="ritual-grid">
            {fateRituals.map(ritual => (
              <RitualExecutor
                key={ritual.id}
                ritualId={ritual.id}
                onResult={(result) => handleRitualResult(ritual.id, result)}
                className="ritual-card"
              >
                <div className="ritual-result">
                  {lastResults[ritual.id] && (
                    <div className={`result-display ${lastResults[ritual.id].data?.severity || 'neutral'}`}>
                      <div className="result-text">
                        {lastResults[ritual.id].data?.outcome || 'The wheel has not spoken'}
                      </div>
                      <div className="result-meta">
                        Fate: {lastResults[ritual.id].data?.severity || 'unknown'}
                      </div>
                    </div>
                  )}
                </div>
              </RitualExecutor>
            ))}
          </div>
        </div>
      </div>

      <div className="ritual-stats">
        <h4>Ritual Registry Status</h4>
        <p>Total Rituals: {rituals.length}</p>
        <p>Categories: Divination ({divinationRituals.length}), Omens ({omenRituals.length}), Fate ({fateRituals.length})</p>
      </div>
    </div>
  );
};

export default RitualDemo;