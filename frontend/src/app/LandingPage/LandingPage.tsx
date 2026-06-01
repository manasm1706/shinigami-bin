import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import './LandingPage.css';

const FEATURES = [
  { icon: '💬', title: 'REALM CHANNELS', desc: 'Speak across Living, Beyond, and Unknown — three channels divided by the veil.' },
  { icon: '🔮', title: 'RITUAL SYSTEM', desc: 'Consult daily fortunes, read weather omens, and spin the Wheel of Fate.' },
  { icon: '👻', title: 'GHOST EFFECTS', desc: 'Event-driven visual hauntings triggered by ritual completion.' },
  { icon: '📡', title: 'REAL-TIME', desc: 'Socket.IO powered messaging. Messages arrive before the echo fades.' },
  { icon: '🌩️', title: 'WEATHER OMENS', desc: 'MCP-bridged weather interpretation. The skies speak if you know how to listen.' },
  { icon: '📜', title: 'PROPHECIES', desc: 'Inscribe events into the cosmic ledger. The calendar remembers what you forget.' },
];

const PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  delay: Math.random() * 8,
  duration: 6 + Math.random() * 8,
  size: Math.random() > 0.7 ? 'large' : 'small',
}));

// How many pixels each arrow key press scrolls
const SCROLL_STEP = 120;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landingRef = useRef<HTMLDivElement>(null);

  // ── Arrow-key scroll (landing page only) ─────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't hijack if focus is inside an input/textarea/button
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(tag)) return;

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const dir = e.key === 'ArrowDown' ? 1 : -1;
        window.scrollBy({ top: dir * SCROLL_STEP, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── ASCII rain canvas ─────────────────────────────────────────────────────
  useEffect(() => {
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

    const CHARS = '死神ABCDEFGHIJKLMNOPQRSTUVWXYZアイウエオカキクケコ0123456789@#$%^&*()';
    const fontSize = 14;
    let cols = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(cols).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px Courier New`;

      for (let i = 0; i < drops.length; i++) {
        const char = CHARS[Math.floor(Math.random() * CHARS.length)];
        const brightness = Math.random();
        if (brightness > 0.95) ctx.fillStyle = '#ffffff';
        else if (brightness > 0.7) ctx.fillStyle = '#00ff41';
        else ctx.fillStyle = 'rgba(0, 180, 40, 0.4)';
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
      cols = Math.floor(canvas.width / fontSize);
      while (drops.length < cols) drops.push(1);
    };

    const interval = setInterval(draw, 50);
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleEnter = () => {
    navigate(isAuthenticated ? '/app/chat' : '/login');
  };

  return (
    <div className="landing" ref={landingRef}>
      <canvas ref={canvasRef} className="landing-canvas" />

      {/* Arrow key scroll hint */}
      <div className="scroll-hint" aria-hidden="true">
        <span className="scroll-hint-key">↑</span>
        <span className="scroll-hint-label">SCROLL</span>
        <span className="scroll-hint-key">↓</span>
      </div>

      {/* Floating particles */}
      <div className="landing-particles">
        {PARTICLES.map(p => (
          <div
            key={p.id}
            className={`particle ${p.size}`}
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="landing-content">
        {/* Hero */}
        <section className="landing-hero" aria-label="Hero">
          <div className="hero-skulls">
            <span className="skull skull-left">💀</span>
            <div className="hero-title-wrap">
              <h1 className="hero-title">死神-BIN</h1>
              <div className="hero-subtitle">SHINIGAMI TERMINAL</div>
            </div>
            <span className="skull skull-right">💀</span>
          </div>

          <p className="hero-tagline">
            A messaging platform for those who dwell between worlds.<br />
            <span className="tagline-dim">Real-time. Ritualistic. Relentless.</span>
          </p>

          <div className="hero-actions">
            <button className="btn-primary" onClick={handleEnter}>
              <span>⚡</span>
              {isAuthenticated ? 'ENTER THE REALM' : 'BEGIN YOUR BINDING'}
              <span>⚡</span>
            </button>
            {!isAuthenticated && (
              <button className="btn-secondary" onClick={() => navigate('/login')}>
                RETURN TO THE VOID
              </button>
            )}
          </div>

          <div className="hero-status">
            <span className="status-dot" />
            SPIRITS ONLINE
          </div>

          {/* Scroll down nudge */}
          <div className="scroll-down-nudge" aria-hidden="true">
            <span>▼ SCROLL TO EXPLORE ▼</span>
          </div>
        </section>

        {/* Features grid */}
        <section className="features-section" aria-label="Capabilities">
          <div className="section-label">// CAPABILITIES</div>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <div className="feature-title">{f.title}</div>
                <div className="feature-desc">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA strip */}
        <section className="landing-cta" aria-label="Call to action">
          <div className="cta-text">
            "In the realm between worlds, messages echo through eternity..."
          </div>
          <button className="btn-primary" onClick={handleEnter}>
            <span>💀</span>
            {isAuthenticated ? 'ENTER THE REALM' : 'BIND YOUR SOUL'}
            <span>💀</span>
          </button>
        </section>

        <footer className="landing-footer">
          <span>死神-BIN</span>
          <span className="footer-sep">///</span>
          <span>SUPERNATURAL MESSAGING TERMINAL</span>
          <span className="footer-sep">///</span>
          <span>ALL SOULS WELCOME</span>
        </footer>
      </div>
    </div>
  );
};

export default LandingPage;
