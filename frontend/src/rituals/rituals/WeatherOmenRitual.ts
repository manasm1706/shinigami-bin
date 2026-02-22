import type { RitualDefinition, RitualResult } from '../RitualRegistry';
import { getWeatherOmen } from '../../services/weatherOmen';

export const weatherOmenRitual: RitualDefinition = {
  id: 'weather_omen',
  name: 'Weather Omen',
  description: 'Interpret the skies for mystical omens',
  category: 'omen',
  cooldown: 60000, // 1 minute
  requiredParams: ['city'],
  
  async execute(params: { city: string }): Promise<RitualResult> {
    try {
      const omen = await getWeatherOmen(params.city);
      
      return {
        id: `omen_${Date.now()}`,
        type: 'weather_omen',
        success: true,
        data: {
          city: omen.city,
          weather: omen.weather,
          omen: omen.omen,
          severity: omen.severity
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`The skies refuse to speak: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};