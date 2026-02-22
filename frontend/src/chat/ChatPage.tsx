import React, { useState, useEffect } from 'react';
import { Sidebar, ChatWindow, MessageInput } from './';
import { useAuth } from '../auth/useAuth';
import { getMessages, sendMessage } from '../services/messages';
import type { MessageResponse } from '../services/messages';
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
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const activeRealm = realms.find(r => r.id === activeRealmId) || null;

  // Fetch messages when realm changes
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      setError(null);
      try {
        const fetchedMessages = await getMessages(activeRealmId);
        setMessages(fetchedMessages);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load messages');
        console.error('Failed to fetch messages:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [activeRealmId]);

  const handleRealmSelect = (realmId: string) => {
    setActiveRealmId(realmId);
  };

  const handleSendMessage = async (content: string) => {
    setError(null);
    try {
      const newMessage = await sendMessage({
        sender: username || 'Anonymous',
        text: content,
        realm: activeRealmId
      });
      setMessages([...messages, newMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      console.error('Failed to send message:', err);
    }
  };

  return (
    <div className="chat-page">
      <Sidebar 
        realms={realms}
        activeRealmId={activeRealmId}
        onRealmSelect={handleRealmSelect}
      />
      <div className="chat-main">
        <ChatWindow 
          messages={messages}
          activeRealm={activeRealm}
          loading={loading}
          error={error}
        />
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={!activeRealmId || loading}
        />
      </div>
    </div>
  );
};

export default ChatPage;