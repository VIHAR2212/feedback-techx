'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import {
  ArrowLeft,
  Home,
  LogOut,
  Download,
  RefreshCw,
  Search,
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
}: UnchartedSignboardLeaderboardProps) {
  const { user, logout } = useUser();
  const router = useRouter();
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
        `"${e.name || ''}"`,
        `"${e.email || ''}"`,
        `"${e.department || ''}"`,
        e.totalFeedback,
        `${e.shards?.length || 0}/3`,
        `"${getScore(e, idx)}"`,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `uncharted_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const headers = ['Rank', 'Product Name', 'Checkpoint/Lab', 'Total Ratings', 'Average Rating', 'Comments'];
      const rows = productStats.map((p, idx) => [
        idx + 1,
        `"${p.productName}"`,
        `"${p.labName}"`,
        p.totalRatings,
        p.averageRating.toFixed(2),
        p.totalComments,
      ]);
      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `uncharted_discoveries_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Fixed action buttons rendered directly to body so no parent transform affects them
  const actionButtonsPortal = mounted
    ? createPortal(
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[9999] flex items-center gap-1.5 sm:gap-2 pointer-events-auto bg-[#1a0e07]/90 backdrop-blur-md px-3 py-2 rounded-xl border border-[#6d4323] shadow-[0_12px_35px_rgba(0,0,0,0.9),inset_0_1px_4px_rgba(255,255,255,0.15)]">
          {/* Back Button */}
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1 rounded border border-[#6d4323] bg-[#2d180c] px-2.5 py-1 text-[9px] sm:text-xs font-cinzel font-bold text-[#fef3c7] shadow-md hover:border-amber-500 hover:bg-[#3d2110] active:scale-95 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
            <span>Back</span>
          </button>

          {/* Home Button */}
          <button
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center gap-1 rounded border border-[#6d4323] bg-[#2d180c] px-2.5 py-1 text-[9px] sm:text-xs font-cinzel font-bold text-[#fef3c7] shadow-md hover:border-amber-500 hover:bg-[#3d2110] active:scale-95 transition-all cursor-pointer"
          >
            <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-400" />
            <span>Home</span>
          </button>

          {/* Explorers / Discoveries Mode Switcher */}
          <div className="inline-flex rounded border border-[#6d4323] bg-[#120803] p-0.5 shadow-md">
            <button
              onClick={() => setViewMode('users')}
              className={`rounded px-2.5 py-1 text-[8.5px] sm:text-[11px] font-cinzel font-bold transition-all cursor-pointer ${
                viewMode === 'users'
                  ? 'bg-[#8c5932] text-amber-100'
                  : 'text-amber-300/70 hover:text-amber-100'
              }`}
            >
              Explorers
            </button>
            <button
              onClick={() => setViewMode('products')}
              className={`rounded px-2.5 py-1 text-[8.5px] sm:text-[11px] font-cinzel font-bold transition-all cursor-pointer ${
                viewMode === 'products'
                  ? 'bg-[#8c5932] text-amber-100'
                  : 'text-amber-300/70 hover:text-amber-100'
              }`}
            >
              Discoveries
            </button>
          </div>

          {/* Admin CSV Export Button */}
          {isAdmin && (
            <button
              onClick={handleExportCSV}
              title="Export CSV"
              className="inline-flex items-center gap-1 rounded border border-[#6d4323] bg-[#2d180c] px-2.5 py-1 text-[9px] sm:text-xs font-cinzel font-bold text-amber-200 shadow-md hover:border-emerald-500 hover:bg-emerald-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-400" />
              <span>CSV</span>
            </button>
          )}

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              title="Refresh Leaderboard"
              className="inline-flex items-center justify-center rounded border border-[#6d4323] bg-[#2d180c] p-1.5 text-amber-300 shadow-md hover:border-amber-400 hover:bg-[#3d2110] active:scale-95 transition-all cursor-pointer"
            >
              <RefreshCw className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            </button>
          )}

          {/* Logout Button (if logged in) */}
          {user && (
            <button
              onClick={logout}
              className="inline-flex items-center gap-1 rounded border border-[#6d4323] bg-[#2d180c] px-2.5 py-1 text-[9px] sm:text-xs font-cinzel text-amber-200 shadow-md hover:border-red-600 hover:bg-red-950/60 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-red-400" />
              <span>Logout</span>
            </button>
          )}
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <div className="relative mx-auto flex w-full h-full max-w-[1700px] flex-col items-center justify-end select-none pb-0 pointer-events-none translate-y-6 sm:translate-y-10 md:translate-y-14 lg:translate-y-16">
        
        {/* Large Grounded Signboard Container */}
        <div className="relative w-full aspect-[1024/576] max-h-[96vh] flex items-center justify-center">
          
          {/* Weathered Standing Wooden Signboard Frame Planted on Ground */}
          <img
            src="/textures/uncharted-signboard.png"
            alt="Uncharted Signboard"
            style={{
              filter: 'brightness(1.20) contrast(1.08) saturate(1.10) drop-shadow(0 20px 40px rgba(0,0,0,0.85)) drop-shadow(0 0 25px rgba(251,191,36,0.12))',
            }}
            className="absolute inset-0 w-full h-full object-contain object-bottom pointer-events-none z-0"
          />

          {/* 1. TOP "LEADERBOARD" TITLE IN DISTRESSED CARVED BLACK LETTERING */}
          <div 
            className="absolute z-10 text-center flex flex-col items-center justify-center pointer-events-auto"
            style={{
              top: '9.0%',
              left: '23.0%',
              width: '35.0%',
            }}
          >
            <h1
              style={{ fontFamily: "var(--font-base02), var(--font-uncharted), 'Base02', 'Base 02', serif" }}
              className="font-uncharted font-black text-lg sm:text-xl md:text-2xl lg:text-[34px] xl:text-[38px] uppercase tracking-[0.16em] text-[#0a0502] drop-shadow-[0_1px_2px_rgba(255,255,255,0.55)] transform -rotate-0.5 leading-none"
            >
              LEADERBOARD
            </h1>
          </div>

          {/* 2. INNER RECTANGLE: TRANSPARENT OVERLAY (No background box) WITH CARVED GOLDEN TYPOGRAPHY */}
          <div 
            className="absolute z-10 overflow-hidden flex flex-col pointer-events-auto"
            style={{
              top: '21.0%',
              left: '23.0%',
              width: '35.0%',
              height: '35.0%',
            }}
          >
            {/* Header Row in Carved Gold */}
            <div className="flex items-center justify-between border-b border-[#a87f58]/50 px-2 sm:px-3 py-1 font-cinzel font-extrabold text-[#fde68a] uppercase tracking-widest shrink-0 bg-black/25 backdrop-blur-[1px] rounded-t-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
              {/* Left Column: RANK */}
              <div className="flex items-center min-w-[70px] sm:min-w-[95px] md:min-w-[105px]">
                <span className="w-8 sm:w-10 text-left sm:text-center font-black tracking-widest text-[#f59e0b] text-xs sm:text-sm md:text-base lg:text-[16px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  RANK
                </span>
              </div>

              {/* Middle Column: EXPLORER / DISCOVERY */}
              <div className="flex-1 text-center px-1">
                <span className="inline-block tracking-[0.22em] text-[#fef08a] font-black text-xs sm:text-sm md:text-base lg:text-[17px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  {viewMode === 'users' ? 'EXPLORER' : 'DISCOVERY'}
                </span>
              </div>

              {/* Right Column: CHECKPOINTS / RATING + Search Icon */}
              <div className="flex items-center justify-end gap-1 sm:gap-1.5 min-w-[70px] sm:min-w-[95px] md:min-w-[105px]">
                <span className="text-right tracking-widest font-black text-[#fde68a] text-xs sm:text-sm md:text-base lg:text-[16px] drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)]">
                  {viewMode === 'users' ? 'CHECKPOINTS' : 'RATING'}
                </span>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  title="Search"
                  className="opacity-75 hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
                >
                  <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#fde68a]" />
                </button>
              </div>
            </div>

            {/* Collapsible Search Input */}
            {showSearch && (
              <div className="bg-black/50 px-2 py-1 border-b border-[#a8825c]/50 flex items-center gap-1.5 shrink-0">
                <Search className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-[#fde68a]/80" />
                <input
                  type="text"
                  placeholder={viewMode === 'users' ? 'Search explorer…' : 'Search discovery…'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-[10px] sm:text-xs text-[#fef08a] placeholder-[#d97706]/70 outline-none font-cinzel"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-[#fde68a] font-bold px-1 cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            )}

            {/* Scrollable list directly on the timber grain */}
            <div className="signboard-scroll flex-1 overflow-y-auto overscroll-contain px-1 sm:px-2 py-0.5 divide-y divide-[#7d502a]/35">
              {viewMode === 'users' ? (
                filteredLeaderboard.length > 0 ? (
                  filteredLeaderboard.map((entry, index) => {
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
                        className={`flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 rounded transition-all ${
                          isYou
                            ? 'bg-[#3b2311]/85 text-[#fffbeb] font-bold shadow-[0_0_15px_rgba(245,158,11,0.3)] my-0.5 border border-amber-400/80'
                            : 'hover:bg-[#2e180c]/55 text-[#fef3c7]'
                        }`}
                      >
                        {/* Left: Rank & Avatar & Formatted Explorer Name */}
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 truncate">
                          <span
                            className={`w-6 sm:w-8 text-center font-cinzel font-extrabold text-[11px] sm:text-xs md:text-sm shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] ${
                              isYou ? 'text-[#fef08a]' : 'text-[#f59e0b]'
                            }`}
                          >
                            {rank}
                          </span>

                          {/* Circular Explorer Avatar Portrait with Gold Trim */}
                          <div
                            className={`flex h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7 items-center justify-center rounded-full text-[9px] sm:text-[11px] md:text-xs font-bold shrink-0 shadow-md ${
                              isYou
                                ? 'bg-gradient-to-b from-[#b45309] to-[#452b12] text-[#fef08a] border border-[#fde68a]'
                                : 'bg-gradient-to-b from-[#6b3e18] to-[#2a1408] text-[#fde68a] border border-[#b45309]/80'
                            }`}
                          >
                            {entry.name ? entry.name.charAt(0).toUpperCase() : 'E'}
                          </div>

                          {/* Formatted Explorer Name in Golden Cinzel Serif Typography */}
                          <div className="flex items-center gap-1.5 truncate min-w-0">
                            <span
                              className={`truncate font-cinzel text-xs sm:text-sm md:text-base font-bold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.95)] ${
                                isYou ? 'text-[#ffffff]' : 'text-[#fef08a]'
                              }`}
                            >
                              {displayName}
                            </span>

                            {isYou && (
                              <span className="text-[7px] sm:text-[8px] bg-[#d97706] text-[#1c0f05] px-1 py-0.2 rounded font-black tracking-wider uppercase shrink-0 shadow-xs">
                                YOU
                              </span>
                            )}

                            {entry.isCompleted && (
                              <span
                                title="Expedition Completed"
                                className="text-xs sm:text-sm text-amber-400 shrink-0 drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
                              >
                                ★
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Checkpoints Score in Glowing Gold */}
                        <span
                          className={`font-mono text-xs sm:text-sm md:text-base font-bold shrink-0 pl-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] ${
                            isYou ? 'text-[#fef08a]' : 'text-[#fde68a]'
                          }`}
                        >
                          {getScore(entry, index)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-xs text-[#fde68a]/70 py-6 font-cinzel drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                    {searchQuery ? 'No matching explorers found.' : 'No explorer records yet.'}
                  </div>
                )
              ) : (
                filteredProducts.length > 0 ? (
                  filteredProducts.map((entry, index) => {
                    const rank = String(index + 1).padStart(2, '0');
                    return (
                      <div
                        key={entry.productId}
                        className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 rounded text-xs sm:text-sm md:text-base hover:bg-[#2e180c]/55 text-[#fef3c7] transition-colors"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 truncate">
                          <span className="w-6 sm:w-8 text-center font-cinzel font-bold text-[#f59e0b] text-[11px] sm:text-xs shrink-0 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                            {rank}
                          </span>
                          <div className="flex flex-col min-w-0 truncate">
                            <span className="truncate font-cinzel font-bold text-[#fef08a] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                              {entry.productName}
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-mono text-[#fde68a]/70 truncate drop-shadow-[0_1px_1px_rgba(0,0,0,0.9)]">
                              {entry.labName} • {entry.totalRatings} ratings
                            </span>
                          </div>
                        </div>
                        <span className="font-mono text-xs sm:text-sm md:text-base font-bold text-[#fde68a] shrink-0 pl-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                          ⭐ {entry.averageRating.toFixed(1)}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="flex h-full items-center justify-center text-center text-xs text-[#fde68a]/70 py-6 font-cinzel drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
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

