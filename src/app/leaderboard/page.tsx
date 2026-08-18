'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@/context/UserContext';

interface LeaderboardEntry {
  name: string;
  department: string;
  totalFeedback: number;
  averageRating: number;
  isCompleted: boolean;
  shards: string[];
  rank: number;
}

interface ProductStatsEntry {
  productId: string;
  productName: string;
  labName: string;
  totalRatings: number;
  averageRating: number;
  ratingDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  totalComments: number;
  lastRated: string | null;
}

// Public expedition rankings — same dual view (users / products) as the
// original Minecraft leaderboard page, just with Uncharted wording.
export default function PublicLeaderboardPage() {
  const { user, logout } = useUser();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [productStats, setProductStats] = useState<ProductStatsEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'users' | 'products'>('users');

  useEffect(() => {
    fetchLeaderboard();
    fetchProductStats();
    const interval = setInterval(() => {
      fetchLeaderboard();
      fetchProductStats();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/admin/leaderboard');
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      const data = await response.json();
      const publicData = data.map(
        (entry: LeaderboardEntry & { email: string; completedProducts: string[] }, index: number) => ({
          name: entry.name || '—',
          department: entry.department,
          totalFeedback: entry.completedProducts?.length || 0,
          averageRating: entry.averageRating || 0,
          isCompleted: entry.isCompleted || false,
          shards: entry.shards || [],
          rank: index + 1,
        })
      );
      setLeaderboard(publicData);
      setError('');
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load expedition rankings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductStats = async () => {
    try {
      const response = await fetch('/api/admin/product-stats');
      if (!response.ok) throw new Error('Failed to fetch product stats');
      const data = await response.json();
      setProductStats(data);
    } catch (err) {
      console.error('Error fetching product stats:', err);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm">Loading expedition rankings…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground">
      <div className="mx-auto max-w-5xl rounded-md border-2 border-foreground p-5">
        <header className="mb-5 text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            Uncharted Expedition
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Expedition Rankings</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {viewMode === 'users'
              ? 'Top explorers across all checkpoints'
              : 'Most-rated discoveries across all labs'}
          </p>
          {user && viewMode === 'users' && (
            <p className="mt-2 text-xs">
              Welcome, <span className="font-mono">{user.name}</span> — your row is highlighted.
            </p>
          )}

          <div className="mt-4 inline-flex rounded border border-foreground/30 bg-muted/30 p-0.5 text-xs">
            <button
              onClick={() => setViewMode('users')}
              className={
                'rounded px-3 py-1 ' + (viewMode === 'users' ? 'bg-foreground text-background' : 'hover:bg-muted')
              }
            >
              Explorers
            </button>
            <button
              onClick={() => setViewMode('products')}
              className={
                'rounded px-3 py-1 ' + (viewMode === 'products' ? 'bg-foreground text-background' : 'hover:bg-muted')
              }
            >
              Discoveries
            </button>
          </div>
        </header>

        <div className="mb-4 flex flex-wrap justify-between gap-2 text-xs">
          <div className="flex gap-2">
            <button
              onClick={() => window.history.back()}
              className="rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
            >
              ← Back
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              className="rounded border border-foreground/30 px-3 py-1.5 hover:bg-muted"
            >
              Home
            </button>
          </div>
          {user && (
            <button
              onClick={logout}
              className="rounded border border-foreground/30 px-3 py-1.5 text-muted-foreground hover:bg-muted"
            >
              Logout
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 rounded border border-dashed border-foreground/40 bg-muted/30 p-3 text-center text-xs">
            {error}
          </div>
        )}

        {((viewMode === 'users' && leaderboard.length > 0) ||
          (viewMode === 'products' && productStats.length > 0)) && (
          <div className="overflow-x-auto">
            {viewMode === 'users' ? (
              <table className="w-full border-collapse border border-foreground/30 text-xs">
                <thead>
                  <tr className="bg-foreground text-background">
                    <th className="border border-foreground/30 px-2 py-2 text-left">Rank</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Explorer</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Department</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Discoveries</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Shards</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Avg Rating</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const isYou = user && entry.name === user.name;
                    const isTopThree = index < 3;
                    const rowBg = isYou
                      ? 'bg-foreground/15'
                      : isTopThree
                        ? 'bg-foreground/5'
                        : '';
                    return (
                      <tr key={`${entry.name}-${entry.department}-${entry.rank}`} className={rowBg}>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{getRankIcon(entry.rank)}</td>
                        <td className="border border-foreground/30 px-2 py-2">{entry.name}</td>
                        <td className="border border-foreground/30 px-2 py-2">{entry.department}</td>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.totalFeedback}</td>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.shards.length}/3</td>
                        <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.averageRating.toFixed(2)}</td>
                        <td className="border border-foreground/30 px-2 py-2">
                          {entry.isCompleted ? (
                            <span className="font-semibold">✓ Expedition complete</span>
                          ) : entry.shards.length > 0 ? (
                            <span>In progress ({entry.shards.length}/3 shards)</span>
                          ) : (
                            <span>Started</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full border-collapse border border-foreground/30 text-xs">
                <thead>
                  <tr className="bg-foreground text-background">
                    <th className="border border-foreground/30 px-2 py-2 text-left">Rank</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Discovery</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Checkpoint</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Ratings</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Avg</th>
                    <th className="border border-foreground/30 px-2 py-2 text-left">Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {productStats.length > 0 ? (
                    productStats.map((entry, index) => {
                      const isTopThree = index < 3;
                      const rowBg = isTopThree ? 'bg-foreground/5' : '';
                      const dist = Object.entries(entry.ratingDistribution)
                        .filter(([, c]) => c > 0)
                        .map(([r, c]) => `${r}: ${c}`)
                        .join(' · ');
                      return (
                        <tr key={entry.productId} className={rowBg}>
                          <td className="border border-foreground/30 px-2 py-2 font-mono">#{index + 1}</td>
                          <td className="border border-foreground/30 px-2 py-2">{entry.productName}</td>
                          <td className="border border-foreground/30 px-2 py-2">{entry.labName}</td>
                          <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.totalRatings}</td>
                          <td className="border border-foreground/30 px-2 py-2 font-mono">{entry.averageRating.toFixed(2)}</td>
                          <td className="border border-foreground/30 px-2 py-2 text-[10px] text-muted-foreground">{dist || '—'}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="border border-foreground/30 px-2 py-3 text-center text-muted-foreground">
                        No discovery data yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        )}

        {((viewMode === 'users' && leaderboard.length === 0) ||
          (viewMode === 'products' && productStats.length === 0)) &&
          !isLoading &&
          !error && (
            <p className="mt-6 text-center text-xs text-muted-foreground">
              No {viewMode === 'users' ? 'explorer' : 'discovery'} data available yet.
            </p>
          )}
      </div>
    </main>
  );
}
