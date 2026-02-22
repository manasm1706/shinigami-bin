import React from 'react';
import './Sidebar.css';
import type { Realm } from '../../../types';

interface SidebarProps {
  realms: Realm[];
  activeRealmId: string;
  onRealmSelect: (realmId: string) => void;
  isConnected?: boolean;
  userCount?: number;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  realms, 
  activeRealmId, 
  onRealmSelect, 
  isConnected = false,
  userCount = 0
}) => {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1 className="app-title">死神-BIN</h1>
        <div className="subtitle">SHINIGAMI TERMINAL</div>
      </div>
      
      <nav className="realm-list">
        <div className="realm-list-header">
          <span className="crt-flicker">▼ REALMS</span>
        </div>
        {realms.map((realm) => (
          <button
            key={realm.id}
            className={`realm-item ${activeRealmId === realm.id ? 'active' : ''}`}
            onClick={() => onRealmSelect(realm.id)}
            disabled={!isConnected}
          >
            <span className="realm-icon">◆</span>
            <span className="realm-name">{realm.name}</span>
            {activeRealmId === realm.id && userCount > 0 && (
              <span className="user-count">({userCount})</span>
            )}
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className={`status-line ${isConnected ? 'connected' : 'disconnected'}`}>
          <span className="crt-flicker">●</span> 
          {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
        </div>
        {isConnected && (
          <div className="realm-info">
            <span className="crt-text">SOULS PRESENT: {userCount}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;