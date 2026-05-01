import React, { useState, useEffect, useCallback } from 'react';
import './CommunityBrowser.css';
import {
  getCommunities,
  createCommunity,
  joinCommunity,
  leaveCommunity,
  getCommunityChannels,
} from '../../../services/communities';
import type { Community, CommunityChannel } from '../../../types';

interface CommunityBrowserProps {
  onChannelSelect: (channel: CommunityChannel, community: Community) => void;
  activeChannelId: string | null;
}

const CommunityBrowser: React.FC<CommunityBrowserProps> = ({ onChannelSelect, activeChannelId }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [activeCommunity, setActiveCommunity] = useState<Community | null>(null);
  const [channels, setChannels] = useState<CommunityChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('◆');
  const [creating, setCreating] = useState(false);

  const loadCommunities = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { communities: list } = await getCommunities();
      setCommunities(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load communities');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadCommunities(); }, [loadCommunities]);

  const handleSelectCommunity = async (c: Community) => {
    setActiveCommunity(c);
    setChannelsLoading(true);
    try {
      const { channels: list } = await getCommunityChannels(c.id);
      setChannels(list);
    } catch {
      setChannels([]);
    } finally {
      setChannelsLoading(false);
    }
  };

  const handleJoin = async (c: Community) => {
    try {
      await joinCommunity(c.id);
      await loadCommunities();
      handleSelectCommunity({ ...c, isMember: true, role: 'member' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to join');
    }
  };

  const handleLeave = async (c: Community) => {
    try {
      await leaveCommunity(c.id);
      await loadCommunities();
      if (activeCommunity?.id === c.id) {
        setActiveCommunity(null);
        setChannels([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to leave');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const { community } = await createCommunity({
        name: newName.trim(),
        description: newDesc.trim(),
        icon: newIcon.trim() || '◆',
      });
      setCommunities(prev => [community, ...prev]);
      setShowCreate(false);
      setNewName(''); setNewDesc(''); setNewIcon('◆');
      handleSelectCommunity(community);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="community-browser">
      {/* Left: community list */}
      <div className="cb-list-col">
        <div className="cb-list-header">
          <span className="cb-section-label">◆ BEYOND — COMMUNITIES</span>
          <button className="cb-create-btn" onClick={() => setShowCreate(s => !s)} title="Create community">
            {showCreate ? '✕' : '+'}
          </button>
        </div>

        {showCreate && (
          <form className="cb-create-form" onSubmit={handleCreate}>
            <div className="cb-form-row">
              <input
                className="cb-input"
                placeholder="Community name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                autoFocus
              />
            </div>
            <div className="cb-form-row">
              <input
                className="cb-input"
                placeholder="Description (optional)"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
              />
            </div>
            <div className="cb-form-row cb-form-row-icon">
              <input
                className="cb-input cb-icon-input"
                placeholder="Icon"
                value={newIcon}
                onChange={e => setNewIcon(e.target.value)}
                maxLength={2}
              />
              <button type="submit" className="cb-btn cb-btn-primary" disabled={creating}>
                {creating ? 'CREATING...' : 'CREATE'}
              </button>
            </div>
          </form>
        )}

        {error && <div className="cb-error">⚠ {error}</div>}

        {loading ? (
          <div className="cb-loading">◆ ◇ ◆ Loading communities...</div>
        ) : communities.length === 0 ? (
          <div className="cb-empty">No communities yet. Create one!</div>
        ) : (
          <div className="cb-community-list">
            {communities.map(c => (
              <button
                key={c.id}
                className={`cb-community-item ${activeCommunity?.id === c.id ? 'active' : ''}`}
                onClick={() => handleSelectCommunity(c)}
              >
                <span className="cb-community-icon">{c.icon}</span>
                <div className="cb-community-info">
                  <span className="cb-community-name">{c.name}</span>
                  <span className="cb-community-meta">{c.memberCount} members · {c.channelCount} channels</span>
                </div>
                {c.isMember && <span className="cb-member-badge">●</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: community detail + channels */}
      <div className="cb-detail-col">
        {!activeCommunity ? (
          <div className="cb-detail-empty">
            <div className="cb-detail-placeholder">
              ╔══════════════════╗<br />
              ║  SELECT A        ║<br />
              ║  COMMUNITY       ║<br />
              ╚══════════════════╝
            </div>
            <p>Choose a community to view its channels</p>
          </div>
        ) : (
          <>
            <div className="cb-detail-header">
              <span className="cb-detail-icon">{activeCommunity.icon}</span>
              <div className="cb-detail-title-group">
                <span className="cb-detail-name">{activeCommunity.name}</span>
                <span className="cb-detail-desc">{activeCommunity.description}</span>
              </div>
              <div className="cb-detail-actions">
                {activeCommunity.isMember ? (
                  activeCommunity.role !== 'owner' && (
                    <button className="cb-btn cb-btn-leave" onClick={() => handleLeave(activeCommunity)}>
                      LEAVE
                    </button>
                  )
                ) : (
                  <button className="cb-btn cb-btn-primary" onClick={() => handleJoin(activeCommunity)}>
                    JOIN
                  </button>
                )}
              </div>
            </div>

            <div className="cb-channels-label">CHANNELS</div>
            {channelsLoading ? (
              <div className="cb-loading">Loading channels...</div>
            ) : channels.length === 0 ? (
              <div className="cb-empty">No channels yet.</div>
            ) : (
              <div className="cb-channel-list">
                {channels.map(ch => (
                  <button
                    key={ch.id}
                    className={`cb-channel-item ${activeChannelId === ch.conversationId ? 'active' : ''}`}
                    onClick={() => ch.conversationId && onChannelSelect(ch, activeCommunity)}
                    disabled={!activeCommunity.isMember || !ch.conversationId}
                  >
                    <span className="cb-channel-hash">#</span>
                    <span className="cb-channel-name">{ch.name}</span>
                    {ch.description && <span className="cb-channel-desc">{ch.description}</span>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommunityBrowser;
