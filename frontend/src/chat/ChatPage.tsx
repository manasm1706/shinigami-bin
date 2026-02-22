import React, { useState, useEffect } from 'react';
import { Sidebar, ChatWindow, MessageInput } from './';
import { useAuth } from '../auth/useAuth';
import { useChat } from './useChat';
import type { Realm } from '../types';
import './ChatPage.css';

// Initial realms data
const initialRealms: Realm[] = [
  {
    id: 'living',
    name: 'Living',
    description: 'The realm of mortals and everyday existence'
  },
  {
    id: 'beyond',
    name: 'Beyond',
    description: 'Where spirits dwell and fortunes are told'
  },
  {
    id: 'unknown',
    name: 'Unknown',
    description: 'The mysterious void between worlds'
  }
];

const ChatPage: React.FC = () => {
  const { username } = useAuth();
  const [realms] = useState<Realm[]>(initialRealms);
  const [activeRealmId, setActiveRealmId] = useState<string>('living');

  const { 
    messages, 
    users, 
    isConnected, 
    joinRealm, 
    sendMessage 
  } = useChat();

  const activeRealm = realms.find(r => r.id === activeRealmId) || null;

  // Join realm when component mounts or realm changes
  useEffect(() => {
    if (username && activeRealmId) {
      joinRealm(activeRealmId, username);
    }
  }, [activeRealmId, username, joinRealm]);

  const handleRealmSelect = (realmId: string) => {
    setActiveRealmId(realmId);
  };

  const handleSendMessage = (content: string) => {
    sendMessage(content);
  };

  return (
    <div className="chat-page">
      <Sidebar 
        realms={realms}
        activeRealmId={activeRealmId}
        onRealmSelect={handleRealmSelect}
        isConnected={isConnected}
        userCount={users.length}
      />
      <div className="chat-main">
        <ChatWindow 
          messages={messages}
          activeRealm={activeRealm}
          loading={false}
          error={!isConnected ? 'Disconnected from the ethereal plane' : null}
          isConnected={isConnected}
        />
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={!activeRealmId || !isConnected}
          isConnected={isConnected}
        />
      </div>
    </div>
  );
};

export default ChatPage;