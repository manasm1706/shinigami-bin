import React, { useEffect, useRef, useCallback } from 'react';
import './EKGOverlay.css';

interface EKGOverlayProps {
  enabled?: boolean;
}

// EKG waveform: flat → P wave → flat → QRS spike → flat → T wave
function getEKGY(x: number, period: number): number {
  const t = (x % period) / period; // 0..1
  // P wave
  if (t > 0.1 && t < 0.2) return -Math.sin((t - 0.1) / 0.1 * Math.PI) * 6;
  // QRS complex
  if (t > 0.28 && t < 0.30) return (t - 0.28) / 0.02 * 28;   // up
  if (t > 0.30 && t < 0.32) return 28 - (t - 0.30) / 0.02 * 56; // spike down
  if (t > 0.32 && t < 0.34) return -28 + (t - 0.32) / 0.02 * 36; // back up
  if (t > 0.34 && t < 0.36) return 8 - (t - 0.34) / 0.02 * 8;   // settle
  // T wave
  if (t > 0.45 && t < 0.60) return -Math.sin((t - 0.45) / 0.15 * Math.PI) * 10;
  return 0;
}

const EKGOverlay: React.FC<EKGOverlayProps> = ({ enabled = true }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);
  const offsetRef = useRef(0);
  const glitchRef = useRef(false);
  const glitchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hrRef = useRef(72);
  const spo2Ref = useRef(98);
  const hrTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Schedule next random glitch (1s – 5min)
  const scheduleGlitch = useCallback(() => {
    const delay = 1000 + Math.random() * (5 * 60 * 1000 - 1000);
    glitchTimerRef.current = setTimeout(() => {
      glitchRef.current = true;
      setTimeout(() => {
        glitchRef.current = false;
        scheduleGlitch();
      }, 120 + Math.random() * 300);
    }, delay);
  }, []);

  // Slowly drift HR and SpO2
  const driftVitals = useCallback(() => {
    hrRef.current = 60 + Math.floor(Math.random() * 40);
    spo2Ref.current = 95 + Math.floor(Math.random() * 5);
    hrTimerRef.current = setTimeout(driftVitals, 4000 + Math.random() * 6000);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    scheduleGlitch();
    driftVitals();
    return () => {
      if (glitchTimerRef.current) clearTimeout(glitchTimerRef.current);
      if (hrTimerRef.current) clearTimeout(hrTimerRef.current);
    };
  }, [enabled, scheduleGlitch, driftVitals]);

  useEffect(() => {
    if (!enabled) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const PERIOD = 220; // px per heartbeat cycle
    const WAVE_Y = canvas.height * 0.88; // bottom strip
    const STRIP_H = 80;
    const SPEED = 1.8; // px per frame

    const draw = () => {
      const W = canvas.width;
      const H = canvas.height;
      const isGlitch = glitchRef.current;

      ctx.clearRect(0, 0, W, H);

      // ── Grid background (faint) ──────────────────────────────────────
      ctx.strokeStyle = isGlitch ? 'rgba(0,255,65,0.12)' : 'rgba(0,255,65,0.06)';
      ctx.lineWidth = 0.5;
      const gridSize = 40;
      for (let x = 0; x < W; x += gridSize) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += gridSize) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // ── EKG strip background ─────────────────────────────────────────
      ctx.fillStyle = 'rgba(0,10,0,0.35)';
      ctx.fillRect(0, WAVE_Y - STRIP_H / 2 - 10, W, STRIP_H + 20);

      // ── EKG waveform ─────────────────────────────────────────────────
      const glitchShift = isGlitch ? (Math.random() - 0.5) * 8 : 0;
      ctx.beginPath();
      ctx.strokeStyle = isGlitch ? '#ff4444' : '#00ff41';
      ctx.lineWidth = isGlitch ? 2.5 : 1.8;
      ctx.shadowColor = isGlitch ? '#ff4444' : '#00ff41';
      ctx.shadowBlur = isGlitch ? 18 : 8;

      for (let px = 0; px < W; px++) {
        const ekgY = WAVE_Y + getEKGY(px + offsetRef.current, PERIOD) + glitchShift;
        if (px === 0) ctx.moveTo(px, ekgY);
        else ctx.lineTo(px, ekgY);
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // ── Scanning line ─────────────────────────────────────────────────
      const scanY = (Date.now() / 30) % H;
      const scanGrad = ctx.createLinearGradient(0, scanY - 2, 0, scanY + 2);
      scanGrad.addColorStop(0, 'transparent');
      scanGrad.addColorStop(0.5, 'rgba(0,255,65,0.08)');
      scanGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = scanGrad;
      ctx.fillRect(0, scanY - 2, W, 4);

      // ── Glitch horizontal tear ────────────────────────────────────────
      if (isGlitch) {
        const tearY = Math.random() * H;
        const tearH = 2 + Math.random() * 6;
        const shift = (Math.random() - 0.5) * 30;
        ctx.save();
        ctx.globalAlpha = 0.6;
        const imgData = ctx.getImageData(0, tearY, W, tearH);
        ctx.putImageData(imgData, shift, tearY);
        ctx.restore();

        // Extra chromatic aberration lines
        for (let i = 0; i < 3; i++) {
          const ly = Math.random() * H;
          ctx.fillStyle = `rgba(${Math.random() > 0.5 ? '255,0,64' : '0,255,255'},0.15)`;
          ctx.fillRect(0, ly, W, 1 + Math.random() * 2);
        }
      }

      // ── Vital signs HUD ───────────────────────────────────────────────
      const hudX = W - 180;
      const hudY = 20;

      ctx.fillStyle = 'rgba(0,8,0,0.7)';
      ctx.fillRect(hudX - 10, hudY - 4, 170, 70);
      ctx.strokeStyle = isGlitch ? '#ff4444' : '#00aa33';
      ctx.lineWidth = 1;
      ctx.strokeRect(hudX - 10, hudY - 4, 170, 70);

      ctx.font = 'bold 11px "Courier New", monospace';
      ctx.fillStyle = '#00aa33';
      ctx.fillText('VITAL SIGNS', hudX, hudY + 10);

      ctx.font = 'bold 22px "Courier New", monospace';
      ctx.fillStyle = isGlitch ? '#ff4444' : '#00ff41';
      ctx.shadowColor = ctx.fillStyle;
      ctx.shadowBlur = 6;
      ctx.fillText(`♥ ${hrRef.current}`, hudX, hudY + 36);

      ctx.font = 'bold 14px "Courier New", monospace';
      ctx.fillStyle = isGlitch ? '#ff8800' : '#00cc44';
      ctx.fillText(`SpO₂ ${spo2Ref.current}%`, hudX, hudY + 56);
      ctx.shadowBlur = 0;

      // ── BPM label ─────────────────────────────────────────────────────
      ctx.font = '9px "Courier New", monospace';
      ctx.fillStyle = '#005522';
      ctx.fillText('BPM', hudX + 70, hudY + 36);

      offsetRef.current += SPEED;
      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      className="ekg-overlay"
      aria-hidden="true"
    />
  );
};

export default EKGOverlay;
