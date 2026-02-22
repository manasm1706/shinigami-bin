import React, { useEffect, useState } from 'react';
import { useEffects } from '../useEffects';
import { EffectTypes } from '../EffectSystem';
import './GhostOverlay.css';

export interface GhostEffectConfig {
  intensity: 'subtle' | 'strong' | 'dramatic';
  duration: number;
  opacity: number;
  particleCount: number;
  wispCount: number;
}

const GHOST_CONFIGS: Record<string, GhostEffectConfig> = {
  subtle: {
    intensity: 'subtle',
    duration: 1500,
    opacity: 0.2,
    particleCount: 6,
    wispCount: 3
  },
  strong: {
    intensity: 'strong',
    duration: 2500,
    opacity: 0.4,
    particleCount: 12,
    wispCount: 6
  },
  dramatic: {
    intensity: 'dramatic',
    duration: 4000,
    opacity: 0.6,
    particleCount: 20,
    wispCount: 10
  }
};

interface EffectGhostOverlayProps {
  className?: string;
  children?: React.ReactNode;
}

const EffectGhostOverlay: React.FC<EffectGhostOverlayProps> = ({ 
  className = '',
  children 
}) => {
  const { addListener } = useEffects();
  const [activeEffect, setActiveEffect] = useState<GhostEffectConfig | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Listen for ghost effect triggers
    const cleanupSubtle = addListener(EffectTypes.GHOST_SUBTLE, () => {
      console.log('👻 Triggering subtle ghost effect');
      setActiveEffect(GHOST_CONFIGS.subtle);
    }, 10);

    const cleanupStrong = addListener(EffectTypes.GHOST_STRONG, () => {
      console.log('👻 Triggering strong ghost effect');
      setActiveEffect(GHOST_CONFIGS.strong);
    }, 10);

    const cleanupDramatic = addListener(EffectTypes.GHOST_DRAMATIC, () => {
      console.log('👻 Triggering dramatic ghost effect');
      setActiveEffect(GHOST_CONFIGS.dramatic);
    }, 10);

    return () => {
      cleanupSubtle();
      cleanupStrong();
      cleanupDramatic();
    };
  }, [addListener]);

  useEffect(() => {
    if (activeEffect) {
      setIsVisible(true);
      setIsAnimating(true);
      
      console.log(`👻 Ghost overlay activated: ${activeEffect.intensity} for ${activeEffect.duration}ms`);
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Keep visible for fade-out animation
        setTimeout(() => {
          setIsVisible(false);
          setActiveEffect(null);
        }, 500);
      }, activeEffect.duration);

      return () => clearTimeout(timer);
    }
  }, [activeEffect]);

  if (!isVisible || !activeEffect) return null;

  return (
    <div 
      className={`ghost-overlay effect-ghost ${activeEffect.intensity} ${isAnimating ? 'active' : 'fading'} ${className}`}
      style={{ 
        '--max-opacity': activeEffect.opacity,
        '--particle-count': activeEffect.particleCount,
        '--wisp-count': activeEffect.wispCount
      } as React.CSSProperties}
    >
      <div className="ghost-background" />
      
      <div className="ghost-particles">
        {[...Array(activeEffect.particleCount)].map((_, i) => (
          <div 
            key={i} 
            className="ghost-particle"
            style={{
              '--delay': `${i * 0.1}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`,
              '--size': `${2 + Math.random() * 4}px`
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      <div className="ghost-wisps">
        {[...Array(activeEffect.wispCount)].map((_, i) => (
          <div 
            key={i} 
            className="ghost-wisp"
            style={{
              '--delay': `${i * 0.3}s`,
              '--path': `${Math.random() * 360}deg`,
              '--speed': `${2 + Math.random() * 3}s`
            } as React.CSSProperties}
          />
        ))}
      </div>
      
      {/* Intensity-specific effects */}
      {activeEffect.intensity === 'dramatic' && (
        <div className="ghost-vortex">
          <div className="vortex-ring" />
          <div className="vortex-ring" style={{ '--delay': '0.5s' } as React.CSSProperties} />
          <div className="vortex-ring" style={{ '--delay': '1s' } as React.CSSProperties} />
        </div>
      )}
      
      {children && (
        <div className="ghost-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default EffectGhostOverlay;