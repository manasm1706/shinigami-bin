import React, { useEffect, useState, useCallback, useRef } from 'react';
import './ChatPage.css';
import Sidebar from './components/Sidebar/Sidebar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import MessageInput from './components/MessageInput/MessageInput';
import { useChat } from './useChat';
import { useConversations } from './useConversations';
import { useAuth } from '../auth/useAuth';
import { useRealmEffects } from '../effects/useRealmEffects';
import { useRituals } from '../rituals/useRituals';
import { useSoundEffects } from '../hooks/useSoundEffects';
import FortuneCard from '../rituals/FortuneCard/FortuneCard';
import WheelOfFate from '../rituals/WheelOfFate/WheelOfFate';
import WeatherOmenCard from '../rituals/WeatherOmenCard/WeatherOmenCard';
import TarotCard from '../rituals/TarotCard/TarotCard';
import CrystalBall from '../rituals/CrystalBall/CrystalBall';
import RuneCasting from '../rituals/RuneCasting/RuneCasting';
import { apiFetch } from '../services/api';
import { getConversationMessages } from '../services/conversations';
import type { RealmConfig, Conversation } from '../types';
import type { ChatMessage } from './useChat';
import type { AsciiGif } from '../services/asciiGifs';

type RitualPanel = 'fortune' | 'wheel' | 'weather' | 'tarot' | 'crystal' | 'runes' | null;

const FALLBACK_REALMS: RealmConfig[] = [
  { id: 'living', name: 'Living', description: 'Default chat realm', type: 'social', effectsLevel: 'low', allowRituals: false },
  { id: 'beyond', name: 'Beyond', description: 'Ritual playground', type: 'experimental', effectsLevel: 'high', allowRituals: true },
  { id: 'unknown', name: 'Unknown', description: 'System space', type: 'system', effectsLevel: 'medium', allowRituals: false },
];

const ChatPage: React.FC = () => {
  const { username, user } = useAuth();
  const { play: playSound } = useSoundEffects(true);

  const [realms, setRealms] = useState<RealmConfig[]>([]);
  const [activeRealmId, setActiveRealmId] = useState<string>('living');
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [convMessages, setConvMessages] = useState<ChatMessage[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convHasMore, setConvHasMore] = useState(false);
  const [convLoadingMore, setConvLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRitualPanel, setActiveRitualPanel] = useState<RitualPanel>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessageCount = useRef(0);

  const activeRealm = realms.find(r => r.id === activeRealmId) ?? null;

  useRealmEffects(activeRealm?.effectsLevel ?? 'low');
  useRituals(activeRealm?.allowRituals ?? false);

  const {
    messages: realmMessages,
    users,
    isConnected,
    typingUsers,
    unreadCounts: socketUnread,
    joinRealm,
    joinConversation,
    sendMessage: sendSocketMessage,
    sendAsciiGif,
    toggleReaction,
    sendTypingStart,
    sendTypingStop,
    clearMessages,
  } = useChat();

  const { conversations, fetchConversations, createGroup } = useConversations();

  // Merge socket unread counts into local unread state
  useEffect(() => {
    setUnreadCounts(prev => ({ ...prev, ...socketUnread }));
  }, [JSON.stringify(socketUnread)]);

  // Sound on new realm messages
  useEffect(() => {
    if (realmMessages.length > prevMessageCount.current && prevMessageCount.current > 0) {
      const newest = realmMessages[realmMessages.length - 1];
      if (newest.sender !== username) playSound('message');
    }
    prevMessageCount.current = realmMessages.length;
  }, [realmMessages, username, playSound]);

  useEffect(() => {
    apiFetch<RealmConfig[] | { realms: RealmConfig[] }>('/realms')
      .then(data => {
        const list = Array.isArray(data) ? data : (data as { realms: RealmConfig[] }).realms ?? [];
        setRealms(list.length > 0 ? list : FALLBACK_REALMS);
        if (list.length > 0) setActiveRealmId(list[0].id);
      })
      .catch(() => setRealms(FALLBACK_REALMS));
  }, []);

  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  useEffect(() => {
    if (!activeRealmId || !username || activeConversation) return;
    clearMessages();
    joinRealm(activeRealmId, username);
  }, [activeRealmId, username, activeConversation]);

  const loadConversationMessages = useCallback(async (
    convId: string,
    before?: string,
    q?: string
  ) => {
    const { messages, hasMore } = await getConversationMessages(convId, 50, before, q);
    return {
      messages: messages.map(m => ({
        id: m.id,
        sender: m.sender,
        text: m.content,
        realm: convId,
        timestamp: m.createdAt,
        status: 'delivered' as const,
        type: m.type as 'text' | 'ascii_gif' | undefined,
        asciiGif: m.asciiGif ?? undefined,
        reactions: m.reactions,
      })),
      hasMore,
    };
  }, []);

  useEffect(() => {
    if (!activeConversation) return;
    setConvLoading(true);
    setConvMessages([]);
    setConvHasMore(false);
    setSearchQuery('');
    joinConversation(activeConversation.id);
    loadConversationMessages(activeConversation.id)
      .then(({ messages, hasMore }) => {
        setConvMessages(messages);
        setConvHasMore(hasMore);
        // Clear unread for this conversation
        setUnreadCounts(prev => ({ ...prev, [activeConversation.id]: 0 }));
      })
      .catch(() => setConvMessages([]))
      .finally(() => setConvLoading(false));
  }, [activeConversation?.id]);

  // Debounced search
  useEffect(() => {
    if (!activeConversation) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      setConvLoading(true);
      try {
        const { messages, hasMore } = await loadConversationMessages(activeConversation.id, undefined, searchQuery || undefined);
        setConvMessages(messages);
        setConvHasMore(hasMore);
      } finally {
        setConvLoading(false);
      }
    }, 350);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [searchQuery, activeConversation?.id]);

  const handleLoadMore = useCallback(async () => {
    if (!activeConversation || convLoadingMore || !convHasMore || convMessages.length === 0) return;
    setConvLoadingMore(true);
    try {
      const oldest = convMessages[0];
      const { messages, hasMore } = await loadConversationMessages(activeConversation.id, oldest.id, searchQuery || undefined);
      setConvMessages(prev => [...messages, ...prev]);
      setConvHasMore(hasMore);
    } finally {
      setConvLoadingMore(false);
    }
  }, [activeConversation, convLoadingMore, convHasMore, convMessages, searchQuery, loadConversationMessages]);

  const handleRealmSelect = useCallback((realmId: string) => {
    setActiveConversation(null);
    setActiveRealmId(realmId);
  }, []);

  const handleConversationSelect = useCallback((conv: Conversation) => {
    setActiveConversation(conv);
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    if (activeConversation) {
      sendSocketMessage(text, activeConversation.id);
    } else {
      sendSocketMessage(text);
    }
    playSound('message');
  }, [activeConversation, sendSocketMessage, playSound]);

  const handleSendAsciiGif = useCallback((gif: AsciiGif) => {
    const gifPayload = { id: gif.id, frames: gif.frames, frameDelay: gif.frameDelay, title: gif.title };
    if (activeConversation) {
      sendAsciiGif(gif.id, gifPayload, activeConversation.id);
    } else {
      sendAsciiGif(gif.id, gifPayload);
    }
  }, [activeConversation, sendAsciiGif]);

  const handleReact = useCallback((messageId: string, emoji: string) => {
    toggleReaction(messageId, emoji);
    // Optimistic update for conv messages
    setConvMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = [...(m.reactions ?? [])];
      const idx = reactions.findIndex(r => r.emoji === emoji);
      if (idx >= 0) {
        const updated = { ...reactions[idx], count: reactions[idx].count + 1 };
        reactions[idx] = updated;
      } else {
        reactions.push({ emoji, count: 1 });
      }
      return { ...m, reactions };
    }));
  }, [toggleReaction]);

  const handleShareRitualResult = useCallback((text: string) => {
    handleSendMessage(text);
    setActiveRitualPanel(null);
  }, []);

  const handleRitualToggle = useCallback((panel: RitualPanel) => {
    setActiveRitualPanel(prev => prev === panel ? null : panel);
    if (panel) playSound('ritual');
  }, [playSound]);

  const handleCreateGroup = useCallback(async (name: string, memberIds: string[]) => {
    const conv = await createGroup(name, memberIds);
    if (conv) setActiveConversation(conv);
  }, [createGroup]);

  const displayMessages = activeConversation ? convMessages : realmMessages;
  const displayLoading = activeConversation ? convLoading : false;

  const conversationHeader: RealmConfig | null = activeConversation
    ? {
        id: activeConversation.id,
        name: activeConversation.name ?? (activeConversation.type === 'dm' ? 'Direct Message' : 'Group'),
        description: activeConversation.members.map(m => m.username).join(', '),
        type: 'social',
        effectsLevel: 'low',
        allowRituals: false,
      }
    : activeRealm;

  return (
    <div className="chat-page">
      <Sidebar
        realms={realms}
        activeRealmId={activeRealmId}
        onRealmSelect={handleRealmSelect}
        conversations={conversations}
        activeConversationId={activeConversation?.id ?? null}
        onConversationSelect={handleConversationSelect}
        onCreateGroup={handleCreateGroup}
        isConnected={isConnected}
        userCount={users.length}
        activeRitualPanel={activeRitualPanel}
        onRitualToggle={handleRitualToggle}
        unreadCounts={unreadCounts}
      />

      <div className="chat-main">
        <ChatWindow
          messages={displayMessages}
          activeRealm={conversationHeader}
          loading={displayLoading}
          isConnected={isConnected}
          typingUsers={typingUsers}
          currentUsername={username ?? undefined}
          hasMore={activeConversation ? convHasMore : false}
          onLoadMore={activeConversation ? handleLoadMore : undefined}
          loadingMore={convLoadingMore}
          onReact={handleReact}
          searchQuery={activeConversation ? searchQuery : undefined}
          onSearchChange={activeConversation ? setSearchQuery : undefined}
        />
        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!activeRealmId && !activeConversation}
          isConnected={isConnected}
          conversationId={activeConversation?.id ?? `realm_${activeRealmId}`}
          onSendAsciiGif={handleSendAsciiGif}
          onTypingStart={sendTypingStart}
          onTypingStop={sendTypingStop}
        />
      </div>

      {activeRitualPanel && (
        <div className="ritual-panel">
          <button
            className="ritual-panel-close"
            onClick={() => setActiveRitualPanel(null)}
            aria-label="Close ritual panel"
          >
            ✕
          </button>
          {activeRitualPanel === 'fortune' && <FortuneCard username={username ?? 'You'} onShare={handleShareRitualResult} />}
          {activeRitualPanel === 'wheel' && <WheelOfFate />}
          {activeRitualPanel === 'weather' && <WeatherOmenCard />}
          {activeRitualPanel === 'tarot' && <TarotCard onShare={handleShareRitualResult} />}
          {activeRitualPanel === 'crystal' && <CrystalBall onShare={handleShareRitualResult} />}
          {activeRitualPanel === 'runes' && <RuneCasting onShare={handleShareRitualResult} />}
        </div>
      )}
    </div>
  );
};

export default ChatPage;



