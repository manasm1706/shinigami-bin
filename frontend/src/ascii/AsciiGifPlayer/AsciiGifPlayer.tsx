import React, { useState } from 'react';
import { useInterval } from '../../hooks/useInterval';
import './AsciiGifPlayer.css';

interface AsciiGifPlayerProps {
  frames: string[];
  frameDelay?: number;
  loop?: boolean;
  title?: string;
  compact?: boolean; // inline chat mode
}

const AsciiGifPlayer: React.FC<AsciiGifPlayerProps> = ({
  frames,
  frameDelay = 150,
  loop = true,
  title,
  compact = false,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(true);

  useInterval(
    () => {
      setCurrentFrame(prev => {
        const next = prev + 1;
        if (next >= frames.length) {
          if (!loop) { setPlaying(false); return prev; }
          return 0;
        }
        return next;
      });
    },
    playing && frames.length > 1 ? frameDelay : null
  );

  if (frames.length === 0) return null;

  return (
    <div className={`ascii-gif-player ${compact ? 'compact' : ''}`}>
      {title && !compact && <div className="agp-title">{title}</div>}
      <pre className="agp-frame">{frames[currentFrame]}</pre>
      {!compact && frames.length > 1 && (
        <div className="agp-controls">
          <button className="agp-btn" onClick={() => setCurrentFrame(p => Math.max(0, p - 1))}>◀</button>
          <button className="agp-btn" onClick={() => setPlaying(p => !p)}>
            {playing ? '⏸' : '▶'}
          </button>
          <button className="agp-btn" onClick={() => setCurrentFrame(p => Math.min(frames.length - 1, p + 1))}>▶</button>
          <span className="agp-counter">{currentFrame + 1}/{frames.length}</span>
        </div>
      )}
    </div>
  );
};

export default AsciiGifPlayer;
