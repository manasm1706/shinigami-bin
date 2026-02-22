import { useState, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { socketService } from '../services/socket';

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  realm: string;
  timestamp: string;
}

export interface ChatUser {
  username: string;
}

export interface UseChatReturn {
  messages: ChatMessage[];
  users: string[];
  isConnected: boolean;
  joinRealm: (realm: string, username: string) => void;
  sendMessage: (text: string) => void;
  clearMessages: () => void;
}

export const useChat = (initialRealm?: string, username?: string): UseChatReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentRealm, setCurrentRealm] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = socketService.connect();
    setSocket(socketInstance);

    // Connection status handlers
    const handleConnect = () => {
      setIsConnected(true);
      console.log('🌟 Connected to the ethereal messaging realm');
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      console.log('💫 Disconnected from the spirit realm');
    };

    // Message handlers
    const handleReceiveMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };

    const handleUserJoined = ({ username: joinedUser }: { username: string; realm: string }) => {
      console.log(`👻 ${joinedUser} has entered the realm`);
    };

    const handleUserLeft = ({ username: leftUser }: { username: string; realm: string }) => {
      console.log(`💨 ${leftUser} has departed the realm`);
    };

    const handleRealmUsers = ({ realm, users: realmUsers }: { realm: string; users: string[] }) => {
      setUsers(realmUsers);
    };

    // Register event listeners
    socketInstance.on('connect', handleConnect);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('receive_message', handleReceiveMessage);
    socketInstance.on('user_joined', handleUserJoined);
    socketInstance.on('user_left', handleUserLeft);
    socketInstance.on('realm_users', handleRealmUsers);

    // Auto-join initial realm if provided
    if (initialRealm && username) {
      socketInstance.emit('join_realm', { realm: initialRealm, username });
      setCurrentRealm(initialRealm);
      setCurrentUsername(username);
    }

    // Cleanup on unmount
    return () => {
      socketInstance.off('connect', handleConnect);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('receive_message', handleReceiveMessage);
      socketInstance.off('user_joined', handleUserJoined);
      socketInstance.off('user_left', handleUserLeft);
      socketInstance.off('realm_users', handleRealmUsers);
    };
  }, [initialRealm, username]);

  const joinRealm = useCallback((realm: string, username: string) => {
    if (socket && isConnected) {
      // Clear messages when switching realms
      setMessages([]);
      setUsers([]);
      
      socket.emit('join_realm', { realm, username });
      setCurrentRealm(realm);
      setCurrentUsername(username);
      
      console.log(`🔮 Joining the ${realm} realm as ${username}`);
    }
  }, [socket, isConnected]);

  const sendMessage = useCallback((text: string) => {
    if (socket && isConnected && currentRealm && currentUsername && text.trim()) {
      socket.emit('send_message', {
        realm: currentRealm,
        sender: currentUsername,
        text: text.trim()
      });
    }
  }, [socket, isConnected, currentRealm, currentUsername]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return {
    messages,
    users,
    isConnected,
    joinRealm,
    sendMessage,
    clearMessages
  };
};