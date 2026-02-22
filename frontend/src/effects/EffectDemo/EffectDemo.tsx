import React from 'react';
import { useEffects } from '../useEffects';
import { EffectTypes } from '../EffectSystem';
import './EffectDemo.css';

const EffectDemo: React.FC = () => {
  const { triggerEffect, getStats } = useEffects();
  const stats = getStats();

  const handleTriggerEffect = (effectType: string) => {
    triggerEffect(effectType, {
      source: 'manual_trigger',
      timestamp: new Date().toISOString()
    });
  };

  return (
    <div className="effect-demo">
      <div className="effect-demo-header">
        <h2 className="demo-title">👻 EFFECT SYSTEM DEMO</h2>
        <p className="demo-subtitle">Test the global UI effect system</p>
      </div>

      <div className="effect-controls">
        <h3>Ghost Effects</h3>
        <div className="effect-buttons">
          <button 
            className="effect-button subtle"
            onClick={() => handleTriggerEffect(EffectTypes.GHOST_SUBTLE)}
          >
            <span className="effect-icon">🌫️</span>
            Subtle Ghost
          </button>
          
          <button 
            className="effect-button strong"
            onClick={() => handleTriggerEffect(EffectTypes.GHOST_STRONG)}
          >
            <span className="effect-icon">👻</span>
            Strong Ghost
          </button>
          
          <button 
            className="effect-button dramatic"
            onClick={() => handleTriggerEffect(EffectTypes.GHOST_DRAMATIC)}
          >
            <span className="effect-icon">💀</span>
            Dramatic Ghost
          </button>
        </div>
      </div>

      <div className="effect-stats">
        <h3>Effect System Stats</h3>
        <div className="stats-grid">
          <div className="stat-item">
            <span className="stat-label">Total Listeners:</span>
            <span className="stat-value">{stats.totalListeners}</span>
          </div>
          
          <div className="stat-item">
            <span className="stat-label">Recent Events:</span>
            <span className="stat-value">{stats.recentEvents}</span>
          </div>
          
          <div className="stat-item listeners-breakdown">
            <span className="stat-label">Listeners by Type:</span>
            <div className="listeners-list">
              {Object.entries(stats.listenersByType).map(([type, count]) => (
                <div key={type} className="listener-item">
                  <span className="listener-type">{type}:</span>
                  <span className="listener-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="effect-info">
        <h4>How It Works</h4>
        <ul>
          <li>Effects are event-based - components listen for triggers</li>
          <li>Ghost overlay automatically responds to effect events</li>
          <li>Ritual completions trigger appropriate ghost effects</li>
          <li>Effects don't affect application logic</li>
        </ul>
      </div>
    </div>
  );
};

export default EffectDemo;