'use client';

import React, { useContext, useEffect } from 'react';
import Image from 'next/image';
import { AchievementsContext, AchievementDispatchContext, Achievement } from '@/context/AchievementContext';

// This is the component for a single popup
const SingleAchievement = ({ achievement }: { achievement: Achievement }) => {
  const setAchievements = useContext(AchievementDispatchContext);
  const { id, title, subtitle, imageUrl, duration = 3 } = achievement;

  // Handles the auto-removal by updating the state array.
  useEffect(() => {
    const totalDuration = (duration + 0.5) * 1000;
    const timer = setTimeout(() => {
      setAchievements?.(prev => prev.filter(a => a.id !== id));
    }, totalDuration);

    return () => clearTimeout(timer);
  }, [id, duration, setAchievements]);

  return (
    <div
      className="w-[360px] max-w-[calc(100vw-2rem)] bg-gradient-to-b from-[#1C1510] to-[#120E0B] text-uc-cream border border-uc-gold/80 rounded-md overflow-hidden flex items-center shadow-[0_10px_24px_rgba(0,0,0,0.85)] font-sans text-sm pointer-events-auto origin-top-right transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      <div className="shrink-0 w-[58px] h-[58px] m-2 rounded-[3px] bg-black/90 grid place-items-center shadow-[inset_0_-2px_6px_rgba(0,0,0,0.6)]">
        <Image
          src={imageUrl || '/images/default-icon.png'}
          alt=""
          width={48}
          height={48}
          className="w-11 h-11 object-contain"
        />
      </div>
      <div className="py-2 px-3 flex flex-col justify-center gap-0.5">
        <div className="text-[#ffeb57] font-bold text-[15px] leading-none drop-shadow-[0_1px_0_rgba(0,0,0,0.6)]">
          {title}
        </div>
        <div className="text-stone-300 text-[13px] opacity-95">
          {subtitle}
        </div>
      </div>
    </div>
  );
};

// This is the main manager component that renders the list of popups
export default function AchievementManager() {
  const achievements = useContext(AchievementsContext);

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2.5 pointer-events-none">
      {achievements.map(achievement => (
        <SingleAchievement key={achievement.id} achievement={achievement} />
      ))}
    </div>
  );
}