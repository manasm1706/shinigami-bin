import { useState } from 'react';
import './App.css';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import MessageInput from './components/MessageInput/MessageInput';
import { Realm, Message } from './types';

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

function App() {
  const [realms] = useState<Realm[]>(initialRealms);
  const [activeRealmId, setActiveRealmId] = useState<string>('living');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      realmId: 'living',
      author: 'SYSTEM',
      content: 'Welcome to the Living realm. Your journey begins here...',
      timestamp: new Date(),
      type: 'system'
    }
  ]);

  const activeRealm = realms.find(r => r.id === activeRealmId) || null;
  const realmMessages = messages.filter(m => m.realmId === activeRealmId);

  const handleRealmSelect = (realmId: string) => {
    setActiveRealmId(realmId);
  };

  const handleSendMessage = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      realmId: activeRealmId,
      author: 'User',
      content,
      timestamp: new Date(),
      type: 'user'
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="app">
      <Sidebar 
        realms={realms}
        activeRealmId={activeRealmId}
        onRealmSelect={handleRealmSelect}
      />
      <main className="main-content">
        <ChatWindow 
          messages={realmMessages}
          activeRealm={activeRealm}
        />
        <MessageInput 
          onSendMessage={handleSendMessage}
          disabled={!activeRealmId}
        />
      </main>
    </div>
  );
}

export default App;
