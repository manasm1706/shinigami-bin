import { apiFetch } from './api';

export interface TarotCard {
  position: string;
  card: string;
  arcana: string;
  number: number;
  reversed: boolean;
  meaning: string;
}

export interface TarotReading {
  spread: TarotCard[];
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export interface CrystalBallReading {
  vision: string;
  clarity: 'murky' | 'hazy' | 'clear' | 'crystalline';
  severity: 'low' | 'medium' | 'high';
  focus: string | null;
  timestamp: string;
}

export interface RuneResult {
  name: string;
  symbol: string;
  reversed: boolean;
  meaning: string;
}

export interface RuneCasting {
  runes: RuneResult[];
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
}

export const getTarotReading = (): Promise<TarotReading> =>
  apiFetch('/rituals/tarot');

export const getCrystalBallVision = (focus?: string): Promise<CrystalBallReading> => {
  const params = focus ? `?focus=${encodeURIComponent(focus)}` : '';
  return apiFetch(`/rituals/crystal-ball${params}`);
};

export const castRunes = (count = 3): Promise<RuneCasting> =>
  apiFetch(`/rituals/runes?count=${count}`);
