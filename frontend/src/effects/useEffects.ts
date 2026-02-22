import { useEffect, useCallback, useRef } from 'react';
import { effectSystem } from './EffectSystem';
import type { EffectEvent, EffectListener, EffectPayload } from './EffectSystem';

export interface UseEffectsReturn {
  triggerEffect: (type: string, payload?: EffectPayload) => void;
  addListener: (type: string, handler: (event: EffectEvent) => void, priority?: number) => () => void;
  getStats: () => ReturnType<typeof effectSystem.getStats>;
}

/**
 * React hook for interacting with the global effect system
 */
export const useEffects = (): UseEffectsReturn => {
  const listenersRef = useRef<string[]>([]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(listenerId => {
        effectSystem.removeListener(listenerId);
      });
    };
  }, []);

  const triggerEffect = useCallback((type: string, payload: EffectPayload = {}) => {
    effectSystem.triggerEffect(type, payload);
  }, []);

  const addListener = useCallback((
    type: string, 
    handler: (event: EffectEvent) => void, 
    priority: number = 0
  ): (() => void) => {
    const listenerId = `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const listener: EffectListener = {
      id: listenerId,
      type,
      handler,
      priority
    };

    effectSystem.addListener(listener);
    listenersRef.current.push(listenerId);

    // Return cleanup function
    return () => {
      effectSystem.removeListener(listenerId, type);
      const index = listenersRef.current.indexOf(listenerId);
      if (index !== -1) {
        listenersRef.current.splice(index, 1);
      }
    };
  }, []);

  const getStats = useCallback(() => {
    return effectSystem.getStats();
  }, []);

  return {
    triggerEffect,
    addListener,
    getStats
  };
};