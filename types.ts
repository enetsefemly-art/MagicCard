export interface CardData {
  id: string;
  content: string;
  color: string;
  pattern: string;
}

export enum AppState {
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED'
}

export interface ThemeConfig {
  id: string;
  name: string;
  type: 'manual' | 'sheet';
  url?: string;
  description: string;
}