import React, { useState, useRef } from 'react';
import './WheelOfFate.css';

interface FateOutcome {
  id: string;
  title: string;
  description: string;
  severity: 'blessing' | 'neutral' | 'curse';
  icon: string;
}

const FATE_OUTCOMES: FateOutcome[] = [
  {
    id: 'fortune',
    title: 'Fortune Smiles',
    description: 'The cosmic winds carry good tidings to your doorstep. Luck flows through your veins like liquid starlight.',
    severity: 'blessing',
    icon: '✨'
  },
  {
    id: 'wisdom',
    title: 'Ancient Wisdom',
    description: 'The old spirits whisper secrets in your ear. Knowledge from beyond the veil illuminates your path.',
    severity: 'blessing',
    icon: '🧙‍♂️'
  },
  {
    id: 'protection',
    title: 'Spectral Shield',
    description: 'Invisible guardians surround you with ethereal armor. The shadows themselves bend to protect you.',
    severity: 'blessing',
    icon: '🛡️'
  },
  {
    id: 'mystery',
    title: 'Veil of Mystery',
    description: 'The future remains shrouded in cosmic fog. Some truths are not meant for mortal comprehension... yet.',
    severity: 'neutral',
    icon: '🌫️'
  },
  {
    id: 'balance',
    title: 'Cosmic Balance',
    description: 'The scales of fate remain perfectly still. Neither fortune nor misfortune claims dominion over your destiny.',
    severity: 'neutral',
    icon: '⚖️'
  },
  {
    id: 'crossroads',
    title: 'The Crossroads',
    description: 'Multiple paths stretch before you into the unknown. The choice—and its consequences—rest in your hands.',
    severity: 'neutral',
    icon: '🛤️'
  },
  {
    id: 'shadow',
    title: 'Shadow\'s Embrace',
    description: 'Dark energies swirl around your aura. Tread carefully, for the shadows have taken notice of your presence.',
    severity: 'curse',
    icon: '🌑'
  },
  {
    id: 'trial',
    title: 'Trial by Fire',
    description: 'The cosmos prepares to test your resolve. What doesn\'t destroy you will forge you into something stronger.',
    severity: 'curse',
    icon: '🔥'
  },
  {
    id: 'debt',
    title: 'Karmic Debt',
    description: 'The universe calls in old favors. Past actions echo through time, demanding their due payment.',
    severity: 'curse',
    icon: '⚡'
  }
];

interface WheelOfFateProps {
  className?: string;
}

const WheelOfFate: React.FC<WheelOfFateProps> = ({ className = '' }) => {
  const [spinning, setSpinning] = useState<boolean>(false);
  const [result, setResult] = useState<FateOutcome | null>(null);
  const [showResult, setShowResult] = useState<boolean>(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const spinWheel = () => {
    if (spinning) return;

    setSpinning(true);
    setShowResult(false);
    setResult(null);

    // Random spin duration between 3-5 seconds
    const spinDuration = 3000 + Math.random() * 2000;
    
    // Random number of rotations (5-10 full rotations)
    const rotations = 5 + Math.random() * 5;
    const finalRotation = rotations * 360;

    // Apply CSS animation
    if (wheelRef.current) {
      wheelRef.current.style.transform = `rotate(${finalRotation}deg)`;
      wheelRef.current.style.transition = `transform ${spinDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    }

    // Select random outcome after spin
    setTimeout(() => {
      const randomOutcome = FATE_OUTCOMES[Math.floor(Math.random() * FATE_OUTCOMES.length)];
      setResult(randomOutcome);
      setSpinning(false);
      
      // Show result with delay for dramatic effect
      setTimeout(() => {
        setShowResult(true);
      }, 500);
    }, spinDuration);
  };

  const resetWheel = () => {
    setResult(null);
    setShowResult(false);
    if (wheelRef.current) {
      wheelRef.current.style.transform = 'rotate(0deg)';
      wheelRef.current.style.transition = 'none';
    }
  };

  const getSeverityClass = (severity: string): string => {
    switch (severity) {
      case 'blessing':
        return 'severity-blessing';
      case 'neutral':
        return 'severity-neutral';
      case 'curse':
        return 'severity-curse';
      default:
        return 'severity-neutral';
    }
  };

  const getSeverityLabel = (severity: string): string => {
    switch (severity) {
      case 'blessing':
        return 'DIVINE BLESSING';
      case 'neutral':
        return 'COSMIC NEUTRALITY';
      case 'curse':
        return 'DARK OMEN';
      default:
        return 'UNKNOWN FATE';
    }
  };

  return (
    <div className={`wheel-of-fate ${className}`}>
      <div className="wheel-header">
        <span className="wheel-icon">🎰</span>
        <h2 className="wheel-title">WHEEL OF FATE</h2>
        <span className="wheel-icon">🎰</span>
      </div>

      <div className="wheel-container">
        <div className="wheel-pointer">▼</div>
        
        <div 
          ref={wheelRef}
          className={`fate-wheel ${spinning ? 'spinning' : ''}`}
        >
          {FATE_OUTCOMES.map((outcome, index) => (
            <div 
              key={outcome.id}
              className={`wheel-segment ${getSeverityClass(outcome.severity)}`}
              style={{
                transform: `rotate(${(index * 360) / FATE_OUTCOMES.length}deg)`,
                '--segment-index': index
              } as React.CSSProperties}
            >
              <div className="segment-content">
                <span className="segment-icon">{outcome.icon}</span>
                <span className="segment-text">{outcome.title}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="wheel-controls">
        {!spinning && !result && (
          <button 
            className="spin-button"
            onClick={spinWheel}
          >
            <span className="button-icon">🌀</span>
            SPIN THE WHEEL OF FATE
            <span className="button-icon">🌀</span>
          </button>
        )}

        {spinning && (
          <div className="spinning-message">
            <div className="cosmic-spinner">⚡ ⭐ ⚡</div>
            <p>The cosmic forces are deciding your fate...</p>
          </div>
        )}

        {result && !spinning && (
          <button 
            className="reset-button"
            onClick={resetWheel}
          >
            <span className="button-icon">🔄</span>
            TEMPT FATE AGAIN
          </button>
        )}
      </div>

      {result && (
        <div className={`fate-result ${showResult ? 'visible' : ''}`}>
          <div className={`result-header ${getSeverityClass(result.severity)}`}>
            <span className="result-icon">{result.icon}</span>
            <div className="result-title-container">
              <h3 className="result-title">{result.title}</h3>
              <div className="result-severity">{getSeverityLabel(result.severity)}</div>
            </div>
            <span className="result-icon">{result.icon}</span>
          </div>
          
          <div className="result-content">
            <div className="quote-mark top">"</div>
            <p className="result-description">{result.description}</p>
            <div className="quote-mark bottom">"</div>
          </div>
          
          <div className="result-footer">
            <span className="fate-seal">⚡ THE FATES HAVE SPOKEN ⚡</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default WheelOfFate;