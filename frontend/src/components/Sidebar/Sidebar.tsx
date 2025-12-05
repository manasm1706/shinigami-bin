import React from 'react';
import './Sidebar.css';
import { Realm } from '../../types';

interface SidebarProps {
  realms: Realm[];
  activeRealmId: string;
  onRealmSelect: (realmId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ realms, activeRealmId, onRealmSelect }) => {
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
          >
            <span className="realm-icon">◆</span>
            <span className="realm-name">{realm.name}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="status-line">
          <span className="crt-flicker">●</span> CONNECTED
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
