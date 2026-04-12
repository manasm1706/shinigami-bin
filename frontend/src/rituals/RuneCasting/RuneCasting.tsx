import React, { useState } from 'react';
import './RuneCasting.css';
import { castRunes } from '../../services/rituals';
import type { RuneCasting as RuneCastingResult } from '../../services/rituals';

interface RuneCastingProps {
  onShare?: (text: string) => void;
}

const RuneCasting: React.FC<RuneCastingProps> = ({ onShare }) => {
  const [result, setResult] = useState<RuneCastingResult | null>(null);
  const [count, setCount] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const cast = async () => {
    setLoading(true);
    setError(null);
    setVisible(false);
    try {
      const data = await castRunes(count);
      setResult(data);
      setTimeout(() => setVisible(true), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The runes will not speak');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const lines = result.runes.map(
      r => `${r.symbol} ${r.name}${r.reversed ? ' (reversed)' : ''} — ${r.meaning}`
    );
    onShare?.(`ᚱ RUNE CASTING:\n${lines.join('\n')}\nSeverity: ${result.severity.toUpperCase()}`);
  };

  return (
    <div className="rune-casting-ritual">
      <div className="ritual-header rune-header">
        <span className="ritual-icon">ᚱ</span>
        <h2 className="ritual-title">RUNE CASTING</h2>
        <span className="ritual-icon">ᚱ</span>
      </div>

      <div className="ritual-body">
        <div className="rune-count-selector">
          <label className="rune-label">RUNES TO CAST:</label>
          <div className="rune-count-btns">
            {[1, 3, 5].map(n => (
              <button
                key={n}
                className={`rune-count-btn ${count === n ? 'active' : ''}`}
                onClick={() => setCount(n)}
                disabled={loading}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="ritual-loading rune-loading">
            <div className="rune-scatter">ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ</div>
            <p>THE RUNES ARE FALLING...</p>
          </div>
        )}
        {error && <div className="ritual-error">⚠ {error}</div>}

        {result && !loading && (
          <div className={`rune-results ${visible ? 'visible' : ''}`}>
            <div className={`severity-badge severity-${result.severity}`}>
              {result.severity.toUpperCase()} OMEN
            </div>
            <div className="rune-stones">
              {result.runes.map((rune, i) => (
                <div key={i} className={`rune-stone ${rune.reversed ? 'reversed' : ''}`}>
                  <div className="rune-symbol">{rune.reversed ? '↓' : ''}{rune.symbol}</div>
                  <div className="rune-name">{rune.name}</div>
                  <div className="rune-meaning">{rune.meaning}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ritual-footer">
        <button className="ritual-btn rune-btn" onClick={cast} disabled={loading}>
          {loading ? 'CASTING...' : 'ᚱ CAST THE RUNES'}
        </button>
        {result && onShare && (
          <button className="ritual-btn ritual-btn-share" onClick={handleShare}>
            ↗ SHARE TO CHAT
          </button>
        )}
      </div>
    </div>
  );
};

export default RuneCasting;
