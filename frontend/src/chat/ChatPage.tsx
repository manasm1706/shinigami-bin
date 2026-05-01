import React, { useEffect, useState, useCallback, useRef } from "react";
import "./ChatPage.css";
import Sidebar from "./components/Sidebar/Sidebar";
import ChatWindow from "./components/ChatWindow/ChatWindow";
import MessageInput from "./components/MessageInput/MessageInput";
import CommunityBrowser from "./components/CommunityBrowser/CommunityBrowser";
import { useChat } from "./useChat";
import { useConversations } from "./useConversations";
import { useAuth } from "../auth/useAuth";
import { useRealmEffects } from "../effects/useRealmEffects";
import { useRituals } from "../rituals/useRituals";
import { useSoundEffects } from "../hooks/useSoundEffects";
import FortuneCard from "../rituals/FortuneCard/FortuneCard";
import WheelOfFate from "../rituals/WheelOfFate/WheelOfFate";
import WeatherOmenCard from "../rituals/WeatherOmenCard/WeatherOmenCard";
import TarotCard from "../rituals/TarotCard/TarotCard";
import CrystalBall from "../rituals/CrystalBall/CrystalBall";
import RuneCasting from "../rituals/RuneCasting/RuneCasting";
import { apiFetch } from "../services/api";
import { getConversationMessages } from "../services/conversations";
import type { RealmConfig, Conversation, CommunityChannel, Community } from "../types";
import type { ChatMessage } from "./useChat";
import type { AsciiGif } from "../services/asciiGifs";
import Toast, { useToast } from "../components/Toast/Toast";

type RitualPanel = "fortune" | "wheel" | "weather" | "tarot" | "crystal" | "runes" | null;

const FALLBACK_REALMS: RealmConfig[] = [
  { id: "living", name: "Living", description: "The realm of mortals and everyday existence", type: "social", effectsLevel: "low", allowRituals: false },
  { id: "beyond", name: "Beyond", description: "Where spirits dwell and communities form", type: "experimental", effectsLevel: "high", allowRituals: true },
  { id: "unknown", name: "Unknown", description: "The mysterious void between worlds", type: "system", effectsLevel: "medium", allowRituals: false },
];

const ChatPage: React.FC = () => {
  const { username, user } = useAuth();
  const { play: playSound } = useSoundEffects(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { toasts, addToast, dismiss: dismissToast } = useToast();
  const [realms, setRealms] = useState<RealmConfig[]>([]);
  const [activeRealmId, setActiveRealmId] = useState<string>("living");
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  const [convMessages, setConvMessages] = useState<ChatMessage[]>([]);
  const [convLoading, setConvLoading] = useState(false);
  const [convHasMore, setConvHasMore] = useState(false);
  const [convLoadingMore, setConvLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRitualPanel, setActiveRitualPanel] = useState<RitualPanel>(null);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevMessageCount = useRef(0);

  const activeRealm = realms.find(r => r.id === activeRealmId) ?? null;

  useRealmEffects(activeRealm?.effectsLevel ?? "low");
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

  // Show socket errors as toasts
  useEffect(() => {
    const handleError = (e: CustomEvent) => {
      addToast(e.detail?.message ?? "Connection error", "error");
    };
    window.addEventListener("shinigami:socket-error", handleError as EventListener);
    return () => window.removeEventListener("shinigami:socket-error", handleError as EventListener);
  }, [addToast]);

  // Merge socket unread counts
  useEffect(() => {
    setUnreadCounts(prev => ({ ...prev, ...socketUnread }));
  }, [JSON.stringify(socketUnread)]);

  // Sound on new realm messages
  useEffect(() => {
    if (realmMessages.length > prevMessageCount.current && prevMessageCount.current > 0) {
      const newest = realmMessages[realmMessages.length - 1];
      if (newest.sender !== username) playSound("message");
    }
    prevMessageCount.current = realmMessages.length;
  }, [realmMessages, username, playSound]);

  // Load realms
  useEffect(() => {
    apiFetch<RealmConfig[] | { realms: RealmConfig[] }>("/realms")
      .then(data => {
        const list = Array.isArray(data) ? data : (data as { realms: RealmConfig[] }).realms ?? [];
        setRealms(list.length > 0 ? list : FALLBACK_REALMS);
        if (list.length > 0) setActiveRealmId(list[0].id);
      })
      .catch(() => setRealms(FALLBACK_REALMS));
  }, []);

  // Load conversations
  useEffect(() => {
    if (user) fetchConversations();
  }, [user, fetchConversations]);

  // Join realm when switching (only when not in a conversation and not in Beyond community view)
  useEffect(() => {
    if (!activeRealmId || !username || activeConversation) return;
    if (activeRealmId === "beyond") return; // Beyond shows CommunityBrowser, not realm chat
    clearMessages();
    joinRealm(activeRealmId, username);
  }, [activeRealmId, username, activeConversation]);

  const loadConversationMessages = useCallback(async (convId: string, before?: string, q?: string) => {
    const { messages, hasMore } = await getConversationMessages(convId, 50, before, q);
    return {
      messages: messages.map(m => ({
        id: m.id,
        sender: m.sender,
        text: m.content,
        realm: convId,
        timestamp: m.createdAt,
        status: "delivered" as const,
        type: m.type as "text" | "ascii_gif" | undefined,
        asciiGif: m.asciiGif ?? undefined,
        reactions: m.reactions,
      })),
      hasMore,
    };
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (!activeConversation) return;
    setConvLoading(true);
    setConvMessages([]);
    setConvHasMore(false);
    setSearchQuery("");
    joinConversation(activeConversation.id);
    loadConversationMessages(activeConversation.id)
      .then(({ messages, hasMore }) => {
        setConvMessages(messages);
        setConvHasMore(hasMore);
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
    setActiveChannelId(null);
    setActiveRealmId(realmId);
  }, []);

  const handleConversationSelect = useCallback((conv: Conversation) => {
    setActiveConversation(conv);
    setActiveChannelId(null);
  }, []);

  // Community channel selected from CommunityBrowser
  const handleChannelSelect = useCallback((channel: CommunityChannel, _community: Community) => {
    if (!channel.conversationId) return;
    setActiveChannelId(channel.conversationId);
    const fakeConv: Conversation = {
      id: channel.conversationId,
      type: "group",
      name: `#${channel.name}`,
      realmId: null,
      members: [],
      lastMessage: null,
    };
    setActiveConversation(fakeConv);
  }, []);

  const handleSendMessage = useCallback((text: string) => {
    if (activeConversation) {
      sendSocketMessage(text, activeConversation.id);
    } else {
      sendSocketMessage(text);
    }
    playSound("message");
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
    setConvMessages(prev => prev.map(m => {
      if (m.id !== messageId) return m;
      const reactions = [...(m.reactions ?? [])];
      const idx = reactions.findIndex(r => r.emoji === emoji);
      if (idx >= 0) {
        reactions[idx] = { ...reactions[idx], count: reactions[idx].count + 1 };
      } else {
        reactions.push({ emoji, count: 1 });
      }
      return { ...m, reactions };
    }));
  }, [toggleReaction]);

  const handleShareRitualResult = useCallback((text: string) => {
    handleSendMessage(text);
    setActiveRitualPanel(null);
  }, [handleSendMessage]);

  const handleRitualToggle = useCallback((panel: RitualPanel) => {
    setActiveRitualPanel(prev => prev === panel ? null : panel);
    if (panel) playSound("ritual");
  }, [playSound]);

  const handleCreateGroup = useCallback(async (name: string, memberIds: string[]) => {
    const conv = await createGroup(name, memberIds);
    if (conv) setActiveConversation(conv);
  }, [createGroup]);

  const displayMessages = activeConversation ? convMessages : realmMessages;
  const displayLoading = activeConversation ? convLoading : false;

  // Whether to show the community browser (Beyond realm, no active conversation)
  const showCommunityBrowser = activeRealmId === "beyond" && !activeConversation;

  const conversationHeader: RealmConfig | null = activeConversation
    ? {
        id: activeConversation.id,
        name: activeConversation.name ?? (activeConversation.type === "dm" ? "Direct Message" : "Group"),
        description: activeConversation.members.map(m => m.username).join(", "),
        type: "social",
        effectsLevel: "low",
        allowRituals: false,
      }
    : activeRealm;

  return (
    <div className={`chat-page ${sidebarOpen ? "sidebar-open" : ""}`}>
      <button
        className="mobile-sidebar-toggle"
        onClick={() => setSidebarOpen(o => !o)}
        aria-label={sidebarOpen ? "Close menu" : "Open menu"}
        aria-expanded={sidebarOpen}
      >
        {sidebarOpen ? "✕" : "☰"}
      </button>
      <div
        className={`sidebar-backdrop ${sidebarOpen ? "visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
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
        {showCommunityBrowser ? (
          <CommunityBrowser
            onChannelSelect={handleChannelSelect}
            activeChannelId={activeChannelId}
          />
        ) : (
          <>
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
          </>
        )}
      </div>

      {activeRitualPanel && (
        <div className="ritual-panel">
          <button
            className="ritual-panel-close"
            onClick={() => setActiveRitualPanel(null)}
            aria-label="Close ritual panel"
          >✕</button>
          {activeRitualPanel === "fortune" && <FortuneCard username={username ?? "You"} onShare={handleShareRitualResult} />}
          {activeRitualPanel === "wheel" && <WheelOfFate />}
          {activeRitualPanel === "weather" && <WeatherOmenCard />}
          {activeRitualPanel === "tarot" && <TarotCard onShare={handleShareRitualResult} />}
          {activeRitualPanel === "crystal" && <CrystalBall onShare={handleShareRitualResult} />}
          {activeRitualPanel === "runes" && <RuneCasting onShare={handleShareRitualResult} />}
        </div>
      )}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};

export default ChatPage;

