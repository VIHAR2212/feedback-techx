'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  expeditionLabs,
  getLabDiscoveryProgress,
  ExpeditionLab,
} from '@/lib/expeditionData';
import ExpeditionStatusHeader from './ExpeditionStatusHeader';
import { motion } from 'framer-motion';

export default function RouteSelection() {
  const router = useRouter();
  const { user } = useUser();
  const userEmail = user?.email || 'explorer@field.recon';

  // Strictly 3 primary sectors
  const labList: ExpeditionLab[] = [
    expeditionLabs['1'],
    expeditionLabs['2'],
    expeditionLabs['3'],
  ].filter(Boolean);

  // Compute completed sectors for the header
  const completedSectorsCount = labList.filter((lab) => {
    const progress = getLabDiscoveryProgress(lab.id, userEmail);
    return progress.isCompleted;
  }).length;

  return (
    <div className="relative min-h-[100dvh] w-full text-[#2c1a0e] flex flex-col items-center justify-start py-6 px-3 sm:px-6 overflow-x-hidden font-['Georgia'] select-none">
      {/* Original Parchment Map Background */}
      <div
        style={{ backgroundImage: `url('/assets/images/expedition_map_bg.jpg')` }}
        className="fixed inset-0 w-full h-full bg-cover bg-center pointer-events-none z-0"
      />

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-[460px] mx-auto flex flex-col items-center gap-5">
        {/* Expedition Status Header Plaque */}
        <ExpeditionStatusHeader
          completedCount={completedSectorsCount}
          totalCount={labList.length}
        />

        {/* 3 Sector Expedition Cards */}
        <div className="w-full flex flex-col gap-4">
          {labList.map((lab, index) => {
            const progress = getLabDiscoveryProgress(lab.id, userEmail);
            const isCompleted = progress.isCompleted;

            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                className="relative w-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.85)] cursor-pointer group"
                onClick={() => router.push(`/labs/${lab.id}`)}
              >
                {/* Torn Parchment Dossier Plaque */}
                <div
                  style={{
                    backgroundImage: `url('/assets/images/torn-card-bg.png')`,
                  }}
                  className="relative w-full bg-[length:100%_100%] bg-no-repeat bg-center p-5 sm:p-6 flex flex-col justify-between min-h-[175px]"
                >
                  {/* Decorative Red Ink Wax Seal for Completed Surveys */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 sm:top-1 sm:right-1 w-12 h-12 pointer-events-none opacity-85 z-20">
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#8b261d] flex items-center justify-center rotate-12 bg-[#8b261d]/10">
                        <span className="text-[9px] font-mono font-bold text-[#8b261d] uppercase tracking-tighter">
                          SEALED
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Header Sub-Row: Sector Tag & Recon Counter */}
                  <div className="flex items-center justify-between border-b border-[#8b6943]/30 pb-1.5 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-[#3d2716] border border-[#7a5214] flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#d4af37]" />
                      </div>
                      <span className="text-[9.5px] sm:text-[10px] font-mono font-extrabold uppercase tracking-[0.2em] text-[#6b4c1b]">
                        Sector // 0{index + 1}
                      </span>
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border border-dashed border-[#8b261d] bg-[#8b261d]/10 text-[#8b261d]">
                        <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider">
                          ✦ Survey Cleared
                        </span>
                      </div>
                    ) : (
                      <div className="px-2 py-0.5 rounded border border-[#7a5214]/40 bg-[#7a5214]/10 text-[#7a5214]">
                        <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider">
                          Recon: {progress.completed}/{progress.total}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Lore Description */}
                  <div className="my-auto py-1">
                    <h2 className="text-lg sm:text-xl font-serif font-bold text-[#241308] tracking-wide uppercase leading-tight group-hover:text-[#522b10] transition-colors">
                      {lab.title}
                    </h2>
                    <p className="text-xs text-[#543d2b] italic leading-relaxed mt-1 line-clamp-2">
                      {lab.subtitle}
                    </p>
                  </div>

                  {/* Navigation Action Button */}
                  <div className="mt-3">
                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/labs/${lab.id}`);
                        }}
                        style={{
                          clipPath:
                            'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                        }}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#2b100b] via-[#4a1c15] to-[#2b100b] text-[#f2dfbe] font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-md transition hover:brightness-125 active:scale-[0.99] flex items-center justify-between border-t border-[#8b261d]/50 font-mono cursor-pointer"
                      >
                        <span>Review {lab.title}</span>
                        <span className="px-2 py-0.5 text-[8px] bg-[#8b261d] text-[#fff0d6] rounded-full border border-[#d6655a]/40 font-bold uppercase tracking-widest">
                          ✦ Sealed
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/labs/${lab.id}`);
                        }}
                        style={{
                          clipPath:
                            'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                        }}
                        className="w-full py-2.5 px-4 bg-gradient-to-b from-[#d4af37] via-[#b38920] to-[#7a5214] text-[#1a0e05] font-bold text-[10px] sm:text-xs uppercase tracking-widest shadow-md transition hover:brightness-110 active:scale-[0.99] flex items-center justify-between border-t border-[#fff3cc]/50 font-mono cursor-pointer"
                      >
                        <span>Enter {lab.title}</span>
                        <span className="text-xs">➔</span>
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}