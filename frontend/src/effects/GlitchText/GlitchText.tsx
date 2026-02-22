import React, { useState, useEffect } from 'react';
import './GlitchText.css';

interface GlitchTextProps {
  children: React.ReactNode;
  enabled?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  trigger?: 'hover' | 'continuous' | 'random';
  className?: string;
}

const GlitchText: React.FC<GlitchTextProps> = ({
  children,
  enabled = true,
  intensity = 'medium',
  trigger = 'random',
  className = ''
}) => {
  const [isGlitching, setIsGlitching] = useState(false);
  const [glitchText, setGlitchText] = useState('');

  // Generate glitch characters
  const generateGlitchText = (originalText: string): string => {
    const glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?~`';
    const chars = originalText.split('');
    
    return chars.map(char => {
      if (char === ' ') return ' ';
      if (Math.random() < 0.3) {
        return glitchChars[Math.floor(Math.random() * glitchChars.length)];
      }
      return char;
    }).join('');
  };

  // Random glitch effect
  useEffect(() => {
    if (!enabled || trigger !== 'random') return;

    const interval = setInterval(() => {
      if (Math.random() < 0.1) { // 10% chance every interval
        const originalText = typeof children === 'string' ? children : '';
        setGlitchText(generateGlitchText(originalText));
        setIsGlitching(true);
        
        setTimeout(() => {
          setIsGlitching(false);
        }, 100 + Math.random() * 200);
      }
    }, 2000 + Math.random() * 3000);

    return () => clearInterval(interval);
  }, [enabled, trigger, children]);

  // Hover glitch effect
  const handleMouseEnter = () => {
    if (!enabled || trigger !== 'hover') return;
    
    const originalText = typeof children === 'string' ? children : '';
    setGlitchText(generateGlitchText(originalText));
    setIsGlitching(true);
  };

  const handleMouseLeave = () => {
    if (!enabled || trigger !== 'hover') return;
    setIsGlitching(false);
  };

  if (!enabled) {
    return <span className={className}>{children}</span>;
  }

  const glitchClass = `glitch-text ${intensity} ${trigger} ${isGlitching ? 'glitching' : ''} ${className}`;

  return (
    <span 
      className={glitchClass}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      data-text={children}
    >
      <span className="glitch-content">
        {isGlitching ? glitchText : children}
      </span>
      
      {/* Glitch layers for visual effect */}
      <span className="glitch-layer glitch-layer-1" aria-hidden="true">
        {isGlitching ? glitchText : children}
      </span>
      <span className="glitch-layer glitch-layer-2" aria-hidden="true">
        {isGlitching ? glitchText : children}
      </span>
    </span>
  );
};

export default GlitchText;