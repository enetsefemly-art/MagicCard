import { ThemeConfig } from './types';

export const PASTEL_COLORS = [
  'bg-red-200 text-red-900',
  'bg-orange-200 text-orange-900',
  'bg-amber-200 text-amber-900',
  'bg-yellow-200 text-yellow-900',
  'bg-lime-200 text-lime-900',
  'bg-green-200 text-green-900',
  'bg-emerald-200 text-emerald-900',
  'bg-teal-200 text-teal-900',
  'bg-cyan-200 text-cyan-900',
  'bg-sky-200 text-sky-900',
  'bg-blue-200 text-blue-900',
  'bg-indigo-200 text-indigo-900',
  'bg-violet-200 text-violet-900',
  'bg-purple-200 text-purple-900',
  'bg-fuchsia-200 text-fuchsia-900',
  'bg-pink-200 text-pink-900',
  'bg-rose-200 text-rose-900',
];

export const PATTERNS = [
  'radial-gradient(circle, rgba(255,255,255,0.4) 2px, transparent 2.5px)',
  'repeating-linear-gradient(45deg, rgba(255,255,255,0.2) 0, rgba(255,255,255,0.2) 10px, transparent 10px, transparent 20px)',
  'linear-gradient(135deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent)',
  'none'
];

export const DEFAULT_INPUT = `Ăn một cái bánh quy 🍪
Hát một bài hát vui 🎤
Nhảy múa trong 10 giây 💃
Kể một câu chuyện cười 😂
Uống một ly nước 💧
Chúc mọi người vui vẻ ❤️`;

export const PRESET_THEMES: ThemeConfig[] = [
  {
    id: 'manual',
    name: 'Tự nhập nội dung',
    type: 'manual',
    description: 'Tự do sáng tạo nội dung thẻ bài của riêng bạn.'
  },
  {
    id: 'demo-sheet',
    name: 'Google Sheet Demo',
    type: 'sheet',
    url: 'https://docs.google.com/spreadsheets/d/e/2PACX-1vR6XkbfwzXyV_q0G9O0tFp_Q5x7O-9r1JqN2F4Xj7k_Y5x6L1w/pub?output=csv', // Placeholder valid structure
    description: 'Dữ liệu mẫu từ Google Sheet (Cần Publish to Web dưới dạng CSV).'
  },
  {
    id: 'custom-sheet',
    name: 'Kết nối Google Sheet Khác...',
    type: 'sheet',
    url: '',
    description: 'Nhập link CSV từ Google Sheet của bạn (File > Chia sẻ > Công bố lên web > CSV).'
  }
];