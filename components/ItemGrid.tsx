
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
    <div className={`flex flex-col items-center justify-between h-full w-full transition-all`}>
      {/* Khu vực hiển thị emoji */}
      <div className={`flex flex-wrap items-center justify-center gap-1 min-h-[100px] w-full p-3 bg-white/50 rounded-2xl border-2 border-dashed border-green-100 shadow-inner relative mb-2`}>
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center opacity-20 py-4">
            <span className="text-3xl filter grayscale">📦</span>
            <span className="text-[8px] font-black mt-1 uppercase tracking-tighter">Trống trơn</span>
          </div>
        ) : (
          items.map((_, i) => (
            <span key={i} className={`${isCompact ? 'text-2xl' : 'text-3xl'} animate-bounce`} style={{ animationDelay: `${i * 0.1}s` }}>
              {emoji}
            </span>
          ))
        )}
      </div>

      {/* Khu vực hiển thị con số - Đã loại bỏ phần chữ chú thích tên đồ vật bên dưới */}
      <div className="w-full flex flex-col items-center pt-2 pb-1">
        <div className="bg-green-50 px-6 py-2 rounded-2xl shadow-sm border border-green-100 min-w-[80px] flex justify-center">
           <span className="text-4xl font-black text-green-700 math-font leading-none">{count}</span>
        </div>
      </div>
    </div>
  );
};
