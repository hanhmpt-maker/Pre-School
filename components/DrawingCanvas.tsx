
import React, { useRef, useEffect, useState } from 'react';

interface DrawingCanvasProps {
  onConfirm: (base64: string) => void;
  disabled: boolean;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({ onConfirm, disabled }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#1d4ed8'; // Blue for drawing phase
  }, []);

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDrawing(true);
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && pos) {
      ctx.beginPath();
      ctx.moveTo(pos.x, pos.y);
    }
  };

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
    const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;
    return { x, y };
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || disabled) return;
    const pos = getPos(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx && pos) {
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="relative bg-white border-2 border-dashed border-blue-300 rounded-2xl overflow-hidden shadow-inner w-full">
        <canvas
          ref={canvasRef}
          width={280}
          height={160}
          className="cursor-crosshair touch-none w-full h-[160px]"
          onMouseDown={startDrawing}
          onMouseUp={stopDrawing}
          onMouseMove={draw}
          onTouchStart={startDrawing}
          onTouchEnd={stopDrawing}
          onTouchMove={draw}
        />
      </div>
      <div className="flex gap-2 w-full">
        <button onClick={clear} disabled={disabled} className="flex-1 py-3 bg-gray-100 rounded-full font-bold text-gray-500">Xóa</button>
        <button 
          onClick={() => canvasRef.current && onConfirm(canvasRef.current.toDataURL())}
          disabled={disabled}
          className="flex-[2] py-3 bg-blue-600 text-white rounded-full font-black shadow-lg"
        >
          Xong rồi!
        </button>
      </div>
    </div>
  );
};
