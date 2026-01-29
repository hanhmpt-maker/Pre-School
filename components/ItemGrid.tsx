
import React from 'react';

interface ItemGridProps {
  count: number;
  emoji: string;
  label: string;
  isCompact?: boolean;
}

export const ItemGrid: React.FC<ItemGridProps> = ({ count, emoji, label, isCompact = false }) => {
  const items = Array.from({ length: count });

  return (
    <div className="flex flex-col items-center justify-center h-full w-full gap-2">
      {/* Container hiển thị Emoji */}
      <div className="flex flex-wrap items-center justify-center gap-1 w-full min-h-[100px] sm:min-h-[140px] p-2 bg-white/50 rounded-2xl border-2 border-dashed border-green-100 shadow-inner relative overflow-hidden">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center opacity-20">
            <span className="text-3xl filter grayscale">📦</span>
          </div>
        ) : (
          items.map((_, i) => (
            <span 
              key={i} 
              className={`${isCompact ? 'text-2xl sm:text-3xl' : 'text-3xl sm:text-4xl'} animate-bounce inline-block transition-all`} 
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {emoji}
            </span>
          ))
        )}
      </div>

      {/* Hiển thị con số bên dưới */}
      <div className="bg-green-50 px-4 py-1 rounded-2xl shadow-sm border border-green-100 min-w-[60px] flex justify-center">
         <span className="text-3xl sm:text-4xl font-black text-green-700 math-font leading-none">{count}</span>
      </div>
    </div>
  );
};
