import { apiFetch } from './api';

export interface ConversationMember {
  id: string;
  username: string;
}

export interface ConversationSummary {
  id: string;
  type: 'realm' | 'dm' | 'group';
  name: string | null;
  realmId: string | null;
  members: ConversationMember[];
  lastMessage: { content: string; createdAt: string } | null;
}

export interface ConversationMessage {
  id: string;
  sender: string;
  senderId: string;
  content: string;
  type: string;
  asciiGif?: {
    id: string;
    frames: string[];
    frameDelay: number;
    title: string;
  } | null;
  reactions?: { emoji: string; count: number; users?: string[] }[];
  createdAt: string;
}

export function getConversations(): Promise<{ conversations: ConversationSummary[] }> {
  return apiFetch('/conversations');
}

export function createConversation(data: {
  type: 'dm' | 'group';
  name?: string;
  memberIds: string[];
}): Promise<{ conversation: ConversationSummary; existing?: boolean }> {
  return apiFetch('/conversations', { method: 'POST', body: JSON.stringify(data) });
}

export function getConversationMessages(
  id: string,
  limit = 50,
  before?: string,
  q?: string
): Promise<{ messages: ConversationMessage[]; hasMore: boolean }> {
  const params = new URLSearchParams({ limit: String(limit) });
  if (before) params.set('before', before);
  if (q) params.set('q', q);
  return apiFetch(`/conversations/${id}/messages?${params}`);
}

export function addConversationMember(
  conversationId: string,
  userId: string
): Promise<{ member: unknown }> {
  return apiFetch(`/conversations/${conversationId}/members`, {
    method: 'POST',
    body: JSON.stringify({ userId })
  });
}
