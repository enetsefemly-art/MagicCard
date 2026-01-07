import React from 'react';
import { CardData } from '../types';

interface CardProps {
  data?: CardData;
  isBack?: boolean;
  onClick?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ data, isBack = false, onClick, className = '', style = {} }) => {
  if (isBack) {
    return (
      <div
        onClick={onClick}
        className={`w-64 h-96 rounded-2xl border-[6px] border-white/90 shadow-2xl cursor-pointer transition-transform hover:-translate-y-2 bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 flex items-center justify-center relative overflow-hidden ${className}`}
        style={style}
      >
        {/* Decorative back pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 20px, transparent 20px, transparent 40px)' 
             }} 
        />
        <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md z-10 border-2 border-white/30 shadow-inner">
          <span className="text-5xl font-serif text-white/90">?</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      onClick={onClick}
      className={`w-64 h-96 rounded-2xl border-[6px] border-white shadow-2xl flex flex-col items-center justify-center p-8 text-center animate-pop-in relative overflow-hidden ${data.color} ${className}`}
      style={style}
    >
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: data.pattern, backgroundSize: '20px 20px' }}
      />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full w-full gap-4">
        {/* Content with better contrast */}
        <h3 className="text-2xl md:text-3xl font-extrabold break-words w-full leading-relaxed drop-shadow-sm text-slate-900">
          {data.content}
        </h3>
      </div>
      
      {/* Footer text with high contrast */}
      <div className="absolute bottom-4 opacity-60 text-[10px] font-black uppercase tracking-[0.2em] text-slate-800">
        Magic Card
      </div>
    </div>
  );
};