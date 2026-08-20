'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { useCompletion } from '@/context/CompletionContext';
import { LAB_ORDER, totalProductCount } from '@/lib/mock-data';
import Link from 'next/link';

export default function ExpeditionProgress() {
  const { user } = useUser();
  const { isCompleted, shards = [] } = useCompletion();
  const pathname = usePathname();

  // Only shown once the user is actually inside the expedition, not on the
  // landing/sign-in page or leaderboard pages where space and signboard design take precedence.
  const isLandingPage = pathname === '/';
  const isLeaderboardPage = pathname === '/leaderboard' || pathname.startsWith('/admin/leaderboard');

  if (!user || isLandingPage || isLeaderboardPage) return null;

  const earnedShards = shards || [];
  const pct = Math.min(100, Math.round((earnedShards.length / LAB_ORDER.length) * 100));

  const shardSlots = [
    { labId: 'a', name: 'Emerald', icon: '💎', color: 'from-emerald-600 to-emerald-400', glow: 'shadow-[0_0_12px_#34d399]' },
    { labId: 'b', name: 'Sapphire', icon: '🔷', color: 'from-blue-600 to-blue-400', glow: 'shadow-[0_0_12px_#60a5fa]' },
    { labId: 'c', name: 'Ruby', icon: '♦️', color: 'from-red-600 to-red-400', glow: 'shadow-[0_0_12px_#f87171]' },
  ];

  return (
    <aside aria-label="Expedition Progress Tracker" className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[#b45309]/60 bg-gradient-to-r from-[#170e08]/95 via-[#23150c]/95 to-[#170e08]/95 backdrop-blur-md shadow-[0_-10px_35px_rgba(0,0,0,0.9)] select-none">
      {/* Top Gold Trim Accent */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-[#f59e0b]/50 to-transparent" />

      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 sm:gap-6 px-4 py-2.5 sm:py-3 text-xs">
        {/* Left: Tracker Title with Compass */}
        <div className="flex items-center gap-2">
          <span className="text-base sm:text-lg animate-spin-slow">🧭</span>
          <div className="flex flex-col">
            <span className="font-cinzel text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-[#dfcfb3] drop-shadow">
              Expedition Tracker
            </span>
            <span className="text-[9px] font-mono text-amber-200/60 hidden sm:inline">
              Uncharted Progress
            </span>
          </div>
        </div>

        {/* Center: 3 Gemstone Sockets + Molten Gold Progress Bar */}
        <div className="flex flex-1 items-center gap-3 sm:gap-4 max-w-xl">
          {/* 3 Shard Gem Sockets */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {shardSlots.map((slot) => {
              const earned = earnedShards.includes(slot.labId);
              return (
                <div
                  key={slot.labId}
                  title={`Lab ${slot.labId.toUpperCase()} ${slot.name} Shard ${earned ? '(Collected)' : '(Locked)'}`}
                  className={`relative flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all duration-500 ${
                    earned
                      ? `border-amber-400 bg-gradient-to-br ${slot.color} ${slot.glow} scale-105`
                      : 'border-stone-700 bg-stone-900/90 opacity-60'
                  }`}
                >
                  <span className="text-xs sm:text-sm filter drop-shadow">
                    {earned ? slot.icon : '⬡'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Adventure XP Molten Gold Track */}
          <div className="relative flex-1">
            <div className="h-3 sm:h-3.5 w-full overflow-hidden rounded-full border border-[#78350f]/80 bg-[#120a06] p-0.5 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#d97706] via-[#f59e0b] to-[#fbbf24] shadow-[0_0_12px_#f59e0b] transition-all duration-700 relative"
                style={{ width: `${Math.max(4, pct)}%` }}
              >
                {/* Glowing light sweep shine */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Right: Shards Count & Finish CTA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right font-cinzel text-[11px] sm:text-xs">
            <span className="font-bold text-amber-300 drop-shadow">
              {earnedShards.length}/{LAB_ORDER.length}
            </span>
            <span className="text-stone-400 ml-1 hidden sm:inline uppercase tracking-wider">
              Shards
            </span>
          </div>

          {isCompleted && (
            <Link
              href="/finish"
              className="animate-pulse rounded-md border-2 border-amber-400 bg-gradient-to-r from-amber-500 to-orange-600 px-3 py-1 text-[11px] font-cinzel font-bold text-black shadow-[0_0_15px_#f59e0b] hover:brightness-110 transition-all uppercase tracking-wider"
            >
              Certificate 🏆
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
