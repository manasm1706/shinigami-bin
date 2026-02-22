import React, { useEffect, useState } from 'react';
import './GhostOverlay.css';

interface GhostOverlayProps {
  active: boolean;
  duration?: number; // Duration in milliseconds
  opacity?: number; // Max opacity (0-1)
  className?: string;
  children?: React.ReactNode;
}

const GhostOverlay: React.FC<GhostOverlayProps> = ({ 
  active, 
  duration = 2000, 
  opacity = 0.3,
  className = '',
  children 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (active) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Auto-hide after duration
      const timer = setTimeout(() => {
        setIsAnimating(false);
        // Keep visible for fade-out animation
        setTimeout(() => setIsVisible(false), 500);
      }, duration);

      return () => clearTimeout(timer);
    } else {
      setIsAnimating(false);
      setTimeout(() => setIsVisible(false), 500);
    }
  }, [active, duration]);

  if (!isVisible) return null;

  return (
    <div 
      className={`ghost-overlay ${isAnimating ? 'active' : 'fading'} ${className}`}
      style={{ '--max-opacity': opacity } as React.CSSProperties}
    >
      <div className="ghost-background" />
      <div className="ghost-particles">
        {[...Array(12)].map((_, i) => (
          <div 
            key={i} 
            className="ghost-particle"
            style={{
              '--delay': `${i * 0.2}s`,
              '--x': `${Math.random() * 100}%`,
              '--y': `${Math.random() * 100}%`
            } as React.CSSProperties}
          />
        ))}
      </div>
      <div className="ghost-wisps">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="ghost-wisp"
            style={{
              '--delay': `${i * 0.5}s`,
              '--path': `${Math.random() * 360}deg`
            } as React.CSSProperties}
          />
        ))}
      </div>
      {children && (
        <div className="ghost-content">
          {children}
        </div>
      )}
    </div>
  );
};

export default GhostOverlay;