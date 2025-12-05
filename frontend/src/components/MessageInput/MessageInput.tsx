import React, { useState, KeyboardEvent } from 'react';
import './MessageInput.css';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    if (message.trim() && !disabled && !sending) {
      setSending(true);
      try {
        await onSendMessage(message.trim());
        setMessage('');
      } catch (error) {
        console.error('Failed to send message:', error);
      } finally {
        setSending(false);
      }
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
          disabled={disabled || sending}
        />
        <button 
          className="send-button" 
          onClick={handleSend}
          disabled={disabled || !message.trim() || sending}
        >
          {sending ? 'SENDING...' : 'SEND ▶'}
        </button>
      </div>
    </div>
  );
};

export default MessageInput;
