import React, { useState, KeyboardEvent } from 'react';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
  isConnected?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  onSendMessage, 
  disabled = false,
  isConnected = false
}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled && isConnected) {
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
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled || !isConnected}
        />
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
    </div>
  );
};

export default MessageInput;