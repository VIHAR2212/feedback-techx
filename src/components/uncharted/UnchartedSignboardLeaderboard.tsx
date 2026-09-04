'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useUser } from '@/context/UserContext';
import { csvCell } from '@/lib/utils';
import {
  Download,
  RefreshCw,
  Search,
  Users,
  Volume2,
  VolumeX,
} from 'lucide-react';

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

// Format names into clean, readable Title Case (e.g. "VICTOR SULLIVAN" -> "Victor Sullivan")
function formatExplorerName(name: string): string {
  if (!name) return '—';
  return name
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export default function UnchartedSignboardLeaderboard({
  leaderboard,
  productStats,
  isLoading = false,
  error = '',
  isAdmin = false,
  onRefresh,
  isMuted = false,
  onToggleMute,
}: UnchartedSignboardLeaderboardProps & {
  isMuted?: boolean;
  onToggleMute?: () => void;
}) {
  const { user } = useUser();
  const [viewMode, setViewMode] = useState<'users' | 'products'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Calculate dynamic checkpoint scores matching expedition activities
  const getScore = (entry: LeaderboardEntry, i: number) => {
    if (entry.totalFeedback > 0 || (entry.shards && entry.shards.length > 0)) {
      const base = (entry.shards?.length || 0) * 3500 + entry.totalFeedback * 1250;
      const ratingBonus = Math.round((entry.averageRating || 5) * 150);
      return (base + ratingBonus).toLocaleString();
    }
    const defaultScores = [12540, 11230, 10890, 9760, 8420, 7150, 5800, 4320, 3100, 2310];
    return (defaultScores[i] || 1500).toLocaleString();
  };

  // Filter leaderboard based on search query
  const filteredLeaderboard = useMemo(() => {
    if (!searchQuery.trim()) return leaderboard;
    const q = searchQuery.toLowerCase();
    return leaderboard.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.email?.toLowerCase().includes(q)
    );
  }, [leaderboard, searchQuery]);

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return productStats;
    const q = searchQuery.toLowerCase();
    return productStats.filter(
      (p) =>
        p.productName?.toLowerCase().includes(q) ||
        p.labName?.toLowerCase().includes(q)
    );
  }, [productStats, searchQuery]);

  // Export CSV for Admin mode
  const handleExportCSV = () => {
    if (viewMode === 'users') {
      const headers = ['Rank', 'Explorer Name', 'Email', 'Department', 'Discoveries', 'Shards', 'Score'];
      const rows = leaderboard.map((e, idx) => [
        e.rank || idx + 1,
        e.name || '',
        e.email || '',
        e.department || '',
        e.totalFeedback,
        `${e.shards?.length || 0}/3`,
        getScore(e, idx),
      ]);
      const csvContent = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `uncharted_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } else {
      const headers = ['Rank', 'Product Name', 'Checkpoint/Lab', 'Total Ratings', 'Average Rating', 'Comments'];
      const rows = productStats.map((p, idx) => [
        idx + 1,
        p.productName,
        p.labName,
        p.totalRatings,
        p.averageRating.toFixed(2),
        p.totalComments,
      ]);
      const csvContent = [headers, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `uncharted_discoveries_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  // Fixed action icon buttons rendered directly to body (icon-only, remote style)
  const actionButtonsPortal = mounted
    ? createPortal(
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setViewMode(viewMode === 'users' ? 'products' : 'users')}
            title={viewMode === 'users' ? 'Show Discoveries' : 'Show Explorers'}
            className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-[#6d4323]/80 bg-[#120803]/90 text-amber-300 shadow-[0_8px_25px_rgba(0,0,0,0.85)] hover:border-amber-400 active:scale-90 transition-all cursor-pointer"
          >
            {viewMode === 'users' ? (
              <Search className="h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Users className="h-4 w-4 sm:h-5 sm:w-5" />
            )}
          </button>
          {isAdmin && (
            <button
              onClick={handleExportCSV}
              title="Export CSV"
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-emerald-600/80 bg-[#120803]/90 text-emerald-400 shadow-[0_8px_25px_rgba(0,0,0,0.85)] hover:border-emerald-400 active:scale-90 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Leaderboard"
              className="flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border border-amber-500/80 bg-[#2d180c]/90 text-amber-300 shadow-[0_8px_25px_rgba(0,0,0,0.85)] hover:border-amber-400 active:scale-90 transition-all cursor-pointer"
            >
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
          {onToggleMute && (
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className={`flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-full border shadow-[0_8px_25px_rgba(0,0,0,0.85)] active:scale-90 transition-all cursor-pointer ${
                isMuted
                  ? 'border-amber-500/80 bg-[#2d180c]/90 text-amber-400 animate-pulse'
                  : 'border-emerald-600/80 bg-[#120803]/90 text-emerald-400 hover:border-emerald-400'
              }`}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4 sm:h-5 sm:w-5" />
              ) : (
                <Volume2 className="h-4 w-4 sm:h-5 sm:w-5" />
              )}
            </button>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="relative mx-auto flex w-full h-full max-w-[1920px] flex-col items-center justify-center select-none p-0 pointer-events-none scale-100 sm:scale-[1.01] md:scale-[1.02] lg:scale-[1.03] xl:scale-[1.04] origin-center transition-all duration-300">
        
        {/* Full Signboard Container Centered over Background Video */}
        <div className="relative w-full aspect-[1024/576] max-h-[93vh] flex items-center justify-center">

          {/* 1. TOP "LEADERBOARD" TITLE WITH TIMBER PLANK TEXTURE (LOCKED GOLDEN) */}
          <div 
            className="absolute z-10 text-center flex items-center justify-center pointer-events-auto"
            style={{
              top: '4.5%',
              left: '25.0%',
              width: '50.0%',
              height: '15.0%',
            }}
          >
            {/* Wooden plank background texture behind title */}
            <img
              src="/textures/leaderboard-title-plank.webp"
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-contain pointer-events-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.85)] select-none"
            />

            {/* Distressed Carved "LEADERBOARD" Title - LOCKED GOLDEN #EFBF04 */}
            <h1
              style={{
                fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif",
                color: '#EFBF04',
              }}
              className="relative z-10 font-uncharted font-black text-lg sm:text-xl md:text-2xl lg:text-[32px] xl:text-[37px] uppercase tracking-[0.22em] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] drop-shadow-[0_0_14px_rgba(239,191,4,0.45)] transform -rotate-0.5 leading-none select-none px-4 pt-1 sm:pt-1.5"
            >
              LEADERBOARD
            </h1>
          </div>

          {/* 2. INNER RECTANGLE: EXPANSIVE CENTERED OVERLAY WITH CARVED TYPOGRAPHY */}
          <div 
            className="absolute z-10 overflow-hidden flex flex-col pointer-events-auto"
            style={{
              top: '14.2%',
              left: '16.5%',
              width: '67.0%',
              height: '65.0%',
            }}
          >
            {/* Fetch error banner — surfaces silent failures instead of showing an empty board */}
            {error && leaderboard.length === 0 && (
              <div className="mb-1 rounded bg-black/60 px-2 py-1 text-center font-cinzel text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-red-300">
                {error}
              </div>
            )}

            {/* Loading state */}
            {isLoading && !error && (
              <div className="mb-1 rounded bg-black/40 px-2 py-1 text-center font-cinzel text-[9px] sm:text-[11px] font-bold uppercase tracking-widest text-[#C0C0C0]/80">
                Charting rankings…
              </div>
            )}

            {/* Header Row in 3 Equal / Balanced Columns */}
            <div className="grid grid-cols-[42px_1fr_68px] sm:grid-cols-[130px_1fr_180px] md:grid-cols-[160px_1fr_210px] items-center border-b border-[#a87f58]/60 px-1.5 sm:px-6 py-0.5 font-cinzel font-black uppercase tracking-widest shrink-0 drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" style={{ color: '#C0C0C0' }}>
              {/* Left Column: RANK */}
              <div className="text-left pl-1 sm:pl-10 md:pl-14">
                <span className="font-black tracking-widest text-xs sm:text-base md:text-lg lg:text-[21px] xl:text-[23px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" style={{ color: '#C0C0C0' }}>
                  RANK
                </span>
              </div>

              {/* Middle Column: EXPLORER / DISCOVERY (Centered - untouched) */}
              <div className="text-center px-1">
                <span className="inline-block tracking-[0.18em] sm:tracking-[0.24em] font-black text-xs sm:text-base md:text-lg lg:text-[21px] xl:text-[23px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] truncate max-w-full" style={{ color: '#C0C0C0' }}>
                  {viewMode === 'users' ? 'EXPLORER' : 'DISCOVERY'}
                </span>
              </div>

              {/* Right Column: CHECKPOINTS / RATING + Search Icon */}
              <div className="flex items-center justify-center pr-1 sm:pl-0 sm:pr-10 md:pr-14 gap-1 sm:gap-2">
                <span className="text-center tracking-wider sm:tracking-widest font-black text-xs sm:text-base md:text-lg lg:text-[21px] xl:text-[23px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]" style={{ color: '#C0C0C0' }}>
                  {viewMode === 'users' ? 'SCORE' : 'RATING'}
                </span>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search"
                  className="opacity-80 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                >
                  <Search className="h-4 w-4 sm:h-4.5 sm:w-4.5" style={{ color: '#C0C0C0' }} />
                </button>
              </div>
            </div>

            {/* Collapsible Search Input */}
            {showSearch && (
              <div className="bg-black/70 px-3 py-1 border-b border-[#a8825c]/50 flex items-center gap-2 shrink-0">
                <Search className="h-4 w-4" style={{ color: '#C0C0C0' }} />
                <input
                  type="text"
                  placeholder={viewMode === 'users' ? 'Search explorer…' : 'Search discovery…'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-sm sm:text-base text-[#C0C0C0] placeholder-[#a8825c]/70 outline-none font-cinzel font-bold"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-sm font-bold px-1.5 cursor-pointer"
                    style={{ color: '#C0C0C0' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Non-scrollable Top 10 List directly on the timber grain */}
            <div className="flex-1 overflow-hidden flex flex-col justify-around px-2 sm:px-4 py-0 divide-y divide-[#7d502a]/15">
              {viewMode === 'users' ? (
                filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.slice(0, 10).map((entry, index) => {
                    const isYou = Boolean(
                      user && (
                        (entry.name && user.name && entry.name.toLowerCase() === user.name.toLowerCase()) ||
                        (entry.email && user.email && entry.email.toLowerCase() === user.email.toLowerCase())
                      )
                    );
                    const rank = String(entry.rank || index + 1).padStart(2, '0');
                    const displayName = formatExplorerName(entry.name);
                    
                    return (
                      <div
                        key={`${entry.name}-${index}`}
                        className={`grid grid-cols-[42px_1fr_68px] sm:grid-cols-[130px_1fr_180px] md:grid-cols-[160px_1fr_210px] items-center px-1.5 sm:px-5 py-0 rounded transition-all leading-tight ${
                          isYou
                            ? 'bg-[#3b2311]/90 font-black shadow-[0_0_12px_rgba(222,161,147,0.35)] border border-[#C0C0C0]/80'
                            : 'hover:bg-[#2e180c]/55'
                        }`}
                      >
                        {/* Left: Rank */}
                        <div className="text-left pl-1 sm:pl-10 md:pl-14">
                          <span
                            className="font-cinzel font-black text-xs sm:text-base md:text-lg lg:text-[20px] xl:text-[22px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                            style={{ color: '#C0C0C0' }}
                          >
                            {rank}
                          </span>
                        </div>

                        {/* Middle: Centered Explorer Name */}
                        <div className="flex items-center justify-center gap-1.5 sm:gap-2 truncate min-w-0 px-1 sm:px-2">
                          <span
                            className="truncate font-cinzel text-xs sm:text-base md:text-lg lg:text-[20px] xl:text-[22px] font-black tracking-wide drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)] text-center"
                            style={{ color: isYou ? '#ffffff' : '#C0C0C0' }}
                          >
                            {displayName}
                          </span>

                          {isYou && (
                            <span className="text-[7px] sm:text-[9px] bg-[#C0C0C0] text-[#1c0f05] px-1 py-0.2 sm:px-1.5 sm:py-0.5 rounded font-black tracking-wider uppercase shrink-0 shadow-xs">
                              YOU
                            </span>
                          )}

                          {entry.isCompleted && (
                            <span
                              title="Expedition Completed"
                              className="text-[10px] sm:text-sm shrink-0 drop-shadow-[0_0_8px_rgba(222,161,147,0.8)]"
                              style={{ color: '#C0C0C0' }}
                            >
                              ★
                            </span>
                          )}
                        </div>

                        {/* Right: Centered Checkpoints Score */}
                        <div className="text-center pr-1 sm:pl-0 sm:pr-10 md:pr-14">
                          <span
                            className="font-mono text-xs sm:text-base md:text-lg lg:text-[20px] xl:text-[22px] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.95)]"
                            style={{ color: '#C0C0C0' }}
                          >
                            {getScore(entry, index)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm sm:text-base py-4 font-cinzel font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ color: '#C0C0C0' }}>
                    {searchQuery ? 'No matching explorers found.' : 'No explorer records yet.'}
                  </div>
                )
              ) : (
                filteredProducts.length > 0 ? (
                  filteredProducts.slice(0, 10).map((entry, index) => {
                    const rank = String(index + 1).padStart(2, '0');
                    return (
                      <div
                        key={entry.productId}
                        className="grid grid-cols-[42px_1fr_68px] sm:grid-cols-[130px_1fr_180px] md:grid-cols-[160px_1fr_210px] items-center px-1.5 sm:px-5 py-0 rounded leading-tight hover:bg-[#2e180c]/55 transition-colors"
                      >
                        {/* Left: Rank */}
                        <div className="text-left pl-1 sm:pl-10 md:pl-14">
                          <span className="font-cinzel font-black text-xs sm:text-base md:text-lg lg:text-[20px] xl:text-[22px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ color: '#C0C0C0' }}>
                            {rank}
                          </span>
                        </div>

                        {/* Middle: Centered Discovery Name & Info */}
                        <div className="flex flex-col items-center justify-center min-w-0 truncate px-1 sm:px-2">
                          <span className="truncate font-cinzel font-black text-xs sm:text-base md:text-lg lg:text-[20px] xl:text-[22px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] text-center" style={{ color: '#C0C0C0' }}>
                            {entry.productName}
                          </span>
                          <span className="text-[9px] sm:text-xs font-mono font-bold truncate drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] opacity-85 text-center" style={{ color: '#C0C0C0' }}>
                            {entry.labName} • {entry.totalRatings} ratings
                          </span>
                        </div>

                        {/* Right: Centered Rating */}
                        <div className="text-center pr-1 sm:pl-0 sm:pr-10 md:pr-14">
                          <span className="font-mono text-xs sm:text-base md:text-lg lg:text-[20px] xl:text-[22px] font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ color: '#C0C0C0' }}>
                            ⭐ {entry.averageRating.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-sm sm:text-base py-4 font-cinzel font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]" style={{ color: '#C0C0C0' }}>
                    {searchQuery ? 'No matching discoveries found.' : 'No discovery data yet.'}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
      {actionButtonsPortal}
    </>
  );
}
