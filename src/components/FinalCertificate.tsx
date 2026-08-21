'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useLabs } from '@/context/LabsContext';
import { expeditionLabs } from '@/lib/expeditionData';
import ImageWithFallback from './ImageWithFallback';
import { motion } from 'framer-motion';

export default function FinalCertificate() {
  const router = useRouter();
  const { user } = useUser();
  useLabs(); // re-render when admin edits labs (data flows via expeditionLabs cache)
  const [fused, setFused] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFused(true);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="max-w-[540px] mx-auto p-4 pb-[max(2rem,env(safe-area-inset-bottom))] min-h-screen flex flex-col justify-center">
      {!fused ? (
        /* Fragment Fusion Animation */
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8 px-4"
        >
          <div className="text-xs sm:text-sm tracking-[3px] text-uc-gold font-mono font-bold uppercase mb-5">
            UNITING CERTIFICATE SEALS...
          </div>
          <div className="flex justify-center gap-3.5 mb-8">
            {Object.values(expeditionLabs).map((lab, i) => (
              <motion.div
                key={lab.labId || lab.id}
                animate={{ rotate: [0, 10, -10, 0], y: [0, -15, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-uc-gold shadow-[0_0_18px_rgba(212,175,55,0.7)]"
              >
                <ImageWithFallback
                  src={lab.fragmentImage || '/assets/images/avery-pirate-coin.png'}
                  alt={lab.fragmentName || lab.title}
                  fallbackTitle={`SEAL ${i + 1}`}
                  fallbackIcon=""
                  aspectRatio="1/1"
                />
              </motion.div>
            ))}
          </div>
          <p className="text-sm sm:text-base text-[#D8C3A5] font-serif">
            Forging official TechX Expedition Certificate of Discovery...
          </p>
        </motion.div>
      ) : (
        /* Official Uncharted Certificate Display */
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="p-6 sm:p-8 rounded-xl relative text-center bg-uc-parchment text-[#2A2017] border-2 border-uc-brass shadow-2xl"
        >
          {/* Top Stamp Header */}
          <div className="absolute top-3.5 right-3.5 border-2 border-emerald-900 text-emerald-900 text-[0.62rem] sm:text-xs font-mono font-bold py-0.5 px-2 -rotate-6 tracking-wider">
            VERIFIED // TECHX 2025
          </div>

          <div className="text-[0.68rem] sm:text-xs tracking-[3px] text-[#705637] font-mono font-bold uppercase">
            TECHX RESEARCH EXPEDITION
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl text-[#2A2017] my-2 mb-4 font-uncharted tracking-widest">
            CERTIFICATE OF DISCOVERY
          </h1>

          <p className="text-sm sm:text-base text-[#584937] mb-3 font-serif">
            This certifies that field explorer
          </p>

          {/* Explorer Name Display */}
          <div className="text-xl sm:text-2xl font-bold text-uc-blood font-uncharted border-b-2 border-uc-brass pb-2 mb-3 tracking-wider">
            {user?.name || 'Valued Explorer'}
          </div>

          <div className="text-xs sm:text-sm text-[#584937] mb-3 font-serif">
            Department: <strong className="text-[#2A2017]">{user?.department || 'Research'}</strong> ({user?.email || 'Field Agent'})
          </div>

          <p className="text-xs sm:text-sm text-[#584937] mb-5 leading-relaxed font-serif">
            has successfully surveyed all 3 uncharted research sectors (The Archive, The Forge, and The Vault) and contributed field observations across all showcased product innovations.
          </p>

          {/* Completed Lab Seals */}
          <div className="grid grid-cols-3 gap-2.5 mb-5 bg-[#E6D8B8] p-3.5 rounded-md border border-uc-brass/60">
            {Object.values(expeditionLabs).map((lab, idx) => (
              <div key={lab.labId || lab.id} className="text-center flex flex-col items-center">
                <div className="w-6 h-6 rounded-full bg-[#7a5214]/20 border border-[#7a5214]/50 flex items-center justify-center text-[10px] font-serif font-bold text-[#4a3014]">
                  {['I', 'II', 'III'][idx] || idx + 1}
                </div>
                <div className="text-[0.68rem] sm:text-xs font-bold text-[#2A2017] mt-1 font-uncharted truncate max-w-full">
                  {lab.title}
                </div>
                <div className="text-[0.6rem] sm:text-[0.65rem] text-emerald-900 font-bold font-mono">SEALED ✦</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-[#705637] mb-5 font-mono">
            DATE OF ISSUE: {currentDate}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => router.push('/leaderboard')}
              className="w-full py-3.5 px-4 bg-gradient-to-b from-[#E6C265] via-[#C49219] to-[#8A6008] border border-[#4A3305] rounded-md text-[#231303] font-mono text-xs sm:text-sm font-extrabold uppercase tracking-wider cursor-pointer shadow-[0_3px_8px_rgba(0,0,0,0.4)] active:scale-[0.98] transition-transform touch-manipulation flex items-center justify-center gap-2"
            >
              <span>VIEW EXPEDITION LEADERBOARD</span>
              <span>➔</span>
            </button>

            <button
              onClick={() => router.push('/labs')}
              className="w-full py-3 px-4 bg-[#1C1510] text-[#F4ECD8] border border-uc-brass/70 rounded-md text-xs sm:text-sm font-mono font-bold tracking-wider uppercase cursor-pointer active:scale-[0.98] transition-transform touch-manipulation flex items-center justify-center gap-2"
            >
              <span>RETURN TO ROUTE MAP</span>
              <span>➔</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
