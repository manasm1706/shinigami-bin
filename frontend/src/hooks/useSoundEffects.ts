import { useCallback, useRef } from 'react';

type SoundType = 'message' | 'ritual' | 'notification';

// Tiny Web Audio API synth — no external files needed
function createAudioContext(): AudioContext | null {
  try {
    return new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch {
    return null;
  }
}

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.15
) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
  osc.start(ctx.currentTime);
  osc.stop(ctx.currentTime + duration);
}

export function useSoundEffects(enabled = true) {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext | null => {
    if (!enabled) return null;
    if (!ctxRef.current) ctxRef.current = createAudioContext();
    return ctxRef.current;
  }, [enabled]);

  const play = useCallback((sound: SoundType) => {
    const ctx = getCtx();
    if (!ctx) return;
    // Resume if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') ctx.resume();

    switch (sound) {
      case 'message':
        // Soft blip: two quick tones
        playTone(ctx, 880, 0.08, 'sine', 0.08);
        setTimeout(() => playTone(ctx, 1100, 0.06, 'sine', 0.06), 80);
        break;
      case 'ritual':
        // Eerie ascending chord
        playTone(ctx, 220, 0.4, 'sawtooth', 0.1);
        setTimeout(() => playTone(ctx, 330, 0.35, 'sawtooth', 0.08), 100);
        setTimeout(() => playTone(ctx, 440, 0.3, 'sawtooth', 0.06), 200);
        setTimeout(() => playTone(ctx, 660, 0.5, 'sine', 0.12), 300);
        break;
      case 'notification':
        playTone(ctx, 660, 0.12, 'square', 0.07);
        setTimeout(() => playTone(ctx, 880, 0.1, 'square', 0.05), 120);
        break;
    }
  }, [getCtx]);

  return { play };
}
