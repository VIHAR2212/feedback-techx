'use client';

import React from 'react';
import MagellanCrossKey from './MagellanCrossKey';
import { WaxSealIcon } from './RusticIcons';

interface MagellanKeyButtonProps {
  title: string;
  isCompleted?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export default function MagellanKeyButton({
  title,
  isCompleted = false,
  onClick,
}: MagellanKeyButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative w-full mt-2 py-2.5 px-4 flex items-center justify-between overflow-hidden transition-all duration-200 active:scale-[0.98] cursor-pointer"
      style={{
        background: isCompleted
          ? 'linear-gradient(180deg, #6B1E12 0%, #421008 100%)'
          : 'linear-gradient(180deg, #E6C564 0%, #B8860B 45%, #7A5305 100%)',
        border: isCompleted ? '1.5px solid #2B0A05' : '1.5px solid #4A3305',
        borderRadius: '3px',
        boxShadow: `
          inset 0 1px 1px rgba(255, 255, 255, 0.45),
          inset 0 -2px 3px rgba(0, 0, 0, 0.6),
          0 4px 8px rgba(15, 8, 3, 0.4)
        `,
        color: isCompleted ? '#F7E7CD' : '#2A1705',
      }}
    >
      {/* Metallic Glint Hover Sweep */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

      {/* Key Graphic & Action Text */}
      <div className="flex items-center gap-3 relative z-10">
        {isCompleted ? (
          <WaxSealIcon size={20} color="#FFF6E5" />
        ) : (
          <div className="transition-transform duration-300 group-hover:rotate-45 group-hover:scale-110">
            <MagellanCrossKey size={26} />
          </div>
        )}

        <span
          className="text-[11px] font-black tracking-widest uppercase"
          style={{
            fontFamily: 'var(--font-courier), monospace',
            textShadow: isCompleted
              ? '0 1px 2px rgba(0,0,0,0.6)'
              : '0 1px 0 rgba(255,255,255,0.3)',
          }}
        >
          {isCompleted ? `SECTOR CLEARED // REVIEW RECORDS` : `INSERT CROSS KEY // UNLOCK ${title}`}
        </span>
      </div>

      {/* Mechanical Locking Arrow Indicator */}
      <span
        className="relative z-10 text-xs font-black transition-transform duration-200 group-hover:translate-x-1"
        style={{ color: isCompleted ? '#F7E7CD' : '#3B2202' }}
      >
        ➔
      </span>
    </button>
  );
}
