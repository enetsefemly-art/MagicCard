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

export enum GameMode {
  MENU = 'MENU',
  CLASSIC = 'CLASSIC', // Rút bài theo chủ đề
  TOD = 'TOD', // Truth or Dare
  FORTUNE = 'FORTUNE' // Gieo quẻ
}

export interface FortuneData {
  id?: string;
  name: string;
  content: string;
  interpretation: string;
  luckyNumber?: string;
  type?: number;
}

export interface ThemeCollection {
  [themeName: string]: string[]; // Map theme name to list of content strings
}

export interface ToDCollection {
  truth: string[];
  dare: string[];
}