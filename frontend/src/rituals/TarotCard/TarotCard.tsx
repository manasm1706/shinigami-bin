import React, { useState } from 'react';
import './TarotCard.css';
import { getTarotReading } from '../../services/rituals';
import type { TarotReading } from '../../services/rituals';

interface TarotCardProps {
  onShare?: (text: string) => void;
}

const SEVERITY_LABEL: Record<string, string> = {
  low: 'MINOR ARCANA WHISPER',
  medium: 'ARCANE WARNING',
  high: 'MAJOR ARCANA OMEN',
};

const TarotCard: React.FC<TarotCardProps> = ({ onShare }) => {
  const [reading, setReading] = useState<TarotReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const draw = async () => {
    setLoading(true);
    setError(null);
    setVisible(false);
    try {
      const data = await getTarotReading();
      setReading(data);
      setTimeout(() => setVisible(true), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The cards refuse to speak');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    if (!reading) return;
    const lines = reading.spread.map(
      c => `[${c.position}] ${c.card}${c.reversed ? ' (reversed)' : ''} — ${c.meaning}`
    );
    onShare?.(`🃏 TAROT READING:\n${lines.join('\n')}\nSeverity: ${reading.severity.toUpperCase()}`);
  };

  return (
    <div className="tarot-card-ritual">
      <div className="ritual-header tarot-header">
        <span className="ritual-icon">🃏</span>
        <h2 className="ritual-title">TAROT READING</h2>
        <span className="ritual-icon">🃏</span>
      </div>

      <div className="ritual-body">
        {loading && (
          <div className="ritual-loading">
            <div className="loading-runes">✦ ✧ ✦ ✧ ✦</div>
            <p>THE CARDS ARE BEING DRAWN...</p>
          </div>
        )}
        {error && <div className="ritual-error">⚠ {error}</div>}
        {reading && !loading && (
          <div className={`tarot-spread ${visible ? 'visible' : ''}`}>
            <div className={`severity-badge severity-${reading.severity}`}>
              {SEVERITY_LABEL[reading.severity]}
            </div>
            <div className="tarot-cards">
              {reading.spread.map((c) => (
                <div key={c.position} className={`tarot-card-item ${c.reversed ? 'reversed' : ''}`}>
                  <div className="card-position">{c.position}</div>
                  <div className="card-face">
                    <div className="card-number">{c.number}</div>
                    <div className="card-name">{c.card}</div>
                    {c.reversed && <div className="card-reversed-label">↓ REVERSED</div>}
                  </div>
                  <div className="card-meaning">{c.meaning}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ritual-footer">
        <button className="ritual-btn" onClick={draw} disabled={loading}>
          {loading ? 'DRAWING...' : '🃏 DRAW THE CARDS'}
        </button>
        {reading && onShare && (
          <button className="ritual-btn ritual-btn-share" onClick={handleShare}>
            ↗ SHARE TO CHAT
          </button>
        )}
      </div>
    </div>
  );
};

export default TarotCard;
