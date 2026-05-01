import React, { useState, useMemo } from 'react';
import { useInterval } from '../../hooks/useInterval';
import './AsciiGifPlayer.css';

// Terminal green palette — index 0 (darkest) to 9 (brightest)
const GREEN_SHADES = [
  '#001a00', '#003300', '#004d00', '#006600', '#008000',
  '#009900', '#00aa33', '#00cc44', '#00ee55', '#00ff41',
];

interface AsciiGifPlayerProps {
  frames: string[];
  /** Per-frame, per-row, per-char shade index (0–9). Optional — falls back to flat green. */
  shades?: number[][][] | null;
  frameDelay?: number;
  /** Always true — GIFs always loop */
  loop?: boolean;
  title?: string;
  compact?: boolean;
}

/** Render a single ASCII frame with per-character green shading */
function ColoredFrame({ text, shadeRows }: { text: string; shadeRows?: number[][] | null }) {
  const lines = text.split('\n');

  if (!shadeRows) {
    // No shade data — render as plain pre (fast path)
    return <pre className="agp-frame">{text}</pre>;
  }

  return (
    <pre className="agp-frame agp-frame-colored">
      {lines.map((line, li) => (
        <span key={li} className="agp-line">
          {line.split('').map((ch, ci) => {
            const shadeIdx = shadeRows[li]?.[ci] ?? 9;
            return (
              <span key={ci} style={{ color: GREEN_SHADES[shadeIdx] }}>{ch}</span>
            );
          })}
          {li < lines.length - 1 ? '\n' : null}
        </span>
      ))}
    </pre>
  );
}

const AsciiGifPlayer: React.FC<AsciiGifPlayerProps> = ({
  frames,
  shades,
  frameDelay = 150,
  title,
  compact = false,
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [playing, setPlaying] = useState(true);

  // Always loop — reset to 0 when reaching end
  useInterval(
    () => {
      setCurrentFrame(prev => (prev + 1) % frames.length);
    },
    playing && frames.length > 1 ? frameDelay : null
  );

  const currentShades = useMemo(
    () => (shades ? shades[currentFrame] ?? null : null),
    [shades, currentFrame]
  );

  if (frames.length === 0) return null;

  return (
    <div className={`ascii-gif-player ${compact ? 'compact' : ''}`}>
      {title && !compact && <div className="agp-title">{title}</div>}

      <ColoredFrame text={frames[currentFrame]} shadeRows={currentShades} />

      {!compact && frames.length > 1 && (
        <div className="agp-controls">
          <button
            className="agp-btn"
            onClick={() => setCurrentFrame(p => (p - 1 + frames.length) % frames.length)}
            aria-label="Previous frame"
          >◀</button>
          <button
            className="agp-btn"
            onClick={() => setPlaying(p => !p)}
            aria-label={playing ? 'Pause' : 'Play'}
          >
            {playing ? '⏸' : '▶'}
          </button>
          <button
            className="agp-btn"
            onClick={() => setCurrentFrame(p => (p + 1) % frames.length)}
            aria-label="Next frame"
          >▶</button>
          <span className="agp-counter">{currentFrame + 1}/{frames.length}</span>
        </div>
      )}
    </div>
  );
};

export default AsciiGifPlayer;
