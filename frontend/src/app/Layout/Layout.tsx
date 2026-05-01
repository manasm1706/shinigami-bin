import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../../auth/useAuth';
import { 
  EffectGhostOverlay, 
  CRTOverlay, 
  GlitchText, 
  EffectSettingsPanel,
  EKGOverlay,
  useEffectSettings 
} from '../../effects';
import './Layout.css';

const Layout: React.FC = () => {
  const { isAuthenticated, username, logout } = useAuth();
  const { settings } = useEffectSettings();

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="layout">
      <header className="layout-header">
        <div className="header-left">
          <GlitchText 
            enabled={settings.glitchText.enabled}
            intensity={settings.glitchText.intensity}
            trigger={settings.glitchText.trigger}
          >
            <h1 className="app-title">死神-BIN</h1>
          </GlitchText>
          <span className="subtitle">SHINIGAMI TERMINAL</span>
        </div>
        
        <div className="header-right">
          <EffectSettingsPanel className="header-effects-panel" />
          <div className="user-info">
            <span className="user-label">SOUL:</span>
            <GlitchText 
              enabled={settings.glitchText.enabled}
              intensity="low"
              trigger="hover"
            >
              <span className="username">{username}</span>
            </GlitchText>
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
      
      {/* EKG/ECG full-screen effect — always on, behind content */}
      <EKGOverlay enabled={true} />

      {/* Global visual effects */}
      <CRTOverlay 
        enabled={settings.crtOverlay.enabled}
        intensity={settings.crtOverlay.intensity}
      />
      
      {/* Global effect overlay - listens for effect events */}
      {settings.ghostEffects.enabled && <EffectGhostOverlay />}
    </div>
  );
};

export default Layout;