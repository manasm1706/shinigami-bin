// Type definitions for Shinigami-bin

export type RealmType = 'social' | 'experimental' | 'system';
export type EffectsLevel = 'low' | 'medium' | 'high';

export interface RealmConfig {
  id: string;
  name: string;
  description: string;
  type: RealmType;
  effectsLevel: EffectsLevel;
  allowRituals: boolean;
}

// Alias for backward compatibility
export type Realm = RealmConfig;

export interface Message {
  id: string;
  realmId: string;
  author: string;
  content: string;
  timestamp: Date;
  type?: 'user' | 'system' | 'fortune';
}

export interface User {
  id: string;
  username: string;
  avatar?: string;
}

export type ConversationType = 'realm' | 'dm' | 'group';

export interface ConversationMember {
  id: string;
  username: string;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  realmId: string | null;
  members: ConversationMember[];
  lastMessage: { content: string; createdAt: string } | null;
}
