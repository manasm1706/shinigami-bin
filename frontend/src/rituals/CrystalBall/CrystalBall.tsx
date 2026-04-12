import React, { useState } from 'react';
import './CrystalBall.css';
import { getCrystalBallVision } from '../../services/rituals';
import type { CrystalBallReading } from '../../services/rituals';

interface CrystalBallProps {
  onShare?: (text: string) => void;
}

const CLARITY_LABEL: Record<string, string> = {
  murky: 'VISION OBSCURED',
  hazy: 'VISION HAZY',
  clear: 'VISION CLEAR',
  crystalline: 'VISION CRYSTALLINE',
};

const CrystalBall: React.FC<CrystalBallProps> = ({ onShare }) => {
  const [reading, setReading] = useState<CrystalBallReading | null>(null);
  const [focus, setFocus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [gazing, setGazing] = useState(false);

  const gaze = async () => {
    setLoading(true);
    setGazing(true);
    setError(null);
    setVisible(false);
    try {
      // Dramatic pause for effect
      await new Promise(r => setTimeout(r, 1200));
      const data = await getCrystalBallVision(focus.trim() || undefined);
      setReading(data);
      setTimeout(() => setVisible(true), 150);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'The ball remains dark');
    } finally {
      setLoading(false);
      setGazing(false);
    }
  };

  const handleShare = () => {
    if (!reading) return;
    const focusPart = reading.focus ? ` [Focus: ${reading.focus}]` : '';
    onShare?.(`🔮 CRYSTAL BALL VISION${focusPart}:\n"${reading.vision}"\nClarity: ${reading.clarity.toUpperCase()} | Severity: ${reading.severity.toUpperCase()}`);
  };

  return (
    <div className="crystal-ball-ritual">
      <div className="ritual-header crystal-header">
        <span className="ritual-icon">🔮</span>
        <h2 className="ritual-title">CRYSTAL BALL</h2>
        <span className="ritual-icon">🔮</span>
      </div>

      <div className="crystal-orb-container">
        <div className={`crystal-orb ${gazing ? 'gazing' : ''} ${reading ? `severity-glow-${reading.severity}` : ''}`}>
          <div className="orb-inner">
            {loading ? (
              <div className="orb-loading">◈</div>
            ) : reading && visible ? (
              <div className="orb-vision">{reading.clarity === 'crystalline' ? '✦' : reading.clarity === 'clear' ? '◆' : reading.clarity === 'hazy' ? '◇' : '○'}</div>
            ) : (
              <div className="orb-idle">○</div>
            )}
          </div>
        </div>
      </div>

      <div className="ritual-body">
        <div className="crystal-focus-input">
          <label className="crystal-label">FOCUS YOUR QUESTION (optional):</label>
          <input
            className="crystal-input"
            value={focus}
            onChange={e => setFocus(e.target.value)}
            placeholder="What do you seek to know?"
            disabled={loading}
            onKeyDown={e => e.key === 'Enter' && !loading && gaze()}
          />
        </div>

        {error && <div className="ritual-error">⚠ {error}</div>}

        {reading && !loading && (
          <div className={`crystal-vision ${visible ? 'visible' : ''}`}>
            <div className={`clarity-badge clarity-${reading.clarity}`}>
              {CLARITY_LABEL[reading.clarity]}
            </div>
            <div className={`severity-badge severity-${reading.severity}`}>
              {reading.severity.toUpperCase()} SEVERITY
            </div>
            <div className="vision-text">
              <span className="vision-quote">"</span>
              {reading.vision}
              <span className="vision-quote">"</span>
            </div>
          </div>
        )}
      </div>

      <div className="ritual-footer">
        <button className="ritual-btn crystal-btn" onClick={gaze} disabled={loading}>
          {loading ? 'GAZING...' : '🔮 GAZE INTO THE BALL'}
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

export default CrystalBall;
