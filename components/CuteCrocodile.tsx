
import React from 'react';

interface CuteCrocodileProps {
  className?: string;
}

export const CuteCrocodile: React.FC<CuteCrocodileProps> = ({ className = "" }) => {
  return (
    <div className={`relative ${className}`}>
      <svg viewBox="0 0 200 200" className={`w-full h-full drop-shadow-lg`}>
        {/* Thân cá sấu */}
        <path d="M60 140 Q40 140 40 110 Q40 60 80 50 Q120 40 150 70 Q170 90 170 120 Q170 150 140 160 Q100 170 60 140" fill="#4ade80" />
        {/* Bụng */}
        <path d="M70 135 Q55 135 55 110 Q55 80 85 70 Q115 60 135 85 Q150 105 150 125 Q150 145 125 150 Q95 155 70 135" fill="#fef08a" />
        
        {/* Đuôi */}
        <path d="M160 130 Q190 130 190 160 Q190 185 160 175" fill="#4ade80" />
        <path d="M170 135 L180 145 L170 155 L180 165" fill="none" stroke="#166534" strokeWidth="2" />

        {/* Đầu & Mõm */}
        <path d="M50 80 Q30 80 20 100 Q15 115 30 120 L70 115 Q80 110 80 90 Q80 75 60 75" fill="#4ade80" />
        <path d="M25 105 Q22 108 25 110" stroke="#166534" strokeWidth="2" fill="none" />
        
        {/* Mắt to tròn thân thiện */}
        <circle cx="75" cy="65" r="15" fill="white" />
        <circle cx="78" cy="65" r="7" fill="black" />
        <circle cx="76" cy="63" r="3" fill="white" />
        
        <circle cx="105" cy="70" r="15" fill="white" />
        <circle cx="108" cy="70" r="7" fill="black" />
        <circle cx="106" cy="68" r="3" fill="white" />

        {/* Má hồng */}
        <circle cx="65" cy="95" r="5" fill="#fecaca" opacity="0.6" />
        
        {/* Răng nhỏ ngộ nghĩnh */}
        <path d="M35 118 L40 112 L45 118" fill="white" />
        <path d="M50 117 L55 111 L60 117" fill="white" />

        {/* Vảy lưng */}
        <path d="M90 45 L100 35 L110 45" fill="#166534" />
        <path d="M115 48 L125 38 L135 48" fill="#166534" />
        <path d="M140 55 L150 45 L160 55" fill="#166534" />
      </svg>
    </div>
  );
};
