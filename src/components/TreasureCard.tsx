'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckpointIcon,
  AntiqueCompassIcon,
  TreasureKeyIcon,
  RelicCoinIcon,
} from './RusticIcons';
import { appendTreasure } from '@/lib/expedition-storage';
import {
  baseExpeditionLabs,
  CheckpointNode,
} from '@/lib/expeditionData';

interface TreasureCardProps {
  completedCount: number;
  targetCount?: number;
  userEmail: string;
  currentLabId?: string; // '1' | '2' | '3'
}

interface ProductWithLab extends CheckpointNode {
  labId: string;
  labName: string;
  labTitle: string;
  themeType?: string;
  globalIndex: number;
}

interface RelicReward {
  id: string;
  name: string;
  rarity: 'Legendary' | 'Mythic' | 'Artifact';
  origin: string;
  inscription: string;
  lore: string;
  type: 'astrolabe' | 'key' | 'coin';
}

const SECRET_RELICS: RelicReward[] = [
  {
    id: 'relic-avery-cross',
    name: 'Saint Dismas Golden Reliquary',
    rarity: 'Mythic',
    origin: "Captain Henry Avery's Private Stash (1694)",
    inscription: 'Hodie mecum eris in paradiso — Today you shall be with me in paradise.',
    lore: "Forged from solid Andean gold and inlaid with uncut sapphires, this reliquary guarded Avery's secret navigational coordinates to Libertalia.",
    type: 'key',
  },
  {
    id: 'relic-drake-astrolabe',
    name: "Sir Francis Drake's Mariner Astrolabe",
    rarity: 'Legendary',
    origin: 'Golden Hind Flagship (1579)',
    inscription: 'Sic Parvis Magna — Greatness from small beginnings.',
    lore: "An intricately calibrated brass navigational instrument used to circumnavigate uncharted archipelagoes under Queen Elizabeth's royal charter.",
    type: 'astrolabe',
  },
  {
    id: 'relic-libertalia-seal',
    name: 'Libertalia Founders Council Seal',
    rarity: 'Artifact',
    origin: 'Colony of Kings Sanctuary (1701)',
    inscription: 'Pro Deo et Libertate — For God and Liberty.',
    lore: 'The official heavy wax-and-bronze seal authorizing sovereign passage across all three uncharted trial sectors.',
    type: 'coin',
  },
];

// Exactly ONE atmospheric field clue for the product (No emojis)
function generateSingleClue(product: ProductWithLab): string {
  const theme =
    product.themeType ||
    (product.labId === '2' ? 'frost' : product.labId === '3' ? 'volcano' : 'jungle');

  const sectorContext =
    theme === 'frost'
      ? 'Located in the sub-zero glacial spires of Sector 02'
      : theme === 'volcano'
        ? 'Stationed in the volcanic caldera ridgelines of Sector 03'
        : 'Situated within the ancient jungle ruins of Sector 01';

  return `"${sectorContext} — ${product.description}"`;
}

export default function TreasureCard({
  completedCount,
  targetCount = 7,
  userEmail,
  currentLabId = '1',
}: TreasureCardProps) {
  // Exactly 1 chance per user
  const [attemptsLeft, setAttemptsLeft] = useState<number>(1);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [selectedCorrectId, setSelectedCorrectId] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 3D Card Flip state (flips ONLY after the single chance fails)
  const [isFlipped, setIsFlipped] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [claimedRelic, setClaimedRelic] = useState<RelicReward | null>(null);

  const isUnlocked = completedCount >= targetCount;
  const progressPercent = Math.min(100, Math.round((completedCount / targetCount) * 100));
  const remainingCount = Math.max(0, targetCount - completedCount);

  const [resolvedLabId, setResolvedLabId] = useState<string>(currentLabId);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('last_active_expedition_lab');
      if (stored) {
        setResolvedLabId(stored);
      } else if (currentLabId) {
        setResolvedLabId(currentLabId);
      }
    }
  }, [currentLabId]);

  // Opposing products pool based on user's current lab (When exploring Lab 2 -> strictly Lab 1 or Lab 3)
  const opposingProducts: ProductWithLab[] = useMemo(() => {
    const normCurrentId =
      resolvedLabId === '2' || resolvedLabId === 'b' || resolvedLabId === 'libertalia'
        ? '2'
        : resolvedLabId === '3' || resolvedLabId === 'c' || resolvedLabId === 'kings-bay'
          ? '3'
          : '1';

    const allLabs = [
      baseExpeditionLabs['1'],
      baseExpeditionLabs['2'],
      baseExpeditionLabs['3'],
    ].filter(Boolean);

    // Filter out the active lab so when exploring Lab 2, candidateLabs is ONLY Lab 1 & Lab 3
    const candidateLabs = allLabs.filter((l) => l.id !== normCurrentId);

    const pool: ProductWithLab[] = [];
    let globalCounter = 0;
    candidateLabs.forEach((l) => {
      if (l.checkpoints) {
        l.checkpoints.forEach((cp) => {
          pool.push({
            ...cp,
            labId: l.id,
            labName: l.name,
            labTitle: l.title,
            themeType: l.themeType,
            globalIndex: globalCounter++,
          });
        });
      }
    });
    return pool;
  }, [resolvedLabId]);

  // Deterministically select EXACTLY ONE product and 4 options for this user
  const { targetProduct, singleClue, options } = useMemo(() => {
    if (opposingProducts.length === 0) {
      return { targetProduct: null, singleClue: '', options: [] };
    }

    const hash = userEmail
      .split('')
      .reduce((acc, c, idx) => acc + c.charCodeAt(0) * (idx + 13), 0);

    const chosen = opposingProducts[hash % opposingProducts.length];
    const clue = generateSingleClue(chosen);

    const remaining = opposingProducts.filter((p) => p.id !== chosen.id);
    const distractorIndices = [
      hash % remaining.length,
      (hash + 3) % remaining.length,
      (hash + 7) % remaining.length,
    ];

    const chosenDistractors: ProductWithLab[] = [];
    distractorIndices.forEach((idx) => {
      const candidate = remaining[idx];
      if (candidate && !chosenDistractors.some((d) => d.id === candidate.id)) {
        chosenDistractors.push(candidate);
      }
    });

    remaining.forEach((p) => {
      if (chosenDistractors.length < 3 && !chosenDistractors.some((d) => d.id === p.id)) {
        chosenDistractors.push(p);
      }
    });

    const combined = [chosen, ...chosenDistractors.slice(0, 3)].sort((a, b) =>
      a.id.localeCompare(b.id)
    );

    return {
      targetProduct: chosen,
      singleClue: clue,
      options: combined,
    };
  }, [opposingProducts, userEmail]);

  // Load saved state (attempts, won/lost, claimed relic)
  useEffect(() => {
    if (typeof window === 'undefined' || !userEmail) return;
    try {
      const storedRelic = localStorage.getItem(`treasure_7p_claimed_${userEmail}`);
      if (storedRelic) {
        setClaimedRelic(JSON.parse(storedRelic));
      }

      const storedState = localStorage.getItem(`treasure_riddle_state_v2_${userEmail}`);
      if (storedState) {
        const parsed = JSON.parse(storedState);
        if (parsed.attemptsLeft !== undefined) setAttemptsLeft(parsed.attemptsLeft);
        if (parsed.gameState) setGameState(parsed.gameState);
        if (parsed.wrongGuesses) setWrongGuesses(parsed.wrongGuesses);
        if (parsed.selectedCorrectId) setSelectedCorrectId(parsed.selectedCorrectId);
        if (parsed.isFlipped) setIsFlipped(parsed.isFlipped);
      }
    } catch {
      // ignore
    }
  }, [userEmail]);

  // Save riddle state
  const saveState = (
    newAttempts: number,
    newState: 'playing' | 'won' | 'lost',
    newWrongs: string[],
    correctId: string | null,
    flipped: boolean
  ) => {
    if (typeof window === 'undefined' || !userEmail) return;
    try {
      localStorage.setItem(
        `treasure_riddle_state_v2_${userEmail}`,
        JSON.stringify({
          attemptsLeft: newAttempts,
          gameState: newState,
          wrongGuesses: newWrongs,
          selectedCorrectId: correctId,
          isFlipped: flipped,
        })
      );
    } catch {
      // ignore
    }
  };

  // Handle the single chance guess
  const handleGuess = (product: ProductWithLab) => {
    if (gameState !== 'playing' || !targetProduct || attemptsLeft <= 0) return;

    if (product.id === targetProduct.id) {
      // Correct!
      setGameState('won');
      setSelectedCorrectId(product.id);
      setStatusMessage('✦ Discovery Verified! You solved the cipher on your first attempt.');

      try {
        const audio = new Audio('/sounds/achievement.mp3');
        audio.volume = 0.6;
        audio.play().catch(() => { });
      } catch {
        // audio muted
      }

      // Persist relic reward
      if (!claimedRelic) {
        const charCodeSum = userEmail.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const chosen = SECRET_RELICS[charCodeSum % SECRET_RELICS.length];
        setClaimedRelic(chosen);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`treasure_7p_claimed_${userEmail}`, JSON.stringify(chosen));
          appendTreasure(userEmail, chosen.id);
        }
      }

      saveState(0, 'won', wrongGuesses, product.id, false);
    } else {
      // Incorrect (The 1 and only chance failed) -> Automatically flip card to reveal answer!
      const newWrongs = [...wrongGuesses, product.id];
      setAttemptsLeft(0);
      setWrongGuesses(newWrongs);
      setGameState('lost');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      setStatusMessage('✦ Chance exhausted. Revealing the target discovery…');
      saveState(0, 'lost', newWrongs, null, true);

      setTimeout(() => {
        setIsFlipped(true);
      }, 900);
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.35 }}
        className="relative w-full drop-shadow-[0_12px_28px_rgba(0,0,0,0.88)] select-none [perspective:1200px]"
      >
        {/* 3D Flippable Container */}
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, ease: [0.35, 0, 0.25, 1] }}
          className="relative w-full [transform-style:preserve-3d]"
        >
          {/* ========================================================================= */}
          {/* FRONT FACE OF CARD                                                        */}
          {/* ========================================================================= */}
          <div
            style={{
              backgroundImage: `url('/assets/images/torn-card-bg.webp')`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className="relative w-full bg-[length:100%_100%] bg-no-repeat bg-center px-10 sm:px-12 py-6 sm:py-7 flex flex-col justify-between min-h-[220px] text-[#241308]"
          >
            {/* Top Right Corner Wax Seal Badge */}
            <div className="absolute top-1 right-2 w-12 h-12 pointer-events-none opacity-90 z-20">
              {!isUnlocked ? (
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#8b261d] flex items-center justify-center -rotate-6 bg-[#8b261d]/15 shadow-sm">
                  <span className="text-[8.5px] font-mono font-black text-[#8b261d] uppercase tracking-tighter">
                    LOCKED
                  </span>
                </div>
              ) : gameState === 'won' ? (
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#15803d] flex items-center justify-center rotate-12 bg-[#15803d]/15 shadow-sm">
                  <span className="text-[8.5px] font-mono font-black text-[#15803d] uppercase tracking-tighter">
                    SOLVED
                  </span>
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#8b6943] flex items-center justify-center rotate-12 bg-[#8b6943]/15 shadow-sm">
                  <span className="text-[8.5px] font-mono font-black text-[#6b4516] uppercase tracking-tighter">
                    ACTIVE
                  </span>
                </div>
              )}
            </div>

            {/* Header Sub-Row: Status & 1 Chance Tracker */}
            <div className="flex items-center justify-between border-b border-[#8b6943]/35 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-3 h-3 rounded-full bg-[#24140a] border border-[#8c6d23] flex items-center justify-center shrink-0">
                  <div className="w-1 h-1 rounded-full bg-[#d4af37]" />
                </div>
                <span className="text-[9.5px] sm:text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#6b4516] truncate">
                  {isUnlocked ? '✦ CIPHER DISCOVERY' : '🔒 SPECIAL RECON // MILESTONE'}
                </span>
              </div>

              {isUnlocked ? (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#7a481c]/40 bg-[#7a481c]/10 text-[#7a481c] shrink-0">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider">
                    {gameState === 'won'
                      ? '✦ Solved'
                      : gameState === 'lost'
                        ? '✦ 0/1 Chance'
                        : '1 Single Chance'}
                  </span>
                </div>
              ) : (
                <div className="px-2 py-0.5 rounded border border-[#7a481c]/40 bg-[#7a481c]/10 text-[#7a481c] shrink-0">
                  <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider">
                    Recon: {completedCount}/{targetCount}
                  </span>
                </div>
              )}
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* LOCKED STATE                                                      */}
            {/* ----------------------------------------------------------------- */}
            {!isUnlocked ? (
              <>
                <div className="my-auto py-1">
                  <h2 className="text-xl sm:text-2xl font-bold font-['EB_Garamond',_serif] text-[#1c0f05] tracking-tight leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                    Treasure Vault: Secret Discovery Clue
                  </h2>
                  <p className="text-sm sm:text-base text-[#3d200e] font-[family-name:var(--font-handwriting)] font-bold italic leading-snug mt-1 line-clamp-2">
                    &quot;A dormant expedition cache. Complete at least {targetCount} project reviews across any sector to unseal the mystery clue.&quot;
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="my-1.5 w-full flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[8px] sm:text-[8.5px] font-mono font-bold uppercase text-[#7a481c]">
                    <span>Projects Rated: {completedCount}/{targetCount}</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-[#241308]/15 border border-[#7a481c]/25 overflow-hidden">
                    <div
                      style={{ width: `${Math.max(3, progressPercent)}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-[#b38920] to-[#ffd700] transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Locked Button */}
                <div className="mt-1">
                  <button
                    type="button"
                    disabled
                    style={{
                      clipPath:
                        'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#2b100b] via-[#4a1c15] to-[#2b100b] text-[#f2dfbe]/70 font-bold text-[11px] sm:text-xs uppercase tracking-widest shadow-md flex items-center justify-between border-t border-[#8b261d]/50 font-['Cinzel',_serif] cursor-not-allowed opacity-85"
                  >
                    <span>Locked (Need {remainingCount} more)</span>
                    <span className="font-mono text-[9px] text-[#f2dfbe]/60">{completedCount}/7</span>
                  </button>
                </div>
              </>
            ) : (
              /* ----------------------------------------------------------------- */
              /* UNLOCKED STATE: ONE CLUE + 4 THEME-MATCHED RUSTIC OPTIONS         */
              /* ----------------------------------------------------------------- */
              <div
                className={`my-auto py-1 flex flex-col gap-2 ${isShaking ? 'animate-shake' : ''
                  }`}
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-['EB_Garamond',_serif] text-[#1c0f05] tracking-tight leading-snug drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">
                    Identify the Discovery (1 Chance)
                  </h2>
                  {/* Single Clue in Nathan Drake Handwriting */}
                  <p className="text-sm sm:text-base text-[#3d200e] font-[family-name:var(--font-handwriting)] font-bold italic leading-snug mt-1">
                    {singleClue}
                  </p>
                </div>

                {/* Status Message */}
                {statusMessage && (
                  <div
                    className={`py-1 px-2.5 rounded text-[8.5px] sm:text-[9px] font-mono font-bold uppercase tracking-wider text-center ${gameState === 'won'
                      ? 'bg-[#15803d]/15 text-[#15803d] border border-[#15803d]/30'
                      : 'bg-[#8b261d]/15 text-[#8b261d] border border-[#8b261d]/30'
                      }`}
                  >
                    {statusMessage}
                  </div>
                )}

                {/* 4 Theme-Matched Options with Rustic Antique Linework Icons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 my-1">
                  {options.map((opt, optIdx) => {
                    const isWrong = wrongGuesses.includes(opt.id);
                    const isCorrectSelected =
                      selectedCorrectId === opt.id ||
                      (gameState === 'won' && opt.id === targetProduct?.id);

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={gameState !== 'playing'}
                        onClick={() => handleGuess(opt)}
                        style={{
                          clipPath:
                            'polygon(5px 0%, calc(100% - 5px) 0%, 100% 5px, 100% calc(100% - 5px), calc(100% - 5px) 100%, 5px 100%, 0% calc(100% - 5px), 0% 5px)',
                        }}
                        className={`py-2 px-3 text-left border transition-all duration-200 flex items-center justify-between gap-2 shadow-sm ${isCorrectSelected
                          ? 'bg-[#15803d]/20 border-[#15803d] text-[#14532d] font-bold shadow-[0_0_8px_rgba(21,128,61,0.3)]'
                          : isWrong
                            ? 'bg-[#8b261d]/15 border-[#8b261d]/60 text-[#8b261d] line-through opacity-70 cursor-not-allowed'
                            : 'bg-gradient-to-b from-[#241308]/5 via-[#241308]/10 to-[#241308]/15 hover:from-[#7a481c]/15 hover:to-[#7a481c]/25 border-[#7a481c]/40 text-[#241308] active:scale-[0.98] cursor-pointer'
                          }`}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full border border-[#8c6d23]/50 bg-[#24140a]/15 flex items-center justify-center shrink-0">
                            <CheckpointIcon
                              index={opt.globalIndex ?? optIdx}
                              size={12}
                              color={
                                isCorrectSelected
                                  ? '#15803d'
                                  : isWrong
                                    ? '#8b261d'
                                    : '#7a481c'
                              }
                            />
                          </div>
                          <span className="text-[11.5px] sm:text-xs font-bold font-['EB_Garamond',_serif] text-[#1c0f05] truncate">
                            {opt.name}
                          </span>
                        </div>
                        <span className="text-[9px] text-[#7a481c] font-mono shrink-0">
                          {isWrong ? '✕' : isCorrectSelected ? '✦' : '➔'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Won state Relic Button */}
                {gameState === 'won' && claimedRelic && (
                  <div className="mt-1">
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      style={{
                        clipPath:
                          'polygon(6px 0%, calc(100% - 6px) 0%, 100% 6px, 100% calc(100% - 6px), calc(100% - 6px) 100%, 6px 100%, 0% calc(100% - 6px), 0% 6px)',
                      }}
                      className="w-full py-2.5 px-4 bg-gradient-to-b from-[#d4af37] via-[#b38920] to-[#7a5214] text-[#140802] font-black text-[11px] sm:text-xs uppercase tracking-widest shadow-md transition hover:brightness-110 active:scale-[0.99] flex items-center justify-between border-t border-[#fff3cc]/60 font-['Cinzel',_serif] cursor-pointer"
                    >
                      <span>✦ Inspect {claimedRelic.name}</span>
                      <span className="text-xs">➔</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BACK FACE (Flips ONLY after user fails their single chance)               */}
          {/* ========================================================================= */}
          <div
            style={{
              backgroundImage: `url('/assets/images/torn-card-bg.webp')`,
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className="absolute inset-0 w-full h-full bg-[length:100%_100%] bg-no-repeat bg-center px-10 sm:px-12 py-6 sm:py-7 flex flex-col justify-between text-[#241308]"
          >
            {/* Top Right Corner Wax Seal (Appears after answer is revealed) */}
            <div className="absolute top-1 right-2 w-12 h-12 pointer-events-none opacity-90 z-20">
              <div className="w-10 h-10 rounded-full border-2 border-dashed border-[#8b261d] flex items-center justify-center rotate-12 bg-[#8b261d]/15 shadow-sm">
                <span className="text-[8.5px] font-mono font-black text-[#8b261d] uppercase tracking-tighter">
                  SEALED
                </span>
              </div>
            </div>
            {/* Header Sub-Row */}
            <div className="flex items-center justify-between border-b border-[#8b6943]/35 pb-1.5 mb-1.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <div className="w-3 h-3 rounded-full bg-[#24140a] border border-[#8c6d23] flex items-center justify-center shrink-0">
                  <div className="w-1 h-1 rounded-full bg-[#d4af37]" />
                </div>
                <span className="text-[9.5px] sm:text-[10px] font-mono font-extrabold uppercase tracking-wider text-[#8b261d] truncate">
                  ✦ CHANCE FAILED // ANSWER REVEALED
                </span>
              </div>

              <div className="px-2 py-0.5 rounded border border-[#8b261d]/40 bg-[#8b261d]/10 text-[#8b261d] font-mono font-bold text-[8.5px] uppercase tracking-wider">
                <span>0/1 Chance</span>
              </div>
            </div>

            {/* Target Product Answer Revealed with Rustic Icon */}
            {targetProduct && (
              <div className="my-auto py-1 flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full border-2 border-[#8c6d23] bg-[#24140a] flex items-center justify-center shadow-sm mb-1">
                  <CheckpointIcon
                    index={targetProduct.globalIndex ?? 0}
                    size={24}
                    color="#d4af37"
                  />
                </div>

                <span className="text-[9px] font-mono font-bold text-[#7a481c] uppercase tracking-wider">
                  {targetProduct.labName}: {targetProduct.labTitle}
                </span>

                <h3 className="text-xl sm:text-2xl font-bold font-['EB_Garamond',_serif] text-[#1c0f05] tracking-tight leading-snug">
                  {targetProduct.name}
                </h3>

                <p className="text-xs sm:text-sm text-[#3d200e] font-[family-name:var(--font-handwriting)] font-bold italic leading-snug mt-1">
                  &quot;{targetProduct.description}&quot;
                </p>
              </div>
            )}

            {/* Bottom Status Banner */}
            <div className="mt-1 pt-1.5 border-t border-[#8b6943]/35 text-center">
              <span className="text-[9px] font-mono text-[#7a481c] italic">
                ✦ This mystery discovery clue was drawn from {targetProduct?.labName}.
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Relic / Treasure Reveal Modal */}
      <AnimatePresence>
        {modalOpen && claimedRelic && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 sm:backdrop-blur-sm backdrop-blur-none p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-md rounded-2xl border-2 border-[#d4af37] bg-gradient-to-b from-[#1f1207] via-[#2c1a0e] to-[#120a03] p-6 sm:p-7 text-[#f5ebd7] shadow-[0_0_40px_rgba(212,175,55,0.45)] overflow-hidden font-['Georgia'] transform-gpu will-change-transform"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-3.5 right-3.5 text-[#d4af37]/70 hover:text-[#fffbeb] transition text-sm font-mono w-7 h-7 rounded-full border border-[#8c6d23]/40 flex items-center justify-center hover:bg-[#8c6d23]/20"
                aria-label="Close"
              >
                ✕
              </button>

              <div className="text-center pb-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full border border-[#d4af37]/60 bg-[#d4af37]/15 text-[#fef08a] font-mono text-[9px] sm:text-[10px] font-extrabold uppercase tracking-widest shadow-sm">
                  <span>✦ 7-PROJECT EXPEDITION MILESTONE ✦</span>
                </div>
              </div>

              <div className="relative my-4 flex flex-col items-center justify-center">
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-b from-[#451a03] to-[#1a0b02] border-2 border-[#d4af37] flex items-center justify-center shadow-[0_0_24px_rgba(212,175,55,0.55)]">
                  {claimedRelic.type === 'key' ? (
                    <TreasureKeyIcon size={32} color="#d4af37" />
                  ) : claimedRelic.type === 'astrolabe' ? (
                    <AntiqueCompassIcon size={32} color="#d4af37" />
                  ) : (
                    <RelicCoinIcon size={32} color="#d4af37" />
                  )}
                </div>

                <div className="mt-2 text-center">
                  <span className="px-2.5 py-0.5 rounded border border-[#f59e0b]/40 bg-[#f59e0b]/20 text-[#fbbf24] font-mono text-[9px] font-bold uppercase tracking-wider">
                    {claimedRelic.rarity} Relic
                  </span>
                </div>
              </div>

              <div className="text-center space-y-2">
                <h3 className="text-xl sm:text-2xl font-bold font-['EB_Garamond',_serif] text-[#ffd700] tracking-tight leading-snug">
                  {claimedRelic.name}
                </h3>
                <p className="text-[10.5px] sm:text-xs font-mono uppercase tracking-wider text-[#a07246]">
                  {claimedRelic.origin}
                </p>

                <div className="my-3 p-3 rounded-lg border border-[#8c6d23]/40 bg-[#140a02]/60 text-left">
                  <p className="text-xs sm:text-sm text-[#e2d3be] font-[family-name:var(--font-handwriting)] font-bold italic leading-relaxed">
                    &quot;{claimedRelic.lore}&quot;
                  </p>
                </div>

                <div className="pt-1">
                  <p className="text-[10px] sm:text-[11px] font-mono italic text-[#d4af37]/90 bg-[#2b1708]/70 py-1.5 px-3 rounded border border-[#8c6d23]/30">
                    📜 Inscription: {claimedRelic.inscription}
                  </p>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-[#8c6d23]/40 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-mono text-[#a07246]">
                  <RelicCoinIcon size={14} color="#d4af37" />
                  <span>Added to Explorer Dossier</span>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{
                    clipPath:
                      'polygon(4px 0%, calc(100% - 4px) 0%, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0% calc(100% - 4px), 0% 4px)',
                  }}
                  className="py-1.5 px-4 bg-gradient-to-r from-[#d4af37] to-[#b38920] text-[#1a0f05] font-black text-[11px] uppercase tracking-wider shadow font-['Cinzel',_serif] hover:brightness-110 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
