import React, { useState, KeyboardEvent } from 'react';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
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

  return (
    <div className="message-input-container">
      <div className="input-wrapper">
        <span className="input-prompt">{'>'}</span>
        <input
          type="text"
          className="message-input"
          placeholder={disabled ? 'Select a realm to chat...' : 'Type your message...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={disabled}
        />
        <button 
          className="send-button" 
          onClick={handleSend}
          disabled={disabled || !message.trim()}
        >
          SEND ▶
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
