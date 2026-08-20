'use client';

import React from 'react';

interface ExpeditionStatusHeaderProps {
  completedCount?: number;
  totalCount?: number;
}

export default function ExpeditionStatusHeader({
  completedCount = 0,
  totalCount = 3,
}: ExpeditionStatusHeaderProps) {
  return (
    <div className="relative w-full max-w-lg mx-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] select-none">
      <div
        style={{
          backgroundImage: `url('/assets/images/expedition_status_bg.png')`,
          aspectRatio: '520 / 230',
        }}
        className="relative w-full bg-[length:100%_100%] bg-no-repeat bg-center"
      >
        {/* Printable Parchment Safe Zone */}
        <div className="absolute inset-0 pt-[23%] pb-[9%] px-[12%] flex flex-col items-center justify-between text-center">
          {/* Main Stamped White Heading */}
          <h1 className="font-serif font-black text-lg sm:text-2xl tracking-[3px] text-[#FFFFFF] drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)] uppercase leading-none">
            EXPEDITION STATUS
          </h1>

          {/* Typewriter Subtitle */}
          <p className="font-courier font-bold text-[9.5px] sm:text-[11px] tracking-[3px] text-[#3D230D] uppercase -mt-0.5">
            {completedCount} OF {totalCount} SECTORS DISCOVERED
          </p>

          {/* 3 Circular Sector Badge Indicators */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 pb-0.5">
            {Array.from({ length: totalCount }).map((_, idx) => {
              const isCompleted = idx < completedCount;
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-courier font-bold text-xs shadow-md transition-all ${isCompleted
                      ? 'bg-gradient-to-b from-[#f5e19f] via-[#d4af37] to-[#7a5214] border border-[#fff3cc] text-[#241308] ring-1 ring-[#d4af37] shadow-[0_0_8px_rgba(212,175,55,0.7)]'
                      : 'bg-[#1b1009] border border-[#5c3e21] text-[#8c6f4b]'
                    }`}
                >
                  {isCompleted ? (
                    <img
                      src="/assets/images/avery-pirate-coin.png"
                      alt="Completed"
                      className="w-4 h-4 sm:w-5 sm:h-5 object-contain drop-shadow"
                    />
                  ) : (
                    `0${idx + 1}`
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}