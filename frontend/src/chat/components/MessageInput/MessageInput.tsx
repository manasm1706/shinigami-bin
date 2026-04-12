import React, { useState, useRef, KeyboardEvent } from 'react';
import './MessageInput.css';
import { AsciiGifCreator } from '../../../ascii';
import type { AsciiGif } from '../../../services/asciiGifs';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  onSendAsciiGif?: (gif: AsciiGif) => void;
  disabled?: boolean;
  isConnected?: boolean;
  conversationId?: string;
  onTypingStart?: (conversationId: string) => void;
  onTypingStop?: (conversationId: string) => void;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  onSendAsciiGif,
  disabled = false,
  isConnected = false,
  conversationId,
  onTypingStart,
  onTypingStop,
}) => {
  const [message, setMessage] = useState('');
  const [showGifCreator, setShowGifCreator] = useState(false);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTyping = useRef(false);

  const stopTyping = () => {
    if (isTyping.current && conversationId && onTypingStop) {
      onTypingStop(conversationId);
      isTyping.current = false;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessage(e.target.value);
    if (!conversationId) return;
    if (!isTyping.current && onTypingStart) {
      onTypingStart(conversationId);
      isTyping.current = true;
    }
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(stopTyping, 2000);
  };

  const handleSend = () => {
    if (message.trim() && !disabled && isConnected) {
      stopTyping();
      if (typingTimer.current) clearTimeout(typingTimer.current);
      onSendMessage(message.trim());
      setMessage('');
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getPlaceholder = () => {
    if (!isConnected) return 'Connecting to the ethereal plane...';
    if (disabled) return 'Select a realm to chat...';
    return 'Type your message to the spirits...';
  };

  return (
    <div className="message-input-container">
      <div className="input-wrapper">
        <span className="input-prompt">{'>'}</span>
        <input
          type="text"
          className="message-input"
          placeholder={getPlaceholder()}
          value={message}
          onChange={handleChange}
          onKeyPress={handleKeyPress}
          disabled={disabled || !isConnected}
        />
        {onSendAsciiGif && (
          <button
            className="gif-button"
            onClick={() => setShowGifCreator(true)}
            disabled={disabled || !isConnected}
            title="Create ASCII GIF"
          >
            GIF
          </button>
        )}
        <button 
          className="send-button" 
          onClick={handleSend}
          disabled={disabled || !message.trim() || !isConnected}
        >
          {!isConnected ? 'OFFLINE' : 'SEND ▶'}
        </button>
      </div>
      {!isConnected && (
        <div className="connection-warning">
          ⚠ Connection lost to the spirit realm
        </div>
      )}
      {showGifCreator && (
        <div className="gif-creator-overlay" onClick={() => setShowGifCreator(false)}>
          <div className="gif-creator-modal" onClick={e => e.stopPropagation()}>
            <AsciiGifCreator
              onSave={gif => { onSendAsciiGif?.(gif); setShowGifCreator(false); }}
              onClose={() => setShowGifCreator(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageInput;