'use client';

import React from 'react';

interface ExpeditionStatusHeaderProps {
  completedCount?: number;
  totalCount?: number;
  completedCheckpoints?: number;
  totalCheckpoints?: number;
  overallPercentage?: number;
}

export default function ExpeditionStatusHeader({
  completedCount = 0,
  totalCount = 3,
}: ExpeditionStatusHeaderProps) {
  return (
    <div className="relative w-full max-w-[480px] mx-auto drop-shadow-[0_14px_32px_rgba(0,0,0,0.92)] select-none">
      <div
        style={{
          backgroundImage: `url('/assets/images/expedition_status_bg.webp')`,
          aspectRatio: '520 / 250',
        }}
        className="relative w-full bg-[length:100%_100%] bg-no-repeat bg-center"
      >
        {/* Printable Parchment Safe Zone */}
        <div className="absolute inset-0 pt-[17%] pb-[14%] px-[12%] flex flex-col items-center justify-between text-center">
          {/* Main Uncharted Themed Heading */}
          <div>
            <h1 className="font-[family-name:var(--font-uncharted)] font-bold text-xl sm:text-2xl tracking-[0.14em] text-[#1c0f05] drop-shadow-[0_1px_0_rgba(255,255,255,0.6)] uppercase leading-none">
              EXPEDITION STATUS
            </h1>
            <p className="font-[family-name:var(--font-uncharted)] text-[9.5px] sm:text-[10.5px] tracking-[0.16em] text-[#7a481c] uppercase mt-1">
              {completedCount} OF {totalCount} SECTORS DISCOVERED • SIC PARVIS MAGNA
            </p>
          </div>

          {/* 3 Circular Sector Badge Indicators */}
          <div className="flex items-center justify-center gap-3 sm:gap-4 my-auto">
            {Array.from({ length: totalCount }).map((_, idx) => {
              const isCompleted = idx < completedCount;
              return (
                <div
                  key={idx}
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs shadow-md transition-all ${
                    isCompleted
                      ? 'bg-gradient-to-b from-[#fef08a] via-[#eab308] to-[#854d0e] border-2 border-[#fffbeb] text-[#1c1917] shadow-[0_0_10px_rgba(234,179,8,0.8)] ring-1 ring-[#eab308]'
                      : 'bg-gradient-to-b from-[#2b1708] via-[#1a0f05] to-[#0d0702] border-2 border-[#8c6d23] text-[#d4af37]'
                  }`}
                >
                  {isCompleted ? (
                    <span className="text-xs text-[#1c1917]">✦</span>
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