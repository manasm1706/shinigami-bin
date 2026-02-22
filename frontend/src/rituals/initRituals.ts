/**
 * Initialize and register all rituals
 */

import { ritualRegistry } from './RitualRegistry';
import { fortuneRitual } from './rituals/FortuneRitual';
import { weatherOmenRitual } from './rituals/WeatherOmenRitual';
import { wheelOfFateRitual } from './rituals/WheelOfFateRitual';

/**
 * Initialize the ritual system by registering all available rituals
 */
export function initializeRituals(): void {
  console.log('🔮 Initializing Shinigami-bin ritual system...');
  
  // Register core rituals
  ritualRegistry.register(fortuneRitual);
  ritualRegistry.register(weatherOmenRitual);
  ritualRegistry.register(wheelOfFateRitual);
  
  console.log(`✨ Ritual system initialized with ${ritualRegistry.getAllRituals().length} rituals`);
}

/**
 * Get ritual registry instance (for external use)
 */
export { ritualRegistry } from './RitualRegistry';
export type { RitualDefinition, RitualResult } from './RitualRegistry';