import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../useAuth';
import './Login.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const { isAuthenticated, login } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      login(username.trim());
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
          ENTER THE REALM OF SHADOWS
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label className="input-label">MORTAL IDENTITY:</label>
            <input
              type="text"
              className="username-input"
              placeholder="Enter your name..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <button type="submit" className="enter-button" disabled={!username.trim()}>
            <span className="button-icon">⚡</span>
            ENTER THE SHINIGAMI REALM
            <span className="button-icon">⚡</span>
          </button>
        </form>

        <div className="login-footer">
          <div className="warning-text">
            ⚠ WARNING: The spirits are watching ⚠
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;