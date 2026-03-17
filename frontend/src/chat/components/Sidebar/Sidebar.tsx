import React, { useState } from 'react';
import './Sidebar.css';
import type { RealmConfig, Conversation } from '../../../types';

type RitualPanel = 'fortune' | 'wheel' | 'weather' | null;

interface SidebarProps {
  realms: RealmConfig[];
  activeRealmId: string;
  onRealmSelect: (realmId: string) => void;
  conversations: Conversation[];
  activeConversationId: string | null;
  onConversationSelect: (conv: Conversation) => void;
  onCreateGroup: (name: string, memberIds: string[]) => void;
  isConnected?: boolean;
  userCount?: number;
  activeRitualPanel: RitualPanel;
  onRitualToggle: (panel: RitualPanel) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  realms,
  activeRealmId,
  onRealmSelect,
  conversations,
  activeConversationId,
  onConversationSelect,
  onCreateGroup,
  isConnected = false,
  userCount = 0,
  activeRitualPanel,
  onRitualToggle,
}) => {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState('');

  const dms = conversations.filter(c => c.type === 'dm');
  const groups = conversations.filter(c => c.type === 'group');

  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    const memberIds = groupMembers.split(',').map(s => s.trim()).filter(Boolean);
    if (groupName.trim() && memberIds.length > 0) {
      onCreateGroup(groupName.trim(), memberIds);
      setGroupName('');
      setGroupMembers('');
      setShowGroupModal(false);
    }
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {/* Realms */}
        <div className="nav-section-header">
          <span className="crt-flicker">▼ REALMS</span>
        </div>
        {realms.map((realm) => (
          <button
            key={realm.id}
            className={`nav-item ${activeRealmId === realm.id && !activeConversationId ? 'active' : ''}`}
            onClick={() => onRealmSelect(realm.id)}
          >
            <span className="nav-icon">◆</span>
            <span className="nav-name">{realm.name}</span>
            {activeRealmId === realm.id && !activeConversationId && userCount > 0 && (
              <span className="user-count">({userCount})</span>
            )}
          </button>
        ))}

        {/* Groups */}
        <div className="nav-section-header">
          <span className="crt-flicker">▼ GROUPS</span>
          <button
            className="section-action"
            onClick={() => setShowGroupModal(true)}
            title="Create group"
          >+</button>
        </div>
        {groups.length === 0 && (
          <div className="nav-empty">No groups yet</div>
        )}
        {groups.map((conv) => (
          <button
            key={conv.id}
            className={`nav-item ${activeConversationId === conv.id ? 'active' : ''}`}
            onClick={() => onConversationSelect(conv)}
          >
            <span className="nav-icon">◈</span>
            <span className="nav-name">{conv.name ?? 'Unnamed'}</span>
          </button>
        ))}

        {/* DMs */}
        <div className="nav-section-header">
          <span className="crt-flicker">▼ DIRECT</span>
        </div>
        {dms.length === 0 && (
          <div className="nav-empty">No direct messages</div>
        )}
        {dms.map((conv) => (
          <button
            key={conv.id}
            className={`nav-item ${activeConversationId === conv.id ? 'active' : ''}`}
            onClick={() => onConversationSelect(conv)}
          >
            <span className="nav-icon">◇</span>
            <span className="nav-name">{conv.name ?? 'Unknown'}</span>
          </button>
        ))}

        {/* Rituals */}
        <div className="nav-section-header">
          <span className="crt-flicker">▼ RITUALS</span>
        </div>
        <button
          className={`nav-item ${activeRitualPanel === 'fortune' ? 'active' : ''}`}
          onClick={() => onRitualToggle('fortune')}
        >
          <span className="nav-icon">☠</span>
          <span className="nav-name">Daily Fortune</span>
        </button>
        <button
          className={`nav-item ${activeRitualPanel === 'wheel' ? 'active' : ''}`}
          onClick={() => onRitualToggle('wheel')}
        >
          <span className="nav-icon">🎰</span>
          <span className="nav-name">Wheel of Fate</span>
        </button>
        <button
          className={`nav-item ${activeRitualPanel === 'weather' ? 'active' : ''}`}
          onClick={() => onRitualToggle('weather')}
        >
          <span className="nav-icon">🌩</span>
          <span className="nav-name">Weather Omens</span>
        </button>
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
      {/* Create Group Modal */}
      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">CREATE GROUP CHANNEL</div>
            <form onSubmit={handleCreateGroup} className="modal-form">
              <label className="modal-label">CHANNEL NAME:</label>
              <input
                className="modal-input"
                value={groupName}
                onChange={e => setGroupName(e.target.value)}
                placeholder="e.g. shadow-council"
                required
                autoFocus
              />
              <label className="modal-label">MEMBER IDs (comma-separated):</label>
              <input
                className="modal-input"
                value={groupMembers}
                onChange={e => setGroupMembers(e.target.value)}
                placeholder="user-id-1, user-id-2"
                required
              />
              <div className="modal-actions">
                <button type="submit" className="modal-btn modal-btn-confirm">SUMMON</button>
                <button type="button" className="modal-btn modal-btn-cancel" onClick={() => setShowGroupModal(false)}>BANISH</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
