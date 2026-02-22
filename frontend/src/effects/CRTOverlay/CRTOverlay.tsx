import React from 'react';
import './CRTOverlay.css';

interface CRTOverlayProps {
  enabled?: boolean;
  intensity?: 'low' | 'medium' | 'high';
  className?: string;
}

const CRTOverlay: React.FC<CRTOverlayProps> = ({ 
  enabled = true, 
  intensity = 'medium',
  className = '' 
}) => {
  if (!enabled) return null;

  return (
    <div className={`crt-overlay ${intensity} ${className}`}>
      {/* Scanlines */}
      <div className="crt-scanlines" />
      
      {/* Screen curvature effect */}
      <div className="crt-screen" />
      
      {/* Flicker overlay */}
      <div className="crt-flicker" />
      
      {/* Vignette effect */}
      <div className="crt-vignette" />
    </div>
  );
};

export default CRTOverlay;