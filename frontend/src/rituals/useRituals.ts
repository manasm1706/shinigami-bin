import { useState, useEffect, useCallback } from 'react';
import { ritualRegistry } from './RitualRegistry';
import type { RitualDefinition, RitualResult } from './RitualRegistry';

export interface UseRitualsReturn {
  rituals: RitualDefinition[];
  executeRitual: (ritualId: string, params?: any) => Promise<RitualResult>;
  isExecuting: boolean;
  lastResult: RitualResult | null;
  error: string | null;
  getRitualsByCategory: (category: RitualDefinition['category']) => RitualDefinition[];
  isOnCooldown: (ritualId: string) => boolean;
  getCooldownRemaining: (ritualId: string) => number;
  getHistory: (ritualId: string) => RitualResult[];
}

export const useRituals = (): UseRitualsReturn => {
  const [rituals, setRituals] = useState<RitualDefinition[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<RitualResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load rituals on mount
  useEffect(() => {
    setRituals(ritualRegistry.getAllRituals());
  }, []);

  const executeRitual = useCallback(async (ritualId: string, params?: any): Promise<RitualResult> => {
    setIsExecuting(true);
    setError(null);
    
    try {
      const result = await ritualRegistry.execute(ritualId, params);
      setLastResult(result);
      
      if (!result.success && result.error) {
        setError(result.error);
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown ritual error';
      setError(errorMessage);
      
      // Create error result
      const errorResult: RitualResult = {
        id: `error_${Date.now()}`,
        type: ritualId,
        success: false,
        data: null,
        timestamp: new Date().toISOString(),
        error: errorMessage
      };
      
      setLastResult(errorResult);
      return errorResult;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  const getRitualsByCategory = useCallback((category: RitualDefinition['category']): RitualDefinition[] => {
    return ritualRegistry.getRitualsByCategory(category);
  }, []);

  const isOnCooldown = useCallback((ritualId: string): boolean => {
    return ritualRegistry.isOnCooldown(ritualId);
  }, []);

  const getCooldownRemaining = useCallback((ritualId: string): number => {
    return ritualRegistry.getCooldownRemaining(ritualId);
  }, []);

  const getHistory = useCallback((ritualId: string): RitualResult[] => {
    return ritualRegistry.getHistory(ritualId);
  }, []);

  return {
    rituals,
    executeRitual,
    isExecuting,
    lastResult,
    error,
    getRitualsByCategory,
    isOnCooldown,
    getCooldownRemaining,
    getHistory
  };
};