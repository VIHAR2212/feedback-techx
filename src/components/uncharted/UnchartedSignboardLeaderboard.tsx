'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { ArrowLeft, Home, LogOut, RefreshCw, Trophy, Sparkles } from 'lucide-react';

export interface LeaderboardEntry {
  name: string;
  department: string;
  totalFeedback: number;
  averageRating: number;
  isCompleted: boolean;
  shards: string[];
  rank: number;
  email?: string;
}

export interface ProductStatsEntry {
  productId: string;
  productName: string;
  labName: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  totalComments: number;
  lastRated: string | null;
}

interface UnchartedSignboardLeaderboardProps {
  leaderboard: LeaderboardEntry[];
  productStats: ProductStatsEntry[];
  isLoading?: boolean;
  error?: string;
  isAdmin?: boolean;
  onRefresh?: () => void;
}

export default function UnchartedSignboardLeaderboard({
  leaderboard,
  productStats,
  isLoading = false,
  error = '',
  isAdmin = false,
  onRefresh,
}: UnchartedSignboardLeaderboardProps) {
  const { user, logout } = useUser();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'users' | 'products'>('users');

  const getScore = (entry: LeaderboardEntry, i: number) => {
    if (entry.totalFeedback > 0 || entry.shards?.length > 0) {
      return (entry.shards.length * 3500 + entry.totalFeedback * 1250).toLocaleString();
    }
    const defaultScores = [12540, 11230, 10890, 9760, 8420, 7150, 5800, 4320, 2310];
    return (defaultScores[i] || 1500).toLocaleString();
  };

  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col items-center justify-center select-none pt-1 sm:pt-4">
      
      {/* Signboard Container with Relative Aspect Ratio (1024x576) */}
      <div className="relative w-full max-w-4xl aspect-[1024/576] min-h-[360px] sm:min-h-[440px] md:min-h-[520px] flex items-center justify-center">
        
        {/* Transparent Standing Signboard Image */}
        <img
          src="/textures/uncharted-signboard.png"
          alt="Uncharted Signboard"
          className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_20px_35px_rgba(0,0,0,0.85)] z-0"
        />

        {/* 1. TOP "LEADERBOARD" TITLE IN BLACK HANDWRITING */}
        <div 
          className="absolute z-10 text-center flex flex-col items-center justify-center"
          style={{
            top: '11%',
            left: '21.5%',
            width: '49%',
          }}
        >
          <h1
            style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
            className="font-uncharted font-black text-2xl sm:text-4xl md:text-5xl uppercase tracking-[0.14em] text-[#0a0502] drop-shadow-[0_1px_1px_rgba(255,255,255,0.4)] transform -rotate-0.5"
          >
            LEADERBOARD
          </h1>
        </div>

        {/* 2. INNER RECTANGLE: PARCHMENT BOARD WITH STRICT SCROLL CLIPPING */}
        <div 
          className="absolute z-10 rounded-lg sm:rounded-xl border border-[#7d502a]/80 bg-[#d8bf9e]/90 shadow-[inset_0_2px_8px_rgba(0,0,0,0.4)] overflow-hidden flex flex-col"
          style={{
            top: '23%',
            left: '21.5%',
            width: '49%',
            height: '46%',
          }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-[#a8825c]/80 px-2 sm:px-4 py-1 sm:py-1.5 text-[9px] sm:text-[11px] md:text-xs font-cinzel font-black text-[#452b18] uppercase tracking-wider shrink-0 bg-[#caa881]/70">
            <div className="flex items-center gap-2 sm:gap-4">
              <span className="w-5 sm:w-7 text-center">RANK</span>
              <span>{viewMode === 'users' ? 'EXPLORER' : 'DISCOVERY'}</span>
            </div>
            <span>{viewMode === 'users' ? 'CHECKPOINTS' : 'RATING'}</span>
          </div>

          {/* Scrollable list strictly inside the board rectangle */}
          <div className="signboard-scroll flex-1 overflow-y-auto overscroll-contain px-1.5 sm:px-2 py-0.5 divide-y divide-[#c4a580]/40">
            {viewMode === 'users' ? (
              leaderboard.length > 0 ? (
                leaderboard.map((entry, index) => {
                  const isYou = Boolean(
                    user && (entry.name === user.name || (entry.email && entry.email === user.email))
                  );
                  const rank = String(entry.rank || index + 1).padStart(2, '0');
                  return (
                    <div
                      key={`${entry.name}-${index}`}
                      className={`flex items-center justify-between px-1.5 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs md:text-sm transition-colors ${
                        isYou
                          ? 'bg-[#5a381e]/35 font-bold text-amber-950'
                          : 'hover:bg-[#c9ae8a]/50 text-[#2b170c]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 truncate">
                        <span className="w-5 sm:w-7 text-center font-cinzel font-bold text-[#5c381e] text-[9px] sm:text-xs">
                          {rank}
                        </span>
                        <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-[#5a381e] text-[#fef3c7] text-[9px] sm:text-[11px] font-bold shrink-0">
                          {entry.name ? entry.name.charAt(0).toUpperCase() : 'E'}
                        </div>
                        <span className="truncate font-cinzel font-semibold text-[#1a0f07]">
                          {entry.name}
                        </span>
                        {isYou && (
                          <span className="text-[7px] sm:text-[8px] bg-amber-800 text-amber-100 px-1 rounded font-bold shrink-0">
                            YOU
                          </span>
                        )}
                      </div>

                      <span className="font-mono text-[10px] sm:text-xs font-bold text-[#3d2413] shrink-0 pl-1">
                        {getScore(entry, index)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-[#5a381e]">
                  No explorer records yet.
                </div>
              )
            ) : (
              productStats.length > 0 ? (
                productStats.map((entry, index) => {
                  const rank = String(index + 1).padStart(2, '0');
                  return (
                    <div
                      key={entry.productId}
                      className="flex items-center justify-between px-1.5 sm:px-3 py-1 sm:py-1.5 rounded text-[10px] sm:text-xs md:text-sm hover:bg-[#c9ae8a]/50 text-[#2b170c]"
                    >
                      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-1 truncate">
                        <span className="w-5 sm:w-7 text-center font-cinzel font-bold text-[#5c381e] text-[9px] sm:text-xs">
                          {rank}
                        </span>
                        <span className="truncate font-cinzel font-semibold text-[#1a0f07]">
                          {entry.productName}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] sm:text-xs font-bold text-[#3d2413] shrink-0 pl-1">
                        ⭐ {entry.averageRating.toFixed(1)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="flex h-full items-center justify-center text-center text-xs text-[#5a381e]">
                  No discovery data yet.
                </div>
              )
            )}
          </div>
        </div>

        {/* 3. BOTTOM CARVED BUTTONS */}
        <div 
          className="absolute z-20 flex items-center justify-center gap-1.5 sm:gap-2.5"
          style={{
            top: '71%',
            left: '21.5%',
            width: '49%',
          }}
        >
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1 rounded border border-[#6d4323] bg-[#2d180c] px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs font-cinzel font-bold text-[#fef3c7] shadow-md hover:border-amber-500 hover:bg-[#3d2110] active:scale-95 transition-all"
          >
            <ArrowLeft className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400" />
            <span>Back</span>
          </button>

          <button
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center gap-1 rounded border border-[#6d4323] bg-[#2d180c] px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs font-cinzel font-bold text-[#fef3c7] shadow-md hover:border-amber-500 hover:bg-[#3d2110] active:scale-95 transition-all"
          >
            <Home className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-amber-400" />
            <span>Home</span>
          </button>

          {/* Mode Switcher */}
          <div className="inline-flex rounded border border-[#6d4323] bg-[#1a0e07] p-0.5 shadow-md">
            <button
              onClick={() => setViewMode('users')}
              className={`rounded px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-cinzel font-bold transition-all ${
                viewMode === 'users'
                  ? 'bg-[#8c5932] text-amber-100'
                  : 'text-amber-300/70 hover:text-amber-100'
              }`}
            >
              Explorers
            </button>
            <button
              onClick={() => setViewMode('products')}
              className={`rounded px-1.5 py-0.5 sm:px-2 sm:py-1 text-[8px] sm:text-[10px] font-cinzel font-bold transition-all ${
                viewMode === 'products'
                  ? 'bg-[#8c5932] text-amber-100'
                  : 'text-amber-300/70 hover:text-amber-100'
              }`}
            >
              Discoveries
            </button>
          </div>

          {user && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 rounded border border-[#6d4323] bg-[#2d180c] px-2 py-1 sm:px-3 sm:py-1.5 text-[9px] sm:text-xs font-cinzel text-amber-200 shadow-md hover:border-red-600 hover:bg-red-950/60 active:scale-95 transition-all"
            >
              <LogOut className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-red-400" />
              <span>Logout</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
