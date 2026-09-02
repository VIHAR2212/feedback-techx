'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useLabs } from '@/context/LabsContext';
import { expeditionLabs, getSubmittedFeedbackForUser } from '@/lib/expeditionData';

export default function ExpeditionBottomDock() {
  const pathname = usePathname();
  const { user } = useUser();
  const { labs } = useLabs();

  const userEmail = user?.email || 'explorer@field.recon';

  // Do not show on landing page ('/') or admin routes ('/admin/*')
  const shouldHide = !pathname || pathname === '/' || pathname.startsWith('/admin');

  // Strictly 3 primary sectors
  const labList = useMemo(() => {
    return [
      labs['1'] || expeditionLabs['1'],
      labs['2'] || expeditionLabs['2'],
      labs['3'] || expeditionLabs['3'],
    ].filter(Boolean);
  }, [labs]);

  const [submittedIds, setSubmittedIds] = useState<string[]>([]);

  const updateSubmitted = useCallback(() => {
    if (typeof window !== 'undefined' && userEmail) {
      setSubmittedIds(getSubmittedFeedbackForUser(userEmail));
    }
  }, [userEmail]);

  useEffect(() => {
    updateSubmitted();

    const handleUpdate = () => updateSubmitted();
    window.addEventListener('storage', handleUpdate);
    window.addEventListener('feedbackSubmitted', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('feedbackSubmitted', handleUpdate);
    };
  }, [updateSubmitted]);

  // Compute total and completed checkpoints
  const totalCheckpoints = useMemo(() => {
    return labList.reduce((acc, lab) => acc + (lab.checkpoints?.length || 0), 0);
  }, [labList]);

  const completedCheckpoints = useMemo(() => {
    return labList.reduce((acc, lab) => {
      const cps = lab.checkpoints || [];
      return acc + cps.filter((cp) => submittedIds.includes(cp.id)).length;
    }, 0);
  }, [labList, submittedIds]);

  const overallPercentage = useMemo(() => {
    return totalCheckpoints > 0
      ? Math.round((completedCheckpoints / totalCheckpoints) * 100)
      : 0;
  }, [completedCheckpoints, totalCheckpoints]);

  const [isImpacting, setIsImpacting] = useState(false);
  const impactTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleImpact = () => {
      setIsImpacting(true);
      if (impactTimeoutRef.current) clearTimeout(impactTimeoutRef.current);
      impactTimeoutRef.current = setTimeout(() => {
        setIsImpacting(false);
      }, 220);
    };

    window.addEventListener('coinImpacted', handleImpact);
    return () => {
      window.removeEventListener('coinImpacted', handleImpact);
      if (impactTimeoutRef.current) clearTimeout(impactTimeoutRef.current);
    };
  }, []);

  if (shouldHide) {
    return null;
  }

  const clampedPercentage = Math.max(0, Math.min(100, overallPercentage));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto px-3 pb-2 sm:pb-2.5 pt-1 select-none">
      <div
        className={`max-w-[480px] mx-auto bg-gradient-to-b from-[#2a160a]/95 via-[#1c0d05]/98 to-[#100702] border-2 border-[#8c6d23] rounded-2xl shadow-[0_-8px_32px_rgba(0,0,0,0.95)] px-3.5 sm:px-4 py-2 sm:py-2.5 backdrop-blur-md transition-all duration-200 ${
          isImpacting ? 'ring-2 ring-[#ffd700]/70 shadow-[0_-8px_36px_rgba(234,179,8,0.5)] scale-[1.01]' : ''
        }`}
      >
        {/* Header row with Antique Labels */}
        <div className="flex items-center justify-between text-[9.5px] sm:text-[11px] font-mono font-extrabold uppercase tracking-widest text-[#fef08a] mb-1.5 px-0.5">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className={`w-3.5 h-3.5 sm:w-4 sm:h-4 relative shrink-0 transition-transform duration-150 ${isImpacting ? 'scale-125' : ''}`}>
              <Image
                src="/assets/images/avery-pirate-coin.webp"
                alt="Pirate Coin"
                fill
                sizes="16px"
                className="object-contain drop-shadow-[0_0_4px_#eab308]"
              />
            </div>
            <span className="drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] truncate">
              Overall Logged: {completedCheckpoints}/{totalCheckpoints}
            </span>
          </div>
          <span className={`text-[#f87171] font-black tracking-wider drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] shrink-0 transition-transform duration-150 ${isImpacting ? 'scale-110 text-[#fde047]' : ''}`}>
            {overallPercentage}% RATED
          </span>
        </div>

        {/* Progress Bar Container with Sliding Avery Pirate Coin */}
        <div className="relative w-full py-0.5">
          {/* Thick Recessed Explorer Gauge Bar */}
          <div className={`relative w-full h-3.5 sm:h-4.5 rounded-full bg-[#0d0602] border-2 border-[#8c6d23]/90 p-[2px] shadow-[inset_0_2px_6px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-150 ${isImpacting ? 'border-[#ffd700]' : ''}`}>
            <div
              style={{ width: `${clampedPercentage}%` }}
              className={`h-full rounded-full bg-gradient-to-r from-[#a17c2f] via-[#eab308] to-[#fde047] shadow-[0_0_12px_rgba(234,179,8,0.9)] transition-all duration-700 ease-out relative ${
                isImpacting ? 'brightness-125 shadow-[0_0_18px_rgba(255,215,0,1)]' : ''
              }`}
            >
              {/* Highlight sheen for 3D gauge glass effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-white/35 to-transparent rounded-full pointer-events-none" />
            </div>
          </div>

          {/* Sliding Avery Pirate Coin Marker */}
          <div
            id="expedition-coin-marker"
            style={{
              left: `${clampedPercentage}%`,
            }}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none transition-all duration-700 ease-out z-10"
          >
            <div className={`w-7 h-7 sm:w-8 sm:h-8 relative drop-shadow-[0_4px_10px_rgba(0,0,0,0.95)] transition-transform duration-150 ${isImpacting ? 'scale-135 brightness-125 drop-shadow-[0_0_16px_rgba(255,215,0,1)]' : ''}`}>
              <Image
                src="/assets/images/avery-pirate-coin.webp"
                alt="Avery Pirate Coin Progress Marker"
                fill
                sizes="32px"
                className="object-contain drop-shadow-[0_0_10px_rgba(234,179,8,0.85)]"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
