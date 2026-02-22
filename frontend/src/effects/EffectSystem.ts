/**
 * Global UI Effect System for Shinigami-bin
 * Event-based system where effects listen for triggers, not call APIs
 */

export interface EffectPayload {
  [key: string]: any;
}

export interface EffectEvent {
  type: string;
  payload: EffectPayload;
  timestamp: string;
  id: string;
}

export interface EffectListener {
  id: string;
  type: string;
  handler: (event: EffectEvent) => void;
  priority?: number; // Higher priority executes first
}

class EffectSystem {
  private listeners = new Map<string, EffectListener[]>();
  private eventHistory: EffectEvent[] = [];
  private maxHistorySize = 50;

  /**
   * Register an effect listener
   * @param listener - Effect listener configuration
   */
  addListener(listener: EffectListener): void {
    const { type } = listener;
    
    if (!this.listeners.has(type)) {
      this.listeners.set(type, []);
    }
    
    const typeListeners = this.listeners.get(type)!;
    typeListeners.push(listener);
    
    // Sort by priority (higher first)
    typeListeners.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    console.log(`👻 Effect listener registered: ${listener.id} for type: ${type}`);
  }

  /**
   * Remove an effect listener
   * @param listenerId - ID of the listener to remove
   * @param type - Effect type (optional, for performance)
   */
  removeListener(listenerId: string, type?: string): void {
    if (type) {
      const typeListeners = this.listeners.get(type);
      if (typeListeners) {
        const index = typeListeners.findIndex(l => l.id === listenerId);
        if (index !== -1) {
          typeListeners.splice(index, 1);
          console.log(`🗑️ Effect listener removed: ${listenerId} from type: ${type}`);
        }
      }
    } else {
      // Remove from all types (less efficient)
      this.listeners.forEach((typeListeners, effectType) => {
        const index = typeListeners.findIndex(l => l.id === listenerId);
        if (index !== -1) {
          typeListeners.splice(index, 1);
          console.log(`🗑️ Effect listener removed: ${listenerId} from type: ${effectType}`);
        }
      });
    }
  }

  /**
   * Trigger an effect event
   * @param type - Effect type
   * @param payload - Effect payload data
   */
  triggerEffect(type: string, payload: EffectPayload = {}): void {
    const event: EffectEvent = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    console.log(`✨ Triggering effect: ${type}`, payload);

    // Store in history
    this.eventHistory.push(event);
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    // Execute listeners
    const typeListeners = this.listeners.get(type);
    if (typeListeners && typeListeners.length > 0) {
      typeListeners.forEach(listener => {
        try {
          listener.handler(event);
        } catch (error) {
          console.error(`💀 Effect listener error (${listener.id}):`, error);
        }
      });
    } else {
      console.warn(`⚠️ No listeners registered for effect type: ${type}`);
    }
  }

  /**
   * Get all listeners for a specific type
   * @param type - Effect type
   */
  getListeners(type: string): EffectListener[] {
    return this.listeners.get(type) || [];
  }

  /**
   * Get all registered effect types
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Get recent effect events
   * @param limit - Maximum number of events to return
   */
  getRecentEvents(limit: number = 10): EffectEvent[] {
    return this.eventHistory.slice(-limit);
  }

  /**
   * Clear all listeners (for cleanup)
   */
  clearAllListeners(): void {
    this.listeners.clear();
    console.log('🧹 All effect listeners cleared');
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.eventHistory = [];
    console.log('🧹 Effect event history cleared');
  }

  /**
   * Get system statistics
   */
  getStats(): {
    totalListeners: number;
    listenersByType: Record<string, number>;
    recentEvents: number;
  } {
    const listenersByType: Record<string, number> = {};
    let totalListeners = 0;

    this.listeners.forEach((listeners, type) => {
      listenersByType[type] = listeners.length;
      totalListeners += listeners.length;
    });

    return {
      totalListeners,
      listenersByType,
      recentEvents: this.eventHistory.length
    };
  }
}

// Export singleton instance
export const effectSystem = new EffectSystem();

// Common effect types
export const EffectTypes = {
  // Ritual completion effects
  RITUAL_COMPLETE: 'ritual_complete',
  FORTUNE_COMPLETE: 'fortune_complete',
  WEATHER_OMEN_COMPLETE: 'weather_omen_complete',
  WHEEL_OF_FATE_COMPLETE: 'wheel_of_fate_complete',
  
  // Ghost overlay effects
  GHOST_SUBTLE: 'ghost_subtle',
  GHOST_STRONG: 'ghost_strong',
  GHOST_DRAMATIC: 'ghost_dramatic',
  
  // General UI effects
  SCREEN_SHAKE: 'screen_shake',
  FLASH: 'flash',
  PARTICLE_BURST: 'particle_burst',
  
  // Audio effects (for future use)
  SOUND_WHISPER: 'sound_whisper',
  SOUND_THUNDER: 'sound_thunder',
  SOUND_CHIME: 'sound_chime'
} as const;

export type EffectType = typeof EffectTypes[keyof typeof EffectTypes];

export default effectSystem;