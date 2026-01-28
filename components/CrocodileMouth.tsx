
import React from 'react';
import { Operator } from '../types';

interface CrocodileMouthProps {
  operator: Operator;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

export const CrocodileMouth: React.FC<CrocodileMouthProps> = ({ operator, isActive, onClick, disabled }) => {
  const getRotation = () => {
    switch (operator) {
      case '>': return "rotate-0";
      case '<': return "rotate-180";
      case '=': return "rotate-0";
      default: return "";
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        relative w-20 h-20 flex items-center justify-center rounded-2xl transition-all duration-300 transform
        ${isActive ? 'scale-105 ring-4 ring-yellow-400 bg-green-100' : 'bg-white hover:bg-green-50 shadow-md'}
        ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:scale-90'}
      `}
    >
      {operator === '=' ? (
        <div className="flex flex-col gap-2 w-10 items-center justify-center">
          <div className="h-2 bg-green-500 rounded-full w-full relative">
             <div className="absolute -top-4 left-1 w-2 h-2 bg-white rounded-full border border-green-700">
               <div className="w-1 h-1 bg-black rounded-full ml-0.5 mt-0.5"></div>
             </div>
          </div>
          <div className="h-2 bg-green-500 rounded-full w-full"></div>
        </div>
      ) : (
        <div className={`transition-transform duration-500 relative ${getRotation()}`}>
          <svg viewBox="0 0 100 100" className="w-16 h-16">
            <path d="M10 20 L90 50 L10 80" fill="none" stroke="#22c55e" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M25 25 L32 35 L40 28 L48 38 L56 31 L64 41 L72 34" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <path d="M25 75 L32 65 L40 72 L48 62 L56 69 L64 59 L72 66" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" />
            <circle cx="20" cy="20" r="8" fill="white" stroke="#166534" strokeWidth="2" />
            <circle cx="22" cy="20" r="4" fill="black" />
          </svg>
        </div>
      )}
      <div className="absolute -bottom-1 bg-green-800 text-white px-2 py-0.5 rounded-full text-[10px] font-black">
        {operator}
      </div>
    </button>
  );
};
