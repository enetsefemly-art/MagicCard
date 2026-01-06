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
        className={`w-64 h-96 rounded-2xl border-4 border-white shadow-xl cursor-pointer transition-transform hover:-translate-y-2 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center relative overflow-hidden ${className}`}
        style={style}
      >
        {/* Decorative back pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 20px, transparent 20px, transparent 40px)' 
             }} 
        />
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm z-10">
          <span className="text-4xl">?</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div
      onClick={onClick}
      className={`w-64 h-96 rounded-2xl border-4 border-white shadow-2xl flex flex-col items-center justify-center p-6 text-center animate-pop-in relative overflow-hidden ${data.color} ${className}`}
      style={style}
    >
      <div 
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{ backgroundImage: data.pattern, backgroundSize: '20px 20px' }}
      />
      
      <div className="relative z-10 flex flex-col items-center gap-4">
        <h3 className="text-2xl font-bold break-words w-full">
          {data.content}
        </h3>
      </div>
      
      <div className="absolute bottom-4 right-4 opacity-50 text-xs font-bold uppercase tracking-widest">
        Lucky Card
      </div>
    </div>
  );
};