import React from 'react';
import { FortuneData } from '../types';
import { Sparkles } from 'lucide-react';

interface FortuneCardProps {
  data?: FortuneData;
  className?: string;
  isBack?: boolean;
  onClick?: () => void;
}

export const FortuneCard: React.FC<FortuneCardProps> = ({ data, className = '', isBack = false, onClick }) => {
  if (isBack) {
    return (
      <div
        onClick={onClick}
        className={`w-full max-w-[450px] min-h-[650px] rounded-2xl border-[6px] border-amber-200 shadow-2xl cursor-pointer bg-gradient-to-br from-amber-600 via-orange-600 to-red-600 flex items-center justify-center relative overflow-hidden ${className}`}
      >
        {/* Decorative back pattern */}
        <div className="absolute inset-0 opacity-20" 
             style={{ 
               backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 20px, transparent 20px, transparent 40px)' 
             }} 
        />
        <div className="w-40 h-40 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md z-10 border-2 border-white/30 shadow-inner">
          <span className="text-7xl font-serif text-white/90">?</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const formatContent = (text: string) => {
    // Insert newline before uppercase letters that are preceded by space
    // This creates a poem structure as requested
    // Using unicode property escape for better Vietnamese support
    return text.trim().replace(/(\s+)(?=\p{Lu})/gu, '\n');
  };

  return (
    <div className={`w-full max-w-[450px] min-h-[650px] rounded-2xl border-[6px] border-amber-200 shadow-2xl flex flex-col p-8 text-slate-900 animate-pop-in relative overflow-hidden bg-orange-50 ${className}`}>
      {/* Decorative border inside */}
      <div className="absolute inset-4 border-2 border-amber-300/50 rounded-xl pointer-events-none" />
      
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none" 
           style={{ backgroundImage: 'radial-gradient(#b45309 1px, transparent 1px)', backgroundSize: '15px 15px' }} 
      />

      <div className="relative z-10 flex flex-col h-full justify-between">
        {/* Header: Fortune Name */}
        <div className="text-center mb-6 pt-2">
          <div className="inline-block px-4 py-1.5 bg-amber-200 rounded-full text-xs font-black uppercase tracking-widest text-amber-900 mb-3">
            Quẻ Linh Ứng
          </div>
          <h3 className="text-3xl font-serif font-bold text-amber-900 border-b-2 border-amber-200 pb-3">
            {data.name}
          </h3>
        </div>

        {/* Content: The main message */}
        <div className="flex-1 py-4 text-center flex flex-col justify-center">
          <div className="mb-6">
            <p className="text-sm font-bold text-amber-800 mb-3 uppercase tracking-tighter">Nội dung</p>
            <p className="text-lg leading-relaxed italic font-medium whitespace-pre-line text-amber-950">
              {formatContent(data.content)}
            </p>
          </div>
          
          <div className="mt-2 text-left bg-white/60 p-5 rounded-xl border border-amber-200 shadow-sm">
            <p className="text-xs font-bold text-amber-800 mb-2 uppercase tracking-tighter">Luận giải:</p>
            <p className="text-base leading-relaxed text-slate-800 text-justify">
              {data.interpretation}
            </p>
          </div>
        </div>

        {/* Footer: Lucky Number */}
        <div className="mt-6 pt-4 border-t border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-amber-500" />
            <span className="text-sm font-bold text-amber-800 uppercase">Số may mắn</span>
          </div>
          <div className="text-4xl font-black text-amber-600 font-mono">
            {data.luckyNumber}
          </div>
        </div>
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
