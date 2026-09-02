'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useLabs } from '@/context/LabsContext';
import {
  expeditionLabs,
  getSubmittedFeedbackForUser,
  ExpeditionLab,
} from '@/lib/expeditionData';
import ExpeditionStatusHeader from './ExpeditionStatusHeader';
import TreasureCard from './TreasureCard';
import BackButton from './BackButton';
import { motion } from 'framer-motion';

export default function RouteSelection() {
  const router = useRouter();
  const { user } = useUser();
  const userEmail = user?.email || 'explorer@field.recon';
  useLabs(); // re-render dynamically when admin edits labs
  const [feedbackVersion, setFeedbackVersion] = useState(0);

  // Listen for feedback submissions across tabs or components
  useEffect(() => {
    const handleFeedbackUpdate = () => {
      setFeedbackVersion((v) => v + 1);
    };
    window.addEventListener('feedbackSubmitted', handleFeedbackUpdate);
    window.addEventListener('storage', handleFeedbackUpdate);
    return () => {
      window.removeEventListener('feedbackSubmitted', handleFeedbackUpdate);
      window.removeEventListener('storage', handleFeedbackUpdate);
    };
  }, []);

  // Strictly 3 primary sectors
  const labList: ExpeditionLab[] = [
    expeditionLabs['1'],
    expeditionLabs['2'],
    expeditionLabs['3'],
  ].filter(Boolean);

  // localStorage is read in an effect (not during render) so the server
  // render and first client paint agree — no hydration mismatch.
  const [submittedIds, setSubmittedIds] = useState<string[]>([]);
  useEffect(() => {
    setSubmittedIds(getSubmittedFeedbackForUser(userEmail));
  }, [userEmail]);

  const perLabProgress = useMemo(() => {
    const map: Record<string, { completed: number; total: number; percentage: number; isCompleted: boolean }> = {};
    for (const lab of labList) {
      const cps = lab.checkpoints || [];
      const completed = cps.filter((cp) => submittedIds.includes(cp.id)).length;
      map[lab.id] = {
        completed,
        total: cps.length,
        percentage: cps.length > 0 ? Math.round((completed / cps.length) * 100) : 0,
        isCompleted: cps.length > 0 && completed === cps.length,
      };
    }
    return map;
  }, [labList, submittedIds]);

  // Compute completed sectors and checkpoints for the header
  const totalCheckpoints = labList.reduce((acc, lab) => acc + (lab.checkpoints?.length || 0), 0);
  const completedCheckpoints = labList.reduce((acc, lab) => {
    return acc + (perLabProgress[lab.id]?.completed || 0);
  }, 0);

  const completedSectorsCount = labList.filter((lab) => perLabProgress[lab.id]?.isCompleted).length;

  const overallPercentage =
    totalCheckpoints > 0 ? Math.round((completedCheckpoints / totalCheckpoints) * 100) : 0;


  const [activeLabId, setActiveLabId] = useState<string>('1');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('last_active_expedition_lab');
      if (stored) {
        setActiveLabId(stored);
      } else {
        const firstIncomplete =
          labList.find((lab) => {
            const progress = perLabProgress[lab.id];
            return !progress?.isCompleted;
          })?.id || '1';
        setActiveLabId(firstIncomplete);
      }
    }
  }, [userEmail, feedbackVersion, labList, perLabProgress]);

  const handleEnterLab = (labId: string) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('last_active_expedition_lab', labId);
      } catch {}
    }
    router.push(`/labs/${labId}`);
  };

  return (
    <div className="relative min-h-[100dvh] w-full text-[#2c1a0e] flex flex-col items-center justify-start pt-6 pb-28 sm:pb-32 px-3 sm:px-6 overflow-x-hidden font-['Georgia'] select-none">
      {/* Original Parchment Map Background */}
      <div
        style={{ backgroundImage: `url('/assets/images/expedition_map_bg.jpg')` }}
        className="fixed inset-0 w-full h-full bg-cover bg-center pointer-events-none z-0"
      />

      {/* Content Wrapper */}
      <div className="relative z-10 w-full max-w-[480px] mx-auto flex flex-col items-center gap-5">
        <div className="w-full flex justify-start">
          <BackButton to="/" label="Home" />
        </div>

        {/* Expedition Status Header Plaque */}
        <ExpeditionStatusHeader
          completedCount={completedSectorsCount}
          totalCount={labList.length}
        />

        {/* 3 Sector Expedition Cards */}
        <div className="w-full flex flex-col gap-4">
          {labList.map((lab, index) => {
            const progress = perLabProgress[lab.id] || {
              completed: 0,
              total: 0,
              percentage: 0,
              isCompleted: false,
            };
            const isCompleted = progress.isCompleted;
            const sectorPercent = progress.percentage;

            const environmentTag =
              lab.themeType === 'frost'
                ? '❄️ GLACIAL FJORD // ICE'
                : lab.themeType === 'volcano'
                  ? '🌋 VOLCANIC CALDERA // MAGMA'
                  : '🌿 JUNGLE CANOPY // RUINS';

            return (
              <motion.div
                key={lab.id}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                className="relative w-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.88)] cursor-pointer group"
                onClick={() => handleEnterLab(lab.id)}
              >
                {/* Torn Parchment Dossier Plaque with Inset Safe Zone */}
                <div
                  style={{
                    backgroundImage: `url('/assets/images/torn-card-bg.webp')`,
                  }}
                  className="relative w-full bg-[length:100%_100%] bg-no-repeat bg-center px-10 sm:px-12 py-6 sm:py-7 flex flex-col justify-between min-h-[200px] text-[#241308]"
                >
                  {/* Centered Large Ink Stamp with Paper Grain Bleed */}
                  {isCompleted && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20 select-none overflow-visible">
                      <div className="w-[280px] h-[280px] sm:w-[340px] sm:h-[340px] md:w-[390px] md:h-[390px] -rotate-[12deg] opacity-[0.82] mix-blend-multiply transition-transform">
                        <Image
                          src="/assets/images/stamp.webp"
                          alt="Survey Cleared Stamp"
                          width={500}
                          height={500}
                          priority
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}

                  {/* Header Sub-Row: Sector Tag & Recon Counter */}
                  <div className="flex items-center justify-between border-b border-[#8b6943]/35 pb-1.5 mb-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-3 h-3 rounded-full bg-[#24140a] border border-[#8c6d23] flex items-center justify-center shrink-0">
                        <div className="w-1 h-1 rounded-full bg-[#d4af37]" />
                      </div>
                      <span className="text-[9.5px] sm:text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#6b4516] truncate">
                        {environmentTag}
                      </span>
                    </div>

                    {!isCompleted && (
                      <div className="px-2 py-0.5 rounded border border-[#7a481c]/40 bg-[#7a481c]/10 text-[#7a481c] shrink-0">
                        <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider">
                          Recon: {progress.completed}/{progress.total}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title & Lore Description */}
                  <div className="my-auto py-1">
                    <h2 className="text-xl sm:text-2xl font-bold font-['EB_Garamond',_serif] text-[#1c0f05] tracking-tight leading-snug group-hover:text-[#522b10] transition-colors drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                      {lab.name}: {lab.title}
                    </h2>
                    <p className="text-sm sm:text-base text-[#3d200e] font-[family-name:var(--font-handwriting)] font-bold italic leading-snug mt-1 line-clamp-2">
                      &quot;{lab.subtitle}&quot;
                    </p>
                  </div>

                  {/* Mini Sector Progress Track */}
                  <div className="my-1.5 w-full flex flex-col gap-1">
                    <div className="flex items-center justify-between text-[8px] sm:text-[8.5px] font-mono font-bold uppercase text-[#7a481c]">
                      <span>Checkpoints Rated: {progress.completed}/{progress.total}</span>
                      <span>{sectorPercent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#241308]/15 border border-[#7a481c]/25 overflow-hidden">
                      <div
                        style={{ width: `${Math.max(3, sectorPercent)}%` }}
                        className="h-full rounded-full bg-gradient-to-r from-[#b38920] to-[#ffd700] transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Navigation Action Button */}
                  <div className="mt-1">
                    {isCompleted ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnterLab(lab.id);
                        }}
                        style={{
                          clipPath:
                            'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                        }}
                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#2b100b] via-[#4a1c15] to-[#2b100b] text-[#f2dfbe] font-bold text-[11px] sm:text-xs uppercase tracking-widest shadow-md transition hover:brightness-125 active:scale-[0.99] flex items-center justify-between border-t border-[#8b261d]/50 font-['Cinzel',_serif] cursor-pointer"
                      >
                        <span>Review {lab.title}</span>
                        <span className="px-2 py-0.5 text-[8.5px] bg-[#8b261d] text-[#fff0d6] rounded-full border border-[#d6655a]/40 font-mono font-bold uppercase tracking-widest">
                          ✦ Sealed
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnterLab(lab.id);
                        }}
                        style={{
                          clipPath:
                            'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                        }}
                        className="w-full py-2.5 px-4 bg-gradient-to-b from-[#d4af37] via-[#b38920] to-[#7a5214] text-[#140802] font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-md transition hover:brightness-110 active:scale-[0.99] flex items-center justify-between border-t border-[#fff3cc]/60 font-['Cinzel',_serif] cursor-pointer"
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

          {/* Unlockable 7-Project Milestone Treasure Card */}
          <TreasureCard
            completedCount={completedCheckpoints}
            targetCount={7}
            userEmail={userEmail}
            currentLabId={activeLabId}
          />
        </div>
      </div>
    </div>
  );
}