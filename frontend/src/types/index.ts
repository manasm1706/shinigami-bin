// Type definitions for Shinigami-bin

export interface Realm {
  id: string;
  name: string;
  description: string;
}

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
