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

export interface ThemeCollection {
  [themeName: string]: string[]; // Map theme name to list of content strings
}