import React, { useState, useEffect } from 'react';
import './ProphecyCard.css';
import GhostOverlay from '../GhostOverlay/GhostOverlay';
import { createProphecy, getProphecies, getUpcomingProphecies } from '../../services/prophecies';
import type { ProphecyResponse } from '../../services/prophecies';

interface ProphecyCardProps {
  className?: string;
  showUpcomingOnly?: boolean;
}

const ProphecyCard: React.FC<ProphecyCardProps> = ({ className = '', showUpcomingOnly = false }) => {
  const [prophecies, setProphecies] = useState<ProphecyResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [ghostActive, setGhostActive] = useState<boolean>(false);
  
  // Form state
  const [title, setTitle] = useState<string>('');
  const [date, setDate] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    fetchProphecies();
  }, [showUpcomingOnly]);

  const fetchProphecies = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = showUpcomingOnly 
        ? await getUpcomingProphecies()
        : await getProphecies();
      setProphecies(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to consult the cosmic calendar');
      console.error('Failed to fetch prophecies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !date) {
      setError('Both title and date are required');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const newProphecy = await createProphecy({
        title: title.trim(),
        date: date
      });
      
      setProphecies([...prophecies, newProphecy]);
      setTitle('');
      setDate('');
      setShowForm(false);
      
      // Trigger ghost overlay
      setGhostActive(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to inscribe prophecy');
      console.error('Failed to create prophecy:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'low':
        return 'severity-low';
      case 'medium':
        return 'severity-medium';
      case 'high':
        return 'severity-high';
      default:
        return 'severity-low';
    }
  };

  const getSeverityIcon = (severity: string): string => {
    switch (severity) {
      case 'low':
        return '🌙';
      case 'medium':
        return '⚡';
      case 'high':
        return '💀';
      default:
        return '🔮';
    }
  };

  return (
    <>
      <div className={`prophecy-card ${className}`}>
        <div className="prophecy-header">
          <span className="prophecy-icon">🔮</span>
          <h2 className="prophecy-title">
            {showUpcomingOnly ? 'IMMINENT PROPHECIES' : 'COSMIC CALENDAR'}
          </h2>
          <span className="prophecy-icon">🔮</span>
        </div>

        {!showForm && (
          <div className="prophecy-actions">
            <button 
              className="inscribe-button"
              onClick={() => setShowForm(true)}
            >
              <span className="button-icon">📜</span>
              INSCRIBE NEW PROPHECY
            </button>
            <button 
              className="refresh-button"
              onClick={fetchProphecies}
              disabled={loading}
            >
              <span className="button-icon">🔄</span>
              {loading ? 'CONSULTING...' : 'REFRESH VISIONS'}
            </button>
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="prophecy-form">
            <div className="form-group">
              <label className="form-label">EVENT TITLE:</label>
              <input
                type="text"
                className="form-input"
                placeholder="Enter the mortal event..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={submitting}
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">FATED DATE & TIME:</label>
              <input
                type="datetime-local"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="submit-button"
                disabled={submitting || !title.trim() || !date}
              >
                <span className="button-icon">✨</span>
                {submitting ? 'INSCRIBING...' : 'INSCRIBE PROPHECY'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setShowForm(false);
                  setTitle('');
                  setDate('');
                  setError(null);
                }}
                disabled={submitting}
              >
                CANCEL
              </button>
            </div>
          </form>
        )}

        <div className="prophecies-display">
          {error && (
            <div className="error-state">
              <span className="error-symbol">⚠</span>
              <p className="error-message">{error}</p>
            </div>
          )}

          {loading && (
            <div className="loading-state">
              <div className="cosmic-loader">
                <span className="loader-symbol">🔮</span>
                <span className="loader-text">Consulting the cosmic calendar...</span>
              </div>
            </div>
          )}

          {!loading && prophecies.length === 0 && !error && (
            <div className="empty-state">
              <div className="empty-icon">📜</div>
              <p>The cosmic calendar reveals no prophecies... yet.</p>
            </div>
          )}

          {!loading && prophecies.length > 0 && (
            <div className="prophecies-list">
              {prophecies.map((prophecy) => (
                <div 
                  key={prophecy.id} 
                  className={`prophecy-item ${getSeverityClass(prophecy.severity)}`}
                >
                  <div className="prophecy-item-header">
                    <span className="severity-icon">
                      {getSeverityIcon(prophecy.severity)}
                    </span>
                    <div className="prophecy-date">
                      {formatDate(prophecy.date)}
                    </div>
                  </div>
                  
                  <div className="prophecy-content">
                    <h3 className="ominous-title">{prophecy.ominousTitle}</h3>
                    <p className="ominous-description">{prophecy.ominousDescription}</p>
                    <div className="original-event">
                      <span className="original-label">Mortal Event:</span>
                      <span className="original-title">{prophecy.originalTitle}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <GhostOverlay 
        active={ghostActive} 
        duration={3000}
        opacity={0.4}
      >
        <div className="ghost-message">
          ✨ The prophecy has been inscribed in the cosmic ledger ✨
        </div>
      </GhostOverlay>
    </>
  );
};

export default ProphecyCard;