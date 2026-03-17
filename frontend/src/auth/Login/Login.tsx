import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import './Login.css';

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';

const Login: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (isAuthenticated) return <Navigate to="/app/chat" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const body = mode === 'register'
        ? { username, email, password }
        : { email, password };

      const res = await fetch(`${API}/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'The ritual has failed');
        return;
      }

      login(data.token, data.user);
    } catch {
      setError('The ethereal connection has been severed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <span className="login-icon">💀</span>
          <h1 className="login-title">死神-BIN</h1>
          <span className="login-icon">💀</span>
        </div>

        <div className="login-subtitle">
          {mode === 'login' ? 'ENTER THE REALM OF SHADOWS' : 'BIND YOUR SOUL TO THE REGISTRY'}
        </div>

        <div className="login-mode-toggle">
          <button
            className={`mode-btn ${mode === 'login' ? 'active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
            type="button"
          >
            RETURN
          </button>
          <button
            className={`mode-btn ${mode === 'register' ? 'active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
            type="button"
          >
            BIND SOUL
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {mode === 'register' && (
            <div className="input-group">
              <label className="input-label">MORTAL IDENTITY:</label>
              <input
                type="text"
                className="username-input"
                placeholder="Choose your name..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoFocus={mode === 'register'}
              />
            </div>
          )}

          <div className="input-group">
            <label className="input-label">ETHEREAL ADDRESS:</label>
            <input
              type="email"
              className="username-input"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div className="input-group">
            <label className="input-label">BLOOD OATH (PASSWORD):</label>
            <input
              type="password"
              className="username-input"
              placeholder="At least 6 characters..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="enter-button" disabled={loading}>
            <span className="button-icon">⚡</span>
            {loading ? 'CONSULTING THE SPIRITS...' : mode === 'login' ? 'ENTER THE SHINIGAMI REALM' : 'COMPLETE THE BINDING'}
            <span className="button-icon">⚡</span>
          </button>
        </form>

        <div className="login-footer">
          <div className="warning-text">⚠ WARNING: The spirits are watching ⚠</div>
          <button className="back-home-btn" onClick={() => navigate('/')} type="button">
            ← RETURN TO THE VOID
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
