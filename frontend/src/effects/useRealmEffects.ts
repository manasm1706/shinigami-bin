/**
 * useRealmEffects — adjusts effect intensity based on the active realm's effectsLevel
 */
import { useEffect } from 'react';
import { effectSystem } from './EffectSystem';
import type { EffectsLevel } from '../types';

const INTENSITY_MAP: Record<EffectsLevel, { ghostProbability: number; glitchMultiplier: number }> = {
  low:    { ghostProbability: 0.1, glitchMultiplier: 0.3 },
  medium: { ghostProbability: 0.4, glitchMultiplier: 0.7 },
  high:   { ghostProbability: 0.9, glitchMultiplier: 1.0 },
};

export function useRealmEffects(effectsLevel: EffectsLevel) {
  useEffect(() => {
    const config = INTENSITY_MAP[effectsLevel];
    // Broadcast realm effect level change so listeners can adapt
    effectSystem.triggerEffect('realm_effects_changed', {
      effectsLevel,
      ...config,
    });
  }, [effectsLevel]);
}
