import React, { useEffect, useRef } from 'react';
import './ChatWindow.css';
import { Realm } from '../../types';
import type { MessageResponse } from '../../services/messages';

interface ChatWindowProps {
  messages: MessageResponse[];
  activeRealm: Realm | null;
  loading?: boolean;
  error?: string | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, activeRealm, loading = false, error = null }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
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
        </div>
        {activeRealm && (
          <div className="realm-description">{activeRealm.description}</div>
        )}
      </div>

      <div className="messages-container">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span>
            <span className="error-text">{error}</span>
          </div>
        )}

        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner">
              ◆ ◇ ◆ ◇ ◆
            </div>
            <p>Loading messages from the {activeRealm?.name} realm...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-state">
            <div className="ascii-art">
              ╔═══════════════════════════╗<br/>
              ║   SHINIGAMI TERMINAL v1.0 ║<br/>
              ╚═══════════════════════════╝
            </div>
            <p>No messages yet. Start the conversation...</p>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`message message-${getMessageType(message.sender)}`}
            >
              <div className="message-header">
                <span className="message-author">{message.sender}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="message-content">{message.text}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
