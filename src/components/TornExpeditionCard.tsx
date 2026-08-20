'use client';

import React from 'react';
import DistressedHeading from '@/components/DistressedHeading';
import { WaxSealIcon } from '@/components/RusticIcons';

interface TornExpeditionCardProps {
  id: string;
  title: string;
  total: number;
  evaluated: number;
  description: string;
  onExplore?: () => void;
  tiltClass?: string;
  seed?: number;
}

export default function TornExpeditionCard({
  id = '01',
  title = "KING'S BAY",
  total = 7,
  evaluated = 0,
  description = 'Uncover lost technological blueprints, wireless relays, and early hardware prototypes.',
  onExplore,
  tiltClass = '',
  seed = 42,
}: TornExpeditionCardProps) {
  const isCompleted = evaluated >= total && total > 0;

  return (
    <div
      className={`relative w-full max-w-lg mx-auto my-2.5 transition-transform active:scale-[0.99] touch-manipulation ${tiltClass}`}
    >
      {/* Wax Seal when completed */}
      {isCompleted && (
        <div className="absolute -top-3 -right-3 w-16 h-16 pointer-events-none drop-shadow-xl rotate-12 z-30 flex items-center justify-center">
          <WaxSealIcon size={56} color="#8B1A1A" />
        </div>
      )}

      {/* Parchment Base Card */}
      <div className="relative w-full min-h-[280px] sm:min-h-[300px] bg-transparent bg-[url('/assets/images/torn-card-bg.png')] bg-[length:100%_100%] bg-no-repeat bg-center drop-shadow-[0_8px_16px_rgba(20,10,4,0.5)] pt-8 sm:pt-9 px-7 sm:px-10 pb-6 sm:pb-7 flex flex-col justify-between">
        {/* 1. Header Bar: Sector Tag & Recon Counter */}
        <div className="flex justify-between items-center border-b border-[#6E4E26]/35 pb-1.5 w-full">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 max-w-[24px] max-h-[24px] shrink-0 overflow-hidden flex items-center justify-center">
              <img
                src="/assets/images/avery-pirate-coin.png"
                alt="Avery Pirate Coin"
                onError={(e) => {
                  e.currentTarget.src = '/assets/images/avery-pirate-coin.png';
                }}
                className="w-full h-full max-w-[24px] max-h-[24px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]"
              />
            </div>

            <span className="text-[0.7rem] sm:text-[0.76rem] font-black tracking-[2px] text-[#3d230d] uppercase font-courier">
              SECTOR // {id}
            </span>
          </div>

          <div>
            {isCompleted ? (
              <div className="flex items-center gap-1 text-uc-blood bg-uc-blood/10 border border-dashed border-uc-blood px-2 py-0.5 rounded-[2px] text-[0.62rem] sm:text-[0.68rem] font-black tracking-wider uppercase font-courier -rotate-2">
                <WaxSealIcon size={12} color="#8B1A1A" />
                <span>SURVEY CLEARED</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 bg-[#D9C49D]/80 border border-[#8C6F42] px-2.5 py-0.5 rounded-[2px] shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
                <span className="text-[0.62rem] sm:text-[0.68rem] font-bold text-[#5C381E] tracking-wider font-courier uppercase">
                  RECON:
                </span>
                <span className="text-xs sm:text-[0.78rem] font-black text-[#1F1005] font-courier">
                  {evaluated}/{total}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 2. Middle Block: Centered White Title & Centered Description */}
        <div className="flex-1 flex flex-col items-center justify-center text-center my-2 w-full px-2">
          <div className="w-full flex justify-center items-center text-center drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
            <DistressedHeading
              title={title}
              subtitle=""
              seed={seed}
              size="card"
              align="center"
              titleColor="#FFFFFF"
              className="text-center w-full flex justify-center"
            />
          </div>

          <p className="font-serif font-bold text-[0.88rem] sm:text-[0.92rem] leading-relaxed text-[#2b1704] max-w-[390px] mx-auto text-center mt-2 mb-0 italic">
            {description}
          </p>
        </div>

        {/* 3. Polygonal Brass Action Plaque Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onExplore) onExplore();
          }}
          style={{
            clipPath:
              'polygon(8px 0%, calc(100% - 8px) 0%, 100% 8px, 100% calc(100% - 8px), calc(100% - 6px) 100%, 8px 100%, 0% calc(100% - 8px), 0% 8px)',
          }}
          className={`group w-full h-[44px] sm:h-[48px] px-4.5 flex items-center justify-between cursor-pointer active:scale-[0.98] transition-transform touch-manipulation border-none shadow-[0_4px_8px_rgba(15,8,3,0.4),inset_0_1px_2px_rgba(255,255,255,0.6),inset_0_-2px_4px_rgba(0,0,0,0.6)] ${isCompleted
              ? 'bg-gradient-to-b from-[#4A1A12] via-[#38100A] to-[#200704] text-[#F7E7CD]'
              : 'bg-gradient-to-b from-[#E6C265] via-[#C49219] to-[#8A6008] text-[#1c1004]'
            }`}
        >
          {/* Left Text with Embossed Ink Shadow */}
          <span
            className={`font-courier text-xs sm:text-[0.82rem] font-bold tracking-[2px] uppercase ${isCompleted
                ? 'text-[#F7E7CD] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]'
                : 'text-[#1c1004] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]'
              }`}
          >
            {isCompleted ? `REVIEW ${title}` : `ENTER ${title}`}
          </span>

          {/* Right Action: Red Wax Seal (Completed) or Tactical Compass Needle */}
          {isCompleted ? (
            <div className="flex items-center gap-1 bg-[radial-gradient(circle,#B22222_20%,#7A1212_80%,#400707_100%)] border border-[#FF8585] px-2 py-0.5 rounded-full shadow-[0_0_6px_rgba(220,20,60,0.5)]">
              <WaxSealIcon size={12} color="#FFF5E6" />
              <span className="text-[0.58rem] sm:text-[0.62rem] font-extrabold text-[#FFF5E6] tracking-wider font-courier">
                SEALED
              </span>
            </div>
          ) : (
            <div className="w-5 h-5 rounded-full border-[1.5px] border-[#2A1705] flex items-center justify-center bg-[#E5B83B]/70 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] transition-transform duration-300 group-hover:rotate-45">
              <svg width="14" height="14" viewBox="0 0 24 24" className="drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                <polygon points="12,2 15,12 12,10 9,12" fill="#8B1A1A" />
                <polygon points="12,22 15,12 12,14 9,12" fill="#1C1004" />
                <circle cx="12" cy="12" r="1.5" fill="#1C1004" />
              </svg>
            </div>
          )}
        </button>
      </div>
    </div>
  );
}