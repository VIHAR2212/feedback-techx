'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { LABS } from '@/lib/mock-data';
import { loadExpeditionUser } from '@/lib/expedition-storage';
import { cn } from '@/lib/utils';
import BackButton from '@/components/BackButton';
import TreasureHunt from './TreasureHunt';

interface InteractiveTreasureMapProps {
  snapshot: ReturnType<typeof loadExpeditionUser>;
  user: { name: string; email: string; department: string };
  logout: () => void;
}

interface CheckpointDef {
  labId: string;
  title: string;
  subtitle: string;
  region: string;
  xPct: number;
  yPct: number;
  gemName: string;
  gemIcon: string;
  gemColor: string;
}

const CHECKPOINTS: CheckpointDef[] = [
  {
    labId: 'a',
    title: 'Checkpoint A',
    subtitle: 'Mountain Pass',
    region: 'Horn Mountains',
    xPct: 20.5,
    yPct: 71.5,
    gemName: 'Emerald Shard',
    gemIcon: '💎',
    gemColor: '#059669',
  },
  {
    labId: 'b',
    title: 'Checkpoint B',
    subtitle: 'Lost Temple',
    region: 'Long Desert',
    xPct: 47.0,
    yPct: 36.0,
    gemName: 'Sapphire Shard',
    gemIcon: '🔷',
    gemColor: '#2563eb',
  },
  {
    labId: 'c',
    title: 'Checkpoint C',
    subtitle: 'Coastal Ruins',
    region: 'Dark Island Cape',
    xPct: 74.8,
    yPct: 47.5,
    gemName: 'Ruby Shard',
    gemIcon: '♦️',
    gemColor: '#dc2626',
  },
];

const RED_X = {
  xPct: 85.5,
  yPct: 74.5,
  name: 'Lost Treasure Site',
  region: 'Dragon Bay Shoals',
};

export default function InteractiveTreasureMap({
  snapshot,
  user,
  logout,
}: InteractiveTreasureMapProps) {
  const [activePopup, setActivePopup] = useState<string | null>(null);
  const [showTreasureModal, setShowTreasureModal] = useState(false);

  const activeCheckpoint = CHECKPOINTS.find((cp) => cp.labId === activePopup);
  const activeLab = activeCheckpoint
    ? LABS.find((l) => l.labId === activeCheckpoint.labId)
    : null;
  const activeLabCompletedCount =
    activeLab?.products.filter((p) => snapshot.completedProducts.includes(p.id))
      .length || 0;
  const activeLabUnlocked = activeCheckpoint
    ? snapshot.unlockedLabs.includes(activeCheckpoint.labId)
    : false;
  const activeLabShardEarned = activeCheckpoint
    ? snapshot.completedLabs.includes(activeCheckpoint.labId)
    : false;

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-[#0c0805] select-none">
      {/* Warm Ambient Map Canvas Layer with Increased Legibility and Sunlight Grading */}
      <div
        className="absolute inset-0 w-full h-full transition-all"
        style={{
          backgroundImage: "url('/textures/treasure-map.jpg')",
          backgroundSize: '100% 100%',
          backgroundPosition: 'center',
          filter: 'brightness(0.80) contrast(1.15) saturate(1.05) sepia(0.16)',
        }}
      />

      {/* Atmospheric Cinematic Soft Vignette & Candlelight Shadows */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-black/45" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,transparent_40%,rgba(0,0,0,0.52)_90%)]" />

      {/* Top Floating Cartographer Header Pill - Mobile Responsive */}
      <header className="absolute top-3 sm:top-4 left-3 sm:left-4 right-3 sm:right-4 z-40 mx-auto max-w-6xl flex items-center justify-between pointer-events-none gap-2">
        {/* Title Badge */}
        <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 rounded-full border border-amber-500/25 bg-[#120a06]/95 px-3 py-1.5 sm:px-4 sm:py-2 shadow-[0_10px_35px_rgba(0,0,0,0.95)] backdrop-blur-md">
          <BackButton to="/labs" label="Labs" />
          <div className="flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-amber-500/15 border border-amber-400/40 shadow-[0_0_10px_rgba(245,158,11,0.2)] animate-spin-slow">
            <span className="text-sm sm:text-lg">🧭</span>
          </div>
          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[8px] sm:text-[10px] font-cinzel font-bold uppercase tracking-[0.25em] text-amber-300/70">
                ✦ Cartographer&apos;s Chart ✦
              </span>
            </div>
            <h1 className="font-uncharted text-base sm:text-2xl font-extrabold text-[#dfcfb3] leading-none drop-shadow-[0_2px_8px_rgba(0,0,0,0.95)]">
              Expedition Map
            </h1>
          </div>
        </div>

        {/* Explorer Profile & Rankings */}
        <div className="pointer-events-auto flex items-center gap-1.5 sm:gap-3 rounded-full border border-amber-500/25 bg-[#120a06]/95 px-2.5 py-1.5 sm:px-4 sm:py-2 shadow-[0_10px_35px_rgba(0,0,0,0.95)] backdrop-blur-md text-xs font-cinzel">
          <div className="hidden md:flex flex-col text-right">
            <span className="font-bold text-[#dfcfb3] tracking-wider text-xs">
              {user.name}
            </span>
            <span className="text-[9px] font-mono text-amber-200/60">
              {user.department}
            </span>
          </div>

          <Link
            href="/leaderboard"
            className="rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 sm:px-3.5 py-1 sm:py-1.5 font-bold uppercase tracking-wider text-[#dfcfb3] shadow hover:bg-amber-500/25 transition-all text-[10px] sm:text-[11px]"
          >
            Rankings
          </Link>

          <button
            onClick={logout}
            className="rounded-full border border-stone-700 bg-stone-900/90 px-2.5 sm:px-3 py-1 sm:py-1.5 text-stone-400 hover:text-[#dfcfb3] hover:bg-stone-800 transition-all cursor-pointer text-[10px] sm:text-[11px]"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* SVG COMPLEX DARK INK DOTTED EXPEDITION PATHS & TRAILS    */}
      {/* ======================================================== */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full z-10"
        viewBox="0 0 1000 1000"
        preserveAspectRatio="none"
      >
        <defs>
          <filter id="inkShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="#ffffff" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* 1. BACKGROUND CARTOGRAPHIC EXPLORATION ROUTES */}
        <path
          d="M 120 180 C 190 230, 240 160, 310 200 S 410 180, 480 230 T 620 190"
          fill="none"
          stroke="#170b04"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
          opacity="0.65"
        />

        <path
          d="M 80 480 C 130 420, 180 490, 240 440 S 310 490, 380 430"
          fill="none"
          stroke="#170b04"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
          opacity="0.65"
        />

        <path
          d="M 640 180 C 710 130, 770 210, 830 160 S 890 220, 950 170"
          fill="none"
          stroke="#170b04"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
          opacity="0.65"
        />

        <path
          d="M 450 780 C 510 740, 560 820, 630 760 S 710 810, 780 770"
          fill="none"
          stroke="#170b04"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Compass Rose Navigational Rhumb Lines */}
        <path d="M 855 745 L 680 720" fill="none" stroke="#170b04" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5" />
        <path d="M 855 745 L 870 580" fill="none" stroke="#170b04" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5" />
        <path d="M 855 745 L 750 870" fill="none" stroke="#170b04" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5" />
        <path d="M 855 745 L 940 760" fill="none" stroke="#170b04" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5" />

        {/* 2. MAIN EXPEDITION PATH (DARK INK DASHED LINE) */}
        <path
          d="M 80 790 C 110 750, 140 780, 170 740 S 185 730, 205 715"
          fill="none"
          stroke="#140903"
          strokeWidth="3.5"
          strokeDasharray="6 8"
          strokeLinecap="round"
          filter="url(#inkShadow)"
          opacity="0.85"
        />

        <path
          d="M 205 715 C 225 640, 260 670, 280 610 S 260 550, 310 520 S 370 540, 400 480 S 390 420, 430 390 S 445 375, 470 360"
          fill="none"
          stroke="#140903"
          strokeWidth="4"
          strokeDasharray="7 9"
          strokeLinecap="round"
          filter="url(#inkShadow)"
          opacity="0.95"
        />

        <path
          d="M 470 360 C 510 320, 540 370, 580 340 S 610 390, 650 360 S 670 430, 710 420 S 725 450, 748 475"
          fill="none"
          stroke="#140903"
          strokeWidth="4"
          strokeDasharray="7 9"
          strokeLinecap="round"
          filter="url(#inkShadow)"
          opacity="0.95"
        />

        <path
          d="M 748 475 C 765 530, 795 510, 785 570 S 825 590, 805 650 S 835 680, 820 720 S 840 735, 855 745"
          fill="none"
          stroke="#140903"
          strokeWidth="4"
          strokeDasharray="7 9"
          strokeLinecap="round"
          filter="url(#inkShadow)"
          opacity="0.95"
        />
      </svg>

      {/* ======================================================== */}
      {/* MAP CHECKPOINT PINS (LAB A, LAB B, LAB C)                */}
      {/* ======================================================== */}
      <div className="relative z-20 w-full h-full">
        {CHECKPOINTS.map((cp, idx) => {
          const lab = LABS.find((l) => l.labId === cp.labId) || LABS[idx];
          const completedCount = lab.products.filter((p) =>
            snapshot.completedProducts.includes(p.id)
          ).length;
          const unlocked = snapshot.unlockedLabs.includes(cp.labId);
          const shardEarned = snapshot.completedLabs.includes(cp.labId);
          const isOpen = activePopup === cp.labId;

          return (
            <div
              key={cp.labId}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${cp.xPct}%`, top: `${cp.yPct}%` }}
            >
              <div className="relative flex flex-col items-center">
                {/* 3D Astrolabe / Compass Medallion Pin */}
                <button
                  type="button"
                  onClick={() => setActivePopup(isOpen ? null : cp.labId)}
                  className={cn(
                    'relative z-20 flex flex-col items-center group cursor-pointer transition-all duration-300 p-1 active:scale-95',
                    isOpen ? 'scale-120' : 'hover:scale-115 hover:-translate-y-1'
                  )}
                  style={{
                    filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.95))',
                  }}
                  aria-label={`Inspect ${lab.labName}`}
                >
                  {/* Outer Beveled Brass Rim */}
                  <div
                    className={cn(
                      'relative flex h-13 w-13 sm:h-16 sm:w-16 items-center justify-center rounded-full border-2 p-1 transition-all',
                      shardEarned
                        ? 'border-[#fde047] bg-gradient-to-b from-[#d97706] via-[#78350f] to-[#451a03]'
                        : unlocked
                        ? 'border-amber-300/80 bg-gradient-to-b from-[#92400e] via-[#451a03] to-[#1c0d02]'
                        : 'border-[#57534e] bg-gradient-to-b from-[#292524] via-[#1c1917] to-[#0c0a09]'
                    )}
                    style={{
                      boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.25), 0 8px 20px rgba(0,0,0,0.9)',
                    }}
                  >
                    {/* Inner Glass Lens with Gemstone Relic */}
                    <div className="relative flex h-full w-full items-center justify-center rounded-full bg-[#0f0905] border border-amber-500/20 overflow-hidden shadow-inner">
                      <div className="absolute -top-3 -left-3 h-8 w-8 rounded-full bg-white/20 blur-[2px] pointer-events-none" />

                      <span className="text-xl sm:text-3xl filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                        {shardEarned ? '🛡️' : unlocked ? cp.gemIcon : '🔒'}
                      </span>
                    </div>

                    {/* Corner Guild Badge */}
                    <div
                      className="absolute -top-1 -right-1 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full text-[10px] sm:text-xs font-uncharted font-extrabold text-[#f5eedc] shadow-[0_2px_8px_rgba(0,0,0,0.9)] border-2 border-white/80"
                      style={{ backgroundColor: shardEarned ? '#059669' : cp.gemColor }}
                    >
                      {cp.labId.toUpperCase()}
                    </div>
                  </div>

                  {/* Sharp Needle Point */}
                  <div
                    className="w-0 h-0 border-l-[6px] sm:border-l-[8px] border-l-transparent border-r-[6px] sm:border-r-[8px] border-r-transparent border-t-[10px] sm:border-t-[12px] -mt-1 drop-shadow-[0_4px_4px_rgba(0,0,0,0.8)]"
                    style={{
                      borderTopColor: shardEarned ? '#f59e0b' : unlocked ? '#d97706' : '#57534e',
                    }}
                  />

                  {/* Label under pin */}
                  <span className="mt-1 hidden sm:inline-block rounded bg-[#120a06]/95 border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-cinzel font-bold text-[#dfcfb3] shadow-md">
                    {cp.subtitle}
                  </span>
                </button>

                {/* DESKTOP Popover (Floats anchored to pin above md screens) */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.92 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.92 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="hidden sm:block absolute bottom-20 sm:bottom-24 z-50 w-80 sm:w-96 select-none -translate-x-1/2 left-1/2"
                      style={{
                        filter: 'drop-shadow(0 25px 45px rgba(0,0,0,0.98)) drop-shadow(0 0 25px rgba(0,0,0,0.7))',
                      }}
                    >
                      <div
                        className="relative w-full bg-cover bg-center px-8 py-6 sm:px-10 sm:py-7 text-center"
                        style={{
                          backgroundImage: "url('/textures/wooden-signboard.png')",
                          backgroundSize: '100% 100%',
                          backgroundRepeat: 'no-repeat',
                        }}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePopup(null);
                          }}
                          className="absolute top-3 right-6 text-sm font-bold text-[#3d1903] hover:text-black p-1 cursor-pointer"
                          aria-label="Close popup"
                        >
                          ✕
                        </button>

                        <p className="text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-[0.25em] text-[#3d1903] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                          ✦ {cp.region} • CHECKPOINT {cp.labId.toUpperCase()} ✦
                        </p>
                        <h3 className="font-uncharted text-base sm:text-lg font-black text-[#140802] mt-0.5 leading-tight tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
                          {lab.labName}
                        </h3>

                        <div className="mt-2 flex items-center justify-between text-xs font-serif text-[#1f0e04] bg-[#241205]/15 border border-[#5c3008]/40 rounded-md py-1 px-3 shadow-inner">
                          <span className="flex items-center gap-1.5 font-bold">
                            <span>{cp.gemIcon}</span>
                            <span>{cp.gemName}</span>
                          </span>
                          <span className="font-mono font-bold text-[#140802] bg-[#fbf5e6]/80 px-2 py-0.5 rounded border border-[#5c3008]/30">
                            {completedCount}/{lab.products.length} Products
                          </span>
                        </div>

                        <div className="mt-2.5">
                          {unlocked ? (
                            <Link
                              href={`/expedition/${cp.labId}`}
                              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-amber-300/80 bg-gradient-to-b from-[#2a1306] via-[#1c0c04] to-[#0c0502] py-2 text-xs font-uncharted font-bold uppercase tracking-[0.18em] text-[#dfcfb3] shadow-[0_4px_14px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.3)] hover:scale-[1.02] hover:border-amber-300 hover:brightness-110 transition-all cursor-pointer"
                            >
                              <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                                {shardEarned ? '❖ View Shard & Feedback ➔' : '❖ Give Feedback & Enter ➔'}
                              </span>
                              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-amber-300/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                            </Link>
                          ) : (
                            <div className="rounded-lg bg-[#2b1608]/25 border border-[#542d0a]/50 py-1.5 text-xs font-serif text-[#3d1e06] italic shadow-inner">
                              🔒 Locked • Clear previous checkpoint
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}

        {/* ======================================================== */}
        {/* SUBTLE HAND-DRAWN RED "X" (WITHOUT EXCESSIVE NEON GLOW)  */}
        {/* ======================================================== */}
        <div
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${RED_X.xPct}%`, top: `${RED_X.yPct}%` }}
        >
          <div className="relative flex flex-col items-center">
            <button
              type="button"
              onClick={() => setActivePopup(activePopup === 'treasure-x' ? null : 'treasure-x')}
              className="relative z-20 flex flex-col items-center group cursor-pointer transition-transform duration-300 hover:scale-115 active:scale-95 p-1"
              style={{
                filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.95))',
              }}
              aria-label="Secret Treasure X"
            >
              {/* Hand-painted Dark Crimson Stamped Red X Icon */}
              <div className="relative flex h-12 w-12 sm:h-15 sm:w-15 items-center justify-center rounded-full border border-red-900/60 bg-[#1c0404]/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_4px_12px_rgba(0,0,0,0.9)]">
                <svg viewBox="0 0 100 100" className="w-8 h-8 sm:w-11 sm:h-11 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                  <path
                    d="M 20 20 Q 48 48, 80 80"
                    stroke="#b91c1c"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                  <path
                    d="M 80 20 Q 50 50, 20 80"
                    stroke="#b91c1c"
                    strokeWidth="15"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Distressed Parchment Label Under X */}
              <span className="mt-1 rounded border border-red-900/80 bg-[#140303]/95 px-2 py-0.5 text-[9px] sm:text-[10px] font-uncharted font-bold uppercase tracking-[0.2em] text-red-300 shadow-[0_4px_10px_rgba(0,0,0,0.9)]">
                Treasure
              </span>
            </button>

            {/* Desktop Red "X" Treasure Message Popover */}
            <AnimatePresence>
              {activePopup === 'treasure-x' && (
                <motion.div
                  initial={{ opacity: 0, y: 15, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.92 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                  className="hidden sm:block absolute bottom-22 sm:bottom-26 z-50 w-80 sm:w-96 select-none -translate-x-1/2 left-1/2"
                  style={{
                    filter: 'drop-shadow(0 25px 50px rgba(0,0,0,0.98)) drop-shadow(0 0 25px rgba(0,0,0,0.7))',
                  }}
                >
                  <div
                    className="relative w-full bg-cover bg-center px-8 py-6 sm:px-10 sm:py-7 text-center"
                    style={{
                      backgroundImage: "url('/textures/wooden-signboard.png')",
                      backgroundSize: '100% 100%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePopup(null);
                      }}
                      className="absolute top-3 right-6 text-sm font-bold text-[#3d1903] hover:text-black p-1 cursor-pointer"
                      aria-label="Close treasure popup"
                    >
                      ✕
                    </button>

                    <div className="flex items-center justify-center gap-2">
                      <span className="text-lg">🏴‍☠️</span>
                      <p className="text-[10px] font-cinzel font-bold uppercase tracking-[0.25em] text-[#7f1d1d] drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                        ✦ {RED_X.region} • SECRET SITE ✦
                      </p>
                      <span className="text-lg">💎</span>
                    </div>

                    <h3 className="font-uncharted text-base sm:text-lg font-black text-[#140802] mt-0.5 drop-shadow-[0_1px_0_rgba(255,255,255,0.5)]">
                      {RED_X.name}
                    </h3>

                    <div className="mt-2 rounded-md border border-[#5c3008]/40 bg-[#241205]/20 p-2 text-center shadow-inner">
                      <p className="font-uncharted font-extrabold text-[#7f1d1d] text-xs sm:text-sm leading-snug tracking-wide drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">
                        Treasure obtained by completing treasure hunt
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePopup(null);
                          setShowTreasureModal(true);
                        }}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-red-400/80 bg-gradient-to-b from-[#881337] via-[#5b0e24] to-[#2e0511] py-2 text-xs font-uncharted font-bold uppercase tracking-[0.18em] text-[#dfcfb3] shadow-[0_4px_14px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.4)] hover:scale-[1.02] hover:border-red-300 hover:brightness-110 transition-all cursor-pointer"
                      >
                        <span className="relative z-10 flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                          ❖ Begin Treasure Hunt ❖
                        </span>
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* MOBILE FULL VIEWPORT DOCKED SIGNBOARD MODAL (NEVER CLIPPED) */}
      {/* ======================================================== */}
      <AnimatePresence>
        {activePopup && (
          <>
            {/* Mobile Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePopup(null)}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
            />

            {/* Mobile Floating Card at bottom */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-3 bottom-20 z-50 max-w-sm mx-auto select-none sm:hidden"
              style={{
                filter: 'drop-shadow(0 20px 35px rgba(0,0,0,0.98)) drop-shadow(0 0 25px rgba(0,0,0,0.7))',
              }}
            >
              <div
                className="relative w-full bg-cover bg-center px-6 py-5 text-center rounded-lg overflow-hidden"
                style={{
                  backgroundImage: "url('/textures/wooden-signboard.png')",
                  backgroundSize: '100% 100%',
                  backgroundRepeat: 'no-repeat',
                }}
              >
                <button
                  onClick={() => setActivePopup(null)}
                  className="absolute top-2.5 right-4 text-base font-bold text-[#3d1903] hover:text-black p-1 cursor-pointer"
                  aria-label="Close popup"
                >
                  ✕
                </button>

                {activePopup === 'treasure-x' ? (
                  <>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-base">🏴‍☠️</span>
                      <p className="text-[9px] font-cinzel font-bold uppercase tracking-[0.2em] text-[#7f1d1d]">
                        ✦ {RED_X.region} • SECRET SITE ✦
                      </p>
                      <span className="text-base">💎</span>
                    </div>

                    <h3 className="font-uncharted text-base font-black text-[#140802] mt-0.5">
                      {RED_X.name}
                    </h3>

                    <div className="mt-2 rounded-md border border-[#5c3008]/40 bg-[#241205]/20 p-2 text-center shadow-inner">
                      <p className="font-uncharted font-extrabold text-[#7f1d1d] text-xs leading-snug">
                        Treasure obtained by completing treasure hunt
                      </p>
                    </div>

                    <div className="mt-2.5">
                      <button
                        type="button"
                        onClick={() => {
                          setActivePopup(null);
                          setShowTreasureModal(true);
                        }}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-red-400/80 bg-gradient-to-b from-[#881337] via-[#5b0e24] to-[#2e0511] py-2 text-xs font-uncharted font-bold uppercase tracking-[0.18em] text-[#dfcfb3] shadow-[0_4px_14px_rgba(0,0,0,0.8)] active:scale-[0.98] transition-all cursor-pointer"
                      >
                        <span className="relative z-10 flex items-center gap-1.5">
                          ❖ Begin Treasure Hunt ❖
                        </span>
                      </button>
                    </div>
                  </>
                ) : activeCheckpoint && activeLab ? (
                  <>
                    <p className="text-[9px] font-cinzel font-bold uppercase tracking-[0.25em] text-[#3d1903]">
                      ✦ {activeCheckpoint.region} • CHECKPOINT {activeCheckpoint.labId.toUpperCase()} ✦
                    </p>
                    <h3 className="font-uncharted text-base font-black text-[#140802] mt-0.5 leading-tight">
                      {activeLab.labName}
                    </h3>

                    <div className="mt-2 flex items-center justify-between text-xs font-serif text-[#1f0e04] bg-[#241205]/15 border border-[#5c3008]/40 rounded-md py-1 px-3 shadow-inner">
                      <span className="flex items-center gap-1.5 font-bold">
                        <span>{activeCheckpoint.gemIcon}</span>
                        <span>{activeCheckpoint.gemName}</span>
                      </span>
                      <span className="font-mono font-bold text-[#140802] bg-[#fbf5e6]/80 px-2 py-0.5 rounded border border-[#5c3008]/30 text-xs">
                        {activeLabCompletedCount}/{activeLab.products.length} Products
                      </span>
                    </div>

                    <div className="mt-2.5">
                      {activeLabUnlocked ? (
                        <Link
                          href={`/expedition/${activeCheckpoint.labId}`}
                          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-lg border-2 border-amber-400/80 bg-gradient-to-b from-[#2a1306] via-[#1c0c04] to-[#0c0502] py-2 text-xs font-uncharted font-bold uppercase tracking-[0.18em] text-[#dfcfb3] shadow-[0_4px_14px_rgba(0,0,0,0.8)] active:scale-[0.98] transition-all cursor-pointer"
                        >
                          <span className="relative z-10 flex items-center gap-1.5">
                            {activeLabShardEarned ? '❖ View Shard & Feedback ➔' : '❖ Give Feedback & Enter ➔'}
                          </span>
                        </Link>
                      ) : (
                        <div className="rounded-lg bg-[#2b1608]/25 border border-[#542d0a]/50 py-1.5 text-xs font-serif text-[#3d1e06] italic shadow-inner">
                          🔒 Locked • Clear previous checkpoint
                        </div>
                      )}
                    </div>
                  </>
                ) : null}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ======================================================== */}
      {/* MOBILE QUICK CHECKPOINT SELECTOR DOCK                    */}
      {/* ======================================================== */}
      <nav
        aria-label="Mobile Checkpoints Navigation"
        className="fixed bottom-3 inset-x-3 z-30 flex items-center justify-between sm:hidden rounded-full bg-[#120a06]/95 border border-amber-500/30 px-2 py-1.5 backdrop-blur-md shadow-[0_10px_30px_rgba(0,0,0,0.95)]"
      >
        {CHECKPOINTS.map((cp) => {
          const unlocked = snapshot.unlockedLabs.includes(cp.labId);
          const shardEarned = snapshot.completedLabs.includes(cp.labId);
          const isCurrent = activePopup === cp.labId;

          return (
            <button
              key={cp.labId}
              type="button"
              onClick={() => setActivePopup(isCurrent ? null : cp.labId)}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-cinzel font-bold transition-all',
                isCurrent
                  ? 'bg-amber-500/30 text-amber-200 border border-amber-400/60 shadow-[0_0_8px_rgba(245,158,11,0.3)]'
                  : 'text-[#dfcfb3]/75 hover:bg-white/10'
              )}
            >
              <span>{shardEarned ? '🛡️' : unlocked ? cp.gemIcon : '🔒'}</span>
              <span>Lab {cp.labId.toUpperCase()}</span>
            </button>
          );
        })}

        {/* Secret Treasure Site Pill */}
        <button
          type="button"
          onClick={() => setActivePopup(activePopup === 'treasure-x' ? null : 'treasure-x')}
          className={cn(
            'flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-cinzel font-bold transition-all',
            activePopup === 'treasure-x'
              ? 'bg-red-900/40 text-red-200 border border-red-500/60 shadow-[0_0_8px_rgba(239,68,68,0.3)]'
              : 'text-red-300/80 hover:bg-red-950/40'
          )}
        >
          <span>🏴‍☠️</span>
          <span>Treasure</span>
        </button>
      </nav>

      {/* Optional Treasure Hunt Modal */}
      {showTreasureModal && (
        <TreasureHunt
          open={showTreasureModal}
          onClose={() => setShowTreasureModal(false)}
          onHuntResolved={(treasure) => {
            alert(`Treasure Discovered: ${treasure.name} — ${treasure.description}`);
          }}
        />
      )}
    </div>
  );
}
