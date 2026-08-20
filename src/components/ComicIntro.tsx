'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from './ImageWithFallback';
import { comicAssets } from '@/lib/expeditionData';

interface ComicIntroProps {
  onComplete: () => void;
}

type Step = 'sky' | 'plane' | 'jump' | 'fall';

export default function ComicIntro({ onComplete }: ComicIntroProps) {
  const [step, setStep] = useState<Step>('sky');

  const nextStep = () => {
    if (step === 'sky') setStep('plane');
    else if (step === 'plane') setStep('jump');
    else if (step === 'jump') setStep('fall');
    else if (step === 'fall') onComplete();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-[#0c0e10] text-uc-cream overflow-hidden flex flex-col">
      {/* Top Navigation Overlay */}
      <div className="absolute top-[max(12px,env(safe-area-inset-top))] left-4 right-4 z-10 flex justify-between items-center pointer-events-auto">
        <div className="font-sans text-xs tracking-[3px] text-uc-gold font-bold drop-shadow-[0_2px_4px_#000]">
          EXPEDITION RECON // LOG 001
        </div>
        <button
          type="button"
          onClick={onComplete}
          className="bg-[#1c1510]/85 text-uc-gold border border-[#A07A28] rounded px-3.5 py-1.5 text-xs font-sans font-bold tracking-[1px] cursor-pointer min-h-[36px] touch-manipulation hover:bg-black/60 transition-colors"
        >
          SKIP RECON ⏩
        </button>
      </div>

      {/* Main Panel Animation Container */}
      <div className="relative flex-1 w-full h-full">
        <AnimatePresence mode="wait">
          {/* PANEL 01: SKY */}
          {step === 'sky' && (
            <motion.div
              key="sky"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full"
            >
              <ImageWithFallback
                src={comicAssets.sky}
                alt="Sky Opening"
                fallbackTitle="PANEL 01: HIGH ALTITUDE DISCOVERY"
                fallbackIcon="☁️"
              />

              <motion.div
                animate={{ x: [-20, 20, -20] }}
                transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,0.06)_0%,transparent_60%)]"
              />

              <div className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-4 right-4 text-center bg-gradient-to-t from-[#0c0e10]/95 via-[#0c0e10]/70 to-transparent pt-8 px-5 pb-5 rounded-xl border border-uc-gold/30">
                <h1 className="text-3xl text-uc-gold mb-1 font-uncharted tracking-[3px]">
                  UNCHARTED EXPEDITION
                </h1>
                <p className="text-base text-stone-300 mb-5 font-serif">
                  A high-altitude aerial drop over forgotten product research territories.
                </p>
                <button
                  type="button"
                  onClick={nextStep}
                  className="uncharted-btn-gold w-full max-w-[340px] py-3 px-6 text-base font-bold tracking-wider uppercase rounded cursor-pointer touch-manipulation mx-auto block"
                >
                  ENTER EXPEDITION ✈️
                </button>
              </div>
            </motion.div>
          )}

          {/* PANEL 02: PLANE */}
          {step === 'plane' && (
            <motion.div
              key="plane"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, y: -50 }}
              transition={{ duration: 0.5 }}
              className="relative w-full h-full"
            >
              <ImageWithFallback
                src={comicAssets.plane}
                alt="Inside Plane"
                fallbackTitle="PANEL 02: CARGO HOLD OVERFLIGHT"
                fallbackIcon="🛩️"
              />

              <motion.div
                animate={{ y: [-2, 2, -2] }}
                transition={{ duration: 0.25, repeat: Infinity, ease: 'linear' }}
                className="absolute inset-0 pointer-events-none border-[3px] border-uc-gold/25"
              />

              <div className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-4 right-4 text-center bg-gradient-to-t from-[#0c0e10]/95 via-[#0c0e10]/70 to-transparent pt-8 px-5 pb-5 rounded-xl border border-uc-gold/30">
                <h2 className="text-2xl text-uc-gold mb-1 font-uncharted tracking-[2px]">
                  CARGO HOLD 04
                </h2>
                <p className="text-base text-uc-cream mb-5 font-serif">
                  Aged map fragments have scattered over the research coordinates below!
                </p>
                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full max-w-[340px] py-3 px-6 bg-[#A04A2C] hover:bg-[#8e3f24] text-white border border-[#E07A5F] rounded text-base font-sans font-bold tracking-[1.5px] uppercase cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.6)] touch-manipulation mx-auto block transition-colors"
                >
                  PREPARE TO DROP 🪂
                </button>
              </div>
            </motion.div>
          )}

          {/* PANEL 03: JUMP */}
          {step === 'jump' && (
            <motion.div
              key="jump"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1.05 }}
              exit={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full"
            >
              <ImageWithFallback
                src={comicAssets.jump}
                alt="Character Jump"
                fallbackTitle="PANEL 03: AIRBORNE DESCENT"
                fallbackIcon="💥"
              />

              <div className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-4 right-4 text-center bg-gradient-to-t from-[#0c0e10]/95 via-[#0c0e10]/70 to-transparent pt-8 px-5 pb-5 rounded-xl border border-uc-gold/30">
                <h2 className="text-2xl text-uc-gold mb-1 font-uncharted tracking-[2px]">
                  FREE FALL DESCENT
                </h2>
                <p className="text-base text-uc-cream mb-5 font-serif">
                  Plunging directly toward the uncharted research territory...
                </p>
                <button
                  type="button"
                  onClick={nextStep}
                  className="uncharted-btn-gold w-full max-w-[340px] py-3 px-6 text-base font-bold tracking-wider uppercase rounded cursor-pointer touch-manipulation mx-auto block"
                >
                  RECOVER FRAGMENTS ➔
                </button>
              </div>
            </motion.div>
          )}

          {/* PANEL 04: FALL & FRAGMENTS */}
          {step === 'fall' && (
            <motion.div
              key="fall"
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 2 }}
              transition={{ duration: 0.6 }}
              className="relative w-full h-full"
            >
              <ImageWithFallback
                src={comicAssets.fall}
                alt="Falling Map Fragments"
                fallbackTitle="PANEL 04: RECOVERING MAP SEALS"
                fallbackIcon="MAP"
              />

              <motion.div
                animate={{ y: [-15, 15, -15], rotate: [-5, 5, -5] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-1/4 left-[15%] w-16 h-16 pointer-events-none"
              >
                <ImageWithFallback
                  src={comicAssets.compass}
                  alt="Compass"
                  fallbackTitle="COMPASS"
                  fallbackIcon="COMPASS"
                  aspectRatio="1/1"
                />
              </motion.div>

              <motion.div
                animate={{ y: [15, -15, 15], rotate: [8, -8, 8] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-[40%] right-[15%] w-[72px] h-[72px] pointer-events-none"
              >
                <ImageWithFallback
                  src={comicAssets.mapFragment}
                  alt="Fragment"
                  fallbackTitle="MAP"
                  fallbackIcon="SEAL"
                  aspectRatio="1/1"
                />
              </motion.div>

              <div className="absolute bottom-[max(2rem,env(safe-area-inset-bottom))] left-4 right-4 text-center bg-gradient-to-t from-[#0c0e10]/95 via-[#0c0e10]/70 to-transparent pt-8 px-5 pb-5 rounded-xl border border-uc-gold/30">
                <h2 className="text-2xl text-uc-gold mb-1 font-uncharted tracking-[2px]">
                  SECTOR MAP RETRIEVED
                </h2>
                <p className="text-base text-uc-cream mb-5 font-serif">
                  Initialize your field dossier to unlock the expedition sectors!
                </p>
                <button
                  type="button"
                  onClick={onComplete}
                  className="uncharted-btn-gold w-full max-w-[340px] py-3 px-6 text-base font-bold tracking-wider uppercase rounded cursor-pointer touch-manipulation mx-auto block"
                >
                  OPEN FIELD DOSSIER ➔
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
