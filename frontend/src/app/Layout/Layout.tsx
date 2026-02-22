import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import './Layout.css';

const Layout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuth();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-left">
          <h1 className="app-title">死神-BIN</h1>
          <span className="subtitle">SHINIGAMI TERMINAL</span>
        </div>
        
        <div className="header-right">
          <div className="user-info">
            <span className="user-label">SOUL:</span>
            <span className="username">{username}</span>
          </div>
          <button className="logout-button" onClick={logout}>
            <span className="logout-icon">⚡</span>
            BANISH
          </button>
        </div>
      </header>

      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;