/**
 * Global Ritual Registry for Shinigami-bin
 * Centralized system for managing and executing rituals
 */

export interface RitualResult {
  id: string;
  type: string;
  success: boolean;
  data: any;
  timestamp: string;
  error?: string;
}

export interface RitualDefinition {
  id: string;
  name: string;
  description: string;
  category: 'divination' | 'omen' | 'fate' | 'prophecy';
  execute: (params?: any) => Promise<RitualResult>;
  requiredParams?: string[];
  cooldown?: number; // milliseconds
}

class RitualRegistry {
  private rituals = new Map<string, RitualDefinition>();
  private lastExecuted = new Map<string, number>();
  private results = new Map<string, RitualResult[]>();

  /**
   * Register a new ritual
   */
  register(ritual: RitualDefinition): void {
    this.rituals.set(ritual.id, ritual);
    console.log(`🔮 Registered ritual: ${ritual.name} (${ritual.id})`);
  }

  /**
   * Get all registered rituals
   */
  getAllRituals(): RitualDefinition[] {
    return Array.from(this.rituals.values());
  }

  /**
   * Get rituals by category
   */
  getRitualsByCategory(category: RitualDefinition['category']): RitualDefinition[] {
    return this.getAllRituals().filter(ritual => ritual.category === category);
  }

  /**
   * Get a specific ritual by ID
   */
  getRitual(id: string): RitualDefinition | undefined {
    return this.rituals.get(id);
  }

  /**
   * Check if a ritual is on cooldown
   */
  isOnCooldown(ritualId: string): boolean {
    const ritual = this.rituals.get(ritualId);
    if (!ritual?.cooldown) return false;

    const lastExecution = this.lastExecuted.get(ritualId);
    if (!lastExecution) return false;

    return Date.now() - lastExecution < ritual.cooldown;
  }

  /**
   * Get remaining cooldown time in milliseconds
   */
  getCooldownRemaining(ritualId: string): number {
    const ritual = this.rituals.get(ritualId);
    if (!ritual?.cooldown) return 0;

    const lastExecution = this.lastExecuted.get(ritualId);
    if (!lastExecution) return 0;

    const remaining = ritual.cooldown - (Date.now() - lastExecution);
    return Math.max(0, remaining);
  }

  /**
   * Execute a ritual
   */
  async execute(ritualId: string, params?: any): Promise<RitualResult> {
    const ritual = this.rituals.get(ritualId);
    
    if (!ritual) {
      throw new Error(`Ritual not found: ${ritualId}`);
    }

    // Check cooldown
    if (this.isOnCooldown(ritualId)) {
      const remaining = this.getCooldownRemaining(ritualId);
      throw new Error(`Ritual is on cooldown. ${Math.ceil(remaining / 1000)}s remaining.`);
    }

    // Validate required parameters
    if (ritual.requiredParams) {
      for (const param of ritual.requiredParams) {
        if (!params || params[param] === undefined) {
          throw new Error(`Missing required parameter: ${param}`);
        }
      }
    }

    console.log(`🌟 Executing ritual: ${ritual.name}`);

    try {
      // Execute the ritual
      const result = await ritual.execute(params);
      
      // Record execution time
      this.lastExecuted.set(ritualId, Date.now());
      
      // Store result
      if (!this.results.has(ritualId)) {
        this.results.set(ritualId, []);
      }
      const ritualResults = this.results.get(ritualId)!;
      ritualResults.push(result);
      
      // Keep only last 10 results per ritual
      if (ritualResults.length > 10) {
        ritualResults.shift();
      }

      console.log(`✨ Ritual completed: ${ritual.name}`, result);
      return result;

    } catch (error) {
      const errorResult: RitualResult = {
        id: `${ritualId}_${Date.now()}`,
        type: ritual.id,
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      console.error(`💀 Ritual failed: ${ritual.name}`, error);
      return errorResult;
    }
  }

  /**
   * Get execution history for a ritual
   */
  getHistory(ritualId: string): RitualResult[] {
    return this.results.get(ritualId) || [];
  }

  /**
   * Get the last result for a ritual
   */
  getLastResult(ritualId: string): RitualResult | undefined {
    const history = this.getHistory(ritualId);
    return history[history.length - 1];
  }

  /**
   * Clear history for a ritual
   */
  clearHistory(ritualId: string): void {
    this.results.delete(ritualId);
  }

  /**
   * Clear all history
   */
  clearAllHistory(): void {
    this.results.clear();
  }
}

// Export singleton instance
export const ritualRegistry = new RitualRegistry();
export default ritualRegistry;