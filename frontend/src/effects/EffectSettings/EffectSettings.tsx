import React, { createContext, useContext, useState, useEffect } from 'react';

export interface EffectSettingsState {
  crtOverlay: {
    enabled: boolean;
    intensity: 'low' | 'medium' | 'high';
  };
  glitchText: {
    enabled: boolean;
    intensity: 'low' | 'medium' | 'high';
    trigger: 'hover' | 'continuous' | 'random';
  };
  ghostEffects: {
    enabled: boolean;
  };
}

const DEFAULT_SETTINGS: EffectSettingsState = {
  crtOverlay: {
    enabled: true,
    intensity: 'medium'
  },
  glitchText: {
    enabled: true,
    intensity: 'medium',
    trigger: 'random'
  },
  ghostEffects: {
    enabled: true
  }
};

interface EffectSettingsContextType {
  settings: EffectSettingsState;
  updateSettings: (updates: Partial<EffectSettingsState>) => void;
  resetSettings: () => void;
}

const EffectSettingsContext = createContext<EffectSettingsContextType | undefined>(undefined);

export const useEffectSettings = (): EffectSettingsContextType => {
  const context = useContext(EffectSettingsContext);
  if (!context) {
    throw new Error('useEffectSettings must be used within an EffectSettingsProvider');
  }
  return context;
};

interface EffectSettingsProviderProps {
  children: React.ReactNode;
}

export const EffectSettingsProvider: React.FC<EffectSettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<EffectSettingsState>(DEFAULT_SETTINGS);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('shinigami-effect-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
      } catch (error) {
        console.warn('Failed to parse saved effect settings:', error);
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('shinigami-effect-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (updates: Partial<EffectSettingsState>) => {
    setSettings(prev => ({
      ...prev,
      ...updates,
      // Deep merge for nested objects
      crtOverlay: { ...prev.crtOverlay, ...updates.crtOverlay },
      glitchText: { ...prev.glitchText, ...updates.glitchText },
      ghostEffects: { ...prev.ghostEffects, ...updates.ghostEffects }
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <EffectSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </EffectSettingsContext.Provider>
  );
};