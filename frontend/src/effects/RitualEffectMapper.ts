/**
 * Ritual Effect Mapper
 * Maps ritual completion events to appropriate visual effects
 */

import { effectSystem, EffectTypes } from './EffectSystem';
import type { RitualResult } from '../rituals/RitualRegistry';

export interface RitualEffectMapping {
  ritualType: string;
  effectType: string;
  condition?: (result: RitualResult) => boolean;
  payload?: (result: RitualResult) => Record<string, any>;
}

/**
 * Default ritual to effect mappings
 */
const DEFAULT_MAPPINGS: RitualEffectMapping[] = [
  // Fortune ritual → subtle ghost
  {
    ritualType: 'daily_fortune',
    effectType: EffectTypes.GHOST_SUBTLE,
    payload: (result) => ({
      ritualType: result.type,
      severity: result.data?.severity,
      fortune: result.data?.fortune
    })
  },
  
  // Weather omen ritual → strong ghost
  {
    ritualType: 'weather_omen',
    effectType: EffectTypes.GHOST_STRONG,
    payload: (result) => ({
      ritualType: result.type,
      severity: result.data?.severity,
      city: result.data?.city,
      weather: result.data?.weather?.condition
    })
  },
  
  // Wheel of fate ritual → dramatic ghost
  {
    ritualType: 'wheel_of_fate',
    effectType: EffectTypes.GHOST_DRAMATIC,
    payload: (result) => ({
      ritualType: result.type,
      severity: result.data?.severity,
      outcome: result.data?.outcome
    })
  }
];

class RitualEffectMapper {
  private mappings: RitualEffectMapping[] = [];
  private isInitialized = false;

  /**
   * Initialize the mapper with default mappings and listeners
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Add default mappings
    this.mappings = [...DEFAULT_MAPPINGS];

    // Listen for ritual completion events
    effectSystem.addListener({
      id: 'ritual_effect_mapper',
      type: EffectTypes.RITUAL_COMPLETE,
      handler: this.handleRitualComplete.bind(this),
      priority: 5 // Medium priority
    });

    console.log('🎭 Ritual Effect Mapper initialized with', this.mappings.length, 'mappings');
    this.isInitialized = true;
  }

  /**
   * Add a custom ritual to effect mapping
   */
  addMapping(mapping: RitualEffectMapping): void {
    this.mappings.push(mapping);
    console.log(`🎭 Added ritual effect mapping: ${mapping.ritualType} → ${mapping.effectType}`);
  }

  /**
   * Remove a mapping by ritual type and effect type
   */
  removeMapping(ritualType: string, effectType: string): void {
    const index = this.mappings.findIndex(
      m => m.ritualType === ritualType && m.effectType === effectType
    );
    
    if (index !== -1) {
      this.mappings.splice(index, 1);
      console.log(`🗑️ Removed ritual effect mapping: ${ritualType} → ${effectType}`);
    }
  }

  /**
   * Handle ritual completion and trigger appropriate effects
   */
  private handleRitualComplete(event: any): void {
    const ritualResult: RitualResult = event.payload.result;
    
    if (!ritualResult || !ritualResult.success) {
      console.log('⚠️ Skipping effects for failed ritual:', ritualResult?.type);
      return;
    }

    console.log(`🎭 Processing ritual completion: ${ritualResult.type}`);

    // Find matching mappings
    const matchingMappings = this.mappings.filter(mapping => {
      if (mapping.ritualType !== ritualResult.type) return false;
      if (mapping.condition && !mapping.condition(ritualResult)) return false;
      return true;
    });

    if (matchingMappings.length === 0) {
      console.log(`⚠️ No effect mappings found for ritual: ${ritualResult.type}`);
      return;
    }

    // Trigger effects for each matching mapping
    matchingMappings.forEach(mapping => {
      const payload = mapping.payload ? mapping.payload(ritualResult) : {};
      
      console.log(`✨ Triggering effect: ${mapping.effectType} for ritual: ${ritualResult.type}`);
      
      // Add a small delay to ensure ritual UI has completed
      setTimeout(() => {
        effectSystem.triggerEffect(mapping.effectType, {
          ...payload,
          ritualId: ritualResult.id,
          timestamp: ritualResult.timestamp
        });
      }, 300);
    });
  }

  /**
   * Manually trigger effects for a ritual result
   */
  triggerEffectsForRitual(ritualResult: RitualResult): void {
    this.handleRitualComplete({
      payload: { result: ritualResult }
    });
  }

  /**
   * Get all current mappings
   */
  getMappings(): RitualEffectMapping[] {
    return [...this.mappings];
  }

  /**
   * Get mappings for a specific ritual type
   */
  getMappingsForRitual(ritualType: string): RitualEffectMapping[] {
    return this.mappings.filter(m => m.ritualType === ritualType);
  }

  /**
   * Clear all mappings
   */
  clearMappings(): void {
    this.mappings = [];
    console.log('🧹 All ritual effect mappings cleared');
  }

  /**
   * Reset to default mappings
   */
  resetToDefaults(): void {
    this.mappings = [...DEFAULT_MAPPINGS];
    console.log('🔄 Reset to default ritual effect mappings');
  }
}

// Export singleton instance
export const ritualEffectMapper = new RitualEffectMapper();

/**
 * Helper function to trigger ritual completion with effects
 */
export function completeRitualWithEffects(ritualResult: RitualResult): void {
  // First trigger the general ritual completion event
  effectSystem.triggerEffect(EffectTypes.RITUAL_COMPLETE, {
    result: ritualResult
  });
  
  // The mapper will automatically handle the effect triggering
}

export default ritualEffectMapper;