export interface Player {
  id: string;
  name: string;
  x: number;
  y: number;
  souls: number;
  isBot: boolean;
  alive: boolean;
  color: number;
  dir: { x: number; y: number };
}

export interface Soul {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

export type GamePhase = 'menu' | 'lobby' | 'countdown' | 'playing' | 'results';

export interface GameState {
  phase: GamePhase;
  roomId: string | null;
  playerId: string | null;
  isPrivate: boolean;
  players: Record<string, Player>;
  bots: Record<string, Player>;
  maze: number[][] | null;
  souls: Soul[];
  timeLeft: number;
  countdown: number;
  leaderboard: Player[];
  error: string | null;
}
