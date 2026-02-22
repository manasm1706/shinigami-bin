import React, { useState, useEffect } from 'react';
import { useRituals } from '../useRituals';
import { completeRitualWithEffects } from '../../effects/RitualEffectMapper';
import type { RitualDefinition, RitualResult } from '../RitualRegistry';
import './RitualExecutor.css';

interface RitualExecutorProps {
  ritualId: string;
  params?: Record<string, any>;
  onResult?: (result: RitualResult) => void;
  onError?: (error: string) => void;
  children?: React.ReactNode;
  className?: string;
}

const RitualExecutor: React.FC<RitualExecutorProps> = ({
  ritualId,
  params = {},
  onResult,
  onError,
  children,
  className = ''
}) => {
  const { executeRitual, isExecuting, isOnCooldown, getCooldownRemaining } = useRituals();
  const [cooldownTime, setCooldownTime] = useState(0);
  const [ritual, setRitual] = useState<RitualDefinition | null>(null);

  // Get ritual definition
  useEffect(() => {
    const ritualDef = useRituals().rituals.find(r => r.id === ritualId);
    setRitual(ritualDef || null);
  }, [ritualId]);

  // Update cooldown timer
  useEffect(() => {
    if (!isOnCooldown(ritualId)) {
      setCooldownTime(0);
      return;
    }

    const updateCooldown = () => {
      const remaining = getCooldownRemaining(ritualId);
      setCooldownTime(remaining);
      
      if (remaining <= 0) {
        setCooldownTime(0);
      }
    };

    updateCooldown();
    const interval = setInterval(updateCooldown, 1000);
    
    return () => clearInterval(interval);
  }, [ritualId, isOnCooldown, getCooldownRemaining]);

  const handleExecute = async () => {
    if (isExecuting || isOnCooldown(ritualId)) return;

    try {
      const result = await executeRitual(ritualId, params);
      
      // Trigger effects AFTER ritual completes successfully
      if (result.success) {
        console.log(`🎭 Ritual completed successfully, triggering effects for: ${result.type}`);
        completeRitualWithEffects(result);
        
        if (onResult) {
          onResult(result);
        }
      } else if (!result.success && result.error && onError) {
        onError(result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Ritual execution failed';
      if (onError) {
        onError(errorMessage);
      }
    }
  };

  const formatCooldownTime = (ms: number): string => {
    const seconds = Math.ceil(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const isDisabled = isExecuting || isOnCooldown(ritualId);
  const buttonText = isExecuting 
    ? 'Channeling...' 
    : cooldownTime > 0 
      ? `Cooldown: ${formatCooldownTime(cooldownTime)}`
      : ritual?.name || 'Execute Ritual';

  return (
    <div className={`ritual-executor ${className}`}>
      {children && (
        <div className="ritual-content">
          {children}
        </div>
      )}
      
      <button
        className={`ritual-button ${isDisabled ? 'disabled' : ''} ${isExecuting ? 'executing' : ''}`}
        onClick={handleExecute}
        disabled={isDisabled}
      >
        <span className="ritual-icon">🔮</span>
        <span className="ritual-text">{buttonText}</span>
      </button>
      
      {ritual && (
        <div className="ritual-info">
          <div className="ritual-description">{ritual.description}</div>
          <div className="ritual-category">Category: {ritual.category}</div>
        </div>
      )}
    </div>
  );
};

export default RitualExecutor;