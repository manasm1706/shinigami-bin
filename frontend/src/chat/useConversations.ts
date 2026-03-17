import { useState, useCallback } from 'react';
import {
  getConversations,
  createConversation,
} from '../services/conversations';
import type { Conversation } from '../types';

export interface UseConversationsReturn {
  conversations: Conversation[];
  loading: boolean;
  error: string | null;
  fetchConversations: () => Promise<void>;
  startDM: (userId: string) => Promise<Conversation | null>;
  createGroup: (name: string, memberIds: string[]) => Promise<Conversation | null>;
}

export function useConversations(): UseConversationsReturn {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConversations();
      setConversations(data.conversations as Conversation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  }, []);

  const startDM = useCallback(async (userId: string): Promise<Conversation | null> => {
    try {
      const data = await createConversation({ type: 'dm', memberIds: [userId] });
      const conv = data.conversation as Conversation;
      setConversations(prev => {
        if (prev.find(c => c.id === conv.id)) return prev;
        return [conv, ...prev];
      });
      return conv;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start DM');
      return null;
    }
  }, []);

  const createGroup = useCallback(async (name: string, memberIds: string[]): Promise<Conversation | null> => {
    try {
      const data = await createConversation({ type: 'group', name, memberIds });
      const conv = data.conversation as Conversation;
      setConversations(prev => [conv, ...prev]);
      return conv;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create group');
      return null;
    }
  }, []);

  return { conversations, loading, error, fetchConversations, startDM, createGroup };
}
