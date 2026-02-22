import type { RitualDefinition, RitualResult } from '../RitualRegistry';
import { getDailyFortune } from '../../services/fortune';

export const fortuneRitual: RitualDefinition = {
  id: 'daily_fortune',
  name: 'Daily Fortune',
  description: 'Consult the spirits for your daily fortune',
  category: 'divination',
  cooldown: 30000, // 30 seconds
  requiredParams: ['username'],
  
  async execute(params: { username: string }): Promise<RitualResult> {
    try {
      const fortune = await getDailyFortune(params.username);
      
      return {
        id: `fortune_${Date.now()}`,
        type: 'daily_fortune',
        success: true,
        data: {
          fortune: fortune.fortune,
          severity: fortune.severity,
          username: fortune.username
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      throw new Error(`The spirits are silent: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};