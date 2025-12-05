import React, { useState, useEffect } from 'react';
import './FortuneCard.css';
import { getDailyFortune } from '../../services/fortune';
import type { FortuneResponse } from '../../services/fortune';

interface FortuneCardProps {
  username?: string;
}

const FortuneCard: React.FC<FortuneCardProps> = ({ username = 'You' }) => {
  const [fortune, setFortune] = useState<FortuneResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const fetchFortune = async () => {
    setLoading(true);
    setError(null);
    setIsVisible(false);
    
    try {
      const data = await getDailyFortune(username);
      setFortune(data);
      // Trigger fade-in animation after data loads
      setTimeout(() => setIsVisible(true), 100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to consult the spirits');
      console.error('Failed to fetch fortune:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFortune();
  }, [username]);

  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'low':
        return 'grey';
      case 'medium':
        return 'orange';
      case 'high':
        return 'red';
      default:
        return 'grey';
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'low':
        return 'WHISPER';
      case 'medium':
        return 'WARNING';
      case 'high':
        return 'OMEN';
      default:
        return 'UNKNOWN';
    }
  };

  return (
    <div className="fortune-card">
      <div className="fortune-header">
        <span className="fortune-icon">☠</span>
        <h2 className="fortune-title">DAILY FORTUNE</h2>
        <span className="fortune-icon">☠</span>
      </div>

      <div className="fortune-body">
        {loading ? (
          <div className="fortune-loading">
            <div className="glitch-text" data-text="CONSULTING THE SPIRITS...">
              CONSULTING THE SPIRITS...
            </div>
            <div className="loading-dots">
              <span>◆</span>
              <span>◆</span>
              <span>◆</span>
            </div>
          </div>
        ) : error ? (
          <div className="fortune-error">
            <span className="error-symbol">⚠</span>
            <p>{error}</p>
          </div>
        ) : fortune ? (
          <div className={`fortune-content ${isVisible ? 'visible' : ''}`}>
            <div className="fortune-recipient">
              <span className="label">FOR:</span>
              <span className="username">{fortune.username}</span>
            </div>

            <div className={`fortune-severity severity-${getSeverityColor(fortune.severity)}`}>
              <span className="severity-label">{getSeverityLabel(fortune.severity)}</span>
            </div>

            <div className="fortune-text">
              <div className="quote-mark top">"</div>
              <p>{fortune.fortune}</p>
              <div className="quote-mark bottom">"</div>
            </div>

            <div className="fortune-timestamp">
              <span className="timestamp-label">REVEALED:</span>
              <span className="timestamp-value">
                {new Date(fortune.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        ) : null}
      </div>

      <div className="fortune-footer">
        <button 
          className="consult-button"
          onClick={fetchFortune}
          disabled={loading}
        >
          <span className="button-icon">☠</span>
          CONSULT THE SHINIGAMI AGAIN
          <span className="button-icon">☠</span>
        </button>
      </div>
    </div>
  );
};

export default FortuneCard;
