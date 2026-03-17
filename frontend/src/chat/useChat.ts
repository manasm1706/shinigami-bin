import { useState, useEffect, useCallback, useRef } from 'react';
import type { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';

export type MessageStatus = 'sending' | 'sent' | 'delivered';

export interface ChatMessage {
  id: string;
  clientId?: string;
  sender: string;
  text: string;
  realm: string;
  timestamp: string;
  status?: MessageStatus;
}

export interface ChatUser {
  username: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  users: string[];
  isConnected: boolean;
  typingUsers: string[];
  joinRealm: (realm: string, username: string) => void;
  joinConversation: (conversationId: string) => void;
  sendMessage: (text: string) => void;
  sendTypingStart: (conversationId: string) => void;
  sendTypingStop: (conversationId: string) => void;
  clearMessages: () => void;
}

export const useChat = (initialRealm?: string, username?: string): UseChatReturn => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeouts = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Pending realm join — stored so we can re-join on reconnect
  const pendingRealm = useRef<{ realm: string; username: string } | null>(null);
  const currentRealm = useRef<string | null>(null);
  const currentUsername = useRef<string | null>(null);

  // Send queue for throttling (300ms debounce)
  const sendQueue = useRef<{ text: string; clientId: string }[]>([]);
  const sendTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const flushSendQueue = useCallback(() => {
    const sock = socketRef.current;
    if (!sock || sendQueue.current.length === 0) return;
    const realm = currentRealm.current;
    const uname = currentUsername.current;
    if (!realm || !uname) return;

    sendQueue.current.forEach(({ text, clientId }) => {
      sock.emit('send_message', { realm, sender: uname, text, clientId });
    });
    sendQueue.current = [];
  }, []);

  useEffect(() => {
    const socketInstance = socketService.connect();
    socketRef.current = socketInstance;

    const doJoin = (realm: string, uname: string) => {
      socketInstance.emit('join_realm', { realm, username: uname });
      currentRealm.current = realm;
      currentUsername.current = uname;
    };

    const handleConnect = () => {
      setIsConnected(true);
      console.log('🌟 Connected to the ethereal messaging realm');
      // Auto-join pending realm on (re)connect
      if (pendingRealm.current) {
        doJoin(pendingRealm.current.realm, pendingRealm.current.username);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('💫 Disconnected from the spirit realm');
    };

    const handleReceiveMessage = (message: ChatMessage) => {
      setMessages(prev => {
        // If we have a matching clientId (optimistic), replace it and mark delivered
        if (message.clientId) {
          const idx = prev.findIndex(m => m.clientId === message.clientId);
          if (idx !== -1) {
            const updated = [...prev];
            updated[idx] = { ...message, status: 'delivered' };
            return updated;
          }
        }
        return [...prev, { ...message, status: 'delivered' }];
      });
    };

    const handleMessageAck = ({ clientId, id }: { clientId: string; id: string }) => {
      setMessages(prev =>
        prev.map(m =>
          m.clientId === clientId ? { ...m, id, status: 'delivered' } : m
        )
      );
    };

    const handleUserJoined = ({ username: joinedUser }: { username: string; realm: string }) => {
      console.log(`👻 ${joinedUser} has entered the realm`);
    };

    const handleUserLeft = ({ username: leftUser }: { username: string; realm: string }) => {
      console.log(`💨 ${leftUser} has departed the realm`);
    };

    const handleRealmUsers = ({ users: realmUsers }: { realm: string; users: string[] }) => {
      setUsers(realmUsers);
    };

    const handleRealmHistory = ({ realm, messages: historyMessages }: { realm: string; messages: ChatMessage[] }) => {
      console.log(`📜 Received ${historyMessages.length} historical messages for ${realm}`);
      setMessages(historyMessages.map(m => ({ ...m, status: 'delivered' as MessageStatus })));
    };

    const handleTyping = ({ username: typingUser }: { conversationId: string; username: string }) => {
      setTypingUsers(prev => prev.includes(typingUser) ? prev : [...prev, typingUser]);
      const existing = typingTimeouts.current.get(typingUser);
      if (existing) clearTimeout(existing);
      const t = setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u !== typingUser));
        typingTimeouts.current.delete(typingUser);
      }, 3000);
      typingTimeouts.current.set(typingUser, t);
    };

    const handleTypingStopped = ({ username: typingUser }: { conversationId: string; username: string }) => {
      setTypingUsers(prev => prev.filter(u => u !== typingUser));
      const existing = typingTimeouts.current.get(typingUser);
      if (existing) { clearTimeout(existing); typingTimeouts.current.delete(typingUser); }
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('receive_message', handleReceiveMessage);
    socketInstance.on('message_ack', handleMessageAck);
    socketInstance.on('user_joined', handleUserJoined);
    socketInstance.on('user_left', handleUserLeft);
    socketInstance.on('realm_users', handleRealmUsers);
    socketInstance.on('realm_history', handleRealmHistory);
    socketInstance.on('typing', handleTyping);
    socketInstance.on('typing_stopped', handleTypingStopped);

    // If already connected when this effect runs, join immediately
    if (socketInstance.connected && initialRealm && username) {
      doJoin(initialRealm, username);
    } else if (initialRealm && username) {
      pendingRealm.current = { realm: initialRealm, username };
    }

    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('receive_message', handleReceiveMessage);
      socketInstance.off('message_ack', handleMessageAck);
      socketInstance.off('user_joined', handleUserJoined);
      socketInstance.off('user_left', handleUserLeft);
      socketInstance.off('realm_users', handleRealmUsers);
      socketInstance.off('realm_history', handleRealmHistory);
      socketInstance.off('typing', handleTyping);
      socketInstance.off('typing_stopped', handleTypingStopped);
      typingTimeouts.current.forEach(t => clearTimeout(t));
    };
  }, []); // run once — socket is a singleton

  const joinRealm = useCallback((realm: string, uname: string) => {
    pendingRealm.current = { realm, username: uname };
    currentRealm.current = realm;
    currentUsername.current = uname;
    setUsers([]);
    setMessages([]);

    const sock = socketRef.current;
    if (sock && sock.connected) {
      sock.emit('join_realm', { realm, username: uname });
      console.log(`🔮 Joining the ${realm} realm as ${uname}`);
    } else {
      console.log(`⏳ Queued realm join for ${realm} — waiting for connection`);
    }
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    const sock = socketRef.current;
    if (sock && sock.connected) {
      sock.emit('join_conversation', { conversationId });
    }
  }, []);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !currentRealm.current || !currentUsername.current) return;

    // Optimistic update
    const clientId = `client_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const optimistic: ChatMessage = {
      id: clientId,
      clientId,
      sender: currentUsername.current,
      text: trimmed,
      realm: currentRealm.current,
      timestamp: new Date().toISOString(),
      status: 'sending'
    };
    setMessages(prev => [...prev, optimistic]);

    // Throttle: debounce 300ms, batch rapid sends
    sendQueue.current.push({ text: trimmed, clientId });
    if (sendTimer.current) clearTimeout(sendTimer.current);
    sendTimer.current = setTimeout(() => {
      flushSendQueue();
    }, 300);
  }, [flushSendQueue]);

  const sendTypingStart = useCallback((conversationId: string) => {
    const sock = socketRef.current;
    if (sock && sock.connected) {
      sock.emit('typing_start', { conversationId });
    }
  }, []);

  const sendTypingStop = useCallback((conversationId: string) => {
    const sock = socketRef.current;
    if (sock && sock.connected) {
      sock.emit('typing_stop', { conversationId });
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    users,
    isConnected,
    typingUsers,
    joinRealm,
    joinConversation,
    sendMessage,
    sendTypingStart,
    sendTypingStop,
    clearMessages
  };
};
