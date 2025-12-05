import React, { useEffect, useRef } from 'react';
import './ChatWindow.css';
import { Message, Realm } from '../../types';

interface ChatWindowProps {
  messages: Message[];
  activeRealm: Realm | null;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages, activeRealm }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
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
        {messages.length === 0 ? (
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
              className={`message message-${message.type || 'user'}`}
            >
              <div className="message-header">
                <span className="message-author">{message.author}</span>
                <span className="message-time">{formatTime(message.timestamp)}</span>
              </div>
              <div className="message-content">{message.content}</div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatWindow;
