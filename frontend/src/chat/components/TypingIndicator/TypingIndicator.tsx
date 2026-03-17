import React from 'react';
import './TypingIndicator.css';

interface TypingIndicatorProps {
  typingUsers: string[];
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ typingUsers }) => {
  if (typingUsers.length === 0) return null;

  const label = typingUsers.length === 1
    ? `${typingUsers[0]} is communing with the spirits...`
    : `${typingUsers.slice(0, 2).join(', ')} are communing...`;

  return (
    <div className="typing-indicator">
      <span className="typing-dots">
        <span />
        <span />
        <span />
      </span>
      <span className="typing-text">{label}</span>
    </div>
  );
};

export default TypingIndicator;
