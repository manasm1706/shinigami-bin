import React, { useEffect, useRef, useState, useCallback } from 'react';
import './ChatWindow.css';
import TypingIndicator from '../TypingIndicator/TypingIndicator';
import { AsciiGifPlayer } from '../../../ascii';
import type { RealmConfig } from '../../../types';
import type { ChatMessage } from '../../useChat';

const REACTION_EMOJIS = ['👍','👎','❤️','😂','😮','😢','🔥','💀','👻','⚡'];

interface ChatWindowProps {
  messages: ChatMessage[];
  activeRealm: RealmConfig | null;
  loading?: boolean;
  error?: string | null;
  isConnected?: boolean;
  typingUsers?: string[];
  currentUsername?: string;
  hasMore?: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  onReact?: (messageId: string, emoji: string) => void;
  searchQuery?: string;
  onSearchChange?: (q: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  activeRealm,
  loading = false,
  error = null,
  isConnected = false,
  typingUsers = [],
  currentUsername,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  onReact,
  searchQuery = '',
  onSearchChange,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null); // messageId
  const prevScrollHeight = useRef(0);

  // Scroll to bottom on new messages (only if already near bottom)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // After loading more, preserve scroll position
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !loadingMore) return;
    prevScrollHeight.current = container.scrollHeight;
  }, [loadingMore]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || loadingMore) return;
    if (prevScrollHeight.current > 0) {
      container.scrollTop = container.scrollHeight - prevScrollHeight.current;
      prevScrollHeight.current = 0;
    }
  }, [messages, loadingMore]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || !hasMore || loadingMore || !onLoadMore) return;
    if (container.scrollTop < 80) {
      onLoadMore();
    }
  }, [hasMore, loadingMore, onLoadMore]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getMessageType = (sender: string): 'user' | 'system' | 'fortune' => {
    if (sender === 'SYSTEM') return 'system';
    if (sender === 'FORTUNE') return 'fortune';
    return 'user';
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="realm-info">
          <span className="realm-indicator">◆</span>
          <span className="realm-title">{activeRealm?.name || 'Select a Realm'}</span>
          <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="status-dot">●</span>
            {isConnected ? 'LIVE' : 'OFFLINE'}
          </div>
        </div>
        <div className="chat-header-bottom">
          {activeRealm && (
            <div className="realm-description">{activeRealm.description}</div>
          )}
          {onSearchChange && (
            <div className="search-bar">
              <span className="search-icon">⌕</span>
              <input
                className="search-input"
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={e => onSearchChange(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear" onClick={() => onSearchChange('')}>✕</button>
              )}
            </div>
          )}
        </div>
      </div>

      <div
        className="messages-container"
        ref={containerRef}
        onScroll={handleScroll}
      >
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {loadingMore && (
          <div className="load-more-indicator">◆ Loading older messages... ◆</div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">◆ ◇ ◆ ◇ ◆</div>
            <p>Loading messages from the {activeRealm?.name} realm...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="ascii-art">
              ╔═══════════════════════════╗<br />
              ║   SHINIGAMI TERMINAL v1.0 ║<br />
              ║      REAL-TIME CHAT       ║<br />
              ╚═══════════════════════════╝
            </div>
            <p>{searchQuery ? 'No messages match your search.' : 'No messages yet. Start the conversation...'}</p>
            {!isConnected && !searchQuery && (
              <p className="connection-warning">⚠ Waiting for connection to the ethereal plane...</p>
            )}
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`message message-${getMessageType(message.sender)}`}
              onMouseEnter={() => setHoveredMessageId(message.id)}
              onMouseLeave={() => { setHoveredMessageId(null); setShowEmojiPicker(null); }}
            >
              <div className="message-header">
                <span className="message-author">{message.sender}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
                {onReact && hoveredMessageId === message.id && (
                  <button
                    className="react-btn"
                    onClick={() => setShowEmojiPicker(p => p === message.id ? null : message.id)}
                    title="Add reaction"
                  >
                    ☺
                  </button>
                )}
              </div>

              <div className="message-content">
                {message.type === 'ascii_gif' && message.asciiGif ? (
                  <AsciiGifPlayer
                    frames={message.asciiGif.frames}
                    frameDelay={message.asciiGif.frameDelay}
                    title={message.asciiGif.title}
                    compact
                    loop
                  />
                ) : (
                  message.text
                )}
              </div>

              {/* Reactions */}
              {message.reactions && message.reactions.length > 0 && (
                <div className="message-reactions">
                  {message.reactions.map(r => (
                    <button
                      key={r.emoji}
                      className="reaction-chip"
                      onClick={() => onReact?.(message.id, r.emoji)}
                      title={`${r.count} reaction${r.count !== 1 ? 's' : ''}`}
                    >
                      {r.emoji} <span className="reaction-count">{r.count}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Emoji picker */}
              {showEmojiPicker === message.id && onReact && (
                <div className="emoji-picker">
                  {REACTION_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      className="emoji-option"
                      onClick={() => { onReact(message.id, emoji); setShowEmojiPicker(null); }}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              {currentUsername && message.sender === currentUsername && message.status && (
                <div className="message-status">
                  <span className={`status-icon ${message.status}`} title={message.status}>
                    {message.status === 'delivered' ? '●' : '○'}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      <TypingIndicator typingUsers={typingUsers} />
    </div>
  );
};

export default ChatWindow;
