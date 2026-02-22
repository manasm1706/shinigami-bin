import React, { useState } from 'react';
import './WeatherOmenCard.css';

interface WeatherData {
  condition: string;
  temperature: number;
  description: string;
  humidity: number;
  windSpeed: number;
}

interface WeatherOmenResponse {
  city: string;
  weather: WeatherData;
  omen: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  source: string;
}

interface WeatherOmenCardProps {
  className?: string;
}

const WeatherOmenCard: React.FC<WeatherOmenCardProps> = ({ className = '' }) => {
  const [city, setCity] = useState<string>('');
  const [omenData, setOmenData] = useState<WeatherOmenResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const fetchWeatherOmen = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    setLoading(true);
    setError(null);
    setIsVisible(false);

    try {
      const response = await fetch(`/api/omens/weather?city=${encodeURIComponent(city.trim())}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch weather omen');
      }

      const data: WeatherOmenResponse = await response.json();
      setOmenData(data);
      
      // Trigger fade-in animation after data loads
      setTimeout(() => setIsVisible(true), 200);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to consult the skies');
      console.error('Failed to fetch weather omen:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchWeatherOmen();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      fetchWeatherOmen();
    }
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

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'low':
        return 'WHISPER FROM BEYOND';
      case 'medium':
        return 'OMINOUS WARNING';
      case 'high':
        return 'DIRE PROPHECY';
      default:
        return 'UNKNOWN SIGN';
    }
  };

  const getWeatherIcon = (condition: string): string => {
    const icons: { [key: string]: string } = {
      clear: '☀',
      clouds: '☁',
      rain: '🌧',
      drizzle: '🌦',
      thunderstorm: '⛈',
      snow: '❄',
      mist: '🌫',
      fog: '🌫'
    };
    return icons[condition] || '🌤';
  };

  return (
    <div className={`weather-omen-card ${className}`}>
      <div className="weather-omen-header">
        <span className="weather-icon">🌩</span>
        <h2 className="weather-omen-title">WEATHER OMENS</h2>
        <span className="weather-icon">🌩</span>
      </div>

      <form onSubmit={handleSubmit} className="city-input-form">
        <div className="input-group">
          <label className="input-label">CITY OF INQUIRY:</label>
          <div className="input-wrapper">
            <input
              type="text"
              className="city-input"
              placeholder="Enter city name..."
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button 
              type="submit"
              className="consult-button"
              disabled={loading || !city.trim()}
            >
              <span className="button-icon">⚡</span>
              {loading ? 'CONSULTING...' : 'CONSULT THE SKIES'}
              <span className="button-icon">⚡</span>
            </button>
          </div>
        </div>
      </form>

      <div className="omen-display">
        {error && (
          <div className="error-state">
            <span className="error-symbol">⚠</span>
            <p className="error-message">{error}</p>
          </div>
        )}

        {loading && (
          <div className="loading-state">
            <div className="glitch-loader" data-text="READING THE ATMOSPHERIC SIGNS...">
              READING THE ATMOSPHERIC SIGNS...
            </div>
            <div className="loading-elements">
              <span className="loading-element">⚡</span>
              <span className="loading-element">🌩</span>
              <span className="loading-element">⚡</span>
            </div>
          </div>
        )}

        {omenData && !loading && (
          <div className={`omen-content ${isVisible ? 'visible' : ''}`}>
            <div className="location-header">
              <span className="location-label">ATMOSPHERIC READING FOR:</span>
              <span className="location-name">{omenData.city}</span>
            </div>

            <div className="weather-summary">
              <div className="weather-icon-large">
                {getWeatherIcon(omenData.weather.condition)}
              </div>
              <div className="weather-details">
                <div className="weather-condition">{omenData.weather.description}</div>
                <div className="weather-stats">
                  <span className="temp">{omenData.weather.temperature}°C</span>
                  <span className="humidity">💧 {omenData.weather.humidity}%</span>
                  <span className="wind">💨 {omenData.weather.windSpeed} km/h</span>
                </div>
              </div>
            </div>

            <div className={`severity-badge ${getSeverityClass(omenData.severity)}`}>
              <span className="severity-label">{getSeverityLabel(omenData.severity)}</span>
            </div>

            <div className="omen-text-container">
              <div className="quote-mark top">"</div>
              <div className={`omen-text ${getSeverityClass(omenData.severity)}`}>
                {omenData.omen}
              </div>
              <div className="quote-mark bottom">"</div>
            </div>

            <div className="omen-timestamp">
              <span className="timestamp-label">DIVINED AT:</span>
              <span className="timestamp-value">
                {new Date(omenData.timestamp).toLocaleString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeatherOmenCard;