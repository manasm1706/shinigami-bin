import React, { useState } from 'react';
import { useEffectSettings } from './EffectSettings';
import './EffectSettingsPanel.css';

interface EffectSettingsPanelProps {
  className?: string;
}

const EffectSettingsPanel: React.FC<EffectSettingsPanelProps> = ({ className = '' }) => {
  const { settings, updateSettings, resetSettings } = useEffectSettings();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`effect-settings-panel ${isExpanded ? 'expanded' : 'collapsed'} ${className}`}>
      <button 
        className="settings-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-label="Toggle effect settings"
      >
        <span className="toggle-icon">{isExpanded ? '⚙️' : '🎛️'}</span>
        <span className="toggle-text">EFFECTS</span>
      </button>

      {isExpanded && (
        <div className="settings-content">
          <div className="settings-header">
            <h3>Visual Effects</h3>
            <button 
              className="reset-button"
              onClick={resetSettings}
              title="Reset to defaults"
            >
              ↻
            </button>
          </div>

          {/* CRT Overlay Settings */}
          <div className="setting-group">
            <div className="setting-header">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.crtOverlay.enabled}
                  onChange={(e) => updateSettings({
                    crtOverlay: { ...settings.crtOverlay, enabled: e.target.checked }
                  })}
                />
                CRT Scanlines
              </label>
            </div>
            
            {settings.crtOverlay.enabled && (
              <div className="setting-controls">
                <label className="intensity-label">Intensity:</label>
                <select
                  value={settings.crtOverlay.intensity}
                  onChange={(e) => updateSettings({
                    crtOverlay: { 
                      ...settings.crtOverlay, 
                      intensity: e.target.value as 'low' | 'medium' | 'high'
                    }
                  })}
                  className="intensity-select"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            )}
          </div>

          {/* Glitch Text Settings */}
          <div className="setting-group">
            <div className="setting-header">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.glitchText.enabled}
                  onChange={(e) => updateSettings({
                    glitchText: { ...settings.glitchText, enabled: e.target.checked }
                  })}
                />
                Glitch Text
              </label>
            </div>
            
            {settings.glitchText.enabled && (
              <div className="setting-controls">
                <div className="control-row">
                  <label className="control-label">Intensity:</label>
                  <select
                    value={settings.glitchText.intensity}
                    onChange={(e) => updateSettings({
                      glitchText: { 
                        ...settings.glitchText, 
                        intensity: e.target.value as 'low' | 'medium' | 'high'
                      }
                    })}
                    className="control-select"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div className="control-row">
                  <label className="control-label">Trigger:</label>
                  <select
                    value={settings.glitchText.trigger}
                    onChange={(e) => updateSettings({
                      glitchText: { 
                        ...settings.glitchText, 
                        trigger: e.target.value as 'hover' | 'continuous' | 'random'
                      }
                    })}
                    className="control-select"
                  >
                    <option value="hover">Hover</option>
                    <option value="random">Random</option>
                    <option value="continuous">Continuous</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Ghost Effects Settings */}
          <div className="setting-group">
            <div className="setting-header">
              <label className="setting-label">
                <input
                  type="checkbox"
                  checked={settings.ghostEffects.enabled}
                  onChange={(e) => updateSettings({
                    ghostEffects: { ...settings.ghostEffects, enabled: e.target.checked }
                  })}
                />
                Ghost Effects
              </label>
            </div>
          </div>

          <div className="settings-info">
            <p>Effects are purely visual and don't affect functionality.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default EffectSettingsPanel;